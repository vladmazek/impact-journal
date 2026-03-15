export function getMediaUrl(relativePath: string) {
  return `/api/media/${relativePath
    .split(/[\\/]/)
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}
