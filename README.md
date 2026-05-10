# KHANKO.io — Website Content Extraction & SEO Audit Platform

KHANKO.io is a lightweight website crawler and SEO analysis platform built for content extraction, structured exports, translation workflows, AI datasets, and technical SEO previews.

The platform crawls websites, discovers internal pages, extracts readable content, detects SEO issues, and exports clean datasets in multiple formats.

---

# Features

## Website Crawling

- Same-domain crawling
- Internal link discovery
- Sitemap.xml support
- Recursive page discovery
- Lightweight crawl queue
- URL deduplication

---

## SEO Preview

Analyze websites before exporting full reports.

Current checks:

- Missing titles
- Missing H1 tags
- Missing meta descriptions
- Thin content detection
- Duplicate title detection
- Crawl error tracking
- High confidence vs low confidence issue classification

---

## Export Formats

### DOCX Export

Generate clean Word documents from website content.

Useful for:

- Translation
- Content review
- Documentation
- Content migration

---

### XLSX Dataset Export

Export structured website datasets including:

- URL
- Title
- H1
- Meta description
- Word count
- Extracted content

---

### Translation XLSX

Generate translation-ready spreadsheets with:

- Original content
- Empty translation columns

---

### SEO Audit XLSX

Export page-level SEO audit reports.

---

# Tech Stack

- Next.js
- React
- TypeScript
- Axios
- Cheerio
- XLSX
- DOCX generation
- Custom crawler logic

---

# SEO Preview Confidence System

## High Confidence Issues

Likely real SEO problems.

Examples:

- Thin content
- Missing H1
- Missing metadata

---

## Low Confidence Issues

Possible crawler or rendering limitations.

Examples:

- JavaScript-rendered pages
- Partial HTML extraction
- Dynamic metadata loading

These results should be manually verified.

---

# Current MVP Limitations

- Up to 20 pages per scan
- Same-domain crawling only
- Lightweight JavaScript rendering support
- No authentication crawling
- No full browser automation
- No screenshot generation
- No Core Web Vitals analysis

---

# Future Roadmap

Planned improvements:

- Crawl depth controls
- Status code analysis
- Canonical detection
- Internal linking analysis
- Duplicate content analysis
- Robots.txt analysis
- Sitemap validation
- Export filters
- Full headless browser rendering
- AI-assisted SEO recommendations

---

# Local Development

Install dependencies:

```bash
npm install
