/* Lightweight markdown <-> HTML round-trip used by the prompt editor.
 * Intentionally tiny — covers headings, lists, code fences, blockquotes,
 * paragraphs and inline bold/italic/code. Not a full CommonMark parser. */

export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function mdInline(s: string) {
  return escapeHtml(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

export function mdToHtml(md: string): string {
  const lines = md.split("\n");
  let html = "";
  let inUl = false, inOl = false, inCode = false;
  const codeBuf: string[] = [];
  const closeLists = () => {
    if (inUl) { html += "</ul>"; inUl = false; }
    if (inOl) { html += "</ol>"; inOl = false; }
  };
  for (const raw of lines) {
    if (raw.startsWith("```")) {
      if (inCode) {
        html += `<pre>${escapeHtml(codeBuf.join("\n"))}</pre>`;
        codeBuf.length = 0;
        inCode = false;
      } else {
        closeLists();
        inCode = true;
      }
      continue;
    }
    if (inCode) { codeBuf.push(raw); continue; }
    const line = raw.trimEnd();
    if (!line) { closeLists(); continue; }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
      closeLists();
      const lvl = m[1].length;
      html += `<h${lvl}>${mdInline(m[2])}</h${lvl}>`;
      continue;
    }
    if ((m = line.match(/^[-*]\s+(.*)$/))) {
      if (inOl) { html += "</ol>"; inOl = false; }
      if (!inUl) { html += "<ul>"; inUl = true; }
      html += `<li>${mdInline(m[1])}</li>`;
      continue;
    }
    if ((m = line.match(/^\d+\.\s+(.*)$/))) {
      if (inUl) { html += "</ul>"; inUl = false; }
      if (!inOl) { html += "<ol>"; inOl = true; }
      html += `<li>${mdInline(m[1])}</li>`;
      continue;
    }
    if (line.startsWith("> ")) {
      closeLists();
      html += `<blockquote>${mdInline(line.slice(2))}</blockquote>`;
      continue;
    }
    closeLists();
    html += `<p>${mdInline(line)}</p>`;
  }
  if (inCode) html += `<pre>${escapeHtml(codeBuf.join("\n"))}</pre>`;
  closeLists();
  return html;
}

export function htmlToMd(root: HTMLElement): string {
  const inline = (el: Node): string => {
    let s = "";
    el.childNodes.forEach((n) => {
      if (n.nodeType === 3) { s += (n as Text).data; return; }
      if (n.nodeType !== 1) return;
      const e = n as HTMLElement;
      const t = e.tagName.toLowerCase();
      if (t === "strong" || t === "b") s += `**${inline(e)}**`;
      else if (t === "em" || t === "i") s += `*${inline(e)}*`;
      else if (t === "code") s += `\`${e.textContent ?? ""}\``;
      else if (t === "br") s += "\n";
      else if (t === "a") s += `[${inline(e)}](${(e as HTMLAnchorElement).getAttribute("href") ?? ""})`;
      else s += inline(e);
    });
    return s;
  };
  const out: string[] = [];
  const walk = (nodes: NodeListOf<ChildNode> | ChildNode[]) => {
    nodes.forEach((n) => {
      if (n.nodeType === 3) {
        const t = (n as Text).data;
        if (t.trim()) { out.push(t.trim()); out.push(""); }
        return;
      }
      if (n.nodeType !== 1) return;
      const el = n as HTMLElement;
      const tag = el.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tag)) {
        out.push("#".repeat(+tag[1]) + " " + inline(el)); out.push("");
      } else if (tag === "p") {
        out.push(inline(el)); out.push("");
      } else if (tag === "ul") {
        Array.from(el.children).filter((c) => c.tagName === "LI").forEach((li) => out.push("- " + inline(li as HTMLElement)));
        out.push("");
      } else if (tag === "ol") {
        let i = 1;
        Array.from(el.children).filter((c) => c.tagName === "LI").forEach((li) => out.push(`${i++}. ` + inline(li as HTMLElement)));
        out.push("");
      } else if (tag === "blockquote") {
        out.push("> " + inline(el)); out.push("");
      } else if (tag === "pre") {
        out.push("```"); out.push(el.textContent ?? ""); out.push("```"); out.push("");
      } else if (tag === "div" || tag === "section" || tag === "article") {
        walk(el.childNodes);
      } else if (tag === "br") {
        // ignore
      } else {
        out.push(inline(el)); out.push("");
      }
    });
  };
  walk(root.childNodes);
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}