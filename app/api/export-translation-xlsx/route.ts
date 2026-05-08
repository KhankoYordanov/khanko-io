import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import * as XLSX from "xlsx";

function cleanText(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

function isUsefulText(text: string) {
  const cleaned = cleanText(text);

  if (cleaned.length < 20) return false;
  if (cleaned.length > 5000) return false;

  return true;
}

async function fetchPage(url: string) {
  const response = await axios.get(url, {
    timeout: 15000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; KHANKO.io Translation Exporter/1.0)",
    },
  });

  return response.data;
}

async function extractSitemapUrls(baseUrl: URL) {
  try {
    const sitemapUrl = `${baseUrl.origin}/sitemap.xml`;

    const xml = await fetchPage(sitemapUrl);

    const urls = Array.from(
      xml.matchAll(/<loc>(.*?)<\/loc>/g)
    )
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

function extractContent(html: string) {
  const $ = cheerio.load(html);

  $(
    "script, style, noscript, svg, canvas, iframe, nav, footer, header, form, button, input, select, textarea, aside"
  ).remove();

  const paragraphs = $("main p, article p, section p, p")
    .map((_, el) => cleanText($(el).text()))
    .get()
    .filter((text) => isUsefulText(text))
    .slice(0, 60);

  return paragraphs;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const url = formData.get("url") as string;

    if (!url) {
      return NextResponse.json(
        { error: "Missing URL" },
        { status: 400 }
      );
    }

    const baseUrl = new URL(url);

    const visited = new Set<string>();

    const sitemapUrls = await extractSitemapUrls(baseUrl);

    const urlsToVisit: string[] =
      sitemapUrls.length > 0 ? sitemapUrls : [url];

    const rows: {
      URL: string;
      OriginalText: string;
      Translation: string;
    }[] = [];

    while (urlsToVisit.length > 0 && visited.size < 20) {
      const currentUrl = urlsToVisit.shift()!;

      if (visited.has(currentUrl)) {
        continue;
      }

      visited.add(currentUrl);

      try {
        const html = await fetchPage(currentUrl);

        const paragraphs = extractContent(html);

        paragraphs.forEach((text) => {
          rows.push({
            URL: currentUrl,
            OriginalText: text,
            Translation: "",
          });
        });
      } catch (err) {
        console.error("Failed:", currentUrl, err);
      }
    }

    const workbook = XLSX.utils.book_new();

    const worksheet =
      XLSX.utils.json_to_sheet(rows);

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Translation Export"
    );

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="translation-export.xlsx"',
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to export translation XLSX" },
      { status: 500 }
    );
  }
}
