/**
 * In-memory database for Local Demo Mode.
 *
 * Mutable: create / update / delete from the UI change this store, so the
 * demo behaves like a real app for the lifetime of the page. Reloading the
 * page reseeds it.
 *
 * Every credential below is fabricated and clearly marked `DEMO`. Nothing here
 * is, or may be replaced with, a real access key.
 */

import type { Bucket, Permissions } from "@/pages/buckets/types";
import type { GetClusterLayoutResult, Node, Role } from "@/pages/cluster/types";
import type { Config } from "@/types/garage";

export type DemoObject = {
  key: string;
  size: number;
  lastModified: string;
  contentType: string;
};

export type DemoKey = {
  id: string;
  name: string;
  secretAccessKey: string;
  created: string;
};

const now = Date.now();
const daysAgo = (d: number, h = 0) =>
  new Date(now - d * 864e5 - h * 36e5).toISOString();

// -- Access keys -------------------------------------------------------------

const keys: DemoKey[] = [
  {
    id: "GKDEMO00000000000000CI01",
    name: "ci-deploy",
    secretAccessKey: "demo-secret-not-a-real-credential-ci01",
    created: daysAgo(212),
  },
  {
    id: "GKDEMO00000000000000WEB1",
    name: "website-publisher",
    secretAccessKey: "demo-secret-not-a-real-credential-web1",
    created: daysAgo(154),
  },
  {
    id: "GKDEMO00000000000000BKP2",
    name: "backup-agent",
    secretAccessKey: "demo-secret-not-a-real-credential-bkp2",
    created: daysAgo(96),
  },
  {
    id: "GKDEMO00000000000000ANLY",
    name: "analytics-reader",
    secretAccessKey: "demo-secret-not-a-real-credential-anly",
    created: daysAgo(31),
  },
  {
    id: "GKDEMO00000000000000ARCH",
    name: "archive-writer",
    secretAccessKey: "demo-secret-not-a-real-credential-arch",
    created: daysAgo(9),
  },
];

// -- Objects -----------------------------------------------------------------

const mb = (n: number) => Math.round(n * 1024 * 1024);
const kb = (n: number) => Math.round(n * 1024);

