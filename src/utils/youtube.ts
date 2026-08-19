export function youtubeVideoId(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      if (url.pathname === "/watch") return url.searchParams.get("v");

      const [kind, id] = url.pathname.split("/").filter(Boolean);
      return ["embed", "shorts", "live"].includes(kind) ? (id ?? null) : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function youtubeThumbnailUrl(value: string | null) {
  const videoId = youtubeVideoId(value);
  return videoId
    ? `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`
    : null;
}

export function youtubeEmbedUrl(value: string | null) {
  const videoId = youtubeVideoId(value);
  return videoId
    ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1`
    : null;
}
