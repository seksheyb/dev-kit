# Phoenix and LiveView

## Context-Based Architecture

Phoenix contexts group related schemas and business logic behind a boundary module; controllers/LiveViews call the context, never `Repo` or schemas directly.

```elixir
defmodule MyApp.Accounts do
  alias MyApp.Accounts.User
  alias MyApp.Repo

  def get_user!(id), do: Repo.get!(User, id)

  def create_user(attrs) do
    %User{}
    |> User.changeset(attrs)
    |> Repo.insert()
  end

  def change_user(%User{} = user, attrs \\ %{}), do: User.changeset(user, attrs)
end
```

Keep context boundaries by feature/domain (`Accounts`, `Billing`, `Catalog`), not by schema — a context can wrap several related schemas.

## LiveView Fundamentals

```elixir
defmodule MyAppWeb.CounterLive do
  use MyAppWeb, :live_view

  @impl true
  def mount(_params, _session, socket) do
    {:ok, assign(socket, count: 0)}
  end

  @impl true
  def handle_event("increment", _params, socket) do
    {:noreply, update(socket, :count, &(&1 + 1))}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <p>Count: {@count}</p>
      <button phx-click="increment">+1</button>
    </div>
    """
  end
end
```

- `mount/3` runs twice per connection: once for the initial HTTP GET (disconnected render), once when the socket upgrades to the LiveView WebSocket (connected render). Use `connected?(socket)` to skip expensive work (subscriptions, timers) on the disconnected pass.
- Keep `assigns` minimal — every assign is diffed and pushed to the client on change.

## LiveComponent Composition

```elixir
defmodule MyAppWeb.CommentFormComponent do
  use MyAppWeb, :live_component

  @impl true
  def update(assigns, socket) do
    {:ok, assign(socket, assigns) |> assign_new(:changeset, fn -> Comments.change_comment(%Comment{}) end)}
  end

  @impl true
  def handle_event("save", %{"comment" => params}, socket) do
    case Comments.create_comment(params) do
      {:ok, comment} ->
        send(self(), {:comment_created, comment})
        {:noreply, socket}

      {:error, changeset} ->
        {:noreply, assign(socket, changeset: changeset)}
    end
  end
end
```

Use `LiveComponent` for stateful, reusable UI fragments that need their own `handle_event`; use function components (plain `.html.heex` or `attr`/`slot`-based components) for stateless rendering — don't reach for a `LiveComponent` just to share markup.

## Streams for Large Collections

```elixir
def mount(_params, _session, socket) do
  {:ok, stream(socket, :messages, Messages.list_recent())}
end

def handle_info({:new_message, message}, socket) do
  {:noreply, stream_insert(socket, :messages, message, at: 0)}
end
```

```heex
<div id="messages" phx-update="stream">
  <div :for={{dom_id, message} <- @streams.messages} id={dom_id}>
    {message.body}
  </div>
</div>
```

Streams avoid keeping large collections in `assigns` (and re-diffing/re-sending them every update) — use them for any list that grows unbounded (chat messages, activity feeds, paginated tables) instead of a plain assign + `Enum.map`.

## Presence Tracking

```elixir
defmodule MyAppWeb.Presence do
  use Phoenix.Presence,
    otp_app: :my_app,
    pubsub_server: MyApp.PubSub
end

def mount(%{"room_id" => room_id}, _session, socket) do
  if connected?(socket) do
    {:ok, _} = MyAppWeb.Presence.track(self(), "room:#{room_id}", socket.assigns.user_id, %{})
    MyAppWeb.PubSub |> Phoenix.PubSub.subscribe("room:#{room_id}")
  end

  {:ok, assign(socket, presences: MyAppWeb.Presence.list("room:#{room_id}"))}
end
```

## PubSub for Cross-Process Messaging

```elixir
Phoenix.PubSub.subscribe(MyApp.PubSub, "orders:#{order_id}")
Phoenix.PubSub.broadcast(MyApp.PubSub, "orders:#{order_id}", {:order_updated, order})
```

`Phoenix.PubSub` works identically single-node or across a cluster — prefer it over ad hoc `send/2` to a list of tracked pids whenever more than one LiveView/Channel process needs the same event.

## Channels for WebSockets

Reach for a raw `Phoenix.Channel` only when the client isn't a LiveView-controlled DOM (native mobile app, third-party JS widget, custom binary protocol). If the UI is server-rendered HTML, LiveView's own diff-and-patch transport over its socket already covers real-time updates without a hand-rolled channel and client-side JS state machine.

## Form Handling with Changesets

```elixir
def handle_event("validate", %{"user" => params}, socket) do
  changeset = Accounts.change_user(socket.assigns.user, params) |> Map.put(:action, :validate)
  {:noreply, assign(socket, form: to_form(changeset))}
end

def handle_event("save", %{"user" => params}, socket) do
  case Accounts.update_user(socket.assigns.user, params) do
    {:ok, user} -> {:noreply, socket |> assign(user: user) |> put_flash(:info, "Saved")}
    {:error, changeset} -> {:noreply, assign(socket, form: to_form(changeset))}
  end
end
```

```heex
<.form for={@form} phx-change="validate" phx-submit="save">
  <.input field={@form[:email]} type="email" />
  <button type="submit">Save</button>
</.form>
```

`to_form/1` wraps the changeset for `<.form>`/`<.input>` — always route validation errors back through the changeset rather than assigning raw error maps.

## Uploads

```elixir
def mount(_params, _session, socket) do
  {:ok, allow_upload(socket, :avatar, accept: ~w(.jpg .png), max_entries: 1)}
end

def handle_event("save", _params, socket) do
  uploaded = consume_uploaded_entries(socket, :avatar, fn %{path: path}, _entry ->
    dest = Path.join("priv/static/uploads", Path.basename(path))
    File.cp!(path, dest)
    {:ok, "/uploads/#{Path.basename(dest)}"}
  end)

  {:noreply, assign(socket, avatar_url: List.hd(uploaded))}
end
```

## Optimistic UI and Hooks

Use JS commands (`JS.push`, `JS.transition`, `JS.toggle`) for instant client-side feedback before the server round-trip completes, and `phx-hook`-based JS hooks only for behavior the server genuinely can't drive (focus management, third-party JS libraries, clipboard access). Prefer server state as the source of truth — hooks that maintain their own client state diverging from `assigns` are a common source of LiveView bugs.

## JSON Encoding

Elixir 1.18+ ships a native `JSON` module in the standard library (`JSON.encode!/1`, `JSON.decode!/1`) mirroring Jason's API. For new code without an existing `Jason` dependency, the stdlib module is sufficient for straightforward encode/decode; keep `Jason` where a project already depends on it or needs its encoder protocol customization (`Jason.Encoder` implementations, ordered maps, etc.).