const objects: Record<string, DemoObject[]> = {
  "media-assets": [
    { key: "photos/2024/alpine-ridge.jpg", size: mb(4.2), lastModified: daysAgo(3, 2), contentType: "image/jpeg" },
    { key: "photos/2024/harbour-dawn.jpg", size: mb(3.6), lastModified: daysAgo(3, 5), contentType: "image/jpeg" },
    { key: "photos/2024/studio-portrait.png", size: mb(8.1), lastModified: daysAgo(6), contentType: "image/png" },
    { key: "photos/2023/launch-keynote.jpg", size: mb(5.4), lastModified: daysAgo(192), contentType: "image/jpeg" },
    { key: "photos/2023/office-tour.jpg", size: mb(2.9), lastModified: daysAgo(240), contentType: "image/jpeg" },
    { key: "video/product-tour-1080p.mp4", size: mb(412), lastModified: daysAgo(11), contentType: "video/mp4" },
    { key: "video/changelog-q3.webm", size: mb(96.4), lastModified: daysAgo(27), contentType: "video/webm" },
    { key: "brand/logo-primary.svg", size: kb(18), lastModified: daysAgo(64), contentType: "image/svg+xml" },
    { key: "brand/logo-mono.svg", size: kb(14), lastModified: daysAgo(64), contentType: "image/svg+xml" },
    { key: "brand/brand-guidelines.pdf", size: mb(12.7), lastModified: daysAgo(58), contentType: "application/pdf" },
    { key: "brand/palette.json", size: kb(2.3), lastModified: daysAgo(58), contentType: "application/json" },
    { key: "README.md", size: kb(4.1), lastModified: daysAgo(1, 4), contentType: "text/markdown" },
  ],
  "static-site": [
    { key: "index.html", size: kb(14.8), lastModified: daysAgo(0, 3), contentType: "text/html" },
    { key: "404.html", size: kb(3.2), lastModified: daysAgo(0, 3), contentType: "text/html" },
    { key: "assets/app.9f2c41.js", size: kb(284), lastModified: daysAgo(0, 3), contentType: "text/javascript" },
    { key: "assets/app.9f2c41.css", size: kb(61), lastModified: daysAgo(0, 3), contentType: "text/css" },
    { key: "assets/hero.webp", size: kb(188), lastModified: daysAgo(14), contentType: "image/webp" },
    { key: "assets/og-card.png", size: kb(342), lastModified: daysAgo(14), contentType: "image/png" },
    { key: "docs/getting-started.html", size: kb(22), lastModified: daysAgo(2), contentType: "text/html" },
    { key: "docs/api-reference.html", size: kb(96), lastModified: daysAgo(2), contentType: "text/html" },
    { key: "docs/img/architecture.png", size: kb(410), lastModified: daysAgo(2), contentType: "image/png" },
    { key: "robots.txt", size: 214, lastModified: daysAgo(90), contentType: "text/plain" },
    { key: "sitemap.xml", size: kb(7.4), lastModified: daysAgo(0, 3), contentType: "application/xml" },
  ],
  "nightly-backups": [
    { key: "postgres/2026-10-13-full.sql.gz", size: mb(1842), lastModified: daysAgo(1, 2), contentType: "application/gzip" },
    { key: "postgres/2026-10-12-full.sql.gz", size: mb(1817), lastModified: daysAgo(2, 2), contentType: "application/gzip" },
    { key: "postgres/2026-10-11-full.sql.gz", size: mb(1795), lastModified: daysAgo(3, 2), contentType: "application/gzip" },
    { key: "redis/2026-10-13-dump.rdb.zst", size: mb(214), lastModified: daysAgo(1, 1), contentType: "application/zstd" },
    { key: "redis/2026-10-12-dump.rdb.zst", size: mb(209), lastModified: daysAgo(2, 1), contentType: "application/zstd" },
    { key: "configs/etc-snapshot.tar.gz", size: mb(38.6), lastModified: daysAgo(7), contentType: "application/gzip" },
    { key: "manifest.json", size: kb(12), lastModified: daysAgo(1, 1), contentType: "application/json" },
  ],
  "app-uploads": [
    { key: "avatars/u-10244.png", size: kb(48), lastModified: daysAgo(0, 1), contentType: "image/png" },
    { key: "avatars/u-10311.png", size: kb(52), lastModified: daysAgo(0, 2), contentType: "image/png" },
    { key: "avatars/u-10490.jpg", size: kb(71), lastModified: daysAgo(0, 6), contentType: "image/jpeg" },
    { key: "invoices/2026-09/INV-004812.pdf", size: kb(96), lastModified: daysAgo(18), contentType: "application/pdf" },
    { key: "invoices/2026-09/INV-004813.pdf", size: kb(102), lastModified: daysAgo(18), contentType: "application/pdf" },
    { key: "invoices/2026-10/INV-004901.pdf", size: kb(99), lastModified: daysAgo(4), contentType: "application/pdf" },
    { key: "exports/users-2026-10-01.csv", size: mb(18.4), lastModified: daysAgo(13), contentType: "text/csv" },
    { key: "exports/events-2026-10-01.csv", size: mb(142), lastModified: daysAgo(13), contentType: "text/csv" },
    { key: "tmp/upload-part-7f31.bin", size: mb(64), lastModified: daysAgo(0, 8), contentType: "application/octet-stream" },
  ],
  "cold-archive": [
    { key: "2021/ledger-2021.tar.zst", size: mb(7340), lastModified: daysAgo(980), contentType: "application/zstd" },
    { key: "2022/ledger-2022.tar.zst", size: mb(8120), lastModified: daysAgo(615), contentType: "application/zstd" },
    { key: "2023/ledger-2023.tar.zst", size: mb(9460), lastModified: daysAgo(250), contentType: "application/zstd" },
    { key: "CHECKSUMS.txt", size: kb(1.1), lastModified: daysAgo(250), contentType: "text/plain" },
  ],
  "terraform-state": [],
};

