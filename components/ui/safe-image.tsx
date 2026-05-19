"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { DEFAULT_COURSE_IMAGE } from "@/lib/course-media";

type SafeImageProps = ImageProps & {
  fallbackSrc?: string;
};

export function SafeImage({ src, alt, fallbackSrc = DEFAULT_COURSE_IMAGE, onError, ...props }: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={(event) => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
        onError?.(event);
      }}
    />
  );
}
