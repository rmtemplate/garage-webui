import { cn } from "@/lib/utils";
import { useState } from "react";
import { getFileExt, getFileIcon, isImageExt } from "./file-types";
import { objectUrl } from "./object-url";
import type { Object as S3Object } from "./types";

type Props = {
  object: Pick<S3Object, "objectKey" | "url">;
  size?: number;
  className?: string;
};

/**
 * Thumbnail for images, a typed icon for everything else.
 *
 * Falls back to the icon if the image fails to load, so a broken or
 * unrenderable object never leaves a torn-image placeholder in the list.
 */
const ObjectThumb = ({ object, size = 20, className }: Props) => {
  const [failed, setFailed] = useState(false);
  const ext = getFileExt(object.objectKey);
  const { Icon, color } = getFileIcon(object.objectKey);

  if (isImageExt(ext) && !failed) {
    return (
      <img
        src={objectUrl(object, "thumb")}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        style={{ width: size, height: size }}
        className={cn(
          "shrink-0 rounded object-cover bg-base-200 border border-base-300",
          className
        )}
      />
    );
  }

  return (
    <Icon
      size={size}
      aria-hidden
      className={cn("shrink-0", color, className)}
    />
  );
};

export default ObjectThumb;
