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

    const sitemapUrls = await extractSitemapUrls(baseUrl);

    const urlsToVisit =
      sitemapUrls.length > 0 ? sitemapUrls : [url];

    const visited = new Set<string>();

    const rows: any[] = [];

    const titleCounts = new Map<string, number>();
    const h1Counts = new Map<string, number>();

    const tempRows: any[] = [];

    while (urlsToVisit.length > 0 && visited.size < 20) {
      const currentUrl = urlsToVisit.shift()!;

      if (visited.has(currentUrl)) continue;

      visited.add(currentUrl);

      try {
        const html = await fetchPage(currentUrl);

        const {
          title,
          h1,
          metaDescription,
          wordCount,
        } = extractSEO(html);

        tempRows.push({
          URL: currentUrl,
          Title: title,
          H1: h1,
          MetaDescription: metaDescription,
          WordCount: wordCount,
        });

        if (title) {
          titleCounts.set(
            title,
            (titleCounts.get(title) || 0) + 1
          );
        }

        if (h1) {
          h1Counts.set(
            h1,
            (h1Counts.get(h1) || 0) + 1
          );
        }
      } catch (err) {
        console.error("Failed:", currentUrl, err);
      }
    }

    tempRows.forEach((row) => {
      rows.push({
        URL: row.URL,
        Title: row.Title,
        H1: row.H1,
        MetaDescription: row.MetaDescription,
        WordCount: row.WordCount,

        MissingTitle: row.Title ? "No" : "Yes",

        MissingH1: row.H1 ? "No" : "Yes",

        MissingMetaDescription: row.MetaDescription
          ? "No"
          : "Yes",

        ThinContent:
          row.WordCount < 150 ? "Yes" : "No",

        DuplicateTitle:
          titleCounts.get(row.Title) > 1
            ? "Yes"
            : "No",

        DuplicateH1:
          h1Counts.get(row.H1) > 1
            ? "Yes"
            : "No",
      });
    });

    const workbook = XLSX.utils.book_new();

    const worksheet =
      XLSX.utils.json_to_sheet(rows);

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "SEO Audit"
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
          'attachment; filename="seo-audit.xlsx"',
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
