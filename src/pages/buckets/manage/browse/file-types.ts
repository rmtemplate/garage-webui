import {
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileVideo,
  File as FileIcon,
  type LucideIcon,
} from "lucide-react";
import mime from "mime/lite";

/**
 * One place that decides what kind of file a key is. The list filter, the
 * icon, the thumbnail decision and the colour all read from here, so they can
 * never disagree.
 */
export const FILE_KINDS = [
  "image",
  "video",
  "audio",
  "document",
  "archive",
  "code",
  "data",
  "other",
] as const;

export type FileKind = (typeof FILE_KINDS)[number];

const BY_EXT: Record<string, FileKind> = {
  // archives
  zip: "archive", rar: "archive", "7z": "archive", iso: "archive",
  tar: "archive", gz: "archive", tgz: "archive", bz2: "archive",
  xz: "archive", zst: "archive",
  // documents
  pdf: "document", doc: "document", docx: "document", odt: "document",
  rtf: "document", epub: "document",
  // data
  csv: "data", tsv: "data", xls: "data", xlsx: "data", ods: "data",
  json: "data", yaml: "data", yml: "data", toml: "data", xml: "data",
  sql: "data", rdb: "data", db: "data", parquet: "data",
  // code
  js: "code", mjs: "code", cjs: "code", ts: "code", tsx: "code", jsx: "code",
  go: "code", rs: "code", py: "code", rb: "code", php: "code", java: "code",
  sh: "code", css: "code", scss: "code", html: "code", htm: "code",
};

const IMAGE_EXTS = new Set([
  "jpg", "jpeg", "png", "gif", "webp", "avif", "bmp", "svg", "ico",
]);

/** Extensions the thumbnail endpoint (and the demo renderer) can render. */
export const isImageExt = (ext?: string | null) =>
  !!ext && IMAGE_EXTS.has(ext.toLowerCase());

export const getFileExt = (key: string) => {
  const name = key.split("/").pop() || key;
  const idx = name.lastIndexOf(".");
  return idx > 0 ? name.slice(idx + 1).toLowerCase() : null;
};

export const getFileKind = (key: string): FileKind => {
  const ext = getFileExt(key);
  if (!ext) return "other";
  if (IMAGE_EXTS.has(ext)) return "image";
  if (BY_EXT[ext]) return BY_EXT[ext];

  const type = mime.getType(ext)?.split("/")[0];
  if (type === "image") return "image";
  if (type === "video") return "video";
  if (type === "audio") return "audio";
  if (type === "text") return "document";

  return "other";
};

const ICONS: Record<FileKind, LucideIcon> = {
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  document: FileText,
  archive: FileArchive,
  code: FileCode,
  data: FileJson,
  other: FileIcon,
};

/** Tinted so a long list is scannable by colour before you read a name. */
const COLORS: Record<FileKind, string> = {
  image: "text-violet-500",
  video: "text-rose-500",
  audio: "text-amber-500",
  document: "text-sky-500",
  archive: "text-orange-500",
  code: "text-emerald-500",
  data: "text-teal-500",
  other: "text-base-content/45",
};

export const FILE_KIND_LABELS: Record<FileKind, string> = {
  image: "Images",
  video: "Video",
  audio: "Audio",
  document: "Documents",
  archive: "Archives",
  code: "Code",
  data: "Data",
  other: "Other",
};

export const getFileIcon = (key: string) => {
  const kind = getFileKind(key);
  return { kind, Icon: ICONS[kind], color: COLORS[kind] };
};

/** Spreadsheet icon is only used for true tabular files, not all data files. */
export const getDataIcon = (ext?: string | null) =>
  ext && ["csv", "tsv", "xls", "xlsx", "ods"].includes(ext)
    ? FileSpreadsheet
    : null;
