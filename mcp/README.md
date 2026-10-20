# @thepulseapi/docs-mcp

The [PULSE developer documentation](https://developer.thepulseapi.com) as an MCP server, so an
agent can search and read it rather than recalling an endpoint that may not exist.

```json
{
  "mcpServers": {
    "pulse-docs": {
      "command": "npx",
      "args": ["-y", "@thepulseapi/docs-mcp"]
    }
  }
}
```

## Tools

| Tool | What it does |
| --- | --- |
| `search_docs` | Full-text search across every page. Returns the matching section, its URL and a score |
| `get_page` | One page as Markdown, by path |
| `list_pages` | Every page with its title |

All three take a `lang` of `en` or `vi`.

## Notes

It runs on your machine and fetches the published index at startup, so it is current without a
republish and nothing about your prompts reaches us. Set `PULSE_DOCS_ORIGIN` to read from a
different origin while working on the documentation itself.

Search is lexical rather than semantic on purpose: the caller is a language model that can read
three candidate sections and judge, and an agent asking about `/catalog/audit` wants the page
with that exact string.

MIT.
