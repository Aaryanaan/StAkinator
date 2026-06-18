import type { Question } from "@/lib/types";

// Each option's `scores` push the architecture toward archetypes.
// `tags` are capability flags consumed by conflict rules + scenario triggers.
export const QUESTIONS: Question[] = [
  {
    id: "client",
    category: "Client",
    prompt: "What kind of client(s) talk to your backend?",
    options: [
      {
        id: "ssr",
        label: "Server-rendered website",
        explanation:
          "HTML is rendered on the server per request — great for content-heavy, SEO-sensitive pages.",
        caveat: "Every interaction tends to round-trip to the server, which limits rich realtime UX.",
        scores: { crud: 2, ecom: 2, social: 1 },
      },
      {
        id: "spa",
        label: "Single-page web app",
        explanation:
          "A JS app talks to a JSON API — good for interactive dashboards and app-like UIs.",
        caveat: "Initial bundle size and client-side state management add complexity.",
        scores: { crud: 1, ecom: 1, analytics: 2, social: 1, ai_search: 1 },
      },
      {
        id: "mobile",
        label: "Mobile app",
        explanation:
          "Native/mobile clients imply token auth, offline tolerance, and push notifications.",
        caveat: "You must support old app versions, so APIs need careful versioning.",
        scores: { chat: 2, social: 2, market: 3, streaming: 2 },
      },
      {
        id: "desktop",
        label: "Desktop app",
        explanation: "A thick desktop client doing local work and syncing to the backend.",
        caveat: "Auto-update and per-OS packaging become real concerns.",
        scores: { crud: 1, analytics: 1 },
      },
      {
        id: "multi_client",
        label: "Multiple clients sharing one backend",
        explanation:
          "Web + mobile + partners hit the same API, so a clean contract and auth matter a lot.",
        caveat: "A shared API must stay backward compatible across very different clients.",
        scores: { market: 2, streaming: 2, chat: 1, social: 1, ecom: 1, iot: 1 },
        tags: ["multi_client"],
      },
    ],
  },
  {
    id: "api",
    category: "API style",
    prompt: "How do clients communicate with the backend?",
    options: [
      {
        id: "rest",
        label: "REST / JSON over HTTP",
        explanation: "Simple, cacheable request/response — the default for CRUD and commerce.",
        caveat: "Over/under-fetching is common; clients often need several round-trips.",
        scores: { crud: 3, ecom: 2, social: 1 },
      },
      {
        id: "graphql",
        label: "GraphQL",
        explanation:
          "Clients query exactly the nested data they need — handy for rich feeds and varied screens.",
        caveat: "Caching and query-cost control are harder than plain REST.",
        scores: { social: 4, ecom: 2, market: 2 },
      },
      {
        id: "grpc",
        label: "gRPC",
        explanation:
          "Binary, schema-first RPC — efficient for internal service-to-service and high-throughput calls.",
        caveat: "Not natively browser-friendly; needs a gateway for web clients.",
        scores: { market: 3, streaming: 3, iot: 2, analytics: 1 },
      },
      {
        id: "websockets",
        label: "WebSockets",
        explanation:
          "A persistent two-way channel for pushing live updates — chat, presence, collaboration, games.",
        caveat: "Open connections are stateful and harder to scale and load-balance.",
        scores: { chat: 5, market: 1, streaming: 2, iot: 2, social: 1, crud: -1 },
        tags: ["realtime_push", "long_lived_conn"],
      },
      {
        id: "sse",
        label: "Server-Sent Events",
        explanation: "One-way server→client stream over HTTP — good for live dashboards and feeds.",
        caveat: "Only server-to-client; client actions still need a separate request path.",
        scores: { chat: 2, analytics: 3, iot: 3, streaming: 2, ai_search: 3 },
        tags: ["realtime_push"],
      },
      {
        id: "message_api",
        label: "Message / event API",
        explanation:
          "Clients/devices publish events that are processed asynchronously — natural for ingestion.",
        caveat: "Request/response semantics (and errors) are less obvious than synchronous APIs.",
        scores: { iot: 4, analytics: 3, streaming: 3, market: 2 },
        tags: ["async_api"],
      },
    ],
  },
  {
    id: "backend",
    category: "Backend shape",
    prompt: "How is the backend structured?",
    options: [
      {
        id: "monolith",
        label: "Simple monolith",
        explanation: "One deployable app — fastest to build and reason about for small systems.",
        caveat: "Boundaries blur over time and the whole thing scales/deploys as one unit.",
        scores: { crud: 4, ecom: 1, social: -1, market: -2 },
      },
      {
        id: "modular_monolith",
        label: "Modular monolith",
        explanation:
          "One deployable, but with strong internal module boundaries — Shopify's pragmatic choice.",
        caveat: "Discipline is required or modules leak into each other.",
        scores: { ecom: 4, crud: 2, social: 2, analytics: 1 },
      },
      {
        id: "microservices",
        label: "Microservices",
        explanation:
          "Independently deployable services per domain — fits large teams and uneven scaling needs.",
        caveat: "Adds network latency, deployment, and data-consistency complexity.",
        scores: { market: 5, streaming: 4, social: 3, chat: 2, iot: 2, crud: -2 },
      },
      {
        id: "serverless",
        label: "Serverless functions",
        explanation: "Per-request functions that scale to zero — cheap for spiky or event workloads.",
        caveat: "Cold starts and ephemeral compute mean you can't hold local state.",
        scores: { crud: 1, analytics: 2, iot: 2, ecom: 1, ai_search: 3 },
        tags: ["ephemeral_compute"],
      },
      {
        id: "event_driven",
        label: "Event-driven services",
        explanation:
          "Components react to events on a bus — decouples producers from consumers at scale.",
        caveat: "Debugging async flows and guaranteeing ordering/delivery is harder.",
        scores: { iot: 4, market: 3, streaming: 3, analytics: 3, chat: 2 },
        tags: ["event_driven"],
      },
      {
        id: "hybrid",
        label: "Hybrid (core monolith + a few services)",
        explanation: "A core app with a handful of carved-out services for specific scaling needs.",
        caveat: "Two operational models to maintain at once.",
        scores: { market: 2, streaming: 2, ecom: 1, social: 1 },
      },
    ],
  },
  {
    id: "state",
    category: "Server state",
    prompt: "How do servers hold session / connection state?",
    options: [
      {
        id: "stateless",
        label: "Stateless API servers",
        explanation:
          "No per-user state on the server — any instance can serve any request, so scaling is trivial.",
        caveat: "Anything stateful (sessions, sockets) must live in a shared store instead.",
        scores: { crud: 3, ecom: 3, social: 2, market: 2, analytics: 1, ai_search: 1 },
        tags: ["stateless"],
      },
      {
        id: "stateful",
        label: "Stateful servers (in-memory sessions)",
        explanation: "Each server keeps user state in memory — simple until you run more than one.",
        caveat: "Breaks the moment a load balancer sends the next request to a different instance.",
        scores: { chat: 1, crud: -1 },
        tags: ["server_state_local", "holds_local_state"],
      },
      {
        id: "sticky_sessions",
        label: "Sticky sessions (LB affinity)",
        explanation: "The load balancer pins a user to one server so in-memory state still works.",
        caveat: "Uneven load and lost state on instance failure/restart.",
        scores: { crud: 1, chat: 1 },
        tags: ["sticky"],
      },
      {
        id: "shared_session_store",
        label: "Shared session store (e.g. Redis)",
        explanation:
          "Servers stay stateless by reading/writing session state in a shared store — scales cleanly.",
        caveat: "Adds a dependency on the store's availability and latency.",
        scores: { ecom: 2, social: 2, market: 2, chat: 2 },
        tags: ["shared_session", "stateless"],
      },
      {
        id: "stateful_conn",
        label: "Stateful connection servers (WebSocket layer)",
        explanation:
          "A tier that holds long-lived client connections — required for realtime push at scale.",
        caveat: "Needs connection tracking, a pub/sub backplane, and graceful reconnect logic.",
        scores: { chat: 5, streaming: 2, iot: 2, crud: -2 },
        // conn_state_local is resolved by a pub/sub backplane (not a shared
        // session store), so it is kept distinct from request-session state.
        tags: ["conn_state_local", "holds_local_state", "long_lived_conn"],
      },
    ],
  },
  {
    id: "db",
    category: "Primary database",
    prompt: "What's the primary data store for the core data?",
    options: [
      {
        id: "relational",
        label: "Relational / SQL",
        explanation:
          "Joins, transactions, and constraints — the right call for orders, users, and money.",
        caveat: "Global horizontal scaling is harder than with simpler NoSQL models.",
        scores: { crud: 3, ecom: 5, market: 2, analytics: 1, chat: -1 },
      },
      {
        id: "key_value",
        label: "Key-value",
        explanation: "Blazing-fast lookups by key — sessions, caches, presence, hot reads.",
        caveat: "Weak ad-hoc querying; you must design around access patterns.",
        scores: { chat: 2, streaming: 3, social: 2, iot: 2, market: 2 },
      },
      {
        id: "document",
        label: "Document",
        explanation: "Flexible JSON-like records — good for profiles, content, and evolving schemas.",
        caveat: "Multi-document transactions and complex joins are weaker than SQL.",
        scores: { social: 3, crud: 2, ecom: 1, chat: 2 },
      },
      {
        id: "wide_column",
        label: "Wide-column",
        explanation:
          "Massive write-heavy, horizontally scaled storage — feeds, timelines, telemetry.",
        caveat: "Bad for ad-hoc queries and strong global transactions.",
        scores: { social: 4, iot: 4, streaming: 3, analytics: 2, chat: 2, ecom: -2, crud: -2 },
        tags: ["ap_store"],
      },
      {
        id: "graph",
        label: "Graph",
        explanation:
          "First-class relationships — social graphs, recommendations, fraud-ring detection.",
        caveat: "Rarely a good single general-purpose store for everything else.",
        scores: { market: 3, social: 3 },
      },
      {
        id: "search_ts",
        label: "Search / time-series / analytics store",
        explanation:
          "Optimized for search, metrics, logs, and aggregations over huge volumes of events.",
        caveat: "Usually a derived view, not the transactional system of record (except pure telemetry).",
        scores: { analytics: 5, iot: 4, streaming: 2, social: 1 },
        tags: ["derived_store"],
      },
      {
        id: "vector",
        label: "Vector store",
        explanation:
          "Stores embeddings and searches by semantic similarity — the backbone of RAG, semantic search, and recommendations.",
        caveat:
          "It's a derived index over content that lives elsewhere; relevance depends on the embedding model and tuning.",
        scores: { ai_search: 5, social: 2, streaming: 2, market: 1, analytics: 1, crud: -1 },
        tags: ["derived_store"],
      },
    ],
  },
  {
    id: "consistency",
    category: "Consistency model",
    prompt: "What consistency does the core data need?",
    options: [
      {
        id: "strong_acid",
        label: "Strong consistency / ACID",
        explanation: "Reads always reflect the latest committed write — required for money/inventory.",
        caveat: "Costs latency and is hard to maintain across regions.",
        scores: { ecom: 5, market: 3, crud: 2, social: -1, analytics: -1 },
        tags: ["strong_consistency"],
      },
      {
        id: "eventual",
        label: "Eventual consistency",
        explanation: "Replicas converge over time — fine for feeds, counts, recommendations, telemetry.",
        caveat: "Reads can be stale; dangerous for payments or inventory.",
        scores: { social: 3, streaming: 3, iot: 3, analytics: 2, ecom: -2, ai_search: 2 },
        tags: ["eventual_consistency"],
      },
      {
        id: "read_your_writes",
        label: "Read-your-writes",
        explanation: "A user always sees their own latest change — key for chat and editing UX.",
        caveat: "Other users may still see slightly stale data.",
        scores: { chat: 3, social: 2, crud: 1 },
      },
      {
        id: "tunable",
        label: "Tunable / per-operation consistency",
        explanation: "Choose strong vs eventual per call — strong for trips/payments, loose for views.",
        caveat: "Every read/write decision becomes a design choice to get right.",
        scores: { market: 3, streaming: 2, iot: 2 },
      },
      {
        id: "crdt",
        label: "Conflict-free sync / CRDTs",
        explanation: "Concurrent edits merge automatically — collaborative editing and offline sync.",
        caveat: "Limited data models and non-trivial to implement correctly.",
        scores: { chat: 4, market: 1 },
      },
    ],
  },
  {
    id: "async",
    category: "Async processing",
    prompt: "How is background / async work handled?",
    options: [
      {
        id: "async_none",
        label: "None — everything is synchronous",
        explanation: "All work happens inside the request — simplest possible model.",
        caveat: "Slow work (emails, exports, matching) blocks the user and times out under load.",
        scores: { crud: 3, ecom: -1, market: -2, iot: -2 },
        tags: ["no_async"],
      },
      {
        id: "job_queue",
        label: "Background job queue",
        explanation: "Defer slow work (emails, receipts, exports) to workers behind a queue.",
        caveat: "You must handle retries, failures, and a dead-letter path.",
        scores: { ecom: 3, crud: 1, social: 1, ai_search: 2 },
      },
      {
        id: "pub_sub",
        label: "Pub/sub events",
        explanation: "Publish events many consumers react to — broadcast, notifications, fan-out.",
        caveat: "At-least-once delivery means consumers must be idempotent.",
        scores: { chat: 4, market: 2, social: 2, iot: 2 },
        tags: ["fanout"],
      },
      {
        id: "event_streaming",
        label: "Event streaming (Kafka-style)",
        explanation: "A durable, replayable log of events feeding analytics, search, and services.",
        caveat: "Operationally heavy; partitioning and consumer lag need monitoring.",
        scores: { iot: 4, analytics: 4, streaming: 3, market: 3, social: 2 },
        tags: ["fanout", "streaming_pipeline"],
      },
      {
        id: "batch_jobs",
        label: "Scheduled batch jobs",
        explanation: "Periodic jobs roll up data and run reports — classic analytics ingestion.",
        caveat: "Results lag reality by the batch interval.",
        scores: { analytics: 4, iot: 2 },
      },
    ],
  },
  {
    id: "cache",
    category: "Caching",
    prompt: "What caching is in front of the data?",
    options: [
      {
        id: "cache_none",
        label: "No cache",
        explanation: "Every read hits the database — simplest, and fine at low traffic.",
        caveat: "Becomes a bottleneck as reads grow.",
        scores: { crud: 2, ecom: -1 },
      },
      {
        id: "browser_cache",
        label: "Browser / HTTP cache",
        explanation: "Cache-Control headers let clients reuse responses — cheap latency wins.",
        caveat: "Invalidation is in the client's hands; stale data can linger.",
        scores: { crud: 1, ecom: 1 },
      },
      {
        id: "cdn",
        label: "CDN",
        explanation: "Edge POPs serve static assets and media close to users worldwide.",
        caveat: "Cache invalidation/purge across edges takes care to get right.",
        scores: { streaming: 3, social: 2, ecom: 2, market: 1 },
      },
      {
        id: "redis_cache",
        label: "Redis / in-memory cache",
        explanation: "A shared hot cache for expensive reads, sessions, counters, and pub/sub.",
        caveat: "Stale entries and cache-invalidation bugs are easy to introduce.",
        scores: { ecom: 3, social: 3, chat: 3, market: 3, streaming: 2, ai_search: 2 },
        tags: ["shared_cache", "fanout"],
      },
      {
        id: "db_cache",
        label: "Database query cache",
        explanation: "Let the database/materialized views cache hot query results.",
        caveat: "Limited control and can mask missing indexes.",
        scores: { crud: 1, ecom: 1, analytics: 1 },
      },
      {
        id: "edge_cache",
        label: "Edge compute cache",
        explanation: "Cache and compute at the edge for ultra-low latency reads globally.",
        caveat: "Consistency across edges and harder debugging.",
        scores: { streaming: 3, market: 2, social: 2, iot: 1 },
      },
    ],
  },
  {
    id: "files",
    category: "File / blob storage",
    prompt: "How are files / media stored?",
    options: [
      {
        id: "files_none",
        label: "No files",
        explanation: "The app is pure data — no uploads or media to manage.",
        caveat: "If media shows up later, retrofitting storage is annoying.",
        scores: { crud: 2, analytics: 1, iot: 1 },
      },
      {
        id: "db_blob",
        label: "Store files in the database",
        explanation: "Small blobs kept inside the DB — simple for tiny attachments.",
        caveat: "Bloats the DB and doesn't scale for real media.",
        scores: { crud: 1 },
        tags: ["files_in_db"],
      },
      {
        id: "object_storage",
        label: "Object storage (S3-style)",
        explanation: "Durable, cheap blob storage for uploads, exports, and user content.",
        caveat: "You manage access control, lifecycle, and signed URLs.",
        scores: { social: 3, ecom: 2, streaming: 2, market: 2, ai_search: 1 },
      },
      {
        id: "cdn_media",
        label: "CDN-backed media storage",
        explanation: "Object storage fronted by a CDN — the standard for images and video at scale.",
        caveat: "Purge/versioning and signed-URL expiry need attention.",
        scores: { streaming: 4, social: 3, ecom: 1 },
      },
    ],
  },
  {
    id: "deploy",
    category: "Deployment / scaling",
    prompt: "How is the system deployed and scaled?",
    options: [
      {
        id: "single_server",
        label: "Single server",
        explanation: "One box runs everything — perfect for an MVP or internal tool.",
        caveat: "A single point of failure; deploys cause downtime.",
        scores: { crud: 3, ecom: -1, market: -2, streaming: -2 },
      },
      {
        id: "lb_multi",
        label: "Multiple servers behind a load balancer",
        explanation: "Horizontal scaling and no single point of failure for the app tier.",
        caveat: "Requires stateless servers or shared session state to work correctly.",
        scores: { ecom: 3, crud: 1, social: 2, analytics: 1 },
        tags: ["multi_instance"],
      },
      {
        id: "containers",
        label: "Containers",
        explanation: "Packaged, reproducible deploys that run the same everywhere.",
        caveat: "You still need an orchestrator/strategy as you grow.",
        scores: { ecom: 2, social: 2, market: 2, analytics: 2 },
        tags: ["multi_instance"],
      },
      {
        id: "kubernetes",
        label: "Kubernetes",
        explanation: "Orchestrated, self-healing, autoscaled services — fits microservices at scale.",
        caveat: "Heavy operational overhead; overkill for small apps.",
        scores: { market: 4, streaming: 4, social: 3, iot: 2, crud: -2 },
        tags: ["multi_instance"],
      },
      {
        id: "serverless_deploy",
        label: "Serverless platform",
        explanation: "The platform scales instances per request — no servers to manage.",
        caveat: "Cold starts, execution limits, and ephemeral compute.",
        scores: { crud: 1, analytics: 2, iot: 2, ecom: 1, ai_search: 2 },
        tags: ["multi_instance", "ephemeral_compute"],
      },
      {
        id: "multi_region",
        label: "Multi-region deployment",
        explanation: "Run in several regions for low latency and disaster resilience worldwide.",
        caveat: "Data replication and cross-region consistency get genuinely hard.",
        scores: { streaming: 3, market: 4, social: 3, chat: 2, iot: 1 },
        tags: ["multi_instance", "global"],
      },
    ],
  },
  {
    id: "observability",
    category: "Observability",
    prompt: "How much observability is in place?",
    options: [
      {
        id: "basic_logs",
        label: "Basic logs only",
        explanation: "Plain application logs — enough to start.",
        caveat: "Hard to diagnose distributed or intermittent issues.",
        scores: { crud: 2 },
      },
      {
        id: "logs_metrics",
        label: "Logs + metrics",
        explanation: "Dashboards and metrics show health and trends over time.",
        caveat: "Without tracing, cross-service latency is still a guess.",
        scores: { ecom: 2, crud: 1, social: 1 },
      },
      {
        id: "logs_metrics_tracing",
        label: "Logs + metrics + distributed tracing",
        explanation: "Trace a request across services — essential for microservices and realtime.",
        caveat: "Instrumentation and trace storage cost effort and money.",
        scores: { market: 3, streaming: 3, social: 2, chat: 2, iot: 1, ai_search: 1 },
      },
      {
        id: "alerts_slo",
        label: "Alerts + SLOs",
        explanation: "Defined objectives and paging so failures are caught fast.",
        caveat: "Poorly tuned alerts cause fatigue and missed real incidents.",
        scores: { market: 2, streaming: 2, iot: 3, analytics: 2 },
      },
      {
        id: "audit_logs",
        label: "Audit logs + security monitoring",
        explanation: "Tamper-evident records of sensitive actions — vital for money and compliance.",
        caveat: "Storage, retention, and access controls add overhead.",
        scores: { ecom: 3, market: 1, crud: 1 },
      },
    ],
  },
];

// Fast lookups built once at module load.
export const OPTION_INDEX: Record<
  string,
  { questionId: string; category: string; option: Question["options"][number] }
> = {};
for (const q of QUESTIONS) {
  for (const o of q.options) {
    if (OPTION_INDEX[o.id]) {
      throw new Error(`Duplicate option id "${o.id}" — option ids must be globally unique.`);
    }
    OPTION_INDEX[o.id] = { questionId: q.id, category: q.category, option: o };
  }
}
