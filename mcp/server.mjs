#!/usr/bin/env node
/**
 * The PULSE documentation, as an MCP server.
 *
 *   npx @thepulseapi/docs-mcp
 *
 * **Why a local stdio server and not a hosted one.** developer.thepulseapi.com is a static export
 * on GitHub Pages: there is no process to host an HTTP MCP endpoint on. This runs wherever the
 * agent runs, fetches the published index, and needs nothing from us but a CDN.
 *
 * **It reads the same index the website reads.** One corpus, two front ends, so an answer an agent
 * gets and an answer a human gets come from the same chunks. The index is fetched at startup
 * rather than bundled, because a bundled copy goes stale the moment a page is edited and the
 * server has no way to know.
 *
 * Search is lexical here, deliberately. The website embeds the query with a 23 MB model it has
 * already paid to download; making an agent download one to ask a question would be a poor
 * trade when the agent is itself a language model and can read three candidate sections and
 * decide. So this returns more, ranks it honestly, and lets the caller judge.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const SITE =
  process.env.PULSE_DOCS_ORIGIN ?? "https://developer.thepulseapi.com";
const INDEX_URL = `${SITE}/search-index.json`;

/** Tokens, lowercased, with the short noise words dropped. */
const STOP = new Set(
  "a an and are as at be but by для for from has have how i if in into is it its of on or that the then there these this to was what when where which who why will with you your".split(
    " ",
  ),
);

function tokens(text) {
  return (
    text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}_/-]*/gu) ?? []
  ).filter((w) => w.length > 1 && !STOP.has(w));
}

/**
 * BM25, which is the right tool when the query is written by something that knows what it means.
 *
 * An agent asking about `/catalog/audit` wants the page with that literal string far more than it
 * wants a semantic neighbour, and lexical scoring is exact about that where an embedding blurs it.
 */
function makeRanker(chunks) {
  const docs = chunks.map((c) => tokens(`${c.p} ${c.h} ${c.t}`));
  const avgLen =
    docs.reduce((n, d) => n + d.length, 0) / Math.max(1, docs.length);
  const df = new Map();
  for (const d of docs)
    for (const w of new Set(d)) df.set(w, (df.get(w) ?? 0) + 1);

  const tf = docs.map((d) => {
    const m = new Map();
    for (const w of d) m.set(w, (m.get(w) ?? 0) + 1);
    return m;
  });

  const k1 = 1.4;
  const b = 0.72;
  const N = docs.length;

  return (query, { lang, limit }) => {
    const qs = tokens(query);
    if (qs.length === 0) return [];

    const scored = [];
    for (let i = 0; i < chunks.length; i += 1) {
      if (lang && chunks[i].l !== lang) continue;
      let score = 0;
      for (const w of qs) {
        const f = tf[i].get(w);
        if (!f) continue;
        const idf = Math.log(
          1 + (N - (df.get(w) ?? 0) + 0.5) / ((df.get(w) ?? 0) + 0.5),
        );
        score +=
          idf *
          ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * docs[i].length) / avgLen)));
      }
      if (score > 0) scored.push({ i, score });
    }

    scored.sort((x, y) => y.score - x.score);

    // One section per page, so a long page cannot fill the whole result set.
    const seen = new Set();
    const out = [];
    for (const s of scored) {
      const c = chunks[s.i];
      if (seen.has(c.u)) continue;
      seen.add(c.u);
      out.push({ chunk: c, score: Number(s.score.toFixed(3)) });
      if (out.length >= limit) break;
    }
    return out;
  };
}

async function load() {
  const res = await fetch(INDEX_URL, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Could not fetch ${INDEX_URL}: ${res.status}`);
  return res.json();
}

const index = await load();
const rank = makeRanker(index.chunks);
const pageUrls = [...new Set(index.chunks.map((c) => c.u))].sort();

const mcp = new McpServer({ name: "pulse-docs", version: "0.2.0" });

mcp.registerTool(
  "search_docs",
  {
    title: "Search the PULSE documentation",
    description:
      "Full-text search across every page of the PULSE developer documentation. Returns the " +
      "matching section of each page with its URL, so you can cite it or fetch the whole page " +
      "with get_page. Prefer this over guessing an endpoint or an SDK method.",
    inputSchema: {
      query: z
        .string()
        .describe("What you want to know, or a literal like /catalog/audit"),
      lang: z
        .enum(["en", "vi"])
        .default("en")
        .describe("Documentation language"),
      limit: z.number().int().min(1).max(10).default(5),
    },
  },
  async ({ query, lang, limit }) => {
    const hits = rank(query, { lang, limit });
    if (hits.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No section of the documentation matches "${query}".`,
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text",
          text: hits
            .map(
              (h) =>
                `## ${h.chunk.p} — ${h.chunk.h}\n` +
                `${SITE}${h.chunk.u}${h.chunk.a ? `#${h.chunk.a}` : ""}  (score ${h.score})\n\n` +
                h.chunk.t,
            )
            .join("\n\n---\n\n"),
        },
      ],
    };
  },
);

