const CONTENT_PREVIEW_MAX = 240;

export function formatContentPreview(content: string): string {
  if (content.length <= CONTENT_PREVIEW_MAX) {
    return content;
  }
  return `${content.slice(0, CONTENT_PREVIEW_MAX)}...`;
}
