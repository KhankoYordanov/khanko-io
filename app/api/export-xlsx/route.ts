import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import * as XLSX from "xlsx";
import { fetchRenderedHtml } from "../../lib/fetchRenderedHtml";

function cleanText(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

function isUsefulText(text: string) {
  const cleaned = cleanText(text);
  const lower = cleaned.toLowerCase();

  if (cleaned.length < 45) return false;
  if (cleaned.length > 5000) return false;

  const noiseWords = [
    "cookie",
    "cookies",
    "privacy policy",
    "terms of use",
    "terms and conditions",
    "accept all",
    "reject all",
    "subscribe",
    "newsletter",
    "sign up",
    "login",
    "log in",
    "menu",
    "navigation",
    "copyright",
    "all rights reserved",
    "read more",
    "learn more",
    "get started",
    "contact us",
    "follow us",
    "share this",
    "back to top",
  ];

  if (noiseWords.some((word) => lower.includes(word))) return false;

  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length < 8) return false;

  const uniqueWords = new Set(words.map((word) => word.toLowerCase()));

  if (uniqueWords.size / words.length < 0.45) return false;

  const linkLikeCount = words.filter(
    (word) =>
      word.includes("http") ||
      word.includes(".com") ||
      word.includes("@")
  ).length;

  if (linkLikeCount > 2) return false;

  return true;
}

async function fetchPage(url: string) {
  return await fetchRenderedHtml(url);
}

async function extractSitemapUrls(baseUrl: URL) {
  try {
    const sitemapUrl = `${baseUrl.origin}/sitemap.xml`;
    const xml = await fetchPage(sitemapUrl);

    const urls = Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g))
      .map((match) => match[1])
      .filter((url) => {
        try {
          const parsed = new URL(url);
          return parsed.hostname === baseUrl.hostname;
        } catch {
          return false;
        }
      });

    return urls.slice(0, 20);
  } catch {
    return [];
  }
}

function extractInternalLinks(html: string, baseUrl: URL): string[] {
  const $ = cheerio.load(html);

  const links = $("a")
    .map((_, el) => $(el).attr("href"))
    .get()
    .filter(Boolean);

  const internalLinks = new Set<string>();

  for (const href of links) {
    try {
      const fullUrl = new URL(href!, baseUrl);

      if (fullUrl.hostname !== baseUrl.hostname) continue;

      if (/\.(pdf|jpg|jpeg|png|gif|webp|zip)$/i.test(fullUrl.pathname)) {
        continue;
      }

      internalLinks.add(fullUrl.toString());
    } catch {
      continue;
    }
  }

  return Array.from(internalLinks).slice(0, 10);
}

function extractContent(html: string) {
  const $ = cheerio.load(html);

  $(
    "script, style, noscript, svg, canvas, iframe, nav, footer, header, form, button, input, select, textarea, aside"
  ).remove();

  const title = cleanText($("title").first().text()) || "Website Export";
  const h1 = cleanText($("h1").first().text());

  const metaDescription = cleanText(
    $("meta[name='description']").attr("content") || ""
  );

  const seen = new Set<string>();

  const paragraphs = $("main p, article p, section p, p")
    .map((_, el) => cleanText($(el).text()))
    .get()
    .filter((text) => {
      if (!isUsefulText(text)) return false;

      const key = text.toLowerCase();

      if (seen.has(key)) return false;

      seen.add(key);

      return true;
    })
    .slice(0, 60);

  const content = paragraphs.join("\n\n");

  return {
    title,
    h1,
    metaDescription,
    content,
    wordCount: content ? content.split(/\s+/).filter(Boolean).length : 0,
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
    const sitemapUrls = await extractSitemapUrls(baseUrl);

    const urlsToVisit: string[] = sitemapUrls.length > 0 ? sitemapUrls : [url];

    const rows: {
      URL: string;
      Title: string;
      H1: string;
      MetaDescription: string;
      WordCount: number;
      Content: string;
    }[] = [];

    while (urlsToVisit.length > 0 && visited.size < 20) {
      const currentUrl = urlsToVisit.shift()!;

      if (visited.has(currentUrl)) continue;

      visited.add(currentUrl);

      try {
        const html = await fetchPage(currentUrl);

        const { title, h1, metaDescription, content, wordCount } =
          extractContent(html);

        rows.push({
          URL: currentUrl,
          Title: title,
          H1: h1,
          MetaDescription: metaDescription,
          WordCount: wordCount,
          Content: content,
        });

        if (sitemapUrls.length === 0) {
          const links = extractInternalLinks(html, baseUrl);

          links.forEach((link) => {
            if (
              !visited.has(link) &&
              !urlsToVisit.includes(link) &&
              urlsToVisit.length < 20
            ) {
              urlsToVisit.push(link);
            }
          });
        }
      } catch (err) {
        console.error("Failed:", currentUrl, err);
      }
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);

    XLSX.utils.book_append_sheet(workbook, worksheet, "Website Export");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="website-export.xlsx"',
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to export XLSX" },
      { status: 500 }
    );
  }
}
