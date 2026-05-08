import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import * as XLSX from "xlsx";
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
        "User-Agent": "Mozilla/5.0 (compatible; KHANKO.io SEO Audit/1.0)",
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
        "User-Agent": "Mozilla/5.0 (compatible; KHANKO.io SEO Audit/1.0)",
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
  const links = $("a").map((_, el) => $(el).attr("href")).get().filter(Boolean);

  const internal = new Set<string>();

  for (const href of links) {
    try {
      const fullUrl = new URL(href!, baseUrl);

      if (fullUrl.hostname !== baseUrl.hostname) continue;
      if (/\.(pdf|jpg|jpeg|png|gif|webp|zip)$/i.test(fullUrl.pathname)) continue;

      internal.add(fullUrl.toString());
    } catch {
      continue;
    }
  }

  return Array.from(internal).slice(0, 20);
}

function extractSEO(html: string) {
  const $ = cheerio.load(html);

  $("script, style, noscript, svg, canvas, iframe").remove();

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

  const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0;

  return {
    title,
    h1,
    metaDescription,
    wordCount,
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
    const titleCounts = new Map<string, number>();
    const h1Counts = new Map<string, number>();

    let urlsToVisit = await getSitemapUrls(baseUrl);

    if (urlsToVisit.length === 0) {
      urlsToVisit = [url];

      try {
        const homeHtml = await fetchHtml(url);
        urlsToVisit.push(...extractInternalLinks(homeHtml, baseUrl));
      } catch {
        // keep at least the original URL
      }
    }

    urlsToVisit = Array.from(new Set(urlsToVisit)).slice(0, 20);

    const tempRows: {
      URL: string;
      Title: string;
      H1: string;
      MetaDescription: string;
      WordCount: number;
      Error: string;
    }[] = [];

    while (urlsToVisit.length > 0 && visited.size < 20) {
      const currentUrl = urlsToVisit.shift()!;

      if (visited.has(currentUrl)) continue;
      visited.add(currentUrl);

      try {
        const html = await fetchHtml(currentUrl);
        const seo = extractSEO(html);

        tempRows.push({
          URL: currentUrl,
          Title: seo.title,
          H1: seo.h1,
          MetaDescription: seo.metaDescription,
          WordCount: seo.wordCount,
          Error: "",
        });

        if (seo.title) {
          titleCounts.set(seo.title, (titleCounts.get(seo.title) || 0) + 1);
        }

        if (seo.h1) {
          h1Counts.set(seo.h1, (h1Counts.get(seo.h1) || 0) + 1);
        }
      } catch {
        tempRows.push({
          URL: currentUrl,
          Title: "",
          H1: "",
          MetaDescription: "",
          WordCount: 0,
          Error: "Failed to fetch or parse page",
        });
      }
    }

    const rows = tempRows.map((row) => ({
      URL: row.URL,
      Title: row.Title,
      H1: row.H1,
      MetaDescription: row.MetaDescription,
      WordCount: row.WordCount,
      MissingTitle: row.Title ? "No" : "Yes",
      MissingH1: row.H1 ? "No" : "Yes",
      MissingMetaDescription: row.MetaDescription ? "No" : "Yes",
      ThinContent: row.WordCount < 150 ? "Yes" : "No",
      DuplicateTitle:
        row.Title && (titleCounts.get(row.Title) || 0) > 1 ? "Yes" : "No",
      DuplicateH1: row.H1 && (h1Counts.get(row.H1) || 0) > 1 ? "Yes" : "No",
      Error: row.Error,
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);

    XLSX.utils.book_append_sheet(workbook, worksheet, "SEO Audit");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="seo-audit.xlsx"',
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to export SEO audit" },
      { status: 500 }
    );
  }
}