// -- Buckets -----------------------------------------------------------------

const permit = (read = true, write = false, owner = false): Permissions => ({
  read,
  write,
  owner,
});

const bucketKey = (
  keyId: string,
  permissions: Permissions,
  bucketLocalAliases: string[] = []
) => {
  const key = keys.find((k) => k.id === keyId)!;
  return {
    accessKeyId: key.id,
    name: key.name,
    permissions,
    bucketLocalAliases,
  };
};

const makeBucket = (
  alias: string,
  over: Partial<Bucket> & { keys?: Bucket["keys"] } = {}
): Bucket => {
  const items = objects[alias] || [];
  return {
    id: `demo-${alias}`,
    globalAliases: [alias],
    localAliases: [],
    websiteAccess: false,
    websiteConfig: null,
    keys: [],
    objects: items.length,
    bytes: items.reduce((acc, o) => acc + o.size, 0),
    unfinishedUploads: 0,
    unfinishedMultipartUploads: 0,
    unfinishedMultipartUploadParts: 0,
    unfinishedMultipartUploadBytes: 0,
    quotas: { maxSize: null, maxObjects: null },
    ...over,
  };
};

const buckets: Bucket[] = [
  makeBucket("media-assets", {
    keys: [
      bucketKey("GKDEMO00000000000000WEB1", permit(true, true, true)),
      bucketKey("GKDEMO00000000000000ANLY", permit(true, false, false)),
    ],
  }),
  makeBucket("static-site", {
    websiteAccess: true,
    websiteConfig: { indexDocument: "index.html", errorDocument: "404.html" },
    keys: [
      bucketKey("GKDEMO00000000000000WEB1", permit(true, true, true), ["site"]),
      bucketKey("GKDEMO00000000000000CI01", permit(true, true, false)),
    ],
  }),
  makeBucket("nightly-backups", {
    quotas: { maxSize: 8 * 1024 ** 4, maxObjects: 20000 },
    keys: [bucketKey("GKDEMO00000000000000BKP2", permit(true, true, true))],
  }),
  makeBucket("app-uploads", {
    keys: [
      bucketKey("GKDEMO00000000000000CI01", permit(true, true, true)),
      bucketKey("GKDEMO00000000000000ANLY", permit(true, false, false)),
    ],
  }),
  makeBucket("cold-archive", {
    keys: [bucketKey("GKDEMO00000000000000ARCH", permit(true, true, true))],
  }),
  // Deliberately empty + unassigned, so empty states are reachable in the demo.
  makeBucket("terraform-state", { keys: [] }),
];

// -- Cluster -----------------------------------------------------------------

const tb = (n: number) => n * 1000 ** 4;

const roles: Role[] = [
  { id: "f1a2b3c4d5e6f708", zone: "dc1", capacity: tb(8), tags: ["ssd", "fast"] },
  { id: "a9b8c7d6e5f40312", zone: "dc1", capacity: tb(8), tags: ["ssd"] },
  { id: "0c1d2e3f40516273", zone: "dc2", capacity: tb(12), tags: ["hdd", "bulk"] },
  { id: "8f7e6d5c4b3a2910", zone: "dc2", capacity: tb(12), tags: ["hdd", "bulk"] },
  { id: "55aa44bb33cc22dd", zone: "dc3", capacity: tb(4), tags: ["hdd"] },
];

