# OTP Patterns

## GenServer State Management

```elixir
defmodule Cache do
  use GenServer

  # Client API

  def start_link(opts) do
    name = Keyword.get(opts, :name, __MODULE__)
    GenServer.start_link(__MODULE__, opts, name: name)
  end

  def get(server \\ __MODULE__, key), do: GenServer.call(server, {:get, key})
  def put(server \\ __MODULE__, key, value), do: GenServer.cast(server, {:put, key, value})

  # Server callbacks

  @impl true
  def init(opts) do
    ttl = Keyword.get(opts, :ttl, :timer.minutes(5))
    {:ok, %{store: %{}, ttl: ttl}}
  end

  @impl true
  def handle_call({:get, key}, _from, state) do
    {:reply, Map.fetch(state.store, key), state}
  end

  @impl true
  def handle_cast({:put, key, value}, state) do
    Process.send_after(self(), {:expire, key}, state.ttl)
    {:noreply, put_in(state.store[key], value)}
  end

  @impl true
  def handle_info({:expire, key}, state) do
    {:noreply, update_in(state.store, &Map.delete(&1, key))}
  end
end
```

Rules of thumb:

- Keep `handle_call` bodies fast — anything slow blocks the caller and the mailbox.
- Prefer `handle_cast`/`handle_info` plus a reply-later pattern (`{:noreply, state}` + `GenServer.reply/2`) for long work, or offload to a `Task`.
- Never trap state in closures passed to `Task.start` — pass explicit state and return it via message.

## Supervisor Strategies and Trees

```elixir
defmodule MyApp.Application do
  use Application

  @impl true
  def start(_type, _args) do
    children = [
      {Registry, keys: :unique, name: MyApp.Registry},
      MyApp.Repo,
      {Phoenix.PubSub, name: MyApp.PubSub},
      {DynamicSupervisor, name: MyApp.WorkerSupervisor, strategy: :one_for_one},
      MyAppWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: MyApp.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
```

Strategy selection:

| Strategy | Use when |
|---|---|
| `:one_for_one` | Children are independent; a crash in one shouldn't affect siblings |
| `:one_for_all` | Children share state/invariants; if one crashes, restart all |
| `:rest_for_one` | Children have a startup dependency order; restart the crashed one and everything after it |

Set `max_restarts`/`max_seconds` deliberately — the defaults (3 restarts in 5 seconds) escalate the crash to the supervisor's own supervisor, which is the intended "let it crash" behavior for a design flaw, not a transient fault.

## DynamicSupervisor for Runtime Children

```elixir
defmodule MyApp.WorkerSupervisor do
  def start_worker(args) do
    spec = {MyApp.Worker, args}
    DynamicSupervisor.start_child(MyApp.WorkerSupervisor, spec)
  end

  def stop_worker(pid) do
    DynamicSupervisor.terminate_child(MyApp.WorkerSupervisor, pid)
  end
end
```

Use `DynamicSupervisor` for per-request/per-session/per-connection processes (LiveView-driven jobs, per-tenant workers) where the child set isn't known at boot.

## Registry for Process Discovery

```elixir
# Named per-key process, looked up without a global name
defmodule MyApp.Session do
  def start_link(session_id) do
    GenServer.start_link(__MODULE__, session_id, name: via(session_id))
  end

  def via(session_id), do: {:via, Registry, {MyApp.Registry, {:session, session_id}}}
end

MyApp.Session.start_link("abc123")
GenServer.call(MyApp.Session.via("abc123"), :status)
```

`Registry` avoids the bottleneck of a single named process and lets thousands of session/connection processes be addressed by key instead of by atom name (atoms leak memory if generated dynamically — never build registry keys from unbounded user input as atoms; use `:unique`/`:duplicate` registries with non-atom keys instead).

## Agent vs GenServer vs ETS

