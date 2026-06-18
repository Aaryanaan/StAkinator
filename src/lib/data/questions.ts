import type { Question } from "@/lib/types";

// Each option's `scores` push the architecture toward archetypes.
// `tags` are capability flags consumed by conflict rules + scenario triggers.
// Explanations are written for people new to system design: plain language,
// terms defined inline. Scores/tags are tuned — change wording freely, but
// keep scores/tags stable so archetype inference stays correct.
export const QUESTIONS: Question[] = [
  {
    id: "client",
    category: "Client",
    prompt: "What kind of client will people use to reach your backend?",
    help: "This is the app a user actually opens, and it ripples through everything else. A mobile app pushes you toward token logins, working offline, and an API that stays stable for old versions still out in the wild; a plain website can lean more on the server. Works with: API style, Server state.",
    options: [
      {
        id: "ssr",
        label: "Server-rendered website",
        explanation:
          "The server builds the finished page and sends ready-to-show HTML. Pages load fast and rank well on Google (good SEO).",
        caveat: "Most clicks fetch a whole new page from the server, so it feels less instant than an app.",
        scores: { crud: 2, ecom: 2, social: 1 },
      },
      {
        id: "spa",
        label: "Single-page web app",
        explanation:
          "Loads once, then JavaScript updates parts of the page on the fly by fetching data (like Gmail). Feels smooth and app-like.",
        caveat: "More code runs in the browser, so the first load is heavier and the front-end is more complex.",
        scores: { crud: 1, ecom: 1, analytics: 2, social: 1, ai_search: 1 },
      },
      {
        id: "mobile",
        label: "Mobile app",
        explanation:
          "An iOS/Android app people install. Usually logs in with tokens, works partly offline, and can send push notifications.",
        caveat: "People keep old versions for months, so your backend has to stay compatible with them.",
        scores: { chat: 2, social: 2, market: 3, streaming: 2 },
      },
      {
        id: "desktop",
        label: "Desktop app",
        explanation:
          "An installed program (Windows/Mac/Linux) that does work on the user's own machine and syncs to the backend.",
        caveat: "You have to ship updates and build a separate package for each operating system.",
        scores: { crud: 1, analytics: 1 },
      },
      {
        id: "multi_client",
        label: "Several clients sharing one backend",
        explanation:
          "Web, mobile, and maybe outside partners all use the same backend, so the API becomes a shared contract everyone relies on.",
        caveat: "You can't casually change the API — every client has to keep working.",
        scores: { market: 2, streaming: 2, chat: 1, social: 1, ecom: 1, iot: 1 },
        tags: ["multi_client"],
      },
    ],
  },
  {
    id: "api",
    category: "API style",
    prompt: "How does that client talk to the backend?",
    help: "How this client and the backend exchange data. Request/response styles (REST, GraphQL, gRPC) suit normal actions; live styles (WebSockets, SSE) let the server push updates the instant they happen. Choosing a live style usually pulls in real-time connection servers later. Works with: Server state, Async processing.",
    options: [
      {
        id: "rest",
        label: "REST (JSON over HTTP)",
        explanation:
          "The most common style: the client asks for or sends data with plain web requests and gets JSON back. Easy to learn and cache.",
        caveat: "One screen often needs several requests, and you may get back more or less data than you wanted.",
        scores: { crud: 3, ecom: 2, social: 1 },
      },
      {
        id: "graphql",
        label: "GraphQL",
        explanation:
          "The client asks for exactly the fields it needs — even across related data — in a single query. Handy when screens need different shapes of data.",
        caveat: "Caching and stopping overly expensive queries take more effort than plain REST.",
        scores: { social: 4, ecom: 2, market: 2 },
      },
      {
        id: "grpc",
        label: "gRPC",
        explanation:
          "A fast, compact way for servers to call each other using a shared, pre-agreed message format. Great for internal service-to-service traffic.",
        caveat: "Browsers can't use it directly — you need a translation layer for web clients.",
        scores: { market: 3, streaming: 3, iot: 2, analytics: 1 },
      },
      {
        id: "websockets",
        label: "WebSockets",
        explanation:
          "Keeps a live, two-way connection open so the server can push updates the instant they happen — chat, typing indicators, multiplayer, live dashboards.",
        caveat: "Each open connection sticks to one server, which makes scaling and spreading load harder.",
        scores: { chat: 5, market: 1, streaming: 2, iot: 2, social: 1, crud: -1 },
        tags: ["realtime_push", "long_lived_conn"],
      },
      {
        id: "sse",
        label: "Server-Sent Events (SSE)",
        explanation:
          "A one-way live stream from server to browser over a normal web connection — good for live feeds, dashboards, and streaming an AI's answer as it's written.",
        caveat: "It only flows server → client, so the client still sends its actions the normal way.",
        scores: { chat: 2, analytics: 3, iot: 3, streaming: 2, ai_search: 3 },
        tags: ["realtime_push"],
      },
      {
        id: "message_api",
        label: "Message / event API",
        explanation:
          "Instead of waiting for an answer, clients or devices fire off events that get processed later. Natural for taking in high volumes of data.",
        caveat: "There's no immediate yes/no reply, so successes and errors are harder to surface to the user.",
        scores: { iot: 4, analytics: 3, streaming: 3, market: 2 },
        tags: ["async_api"],
      },
    ],
  },
  {
    id: "backend",
    category: "Backend shape",
    prompt: "How is the backend code organized?",
    help: "How the code is split up. One app (a monolith) is simplest to build; many small services scale independently but add network calls, more deploys, and data spread across services. The golden rule: start simple, split only when a real bottleneck appears. Works with: Async processing, Deployment, Observability.",
    options: [
      {
        id: "monolith",
        label: "Simple monolith",
        explanation:
          "One single app holds all the code and ships as one piece. The fastest way to build and understand a small system.",
        caveat: "As it grows, parts get tangled and you must redeploy and scale the whole thing at once.",
        scores: { crud: 4, ecom: 1, social: -1, market: -2 },
      },
      {
        id: "modular_monolith",
        label: "Modular monolith",
        explanation:
          "Still one app you deploy as a whole, but split inside into clear modules with firm boundaries. A popular middle ground (Shopify works this way).",
        caveat: "Only works if the team keeps the boundaries clean instead of letting modules reach into each other.",
        scores: { ecom: 4, crud: 2, social: 2, analytics: 1 },
      },
      {
        id: "microservices",
        label: "Microservices",
        explanation:
          "The app is split into many small services that each own one area and deploy/scale on their own. Suits big teams and parts that grow at different rates.",
        caveat: "Now you juggle network calls between services, many deployments, and keeping data in sync across them.",
        scores: { market: 5, streaming: 4, social: 3, chat: 2, iot: 2, crud: -2 },
      },
      {
        id: "serverless",
        label: "Serverless functions",
        explanation:
          "You write small functions; the cloud runs them only when called and scales them down to nothing when idle. Cheap for spiky or occasional work.",
        caveat: "Functions can start 'cold' (a brief first-call delay) and forget everything between calls, so they can't hold state.",
        scores: { crud: 1, analytics: 2, iot: 2, ecom: 1, ai_search: 3 },
        tags: ["ephemeral_compute"],
      },
      {
        id: "event_driven",
        label: "Event-driven services",
        explanation:
          "Parts of the system announce 'this happened' and other parts react, instead of calling each other directly. Loosely connected and scales well.",
        caveat: "Following a flow across many events — and guaranteeing order and delivery — is harder to debug.",
        scores: { iot: 4, market: 3, streaming: 3, analytics: 3, chat: 2 },
        tags: ["event_driven"],
      },
      {
        id: "hybrid",
        label: "Hybrid (monolith + a few services)",
        explanation:
          "Keep one main app for most things, but split off a few pieces as separate services where it really pays off.",
        caveat: "You're running two styles at once, so there's more to operate and maintain.",
        scores: { market: 2, streaming: 2, ecom: 1, social: 1 },
      },
    ],
  },
  {
    id: "state",
    category: "Server state",
    prompt: "Where does per-user state (like your login session) live?",
    help: "Where a user's session or live connection is remembered — and the classic scaling trap. If servers keep this in their own memory AND you run more than one, users get randomly logged out. Stateless servers plus a shared store (or sticky routing) avoid that. Works with: Deployment, API style.",
    options: [
      {
        id: "stateless",
        label: "Stateless servers",
        explanation:
          "Servers keep no per-user info in their own memory, so any copy of the server can handle any request. The easiest setup to scale.",
        caveat: "Anything that must be remembered (sessions, live connections) has to be stored somewhere shared instead.",
        scores: { crud: 3, ecom: 3, social: 2, market: 2, analytics: 1, ai_search: 1 },
        tags: ["stateless"],
      },
      {
        id: "stateful",
        label: "Stateful servers (memory holds your session)",
        explanation:
          "Each server remembers users in its own memory. Simple — as long as you run only one server.",
        caveat: "With more than one server, your next request may hit a different one that doesn't remember you.",
        scores: { chat: 1, crud: -1 },
        tags: ["server_state_local", "holds_local_state"],
      },
      {
        id: "sticky_sessions",
        label: "Sticky sessions (pinned to one server)",
        explanation:
          "The load balancer (the traffic router in front of your servers) always sends a given user back to the same server, so in-memory sessions keep working.",
        caveat: "Load can get uneven, and a user's state is lost if that one server restarts.",
        scores: { crud: 1, chat: 1 },
        tags: ["sticky"],
      },
      {
        id: "shared_session_store",
        label: "Shared session store (e.g. Redis)",
        explanation:
          "Servers stay simple by keeping session data in one shared, fast store they all read from. Scales cleanly.",
        caveat: "You now depend on that store always being up and quick to respond.",
        scores: { ecom: 2, social: 2, market: 2, chat: 2 },
        tags: ["shared_session", "stateless"],
      },
      {
        id: "stateful_conn",
        label: "Real-time connection servers (WebSocket layer)",
        explanation:
          "A dedicated tier that holds users' live connections open — needed for real-time push when you run many servers.",
        caveat: "You must track connections, share messages between servers, and reconnect users smoothly when links drop.",
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
    prompt: "Where does your main data live?",
    help: "Where your core data lives — the most defining choice here. SQL gives safe, all-or-nothing updates (money, orders); other types trade some safety for scale or flexibility; search and vector stores are usually fast-read copies, not your source of truth. Many real apps use more than one. Works with: Consistency, Caching, File storage.",
    options: [
      {
        id: "relational",
        label: "Relational / SQL database",
        explanation:
          "Stores data in linked tables and guarantees clean, all-or-nothing updates. The safe default for users, orders, and money.",
        caveat: "Spreading it across many machines around the world is harder than with simpler databases.",
        scores: { crud: 3, ecom: 5, market: 2, analytics: 1, chat: -1 },
      },
      {
        id: "key_value",
        label: "Key-value store",
        explanation:
          "Like a giant dictionary: give it a key, get the value back instantly. Perfect for sessions, caches, and quick lookups.",
        caveat: "It can't answer rich questions about the data — you have to design around exact keys.",
        scores: { chat: 2, streaming: 3, social: 2, iot: 2, market: 2 },
      },
      {
        id: "document",
        label: "Document database",
        explanation:
          "Stores flexible JSON-like records, so each item can have its own shape. Good for profiles, content, and schemas that keep changing.",
        caveat: "Updating many records together, or joining them, isn't as strong as in SQL.",
        scores: { social: 3, crud: 2, ecom: 1, chat: 2 },
      },
      {
        id: "wide_column",
        label: "Wide-column store",
        explanation:
          "Built to absorb huge amounts of writes spread across many machines — think activity feeds, timelines, and sensor data.",
        caveat: "Poor at one-off exploratory queries and at strong all-or-nothing updates.",
        scores: { social: 4, iot: 4, streaming: 3, analytics: 2, chat: 2, ecom: -2, crud: -2 },
        tags: ["ap_store"],
      },
      {
        id: "graph",
        label: "Graph database",
        explanation:
          "Stores things and the connections between them, so questions like 'friends of friends' or recommendations are fast.",
        caveat: "Rarely a good fit as the single database for everything else in the app.",
        scores: { market: 3, social: 3 },
      },
      {
        id: "search_ts",
        label: "Search / time-series / analytics store",
        explanation:
          "Specialized for searching text, or for crunching huge streams of metrics, logs, and events into summaries.",
        caveat: "Usually a secondary copy built for fast reading, not the trustworthy original — except for pure metrics data.",
        scores: { analytics: 5, iot: 4, streaming: 2, social: 1 },
        tags: ["derived_store"],
      },
      {
        id: "vector",
        label: "Vector store",
        explanation:
          "Stores 'embeddings' (numeric fingerprints of text or images) and finds items by meaning rather than exact words. The engine behind AI search and chatbots over your data (RAG).",
        caveat: "It's a searchable copy built from content kept elsewhere, and result quality depends on the AI model and tuning.",
        scores: { ai_search: 5, social: 2, streaming: 2, market: 1, analytics: 1, crud: -1 },
        tags: ["derived_store"],
      },
    ],
  },
  {
    id: "consistency",
    category: "Consistency model",
    prompt: "How up-to-date must the data look when you read it?",
    help: "How fresh a read has to be. Strong means every read sees the latest write (needed for payments, but slower and hard worldwide); eventual is faster but a read can be a moment behind (fine for feeds and counts). This should match your database and whether you go multi-region. Works with: Database, Deployment.",
    options: [
      {
        id: "strong_acid",
        label: "Strong consistency (ACID)",
        explanation:
          "Once something is saved, every read sees that exact latest value — no surprises. Needed for money and inventory. (ACID = reliable, all-or-nothing updates.)",
        caveat: "It's slower, and very hard to keep perfect across the globe.",
        scores: { ecom: 5, market: 3, crud: 2, social: -1, analytics: -1 },
        tags: ["strong_consistency"],
      },
      {
        id: "eventual",
        label: "Eventual consistency",
        explanation:
          "Copies of the data catch up after a short delay, so a read might be a moment behind. Fine for likes, feeds, and recommendations.",
        caveat: "You can read slightly stale data — dangerous for payments or stock counts.",
        scores: { social: 3, streaming: 3, iot: 3, analytics: 2, ecom: -2, ai_search: 2 },
        tags: ["eventual_consistency"],
      },
      {
        id: "read_your_writes",
        label: "Read-your-writes",
        explanation:
          "You always see your own latest change right away, even if others see it a beat later. Key for chat and editing.",
        caveat: "Other people may still briefly see the older version.",
        scores: { chat: 3, social: 2, crud: 1 },
      },
      {
        id: "tunable",
        label: "Tunable (choose per operation)",
        explanation:
          "Pick strong or relaxed consistency case by case — strong for a payment, relaxed for a view count.",
        caveat: "Every read and write becomes a decision you have to get right.",
        scores: { market: 3, streaming: 2, iot: 2 },
      },
      {
        id: "crdt",
        label: "Conflict-free sync (CRDTs)",
        explanation:
          "Special data types that let many people edit at once (even offline) and merge automatically without clashes. Powers live collaboration.",
        caveat: "Works only for certain kinds of data and is tricky to implement correctly.",
        scores: { chat: 4, market: 1 },
      },
    ],
  },
  {
    id: "async",
    category: "Async processing",
    prompt: "How does slow work get done without making users wait?",
    help: "How work that shouldn't make the user wait gets done — emails, exports, search indexing, notifications. Skip it and slow tasks block users and time out. Queues defer one-off jobs; pub/sub and streaming broadcast events to many parts of the system at once. Works with: Backend shape, API style.",
    options: [
      {
        id: "async_none",
        label: "None — do everything immediately",
        explanation: "All work finishes inside the user's request. The simplest approach.",
        caveat: "Slow tasks (emails, exports, matching) make users wait and can time out when the app is busy.",
        scores: { crud: 3, ecom: -1, market: -2, iot: -2 },
        tags: ["no_async"],
      },
      {
        id: "job_queue",
        label: "Background job queue",
        explanation:
          "Hand slow tasks to background workers through a to-do list (a queue) so the user isn't kept waiting.",
        caveat: "You have to handle retries and tasks that keep failing.",
        scores: { ecom: 3, crud: 1, social: 1, ai_search: 2 },
      },
      {
        id: "pub_sub",
        label: "Pub/sub events",
        explanation:
          "One part announces an event and many others react at once — great for notifications and broadcasting to lots of users.",
        caveat: "An event can be delivered more than once, so handlers must be safe to run twice (idempotent).",
        scores: { chat: 4, market: 2, social: 2, iot: 2 },
        tags: ["fanout"],
      },
      {
        id: "event_streaming",
        label: "Event streaming (Kafka-style)",
        explanation:
          "A durable, replayable log of everything that happened, feeding analytics, search, and other services.",
        caveat: "Powerful but heavy to run; you must watch for consumers falling behind.",
        scores: { iot: 4, analytics: 4, streaming: 3, market: 3, social: 2 },
        tags: ["fanout", "streaming_pipeline"],
      },
      {
        id: "batch_jobs",
        label: "Scheduled batch jobs",
        explanation:
          "Jobs that run on a schedule (say, nightly) to crunch data and build reports. A classic for analytics.",
        caveat: "Results are only as fresh as the last run.",
        scores: { analytics: 4, iot: 2 },
      },
    ],
  },
  {
    id: "cache",
    category: "Caching",
    prompt: "Do you keep fast copies of data to speed up reads?",
    help: "Fast copies of data so you don't refetch or recompute constantly — big speed and cost wins. The catch is staleness: forget to refresh the cache when data changes and users see old values. More caching means more 'why is this stale?' bugs to design around. Works with: Consistency, Deployment.",
    options: [
      {
        id: "cache_none",
        label: "No cache",
        explanation: "Every read goes straight to the database. Simplest, and fine when traffic is low.",
        caveat: "Becomes a bottleneck as reads pile up.",
        scores: { crud: 2, ecom: -1 },
      },
      {
        id: "browser_cache",
        label: "Browser / HTTP cache",
        explanation:
          "Tell browsers to reuse a response for a while, so repeat visits skip the server. A free speed-up.",
        caveat: "Once cached, a user can keep seeing old data until it expires.",
        scores: { crud: 1, ecom: 1 },
      },
      {
        id: "cdn",
        label: "CDN (content delivery network)",
        explanation:
          "A worldwide network of servers that keeps copies of files and media close to users so they load fast everywhere.",
        caveat: "Clearing or updating those cached copies everywhere takes care.",
        scores: { streaming: 3, social: 2, ecom: 2, market: 1 },
      },
      {
        id: "redis_cache",
        label: "Redis / in-memory cache",
        explanation:
          "A super-fast shared store that holds expensive results so you compute them once and reuse them. Very common.",
        caveat: "Forgetting to refresh it leads to stale-data bugs.",
        scores: { ecom: 3, social: 3, chat: 3, market: 3, streaming: 2, ai_search: 2 },
        tags: ["shared_cache", "fanout"],
      },
      {
        id: "db_cache",
        label: "Database query cache",
        explanation:
          "Let the database remember results of common queries (e.g. materialized views — pre-computed result tables).",
        caveat: "Less control, and it can hide the fact that you're missing an index.",
        scores: { crud: 1, ecom: 1, analytics: 1 },
      },
      {
        id: "edge_cache",
        label: "Edge cache / compute",
        explanation:
          "Cache (and even run code) at locations near users for the lowest possible delay worldwide.",
        caveat: "Keeping all those locations consistent — and debugging them — is harder.",
        scores: { streaming: 3, market: 2, social: 2, iot: 1 },
      },
    ],
  },
  {
    id: "files",
    category: "File / media storage",
    prompt: "Where do uploads and media (images, video, files) go?",
    help: "Where uploads and media live. Tiny attachments can sit in the database, but real images and video belong in object storage (cheap, durable), usually behind a CDN so they load fast worldwide. Big files in the database bloat it and slow backups. Works with: Caching, Client.",
    options: [
      {
        id: "files_none",
        label: "No files",
        explanation: "The app stores only data — no uploads or media to manage.",
        caveat: "Adding file support later is more work than building it in from the start.",
        scores: { crud: 2, analytics: 1, iot: 1 },
      },
      {
        id: "db_blob",
        label: "Store files in the database",
        explanation: "Keep small files directly inside the database. Fine for tiny attachments.",
        caveat: "Big files bloat the database, slow backups, and don't scale.",
        scores: { crud: 1 },
        tags: ["files_in_db"],
      },
      {
        id: "object_storage",
        label: "Object storage (S3-style)",
        explanation:
          "Cheap, durable cloud storage built for files — uploads, exports, user content. The standard choice.",
        caveat: "You manage who can access files, using time-limited links (signed URLs).",
        scores: { social: 3, ecom: 2, streaming: 2, market: 2, ai_search: 1 },
      },
      {
        id: "cdn_media",
        label: "CDN-backed media storage",
        explanation:
          "Object storage with a CDN in front, so images and video load fast everywhere. Standard for media at scale.",
        caveat: "Updating or expiring cached files and links needs attention.",
        scores: { streaming: 4, social: 3, ecom: 1 },
      },
    ],
  },
  {
    id: "deploy",
    category: "Deployment / scaling",
    prompt: "How and where does the app run in production?",
    help: "How and where it runs. One server is simplest but a single point of failure; multiple servers, containers, or Kubernetes scale and survive failures — but only if servers are stateless or share state. Multi-region is fast and resilient worldwide, at the cost of hard data-replication problems. Works with: Server state, Consistency.",
    options: [
      {
        id: "single_server",
        label: "Single server",
        explanation: "Everything runs on one machine. Perfect for a first version (MVP) or an internal tool.",
        caveat: "If it goes down, everything is down — and each deploy causes a brief outage.",
        scores: { crud: 3, ecom: -1, market: -2, streaming: -2 },
      },
      {
        id: "lb_multi",
        label: "Several servers behind a load balancer",
        explanation:
          "A load balancer (traffic router) spreads requests across several identical servers, so you can grow and survive one of them failing.",
        caveat: "Only works if servers are stateless or share their session data.",
        scores: { ecom: 3, crud: 1, social: 2, analytics: 1 },
        tags: ["multi_instance"],
      },
      {
        id: "containers",
        label: "Containers (e.g. Docker)",
        explanation: "Package the app with everything it needs so it runs the same on any machine.",
        caveat: "As you grow, you still need a system to run and schedule them all.",
        scores: { ecom: 2, social: 2, market: 2, analytics: 2 },
        tags: ["multi_instance"],
      },
      {
        id: "kubernetes",
        label: "Kubernetes",
        explanation:
          "A system that runs, restarts, and auto-scales lots of containers for you. Fits many services at large scale.",
        caveat: "Lots of moving parts to learn and operate — overkill for small apps.",
        scores: { market: 4, streaming: 4, social: 3, iot: 2, crud: -2 },
        tags: ["multi_instance"],
      },
      {
        id: "serverless_deploy",
        label: "Serverless platform",
        explanation: "The cloud runs and scales your code per request automatically — no servers for you to manage.",
        caveat: "Brief cold-start delays, time limits per run, and no memory kept between runs.",
        scores: { crud: 1, analytics: 2, iot: 2, ecom: 1, ai_search: 2 },
        tags: ["multi_instance", "ephemeral_compute"],
      },
      {
        id: "multi_region",
        label: "Multi-region deployment",
        explanation:
          "Run in several parts of the world for fast access everywhere and to survive one region going down.",
        caveat: "Copying data between regions and keeping it consistent gets genuinely hard.",
        scores: { streaming: 3, market: 4, social: 3, chat: 2, iot: 1 },
        tags: ["multi_instance", "global"],
      },
    ],
  },
  {
    id: "observability",
    category: "Observability",
    prompt: "How will you see what's happening inside the system?",
    help: "How you'll see what's happening when something breaks. Logs are a start; metrics show trends; tracing follows one request across services to find the slow step; alerts and SLOs page you fast; audit logs track sensitive actions. The more distributed your system, the more of this you need. Works with: Backend shape, Deployment.",
    options: [
      {
        id: "basic_logs",
        label: "Basic logs only",
        explanation: "Plain text records of what happened. Enough to get started.",
        caveat: "Hard to track down rare problems or ones that span several servers.",
        scores: { crud: 2 },
      },
      {
        id: "logs_metrics",
        label: "Logs + metrics",
        explanation: "Add dashboards and numbers (metrics) so you can watch health and trends over time.",
        caveat: "Without tracing, you still can't easily see where time goes across services.",
        scores: { ecom: 2, crud: 1, social: 1 },
      },
      {
        id: "logs_metrics_tracing",
        label: "Logs + metrics + tracing",
        explanation:
          "Tracing follows a single request as it hops across services, so you can pinpoint the slow step. Important for many-service and real-time apps.",
        caveat: "Adding the instrumentation and storing traces costs effort and money.",
        scores: { market: 3, streaming: 3, social: 2, chat: 2, iot: 1, ai_search: 1 },
      },
      {
        id: "alerts_slo",
        label: "Alerts + SLOs",
        explanation:
          "Set targets for how reliable things should be (SLOs = service-level objectives) and get paged the moment they slip.",
        caveat: "Badly tuned alerts cause noise and let real problems slip through.",
        scores: { market: 2, streaming: 2, iot: 3, analytics: 2 },
      },
      {
        id: "audit_logs",
        label: "Audit logs + security monitoring",
        explanation:
          "Tamper-resistant records of sensitive actions (who did what, when). Vital for money and compliance.",
        caveat: "Storing and protecting these records adds overhead.",
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
