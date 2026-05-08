import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  PageBreak,
  TextRun,
} from "docx";

function cleanText(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

function isUsefulText(text: string) {
  const cleaned = cleanText(text);

  if (cleaned.length < 40) return false;
  if (cleaned.length > 3000) return false;

  const lower = cleaned.toLowerCase();

  const noiseWords = [
    "cookie",
    "privacy policy",
    "terms of use",
    "accept all",
    "subscribe",
    "sign up",
    "login",
    "log in",
    "copyright",
    "all rights reserved",
  ];

  return !noiseWords.some((word) =>
    lower.includes(word)
  );
}

async function fetchPage(url: string) {
  const response = await axios.get(url, {
    timeout: 15000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; KHANKO.io Website Exporter/1.0)",
    },
  });

  return response.data;
}

function extractInternalLinks(
  html: string,
  baseUrl: URL
): string[] {
  const $ = cheerio.load(html);

  const links = $("a")
    .map((_, el) => $(el).attr("href"))
    .get()
    .filter(Boolean);

  const internalLinks = new Set<string>();

  for (const href of links) {
    try {
      const fullUrl = new URL(href!, baseUrl);

      if (fullUrl.hostname !== baseUrl.hostname) {
        continue;
      }

      if (
        /\.(pdf|jpg|jpeg|png|gif|webp|zip)$/i.test(
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

  return Array.from(internalLinks).slice(0, 5);
}

function extractContent(html: string) {
  const $ = cheerio.load(html);

  $(
    "script, style, noscript, svg, canvas, iframe, nav, footer, header, form, button, input, select, textarea, aside"
  ).remove();

  const title =
    cleanText($("title").first().text()) ||
    "Website Export";

  const h1 = cleanText($("h1").first().text());

  const h2s = $("h2")
    .map((_, el) => cleanText($(el).text()))
    .get()
    .filter((text) => text.length > 3)
    .slice(0, 10);

  const h3s = $("h3")
    .map((_, el) => cleanText($(el).text()))
    .get()
    .filter((text) => text.length > 3)
    .slice(0, 10);

  const lists = $("li")
    .map((_, el) => cleanText($(el).text()))
    .get()
    .filter((text) => isUsefulText(text))
    .slice(0, 20);

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
    .slice(0, 40);

  return {
    title,
    h1,
    h2s,
    h3s,
    lists,
    paragraphs,
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

    const visited = new Set<string>();

    const urlsToVisit: string[] = [url];

    const children: Paragraph[] = [];

    while (urlsToVisit.length > 0 && visited.size < 5) {
      const currentUrl = urlsToVisit.shift()!;

      if (visited.has(currentUrl)) {
        continue;
      }

      visited.add(currentUrl);

      try {
        const html = await fetchPage(currentUrl);

        const {
          title,
          h1,
          h2s,
          h3s,
          lists,
          paragraphs,
        } = extractContent(html);

        children.push(
          new Paragraph({
            children: [new PageBreak()],
          })
        );

        children.push(
          new Paragraph({
            text: currentUrl,
            heading: HeadingLevel.HEADING_2,
            spacing: {
              after: 200,
            },
          })
        );

        children.push(
          new Paragraph({
            text: title,
            heading: HeadingLevel.TITLE,
            spacing: {
              after: 300,
            },
          })
        );

        if (h1 && h1 !== title) {
          children.push(
            new Paragraph({
              text: h1,
              heading: HeadingLevel.HEADING_1,
              spacing: {
                after: 200,
              },
            })
          );
        }

        h2s.forEach((text) => {
          children.push(
            new Paragraph({
              text,
              heading: HeadingLevel.HEADING_2,
              spacing: {
                before: 200,
                after: 100,
              },
            })
          );
        });

        h3s.forEach((text) => {
          children.push(
            new Paragraph({
              text,
              heading: HeadingLevel.HEADING_3,
              spacing: {
                before: 150,
                after: 80,
              },
            })
          );
        });

        paragraphs.forEach((text) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text,
                }),
              ],
              spacing: {
                after: 120,
              },
            })
          );
        });

        if (lists.length > 0) {
          children.push(
            new Paragraph({
              text: "List Items",
              heading: HeadingLevel.HEADING_2,
            })
          );

          lists.forEach((item) => {
            children.push(
              new Paragraph({
                text: `• ${item}`,
                spacing: {
                  after: 80,
                },
              })
            );
          });
        }

        const links = extractInternalLinks(
          html,
          baseUrl
        );

        links.forEach((link) => {
          if (
            !visited.has(link) &&
            urlsToVisit.length < 10
          ) {
            urlsToVisit.push(link);
          }
        });
      } catch (err) {
        console.error("Failed:", currentUrl, err);
      }
    }

    const doc = new Document({
      sections: [
        {
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition":
          'attachment; filename="website-export.docx"',
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to export DOCX" },
      { status: 500 }
    );
  }
}
