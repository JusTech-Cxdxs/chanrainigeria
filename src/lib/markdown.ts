import { Marked } from "marked";

// Raw HTML in content is escaped rather than rendered, so admin-entered text can't inject scripts.
const md = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    html({ text }) {
      return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    },
    link({ href, title, tokens }) {
      const safe = /^(https?:|mailto:|tel:|\/|#)/i.test(href) ? href : "#";
      const ext = /^https?:/i.test(safe);
      const label = this.parser.parseInline(tokens);
      return `<a href="${safe}"${title ? ` title="${title}"` : ""}${ext ? ' target="_blank" rel="noopener"' : ""}>${label}</a>`;
    },
  },
});

export function renderMarkdown(src: string) {
  return md.parse(src ?? "", { async: false }) as string;
}
