export const DEFAULT_COURSE_IMAGE = "/icons/logo.png";

export const DEFAULT_PREVIEW_VIDEO =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

const COURSE_IMAGE_BY_CATEGORY = [
  {
    match: /ai|automation|technology|software|data/i,
    image: DEFAULT_COURSE_IMAGE
  },
  {
    match: /business|marketing|commerce|sales|entrepreneur/i,
    image: DEFAULT_COURSE_IMAGE
  },
  {
    match: /video|media|production|studio|creative/i,
    image: DEFAULT_COURSE_IMAGE
  },
  {
    match: /photo|camera|visual/i,
    image: DEFAULT_COURSE_IMAGE
  }
];

const BROKEN_REMOTE_IMAGES = [/photo-1536240478700-b869070f9279/i];

export function courseImageForCategory(category) {
  const match = COURSE_IMAGE_BY_CATEGORY.find((item) => item.match.test(String(category ?? "")));

  return match?.image ?? DEFAULT_COURSE_IMAGE;
}

export function normalizeCourseImage(value, category) {
  const fallback = courseImageForCategory(category);
  const image = String(value ?? "").trim();

  if (!image || BROKEN_REMOTE_IMAGES.some((pattern) => pattern.test(image))) {
    return fallback;
  }

  if (image.startsWith("/")) {
    return image;
  }

  try {
    const url = new URL(image);
    return ["http:", "https:"].includes(url.protocol) ? image : fallback;
  } catch {
    return fallback;
  }
}

export function titleFromCourseSlug(slug) {
  return String(slug ?? "course")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