const nodes: Node[] = [
  {
    id: "f1a2b3c4d5e6f708",
    addr: "10.20.0.11:3901",
    hostname: "garage-dc1-a",
    isUp: true,
    lastSeenSecsAgo: 2,
    dataPartition: { available: tb(5.1), total: tb(8) },
    metadataPartition: { available: 182 * 1000 ** 3, total: 256 * 1000 ** 3 },
  },
  {
    id: "a9b8c7d6e5f40312",
    addr: "10.20.0.12:3901",
    hostname: "garage-dc1-b",
    isUp: true,
    lastSeenSecsAgo: 1,
    dataPartition: { available: tb(5.4), total: tb(8) },
    metadataPartition: { available: 190 * 1000 ** 3, total: 256 * 1000 ** 3 },
  },
  {
    id: "0c1d2e3f40516273",
    addr: "10.30.0.21:3901",
    hostname: "garage-dc2-a",
    isUp: true,
    lastSeenSecsAgo: 4,
    dataPartition: { available: tb(8.8), total: tb(12) },
    metadataPartition: { available: 201 * 1000 ** 3, total: 256 * 1000 ** 3 },
  },
  {
    id: "8f7e6d5c4b3a2910",
    addr: "10.30.0.22:3901",
    hostname: "garage-dc2-b",
    isUp: true,
    lastSeenSecsAgo: 3,
    dataPartition: { available: tb(9.2), total: tb(12) },
    metadataPartition: { available: 205 * 1000 ** 3, total: 256 * 1000 ** 3 },
  },
  {
    id: "55aa44bb33cc22dd",
    addr: "10.40.0.31:3901",
    hostname: "garage-dc3-a",
    isUp: false,
    lastSeenSecsAgo: 1870,
    dataPartition: { available: tb(3.1), total: tb(4) },
    metadataPartition: { available: 120 * 1000 ** 3, total: 256 * 1000 ** 3 },
  },
  // Connected but never assigned a role — exercises the "Assign" flow.
  {
    id: "1234abcd5678ef90",
    addr: "10.40.0.32:3901",
    hostname: "garage-dc3-b",
    isUp: true,
    lastSeenSecsAgo: 6,
    dataPartition: { available: tb(3.9), total: tb(4) },
    metadataPartition: { available: 244 * 1000 ** 3, total: 256 * 1000 ** 3 },
  },
];

const layout: GetClusterLayoutResult = {
  version: 7,
  roles,
  stagedRoleChanges: [],
};

const config: Config = {
  metadata_dir: "/var/lib/garage/meta",
  data_dir: "/var/lib/garage/data",
  db_engine: "lmdb",
  metadata_auto_snapshot_interval: "6h",
  replication_factor: 3,
  compression_level: 2,
  rpc_bind_addr: "[::]:3901",
  rpc_public_addr: "10.20.0.11:3901",
  rpc_secret: "(hidden in demo mode)",
  s3_api: {
    s3_region: "demo-region",
    api_bind_addr: "[::]:3900",
    root_domain: ".s3.demo.local",
  },
  s3_web: {
    bind_addr: "[::]:3902",
    root_domain: ".web.demo.local",
    index: "index.html",
  },
  admin: {
    api_bind_addr: "[::]:3903",
    admin_token: "(hidden in demo mode)",
    metrics_token: "(hidden in demo mode)",
  },
};

/** The live, mutable demo state. */
export const db = {
  buckets,
  keys,
  objects,
  nodes,
  layout,
  config,
  nodeInfo: {
    nodeId: "f1a2b3c4d5e6f708",
    garageVersion: "v2.1.0",
    garageFeatures: ["k2v", "lmdb", "sqlite", "consul-discovery", "metrics"],
    rustVersion: "1.82.0",
    dbEngine: "LMDB (using Heed crate)",
  },
};

/** Recompute the cached object/byte counters after a browse mutation. */
export const recountBucket = (alias: string) => {
  const bucket = db.buckets.find((b) => b.globalAliases.includes(alias));
  if (!bucket) return;

  const items = db.objects[alias] || [];
  bucket.objects = items.length;
  bucket.bytes = items.reduce((acc, o) => acc + o.size, 0);
};

export const findBucket = (idOrAlias?: string | null) =>
  db.buckets.find(
    (b) => b.id === idOrAlias || b.globalAliases.includes(idOrAlias || "")
  );
