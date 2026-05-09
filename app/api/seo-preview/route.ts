import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { fetchRenderedHtml } from "../../lib/fetchRenderedHtml";

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}

async function fetchHtml(url: string) {
  try {
    return await fetchRenderedHtml(url);
  } catch {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; KHANKO.io SEO Preview/1.0)",
      },
    });

    return response.data;
  }
}

async function getSitemapUrls(baseUrl: URL) {
  try {
    const sitemapUrl = `${baseUrl.origin}/sitemap.xml`;

    const response = await axios.get(sitemapUrl, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; KHANKO.io SEO Preview/1.0)",
      },
    });

    const xml = response.data as string;

    return Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g))
      .map((match) => match[1])
      .filter((url) => {
        try {
          const parsed = new URL(url);
          return parsed.hostname === baseUrl.hostname;
        } catch {
          return false;
        }
      })
      .slice(0, 20);
  } catch {
    return [];
  }
}

function extractInternalLinks(html: string, baseUrl: URL) {
  const $ = cheerio.load(html);

  const links = $("a")
    .map((_, el) => $(el).attr("href"))
    .get()
    .filter(Boolean);

  const internalLinks = new Set<string>();

  for (const href of links) {
    try {
      const fullUrl = new URL(href!, baseUrl);

      fullUrl.hash = "";

      if (fullUrl.hostname !== baseUrl.hostname) continue;

      if (
        /\.(pdf|jpg|jpeg|png|gif|webp|zip|mp4|mp3|svg|css|js)$/i.test(
          fullUrl.pathname
        )
      ) {
        continue;
      }

      internalLinks.add(fullUrl.toString());
    } catch {
      continue;
    }
  }

  return Array.from(internalLinks).slice(0, 20);
}

function extractSEO(html: string) {
  const $ = cheerio.load(html);

  $("script, style, noscript").remove();

  const title = cleanText($("title").first().text());

  const h1 = cleanText($("h1").first().text());

  const metaDescription = cleanText(
    $("meta[name='description']").attr("content") || ""
  );

  const paragraphs = $("main p, article p, section p, p")
    .map((_, el) => cleanText($(el).text()))
    .get()
    .filter((text) => text.length > 40);

  const content = paragraphs.join(" ");

  const wordCount = content
    ? content.split(/\s+/).filter(Boolean).length
    : 0;

  return {
    title,
    h1,
    metaDescription,
    wordCount,
  };
}

function buildStatusMessage({
  pagesChecked,
  errors,
  missingTitles,
  missingH1,
  missingMetaDescriptions,
}: {
  pagesChecked: number;
  errors: number;
  missingTitles: number;
  missingH1: number;
  missingMetaDescriptions: number;
}) {
  const seoIssues =
    missingTitles +
    missingH1 +
    missingMetaDescriptions;

  if (pagesChecked === 0) {
    return {
      status: "failed",
      message:
        "No pages could be analyzed. The website may block crawlers or require special rendering.",
    };
  }

  if (errors >= pagesChecked) {
    return {
      status: "failed",
      message:
        "All pages failed to analyze. The website may block automated access.",
    };
  }

  if (errors > 0) {
    return {
      status: "partial",
      message:
        "Partial result. Some pages could not be analyzed, so the report may be incomplete.",
    };
  }

  if (seoIssues > 0) {
    return {
      status: "issues found",
      message:
        "The analysis completed, but SEO issues were detected on some pages.",
    };
  }

  return {
    status: "success",
    message: "Analysis completed successfully.",
  };
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const url = formData.get("url") as string;

    if (!url) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    const baseUrl = new URL(url);

    const visited = new Set<string>();
    const queued = new Set<string>();

    let urlsToVisit = await getSitemapUrls(baseUrl);

    if (urlsToVisit.length === 0) {
      urlsToVisit = [url];
    }

    urlsToVisit = Array.from(new Set(urlsToVisit)).slice(0, 20);

    urlsToVisit.forEach((item) => queued.add(item));

    const titles: string[] = [];

    let errors = 0;
    let thinPages = 0;
    let missingTitles = 0;
    let missingH1 = 0;
    let missingMetaDescriptions = 0;

    while (urlsToVisit.length > 0 && visited.size < 20) {
      const currentUrl = urlsToVisit.shift()!;

      if (visited.has(currentUrl)) continue;

      visited.add(currentUrl);

      try {
        const html = await fetchHtml(currentUrl);

        const seo = extractSEO(html);

        if (!seo.title) missingTitles++;

        if (!seo.h1) missingH1++;

        if (!seo.metaDescription) {
          missingMetaDescriptions++;
        }

        if (seo.wordCount < 150) {
          thinPages++;
        }

        if (seo.title) {
          titles.push(seo.title);
        }

        const internalLinks = extractInternalLinks(
          html,
          baseUrl
        );

        internalLinks.forEach((link) => {
          if (
            !visited.has(link) &&
            !queued.has(link) &&
            urlsToVisit.length + visited.size < 20
          ) {
            urlsToVisit.push(link);
            queued.add(link);
          }
        });
      } catch {
        errors++;
      }
    }

    const duplicateTitles =
      titles.length -
      new Set(
        titles.map((title) => title.toLowerCase())
      ).size;

    const statusInfo = buildStatusMessage({
      pagesChecked: visited.size,
      errors,
      missingTitles,
      missingH1,
      missingMetaDescriptions,
    });

    return NextResponse.json({
      ...statusInfo,
      pagesChecked: visited.size,
      errors,
      thinPages,
      missingTitles,
      missingH1,
      missingMetaDescriptions,
      duplicateTitles,
      discoveredUrls: Array.from(visited),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to generate SEO preview" },
      { status: 500 }
    );
  }
}
