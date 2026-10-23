/**
 * Docs-site generator — zero dependencies.
 *
 * Reads `packages/components/*.md`, renders a static site under
 * `docs-site/dist/` with Squircle itself for the shell (skip link,
 * navbar, sticky sidebar, theme). Heading hierarchy in the docs maps to
 * the page shell's `sq-stack` rhythm; code fences render as escaped
 * `pre` blocks; tables render as `sq-table`.
 */

import { mkdir, readFile, copyFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = dirname(fileURLToPath(import.meta.url));
const root = dirname(siteDir);
const into = join(siteDir, "dist");

const DOCS = [
  ["CONTRACT", "Component contract"],
  ["BUTTONS", "Buttons"],
  ["FORMS", "Forms & inputs"],
  ["NAVIGATION", "Navigation"],
  ["OVERLAYS", "Overlays"],
  ["FEEDBACK", "Feedback"],
  ["DATA", "Data display"],
  ["MEDIA", "Media"],
  ["TYPOGRAPHY", "Typography"],
  ["LINKS", "Links"],
  ["LAYOUT", "Layout primitives"],
  ["PANELS-CARDS", "Panels & cards"],
  ["TABS", "Tabs"],
];

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function inline(text) {
  let out = escapeHtml(text);
  out = out.replaceAll(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replaceAll(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replaceAll(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  return out;
}

/** Splits one markdown table row's cells, honoring backtick code spans
 * (pipes inside code are data). Returns null-unbalanced cells so the
 * caller knows the row continues on the next source line. */
function splitCellRow(line) {
  const cells = [];
  let current = "";
  let inCode = false;
  const chars = [...line];
  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i];
    if (ch === "\\" && chars[i + 1] === "|") {
      current += "\\|";
      i += 1;
      continue;
    }
    if (ch === "`") {
      inCode = !inCode;
    }
    if (ch === "|" && !inCode) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return { cells, open: inCode };
}

function slugOf(text) {
  return text
    .toLowerCase()
    .replaceAll(/[^a-z0-9\s-]/gi, "")
    .trim()
    .replaceAll(/\s+/g, "-");
}

function mdToHtml(markdown) {
  const out = [];
  let paragraph = [];
  let fenceHeader = null;
  let fenceLines = [];
  let table = [];
  let list = null;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      out.push(`<p>${inline(paragraph.join(" "))}</p>`);
    }
    paragraph = [];
  };

  const flushFence = () => {
    if (fenceHeader === true) {
      const html = escapeHtml(fenceLines.join("\n"));
      // Example blocks can scroll horizontally on narrow screens — the
      // region gets keyboard access like any other scroll region.
      out.push(`<pre tabindex="0" aria-label="Example code">${html}</pre>`);
      fenceHeader = null;
      fenceLines = [];
    }
  };

  const flushTable = () => {
    if (table.length > 0) {
      const [head, ...rows] = table;
      const cells = (values, tag) =>
        values
          .map(
            (value) =>
              `<${tag}${tag === "th" ? ' scope="col"' : ""}>${inline(value)}</${tag}>`,
          )
          .join("");
      out.push(
        `<div class="sq-table-scroll" role="region" tabindex="0" aria-label="Data table"><table class="sq-table"><thead><tr>${cells(
          head,
          "th",
        )}</tr></thead><tbody>${rows
          .map((row) => `<tr>${cells(row, "td")}</tr>`)
          .join("")}</tbody></table></div>`,
      );
      table = [];
    }
  };

  const flushList = () => {
    if (list !== null) {
      const tag = list.ordered ? "ol" : "ul";
      const items = list.items
        .map((item) => `<li>${inline(item)}</li>`)
        .join("");
      out.push(`<${tag}>${items}</${tag}>`);
      list = null;
    }
  };

  const lines = markdown.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();

    if (fenceHeader === true) {
      if (line.startsWith("```")) {
        flushFence();
      } else {
        fenceLines.push(lines[i].trimEnd());
      }
      continue;
    }

    if (line.startsWith("```")) {
      flushParagraph();
      flushTable();
      flushList();
      fenceHeader = true;
      fenceLines = [];
      continue;
    }

    if (line.startsWith("|")) {
      flushParagraph();
      flushList();
      let { cells, open } = splitCellRow(line);
      // A table row that ends inside an unterminated code span continues
      // on the next source line (hand-wrapped docs tables).
      while (open && i + 1 < lines.length) {
        i += 1;
        const more = splitCellRow(lines[i].trim());
        const [first, ...rest] = more.cells;
        cells = [
          ...cells.slice(0, -1),
          `${cells[cells.length - 1] ?? ""} ${first ?? ""}`,
          ...rest,
        ];
        open = more.open;
      }
      const body = cells.slice(1, -1);
      const meta = body.every((cell) => /^:?-+:?$/.test(cell));
      if (!meta) {
        table.push(
          body.map((cell) =>
            /^[^\n]*$/.test(cell) ? cell.replaceAll(/ {2,}/g, " ") : cell,
          ),
        );
      }
      continue;
    }
    if (table.length > 0 && /^[:-]+$/.test(line.replace(/[\s|]/g, ""))) {
      continue; // alignment separator row
    }

    if (list !== null && !/^(?:[-*]|\d+\.)\s/.test(line)) {
      flushList();
    }
    if (/^(?:[-*]|\d+\.)\s/.test(line)) {
      flushParagraph();
      flushTable();
      const ordered = /^\d+\./.test(line);
      if (list === null || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push(line.replace(/^(?:[-*]|\d+\.)\s+/, ""));
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushTable();
      flushList();
      const text = line.slice(4);
      out.push(`<h4 id="${slugOf(text)}">${inline(text)}</h4>`);
      continue;
    }
    if (line.startsWith("## ")) {
      flushParagraph();
      flushTable();
      flushList();
      const text = line.slice(3);
      out.push(`<h2 id="${slugOf(text)}">${inline(text)}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      continue; // page h1 comes from the shell
    }
    if (line === "---") {
      continue;
    }
    if (line === "") {
      flushParagraph();
      flushTable();
      flushList();
      continue;
    }
    paragraph.push(line);
  }

  flushParagraph();
  flushFence();
  flushTable();
  flushList();
  return out.join("\n");
}

function shell(title, description, bodyHtml) {
  const sideLinks = DOCS.map(
    ([slugName, linkTitle]) =>
      `<li><a class="sq-nav__link" href="${slugName.toLowerCase()}.html">${linkTitle}</a></li>`,
  ).join("");
  const sideHtml = `<nav class="sq-sidebar sq-sidebar--sticky" aria-label="Component docs">
    <p class="sq-sidebar__title">Component docs</p>
    <ul class="sq-nav sq-nav--vertical">${sideLinks}</ul>
  </nav>`;
  return `<!doctype html>
<html lang="en" data-sq-theme="luca">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} — Squircle docs</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="stylesheet" href="assets/squircle.css" />
    <script src="assets/squircle-runtime.js"></script>
    <script>Squircle.initTheme();</script>
  </head>
  <body>
    <a class="sq-skip-link" href="#docs-main">Skip to content</a>
    <header class="sq-navbar">
      <div class="sq-container sq-navbar__inner">
        <a class="sq-navbar__brand" href="index.html">Squircle</a>
        <a class="sq-button sq-button--tertiary" href="index.html">Index</a>
      </div>
    </header>
    <main id="docs-main" class="sq-py-lg">
      <div class="sq-container--wide sq-px-md sq-with-sidebar">
        ${sideHtml}
        ${bodyHtml}
      </div>
    </main>
    <script>Squircle.init();</script>
  </body>
</html>
`;
}

function docPage(h1, purpose, bodyHtml) {
  const main = `<main id="doc-main" class="sq-stack--loose sq-stack">
    <div class="sq-stack">
      <h1>${inline(h1)}</h1>
      <p class="sq-lead">${inline(purpose)}</p>
    </div>
${bodyHtml}
  </main>`;
  return shell(h1, purpose, main);
}

function purposeOf(markdown) {
  const match = markdown.match(/Purpose[:\s]([^\n]+)/u);
  return match === null ? "Squircle component guide." : `Purpose: ${match[1]}`;
}

async function main() {
  await mkdir(join(into, "assets"), { recursive: true });
  await copyFile(
    join(root, "packages", "css", "dist", "squircle.css"),
    join(into, "assets", "squircle.css"),
  );
  await copyFile(
    join(root, "packages", "runtime", "dist", "squircle-runtime.js"),
    join(into, "assets", "squircle-runtime.js"),
  );

  const introCards = [];
  for (const [slugName, linkTitle] of DOCS) {
    const markdown = await readFile(
      join(root, "packages", "components", `${slugName}.md`),
      "utf8",
    );
    const purpose = purposeOf(markdown);
    const bodyHtml = docPage(
      linkTitle,
      purpose,
      `<article class="sq-stack" aria-labelledby="doc-main">${mdToHtml(markdown)}</article>`,
    );
    await writeFile(join(into, `${slugName.toLowerCase()}.html`), bodyHtml);
    introCards.push(
      `<article class="sq-card"><h3 class="sq-heading--4"><a href="${slugName.toLowerCase()}.html" class="sq-link">${linkTitle}</a></h3><p class="sq-text sq-muted sq-clamp-2">${inline(purpose)}</p></article>`,
    );
  }

  const indexMain = `<main class="sq-stack--loose sq-stack">
    <div class="sq-stack">
      <h1>Squircle component docs</h1>
      <p class="sq-lead">
        Evergreen semantics, one design language, zero training.
      </p>
    </div>
    <div class="sq-grid-auto">
      <article class="sq-card sq-card--interactive">
        <h3 class="sq-heading--4"><a href="contract.html" class="sq-link">Component contract</a></h3>
        <p class="sq-text sq-muted">Every component obeys one contract: naming, semantics, tokens, motion, density.</p>
      </article>
      ${introCards.join("")}
    </div>
  </main>`;
  await writeFile(
    join(into, "index.html"),
    shell(
      "Component docs",
      "Squircle component reference site — docs rendered from source",
      indexMain,
    ),
  );
  console.log(`docs-site: ${DOCS.length + 1} pages -> ${relative(root, into)}`);
}

await main();
