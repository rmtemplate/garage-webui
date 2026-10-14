/**
 * Local Demo Mode request handler.
 *
 * Mirrors the real backend's routes (backend/router/router.go) one-for-one and
 * answers them from `db`. Because it plugs in at the single `api.fetch`
 * boundary, every page, hook and query keeps its existing code path and its
 * existing request/response contract — swapping this adapter back out restores
 * the real service with no UI changes.
 *
 * This module is only ever imported from a `IS_DEMO` branch, so a production
 * build drops it entirely.
 */

import { APIError } from "../api";
import { db, findBucket, recountBucket, type DemoObject } from "./db";
import type { Bucket, Permissions } from "@/pages/buckets/types";
import type { Role, StagedRole } from "@/pages/cluster/types";

type Ctx = {
  path: string;
  method: string;
  params: Record<string, any>;
  body: any;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Realistic-but-brisk latency so loading states are actually visible. */
const latency = () => 90 + Math.random() * 160;

const randomHex = (len: number) =>
  Array.from({ length: len }, () =>
    "0123456789abcdef".charAt(Math.floor(Math.random() * 16))
  ).join("");

const bucketOr404 = (idOrAlias?: string | null) => {
  const bucket = findBucket(idOrAlias);
  if (!bucket) throw new APIError(`Bucket not found: ${idOrAlias}`, 404);
  return bucket;
};

const aliasOf = (bucket: Bucket) => bucket.globalAliases[0];

// -- Browse ------------------------------------------------------------------

const listObjects = (alias: string, prefix: string, limit: number) => {
  const items = db.objects[alias] || [];
  const prefixes = new Set<string>();
  const matched: DemoObject[] = [];

  for (const item of items) {
    if (!item.key.startsWith(prefix)) continue;

    const rest = item.key.slice(prefix.length);
    const slash = rest.indexOf("/");

    if (slash >= 0) {
      prefixes.add(prefix + rest.slice(0, slash + 1));
    } else if (rest.length) {
      matched.push(item);
    }
  }

  return {
    prefixes: [...prefixes].sort(),
    objects: matched
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(0, limit)
      .map((o) => ({
        objectKey: o.key.slice(prefix.length),
        lastModified: o.lastModified,
        size: o.size,
        // Shape-compatible with the real backend's `/browse/{bucket}/{key}`.
        url: `/browse/${alias}/${o.key}`,
      })),
    prefix,
    nextToken: null,
  };
};

const putObject = async (alias: string, key: string, body: any) => {
  const items = (db.objects[alias] ||= []);
  const file: File | null =
    body instanceof FormData ? ((body.get("file") as File) ?? null) : null;

  // A key ending in "/" is a folder marker — the real backend stores a
  // zero-byte object, and so do we.
  if (key.endsWith("/")) {
    if (items.some((i) => i.key.startsWith(key))) {
      throw new APIError("A folder with that name already exists", 409);
    }
    items.push({
      key: `${key}.keep`,
      size: 0,
      lastModified: new Date().toISOString(),
      contentType: "application/octet-stream",
    });
  } else {
    const existing = items.findIndex((i) => i.key === key);
    const entry: DemoObject = {
      key,
      size: file?.size ?? 0,
      lastModified: new Date().toISOString(),
      contentType: file?.type || "application/octet-stream",
    };
    if (existing >= 0) items[existing] = entry;
    else items.push(entry);
  }

  recountBucket(alias);
  return { message: "ok" };
};

const deleteObject = (alias: string, key: string, recursive: boolean) => {
  const items = db.objects[alias] || [];
  const before = items.length;

  db.objects[alias] = items.filter((i) =>
    recursive ? !i.key.startsWith(key) : i.key !== key
  );

  if (db.objects[alias].length === before) {
    throw new APIError(`Object not found: ${key}`, 404);
  }

  recountBucket(alias);
  return { message: "ok" };
};

// -- Cluster -----------------------------------------------------------------

const clusterHealth = () => {
  const assigned = db.layout.roles;
  const storageNodes = assigned.filter((r) => r.capacity !== null).length;
  const up = assigned.filter(
    (r) => r.capacity !== null && db.nodes.find((n) => n.id === r.id)?.isUp
  ).length;
  const connected = db.nodes.filter((n) => n.isUp).length;

  const status =
    up === storageNodes ? "healthy" : up > storageNodes / 2 ? "degraded" : "unavailable";

  return {
    status,
    knownNodes: db.nodes.length,
    connectedNodes: connected,
    storageNodes,
    storageNodesUp: up,
    partitions: 256,
    partitionsQuorum: 256,
    partitionsAllOk: status === "healthy" ? 256 : 231,
  };
};

const clusterStatus = () => ({
  node: db.nodeInfo.nodeId,
  garageVersion: db.nodeInfo.garageVersion,
  garageFeatures: db.nodeInfo.garageFeatures,
  rustVersion: db.nodeInfo.rustVersion,
  dbEngine: db.nodeInfo.dbEngine,
  layoutVersion: db.layout.version,
  nodes: db.nodes.map((node) => ({
    ...node,
    role: db.layout.roles.find((r) => r.id === node.id),
  })),
  layout: db.layout,
});

const updateLayout = (body: { roles: (Role | StagedRole)[] }) => {
  for (const role of body.roles || []) {
    const idx = db.layout.stagedRoleChanges.findIndex((r) => r.id === role.id);
    const staged = role as StagedRole;
    if (idx >= 0) db.layout.stagedRoleChanges[idx] = staged;
    else db.layout.stagedRoleChanges.push(staged);
  }
  return db.layout;
};

const applyLayout = () => {
  const messages = [`==== COMPUTATION OF A NEW PARTITION ASSIGNATION ====`, ``];

  for (const staged of db.layout.stagedRoleChanges) {
    const idx = db.layout.roles.findIndex((r) => r.id === staged.id);

    if ("remove" in staged && staged.remove) {
      if (idx >= 0) db.layout.roles.splice(idx, 1);
      messages.push(`Removed node ${staged.id.slice(0, 16)} from the layout.`);
      continue;
    }

    const role: Role = {
      id: staged.id,
      zone: staged.zone || "dc1",
      capacity: staged.capacity ?? null!,
      tags: staged.tags || [],
    };
    if (idx >= 0) db.layout.roles[idx] = role;
    else db.layout.roles.push(role);
    messages.push(
      `Node ${role.id.slice(0, 16)} assigned to zone ${role.zone}.`
    );
  }

  db.layout.stagedRoleChanges = [];
  db.layout.version += 1;
  messages.push(``, `New layout version: ${db.layout.version}`);

  return { message: messages, layout: db.layout };
};

// -- Routing -----------------------------------------------------------------

const routes: Record<string, (ctx: Ctx) => any> = {
  // Auth — demo mode has no authentication at all, so the guards see a
  // session that is "not enabled", exactly as an unauthenticated real
  // deployment reports. No bypass code is added to the guards themselves.
  "GET /auth/status": () => ({ enabled: false, authenticated: true }),
  "POST /auth/logout": () => ({ message: "ok" }),
  "POST /auth/login": () => {
    throw new APIError("Authentication is disabled in Demo Mode", 400);
  },

  "GET /config": () => db.config,

  // -- Buckets --
  "GET /buckets": () => db.buckets,

  "GET /v2/GetBucketInfo": ({ params }) => bucketOr404(params.id),

  "POST /v2/CreateBucket": ({ body }) => {
    const alias = String(body?.globalAlias || "").trim();
    if (!alias) throw new APIError("Bucket name is required", 400);
    if (findBucket(alias))
      throw new APIError(`Bucket "${alias}" already exists`, 409);

    const bucket: Bucket = {
      id: `demo-${alias}`,
      globalAliases: [alias],
      localAliases: [],
      websiteAccess: false,
      websiteConfig: null,
      keys: [],
      objects: 0,
      bytes: 0,
      unfinishedUploads: 0,
      unfinishedMultipartUploads: 0,
      unfinishedMultipartUploadParts: 0,
      unfinishedMultipartUploadBytes: 0,
      quotas: { maxSize: null, maxObjects: null },
    };

    db.buckets.push(bucket);
    db.objects[alias] = [];
    return bucket;
  },

  "POST /v2/UpdateBucket": ({ params, body }) => {
    const bucket = bucketOr404(params.id);

    if (body?.websiteAccess) {
      bucket.websiteAccess = !!body.websiteAccess.enabled;
      bucket.websiteConfig = bucket.websiteAccess
        ? {
            indexDocument: body.websiteAccess.indexDocument || "index.html",
            errorDocument: body.websiteAccess.errorDocument || "error/400.html",
          }
        : null;
    }

    if (body?.quotas) {
      bucket.quotas = {
        maxSize: body.quotas.maxSize ?? null,
        maxObjects: body.quotas.maxObjects ?? null,
      };
    }

    return bucket;
  },

  "POST /v2/DeleteBucket": ({ params }) => {
    const bucket = bucketOr404(params.id);
    if (bucket.objects > 0)
      throw new APIError("Bucket is not empty, delete its objects first", 400);

    db.buckets = db.buckets.filter((b) => b.id !== bucket.id);
    delete db.objects[aliasOf(bucket)];
    return { message: "ok" };
  },

  "POST /v2/AddBucketAlias": ({ body }) => {
    const bucket = bucketOr404(body?.bucketId);
    const alias = String(body?.globalAlias || "").trim();
    if (!alias) throw new APIError("Alias is required", 400);
    if (findBucket(alias)) throw new APIError("Alias already in use", 409);

    bucket.globalAliases.push(alias);
    return bucket;
  },

  "POST /v2/RemoveBucketAlias": ({ body }) => {
    const bucket = bucketOr404(body?.bucketId);
    if (bucket.globalAliases.length <= 1)
      throw new APIError("A bucket must keep at least one alias", 400);

    bucket.globalAliases = bucket.globalAliases.filter(
      (a) => a !== body?.globalAlias
    );
    return bucket;
  },

  "POST /v2/AllowBucketKey": ({ body }) => {
    const bucket = bucketOr404(body?.bucketId);
    const key = db.keys.find((k) => k.id === body?.accessKeyId);
    if (!key) throw new APIError("Key not found", 404);

    const permissions: Permissions = {
      read: !!body?.permissions?.read,
      write: !!body?.permissions?.write,
      owner: !!body?.permissions?.owner,
    };
    const existing = bucket.keys.find((k) => k.accessKeyId === key.id);

    if (existing) {
      existing.permissions = {
        read: existing.permissions.read || permissions.read,
        write: existing.permissions.write || permissions.write,
        owner: existing.permissions.owner || permissions.owner,
      };
    } else {
      bucket.keys.push({
        accessKeyId: key.id,
        name: key.name,
        permissions,
        bucketLocalAliases: [],
      });
    }

    return bucket;
  },

  "POST /v2/DenyBucketKey": ({ body }) => {
    const bucket = bucketOr404(body?.bucketId);
    const entry = bucket.keys.find((k) => k.accessKeyId === body?.accessKeyId);
    if (!entry) throw new APIError("Key is not allowed on this bucket", 404);

    if (body?.permissions?.read) entry.permissions.read = false;
    if (body?.permissions?.write) entry.permissions.write = false;
    if (body?.permissions?.owner) entry.permissions.owner = false;

    return bucket;
  },

  // -- Keys --
  "GET /v2/ListKeys": () => db.keys.map(({ id, name }) => ({ id, name })),

  "GET /v2/GetKeyInfo": ({ params }) => {
    const key = db.keys.find((k) => k.id === params.id);
    if (!key) throw new APIError("Key not found", 404);

    return {
      accessKeyId: key.id,
      name: key.name,
      ...(String(params.showSecretKey) === "true"
        ? { secretAccessKey: key.secretAccessKey }
        : {}),
      buckets: db.buckets
        .filter((b) => b.keys.some((k) => k.accessKeyId === key.id))
        .map((b) => ({ id: b.id, globalAliases: b.globalAliases })),
    };
  },

  "POST /v2/CreateKey": ({ body }) => {
    const name = String(body?.name || "").trim();
    if (!name) throw new APIError("Key name is required", 400);
    if (db.keys.some((k) => k.name === name))
      throw new APIError(`A key named "${name}" already exists`, 409);

    const key = {
      id: `GKDEMO${randomHex(18).toUpperCase()}`,
      name,
      secretAccessKey: `demo-secret-not-a-real-credential-${randomHex(12)}`,
      created: new Date().toISOString(),
    };
    db.keys.push(key);
    // Garage returns the secret exactly once, at creation.
    return {
      accessKeyId: key.id,
      name: key.name,
      secretAccessKey: key.secretAccessKey,
    };
  },

  "POST /v2/ImportKey": ({ body }) => {
    const name = String(body?.name || "").trim();
    const id = String(body?.accessKeyId || "").trim();
    if (!name || !id)
      throw new APIError("Key name and access key ID are required", 400);
    if (db.keys.some((k) => k.id === id))
      throw new APIError("That access key ID already exists", 409);

    const secretAccessKey = String(body?.secretAccessKey || "");
    db.keys.push({ id, name, secretAccessKey, created: new Date().toISOString() });
    return { accessKeyId: id, name, secretAccessKey };
  },

  "POST /v2/DeleteKey": ({ params }) => {
    const key = db.keys.find((k) => k.id === params.id);
    if (!key) throw new APIError("Key not found", 404);

    db.keys = db.keys.filter((k) => k.id !== key.id);
    for (const bucket of db.buckets) {
      bucket.keys = bucket.keys.filter((k) => k.accessKeyId !== key.id);
    }
    return { message: "ok" };
  },

  // -- Cluster --
  "GET /v2/GetClusterHealth": clusterHealth,
  "GET /v2/GetClusterStatus": clusterStatus,
  "GET /v2/GetClusterLayout": () => db.layout,
  "GET /v2/GetNodeInfo": () => ({
    success: { self: db.nodeInfo },
    error: {},
  }),

  "POST /v2/ConnectClusterNodes": ({ body }) => {
    const [nodeId] = (body as string[]) || [];
    const [id, addr] = String(nodeId || "").split("@");

    if (!id || id.length < 8)
      return [{ success: false, error: "Invalid node ID" }];
    if (db.nodes.some((n) => n.id === id))
      return [{ success: false, error: "Node is already connected" }];

    db.nodes.push({
      id,
      addr: addr || "10.50.0.1:3901",
      hostname: `garage-node-${id.slice(0, 6)}`,
      isUp: true,
      lastSeenSecsAgo: 0,
      dataPartition: { available: 1000 ** 4 * 3.7, total: 1000 ** 4 * 4 },
      metadataPartition: { available: 240 * 1000 ** 3, total: 256 * 1000 ** 3 },
    });
    return [{ success: true, error: null }];
  },

  "POST /v2/UpdateClusterLayout": ({ body }) => updateLayout(body),
  "POST /v2/RevertClusterLayout": () => {
    db.layout.stagedRoleChanges = [];
    return db.layout;
  },
  "POST /v2/ApplyClusterLayout": applyLayout,
};

/**
 * A real HTTP response is always freshly parsed JSON. The handlers above
 * return live references into `db`, so without this the cached value and the
 * "new" value would be the same mutated object — React Query's structural
 * sharing would see no change and no page would ever re-render after a write.
 */
const detach = <T>(value: T): T =>
  value == null || typeof value !== "object" ? value : structuredClone(value);

/**
 * Entry point. Returns whatever the matching route returns, or throws an
 * APIError — the same two outcomes `api.fetch` produces against the real
 * backend.
 */
export const handleDemoRequest = async <T>(
  path: string,
  options: {
    method?: string;
    params?: Record<string, any>;
    body?: any;
  } = {}
): Promise<T> => {
  await sleep(latency());

  const method = (options.method || "GET").toUpperCase();
  const ctx: Ctx = {
    path,
    method,
    params: options.params || {},
    body: options.body,
  };

  // /browse/{bucket}[/{key...}] — matched by prefix, the rest is a table.
  if (path.startsWith("/browse/")) {
    const rest = path.slice("/browse/".length);
    const slash = rest.indexOf("/");
    const alias = decodeURIComponent(slash < 0 ? rest : rest.slice(0, slash));
    const key = slash < 0 ? "" : decodeURIComponent(rest.slice(slash + 1));

    bucketOr404(alias);

    if (method === "GET" && !key) {
      return detach(
        listObjects(
          alias,
          String(ctx.params.prefix || ""),
          Number(ctx.params.limit) || 100
        )
      ) as T;
    }
    if (method === "PUT") return detach(await putObject(alias, key, ctx.body)) as T;
    if (method === "DELETE")
      return detach(
        deleteObject(alias, key, String(ctx.params.recursive) === "true")
      ) as T;
  }

  const handler = routes[`${method} ${path}`];
  if (!handler) {
    throw new APIError(`Demo Mode has no handler for ${method} ${path}`, 404);
  }

  return detach(handler(ctx)) as T;
};
