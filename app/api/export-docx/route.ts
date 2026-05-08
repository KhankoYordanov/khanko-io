import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
} from "docx";

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

    const response = await axios.get(url);

    const html = response.data;

    const $ = cheerio.load(html);

    const title = $("title").first().text().trim();

    const h1 = $("h1").first().text().trim();

    const paragraphs = $("p")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((text) => text.length > 40)
      .slice(0, 30);

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: title || "Website Export",
              heading: HeadingLevel.TITLE,
            }),

            new Paragraph({
              text: h1 || "",
              heading: HeadingLevel.HEADING_1,
            }),

            ...paragraphs.map(
              (text) =>
                new Paragraph({
                  text,
                })
            ),
          ],
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
