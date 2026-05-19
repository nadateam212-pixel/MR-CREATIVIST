export type VideoSourceProvider = "direct" | "youtube" | "vimeo" | "google-drive" | "unsupported" | "empty";

export type VideoSource = {
  provider: VideoSourceProvider;
  originalUrl: string;
  playbackUrl: string;
  embedUrl: string;
  iframeOrigin: string;
  canUseToolbar: boolean;
  isIframe: boolean;
  label: string;
};

type VideoSourceOptions = {
  nonce?: number;
  playerId?: string;
  controls?: boolean;
  origin?: string;
};

const DIRECT_VIDEO_PATTERN = /\.(mp4|webm|ogg)(?:[?#].*)?$/i;

function cleanId(value?: string | null) {
  return String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 128);
}

export function youtubeIdFromUrl(rawUrl?: string) {
  const raw = String(rawUrl ?? "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

    if (host === "youtu.be") {
      return cleanId(url.pathname.split("/").filter(Boolean)[0]);
    }

    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const directId = url.searchParams.get("v");
      if (directId) return cleanId(directId);

      const [, id] = url.pathname.match(/\/(?:embed|shorts|live)\/([^/?#]+)/i) ?? [];
      return cleanId(id);
    }
  } catch {
    const [, id] =
      raw.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?[^#]*v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/i) ?? [];
    return cleanId(id);
  }

  return "";
}

export function vimeoIdFromUrl(rawUrl?: string) {
  const raw = String(rawUrl ?? "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    if (!url.hostname.includes("vimeo.com")) return "";

    const numericSegment = url.pathname
      .split("/")
      .filter(Boolean)
      .find((segment) => /^\d+$/.test(segment));

    return numericSegment ?? "";
  } catch {
    const [, id] = raw.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/i) ?? [];
    return id ?? "";
  }
}

function vimeoHashFromUrl(rawUrl?: string) {
  const raw = String(rawUrl ?? "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    if (!url.hostname.includes("vimeo.com")) return "";

    const queryHash = url.searchParams.get("h");
    if (queryHash) return cleanId(queryHash);

    const parts = url.pathname.split("/").filter(Boolean);
    const numericIndex = parts.findIndex((part) => /^\d+$/.test(part));
    return numericIndex >= 0 ? cleanId(parts[numericIndex + 1]) : "";
  } catch {
    const [, hash] = raw.match(/vimeo\.com\/\d+\/([a-zA-Z0-9]+)/i) ?? [];
    return cleanId(hash);
  }
}

export function googleDriveFileIdFromUrl(rawUrl?: string) {
  const raw = String(rawUrl ?? "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    if (!url.hostname.includes("drive.google.com") && !url.hostname.includes("docs.google.com")) return "";

    const queryId = url.searchParams.get("id");
    if (queryId) return cleanId(queryId);

    const [, id] = url.pathname.match(/\/(?:file\/d|document\/d|presentation\/d)\/([^/?#]+)/i) ?? [];
    return cleanId(id);
  } catch {
    const [, id] = raw.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?[^#]*id=)([a-zA-Z0-9_-]+)/i) ?? [];
    return cleanId(id);
  }
}

function emptySource(rawUrl = ""): VideoSource {
  return {
    provider: rawUrl ? "unsupported" : "empty",
    originalUrl: rawUrl,
    playbackUrl: "",
    embedUrl: "",
    iframeOrigin: "",
    canUseToolbar: false,
    isIframe: false,
    label: rawUrl ? "Unsupported video" : "No video"
  };
}

export function videoSourceForUrl(rawUrl?: string, options: VideoSourceOptions = {}): VideoSource {
  const originalUrl = String(rawUrl ?? "").trim();
  if (!originalUrl) return emptySource();

  if (DIRECT_VIDEO_PATTERN.test(originalUrl)) {
    return {
      provider: "direct",
      originalUrl,
      playbackUrl: originalUrl,
      embedUrl: "",
      iframeOrigin: "",
      canUseToolbar: true,
      isIframe: false,
      label: "Hosted video"
    };
  }

  const youtubeId = youtubeIdFromUrl(originalUrl);
  if (youtubeId) {
    const params = new URLSearchParams({
      enablejsapi: "1",
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
      iv_load_policy: "3",
      disablekb: options.controls === false ? "1" : "0",
      fs: options.controls === false ? "0" : "1",
      showinfo: "0",
      controls: options.controls === false ? "0" : "1"
    });
    if (options.origin) params.set("origin", options.origin);

    return {
      provider: "youtube",
      originalUrl,
      playbackUrl: originalUrl,
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?${params.toString()}`,
      iframeOrigin: "https://www.youtube-nocookie.com",
      canUseToolbar: true,
      isIframe: true,
      label: "YouTube"
    };
  }

  const vimeoId = vimeoIdFromUrl(originalUrl);
  if (vimeoId) {
    const vimeoHash = vimeoHashFromUrl(originalUrl);
    const params = new URLSearchParams({
      api: "1",
      player_id: options.playerId ?? "mrc-vimeo-player",
      title: "0",
      byline: "0",
      portrait: "0",
      badge: "0",
      controls: options.controls === false ? "0" : "1",
      speed: "1",
      dnt: "1",
      autopause: "1",
      nonce: String(options.nonce ?? 0)
    });
    if (vimeoHash) params.set("h", vimeoHash);

    return {
      provider: "vimeo",
      originalUrl,
      playbackUrl: originalUrl,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?${params.toString()}`,
      iframeOrigin: "https://player.vimeo.com",
      canUseToolbar: true,
      isIframe: true,
      label: "Vimeo"
    };
  }

  const driveId = googleDriveFileIdFromUrl(originalUrl);
  if (driveId) {
    return {
      provider: "google-drive",
      originalUrl,
      playbackUrl: originalUrl,
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      iframeOrigin: "https://drive.google.com",
      canUseToolbar: false,
      isIframe: true,
      label: "Google Drive"
    };
  }

  return emptySource(originalUrl);
}

export function normalizedExternalVideoUrl(rawUrl?: string) {
  const source = videoSourceForUrl(rawUrl);

  return {
    url: source.embedUrl || source.playbackUrl || source.originalUrl,
    embedUrl: source.isIframe ? source.embedUrl : undefined,
    playbackUrl: source.provider === "direct" ? source.playbackUrl : source.embedUrl || source.playbackUrl,
    providerLabel: source.label,
    provider: source.provider
  };
}