- **Agent** — trivial shared state with no custom logic beyond get/update. If you're about to add a `handle_call` clause with branching, it's a GenServer now.
- **GenServer** — anything with behavior: validation, side effects, timers, supervision-relevant lifecycle.
- **ETS** — high-read, low-contention shared state read directly by many processes without going through a single process's mailbox. Owning process (often a GenServer) still manages writes/table lifecycle.

```elixir
:ets.new(:rate_limits, [:set, :public, :named_table, read_concurrency: true])
:ets.insert(:rate_limits, {user_id, count, window_start})
:ets.lookup(:rate_limits, user_id)
```

## Task for Async Operations

```elixir
# Fire-and-forget under supervision
Task.Supervisor.start_child(MyApp.TaskSupervisor, fn -> send_webhook(payload) end)

# Await with timeout, isolated failure
task = Task.Supervisor.async_nolink(MyApp.TaskSupervisor, fn -> fetch_report(id) end)

case Task.yield(task, 5_000) || Task.shutdown(task) do
  {:ok, result} -> {:ok, result}
  nil -> {:error, :timeout}
end
```

Always run `Task`s under a `Task.Supervisor` in production code — bare `Task.start_link/1` links the task to the calling process and crashes it on task failure, which is rarely what's intended outside of tests.

## "Let It Crash" and Error Handling Philosophy

- Let a process crash on unexpected input; supervision restarts it in a known-good state. Don't defensively `rescue` around every possible failure.
- Reserve `try/rescue` for boundaries where a crash would be user-visible in the wrong way (a web request that should return a 4xx, not tear down the connection process) or where external side effects need cleanup (`after` blocks).
- Use tagged tuples `{:ok, value}` / `{:error, reason}` for expected failure paths; use `with` to chain them without nested `case`:

```elixir
def create_order(attrs) do
  with {:ok, cart} <- validate_cart(attrs),
       {:ok, charge} <- Payments.charge(cart),
       {:ok, order} <- Orders.insert(cart, charge) do
    {:ok, order}
  else
    {:error, :cart_empty} = err -> err
    {:error, %Stripe.Error{}} = err -> err
  end
end
```

## Broadway, GenStage, and Flow

- **GenStage** — backpressure-aware producer/consumer pipelines when you're building the stages yourself.
- **Broadway** — the standard choice for consuming from SQS/Kafka/RabbitMQ/GCP Pub/Sub with batching, rate limiting, and automatic acknowledgment; reach for it before hand-rolling GenStage against a queue.
- **Flow** — parallel data processing over enumerables/collections (ETL-style), not message-queue consumption.

## Distributed Systems

- **libcluster** for node discovery/clustering (Kubernetes DNS, Gossip, EPMD strategies).
- **Horde** for distributed `Registry`/`DynamicSupervisor` — process ownership survives node loss and rebalances on join, unlike the standard library versions which are node-local.
- **Phoenix.PubSub** — works single-node or clustered with the same API; use it for cross-node broadcast instead of hand-rolled node messaging.
- Design for network partitions explicitly: prefer idempotent operations and eventual reconciliation over assuming a single global leader unless you've adopted a leader-election library (e.g., `:global`, or Horde's own coordination) and understand its split-brain behavior.

## Compiler Type Checking vs Dialyzer

Elixir 1.18+ ships a built-in, sound, set-theoretic type system in the compiler itself — it infers types from pattern matches and (as of 1.19) guards and anonymous functions, and reports real type errors at compile time with no `@spec` annotations required. Treat this as the primary correctness signal for OTP code:

- Let the compiler's type inference catch pattern-match and argument-shape mistakes first.
- Add `@spec`/Dialyzer only where the compiler's inference is insufficiently precise (e.g., documenting a public API's contract, or narrowing a `GenServer.call/3` reply type for callers) — treat Dialyzer as a supplementary, legacy tool rather than the primary type-checking step.
- Don't gate CI on Dialyzer alone; run `mix compile --warnings-as-errors` to surface the compiler's own type diagnostics.
