import type { ConflictRule } from "@/lib/types";

// Conflict rules fire on the SELECTED option ids and their tags.
// ifAll/ifAllTags must all be present; ifNone/ifNoneTags must all be absent.
export const CONFLICTS: ConflictRule[] = [
  {
    id: "stateful_across_instances",
    severity: "high",
    ifAllTags: ["server_state_local", "multi_instance"],
    ifNoneTags: ["shared_session", "sticky"],
    message:
      "You keep session state in a server's memory, but run multiple instances with no shared store or sticky routing. The load balancer can send a user's next request to a different instance that doesn't have their session — so users appear randomly logged out or lose progress.",
    fixes: [
      "Make servers stateless and store sessions in a shared store (e.g. Redis) or in signed cookies/JWTs",
      "Enable sticky sessions so a user keeps hitting the same instance",
    ],
  },
  {
    id: "conn_tier_no_backplane",
    severity: "high",
    ifAllTags: ["conn_state_local", "multi_instance"],
    ifNoneTags: ["fanout", "shared_cache", "sticky"],
    message:
      "Your real-time connection tier holds long-lived connections in each instance's memory and runs across multiple instances, but there's no pub/sub backplane to share events between them. An event produced on one instance never reaches users connected to another.",
    fixes: [
      "Add a Redis pub/sub (or event-streaming) backplane every instance subscribes to",
      "Broadcast through a shared channel rather than holding events in one process",
    ],
  },
  {
    id: "websockets_no_backplane",
    severity: "high",
    ifAll: ["websockets"],
    ifAllTags: ["multi_instance"],
    ifNoneTags: ["fanout", "shared_cache"],
    message:
      "WebSocket clients are spread across multiple instances, but there's no pub/sub or shared backplane to broadcast events between them. A message sent to a user connected to server A will never reach a user connected to server B.",
    fixes: [
      "Add a Redis pub/sub (or event-streaming) backplane so all instances see every event",
      "Fan messages out through a shared channel rather than holding them in one process",
    ],
  },
  {
    id: "serverless_local_state",
    severity: "high",
    ifAllTags: ["ephemeral_compute", "holds_local_state"],
    message:
      "Serverless/ephemeral compute spins instances up and down per request, so anything you keep in a function's memory disappears between invocations. You can't reliably hold sessions or live connections there.",
    fixes: [
      "Store session state in a shared store (Redis/DynamoDB) and keep functions stateless",
      "Use a managed realtime/WebSocket service for long-lived connections instead of raw functions",
    ],
  },
  {
    id: "microservices_single_server",
    severity: "high",
    ifAll: ["microservices", "single_server"],
    message:
      "Microservices only pay off when services deploy and scale independently — but you've put everything on a single server. You get all the network/coordination cost of microservices with none of the scaling benefit.",
    fixes: [
      "For a single box, use a (modular) monolith instead",
      "If you truly need microservices, deploy them across multiple instances/containers",
    ],
  },
  {
    id: "event_driven_no_async",
    severity: "high",
    ifAll: ["event_driven", "async_none"],
    message:
      "An event-driven backend is defined by asynchronous event flow, but you've selected no async processing. These directly contradict each other.",
    fixes: [
      "Add pub/sub or event streaming to actually carry the events",
      "Or simplify to a synchronous monolith if you don't need events",
    ],
  },
  {
    id: "event_driven_single_server",
    severity: "medium",
    ifAll: ["event_driven", "single_server"],
    message:
      "Event-driven architectures shine when independent consumers scale separately. On a single server, the event bus adds complexity without delivering decoupling or scale.",
    fixes: [
      "Start with a synchronous monolith and add events when a real bottleneck appears",
      "If you keep events, run consumers on separate instances",
    ],
  },
  {
    id: "strong_acid_wide_column",
    severity: "medium",
    ifAll: ["strong_acid", "wide_column"],
    message:
      "Wide-column stores are built for availability and horizontal write scale, typically with eventual or tunable consistency. Expecting global strong ACID transactions from them fights their design.",
    fixes: [
      "Keep transactional data (orders, payments) in a relational DB",
      "Use the wide-column store for the high-volume, eventually-consistent data only",
    ],
  },
  {
    id: "strong_acid_multi_region",
    severity: "medium",
    ifAll: ["strong_acid", "multi_region"],
    message:
      "Strong consistency across regions means cross-region coordination on writes, which adds significant latency. Few systems need globally strong consistency for everything.",
    fixes: [
      "Use tunable consistency: strong for money/inventory, eventual for the rest",
      "Pin strongly-consistent data to a home region and replicate read-only copies",
    ],
  },
  {
    id: "realtime_conn_no_realtime_api",
    severity: "medium",
    ifAll: ["stateful_conn"],
    ifNone: ["websockets", "sse", "message_api"],
    message:
      "You've chosen a stateful real-time connection tier, but the API style is plain request/response. There's no live channel for that connection layer to actually push updates over.",
    fixes: [
      "Use WebSockets (or SSE) so the connection tier can push to clients",
      "If you don't need realtime push, drop the stateful connection tier and stay stateless",
    ],
  },
  {
    id: "search_only_source_of_truth",
    severity: "low",
    ifAll: ["search_ts"],
    ifNoneTags: ["streaming_pipeline"],
    message:
      "A search/analytics index is usually a derived view, optimized for retrieval rather than transactional correctness. Used purely as a search index, it shouldn't be your only source of truth. (If this is genuine time-series telemetry, using it as the system of record is fine.)",
    fixes: [
      "Keep authoritative data in a relational/document DB",
      "Push changes into the search index asynchronously (and add a reindex path)",
    ],
  },
  {
    id: "files_in_db",
    severity: "low",
    ifAll: ["db_blob"],
    message:
      "Storing real files as blobs inside the database bloats it, slows backups, and doesn't scale. It's only acceptable for tiny attachments.",
    fixes: [
      "Use object storage (S3-style) and keep only a URL/metadata in the DB",
      "Front media with a CDN for delivery",
    ],
  },
  {
    id: "microservices_no_messaging",
    severity: "low",
    ifAll: ["microservices"],
    ifNone: ["job_queue", "pub_sub", "event_streaming", "batch_jobs"],
    message:
      "Microservices usually rely on asynchronous messaging to stay decoupled. With only synchronous calls between them, an outage in one service cascades directly into the others.",
    fixes: [
      "Introduce a queue or pub/sub so services can communicate asynchronously",
      "Add timeouts, retries, and circuit breakers to synchronous calls",
    ],
  },
  {
    id: "no_cache_global",
    severity: "low",
    ifAllTags: ["global"],
    ifAll: ["cache_none"],
    message:
      "You're deploying multi-region for low latency but caching nothing, so every read crosses back to the origin database — undercutting the point of going global.",
    fixes: [
      "Add a CDN/edge cache for reads that can tolerate slight staleness",
      "Add a shared cache (Redis) in front of hot queries",
    ],
  },
  {
    id: "graph_only_store",
    severity: "low",
    ifAll: ["graph"],
    message:
      "Graph databases are excellent for relationships and traversals but are rarely a good single general-purpose store for everything else in an app.",
    fixes: [
      "Use the graph DB for relationship/recommendation queries specifically",
      "Keep core entities in a relational/document store as the system of record",
    ],
  },
];