mcp.registerTool(
  "get_page",
  {
    title: "Read one documentation page",
    description:
      "Fetch a full documentation page as Markdown. Use the url from search_docs, for example " +
      "/quickstart or /api/v1/audit.",
    inputSchema: {
      url: z.string().describe("Page path, such as /quickstart or /vi/sdk"),
    },
  },
  async ({ url }) => {
    const path = url.startsWith("/") ? url : `/${url}`;
    const slug = path.replace(/^\/(vi)(?=\/|$)/, "") || "/";
    const lang = path.startsWith("/vi") ? ".vi" : "";
    const target = `${SITE}/llms.mdx/docs${slug === "/" ? "" : slug}/content.md`;

    const res = await fetch(target);
    if (!res.ok) {
      return {
        content: [
          {
            type: "text",
            text: `No page at ${path}. Known pages:\n${pageUrls.join("\n")}`,
          },
        ],
        isError: true,
      };
    }
    void lang;
    return { content: [{ type: "text", text: await res.text() }] };
  },
);

mcp.registerTool(
  "list_pages",
  {
    title: "List every documentation page",
    description:
      "Every page in the PULSE developer documentation, with its title. Useful for orienting " +
      "before searching.",
    inputSchema: { lang: z.enum(["en", "vi"]).default("en") },
  },
  async ({ lang }) => {
    const seen = new Map();
    for (const c of index.chunks) {
      if (c.l !== lang) continue;
      if (!seen.has(c.u)) seen.set(c.u, c.p);
    }
    return {
      content: [
        {
          type: "text",
          text: [...seen.entries()]
            .map(([u, title]) => `${u}  ${title}`)
            .join("\n"),
        },
      ],
    };
  },
);

/*
 * The one tool that calls PULSE rather than reading the docs: the Decision API, sold per decision.
 *
 * Everything above runs on the caller's machine and sends nothing. This sends the shopper's words
 * and the candidates to `POST /decide`, and only when the user has put an API key in the config,
 * so a docs-only install never makes a call it did not ask for.
 */
const API = (
  process.env.PULSE_API_URL ?? "https://api.thepulseapi.com/api/v1"
).replace(/\/+$/, "");
const KEY = process.env.PULSE_API_KEY;

mcp.registerTool(
  "resolve_products",
  {
    title: "Decide which products meet the shopper's requirements",
    description:
      "For each candidate product, says whether the evidence on the product (its fields, title and " +
      "description) shows it meets each requirement, fails it, or cannot tell, and what is missing. " +
      'Use it before recommending a product, so you can say "the listing does not state the RAM" ' +
      "instead of guessing. Needs PULSE_API_KEY. Requirements use op lte, gte, eq or neq; a budget " +
      'in the query, such as "under 2 triệu" or "below $1,500", becomes a price requirement.',
    inputSchema: {
      query: z
        .string()
        .max(500)
        .optional()
        .describe("The shopper's request in their own words"),
      requirements: z
        .array(
          z.object({
            attribute: z
              .string()
              .describe(
                "For example ram, storage, screen, cpu, price, or any field name",
              ),
            op: z.enum(["lte", "gte", "eq", "neq"]),
            value: z
              .union([z.number(), z.string()])
              .describe("GB for ram and storage, inches for screen"),
          }),
        )
        .max(20)
        .optional(),
      products: z
        .array(
          z.object({
            id: z.string(),
            title: z.string().optional(),
            description: z.string().max(20000).optional(),
            price: z.number().optional(),
            attributes: z.record(z.string(), z.unknown()).optional(),
          }),
        )
        .min(1)
        .max(50),
    },
  },
  async (input) => {
    if (!KEY) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text:
              "resolve_products needs a PULSE API key. Create one in the dashboard under " +
              'Integration, API keys, then add "env": { "PULSE_API_KEY": "pk_..." } to this ' +
              "server in the MCP config. See https://developer.thepulseapi.com/mcp",
          },
        ],
      };
    }
    const res = await fetch(`${API}/decide`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": KEY },
      body: JSON.stringify(input),
    });
    const text = await res.text();
    return res.ok
      ? { content: [{ type: "text", text }] }
      : {
          isError: true,
          content: [
            { type: "text", text: `PULSE answered ${res.status}: ${text}` },
          ],
        };
  },
);

await mcp.connect(new StdioServerTransport());
