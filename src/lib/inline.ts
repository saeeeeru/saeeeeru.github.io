function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Bold and markdown links only. Input is escaped before tags are added. */
export function renderInline(input: string): string {
  const escaped = escapeHtml(input);
  return escaped
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      (_match, label: string, href: string) =>
        `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}<span class="sr-only">（新しいタブで開きます）</span></a>`,
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}
