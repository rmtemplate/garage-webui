import { API_URL } from "@/lib/api";
import { IS_DEMO } from "@/lib/consts";
import { demoImage, demoTextPreview, demoThumbnail } from "@/lib/demo/assets";
import { isImageExt } from "./file-types";

type Mode = "view" | "thumb" | "dl";

/**
 * Where to point an <img>, a preview tab, or a download at for an object.
 *
 * The only place in the browser that builds an object URL. In Demo Mode it
 * returns a locally generated data: URI, so nothing is ever requested over the
 * network; otherwise it is the backend's `/browse/{bucket}/{key}` route.
 */
export const objectUrl = (
  object: { objectKey: string; url: string },
  mode: Mode = "view"
) => {
  if (IS_DEMO) {
    const ext = object.objectKey.split(".").pop()?.toLowerCase();
    if (isImageExt(ext)) {
      return mode === "thumb"
        ? demoThumbnail(object.objectKey)
        : demoImage(object.objectKey);
    }
    return demoTextPreview(object.objectKey);
  }

  return API_URL + object.url + `?${mode}=1`;
};
