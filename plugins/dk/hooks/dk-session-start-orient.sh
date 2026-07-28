#!/usr/bin/env bash
# dk-session-start-orient.sh — re-orient a session whose context window is empty.
#
# dk's session-boundary protocol IS a `/clear` protocol: `/dk:run` writes `.dk-state`, tells the
# operator to `/clear`, and resumes on the far side (RUNBOOK.md, "Session boundary"). SessionStart
# is the only event that fires on `clear`, `compact`, `resume` AND `startup`, so this single hook
# lands on every dk boundary — and it lands at the one moment injecting context is cheap, because
# there is nothing in the window yet to compete with.
#
# Three jobs, one message: where the run is, what the vault could usefully supply for the next
# step, and which artifacts the Stop-time drain never got saved.
#
# Every contract used here lives in ./CONTRACTS.md — the wiki queue format, the six note types,
# and the "Step → types needed" table. None of it is re-decided in this file.

. "$(dirname "$0")/lib/dk-common.sh"

dk_read_stdin
dk_guard

# A forked session is a copy that already carries the parent's full context. Orienting it repeats
# what it can already see, so `fork` is the one source that gets nothing at all — not defensive
# coding, a real case with a real answer.
case "$(dk_json source)" in
  fork) exit 0 ;;
esac

# --- contract lookups (CONTRACTS.md, verbatim — do not extend here) -------------------------

# dk_type_name <n> — the six note types by name. Numbers are meaningless in an injected sentence;
# the model has to know what it is asking the vault for.
dk_type_name() {
  case "$1" in
    1) printf 'Decision + rejected alternatives' ;;
    2) printf 'Post-mortem' ;;
    3) printf 'Constraint + how it was learned' ;;
    4) printf 'Domain knowledge' ;;
    5) printf 'Milestone retrospect' ;;
    6) printf 'Dismissed finding' ;;
    *) printf 'type %s' "$1" ;;
  esac
}

# dk_types_for_step <group:name> — the "Step → types needed" table. The default arm is the whole
# point of the table: most pipeline steps open no new line of reasoning, so they get no nudge.
# A blanket "check the vault" on every session is exactly the pollution this design avoids.
dk_types_for_step() {
  case "$1" in
    arch:design|arch:gate)                                            printf '1 3' ;;
    plan:write|plan:review|plan:gate)                                 printf '1 3' ;;
    debug:run)                                                        printf '2 3' ;;
    discover:research|discover:map)                                   printf '4' ;;
    requirements:brainstorm|requirements:specify|requirements:market) printf '4 5' ;;
    review:loop|review:once|review:qa)                                printf '6' ;;
    close:retro|close:milestone)                                      printf '1 2 3 4 5 6' ;;
    *)                                                                return 0 ;;
  esac
}

# --- section a: the state head ---------------------------------------------------------------

STAGE="$(dk_state stage)"
MILESTONE="$(dk_state milestone)"
PHASE="$(dk_state phase)"
ROUND="$(dk_state round)"
VERDICT="$(dk_state verdict)"
NEXT="$(dk_state next)"

HEAD=""
DESC=""
[ -n "$MILESTONE" ] && DESC="milestone $MILESTONE"
[ -n "$PHASE" ]     && DESC="${DESC:+$DESC, }phase $PHASE"
[ -n "$STAGE" ]     && DESC="${DESC:+$DESC, }stage $STAGE"
[ -n "$ROUND" ]     && DESC="${DESC:+$DESC, }round $ROUND"

if [ -n "$DESC" ] || [ -n "$VERDICT" ] || [ -n "$NEXT" ]; then
  HEAD="dk run active"
  [ -n "$DESC" ]    && HEAD="$HEAD — $DESC"
  [ -n "$VERDICT" ] && HEAD="$HEAD (last verdict: $VERDICT)"
  HEAD="$HEAD."
  # `next:` is a POINTER by contract (references/state-contract.md), not a payload: the deciding
  # already happened when the line was written. Reproduce it verbatim — paraphrasing it, or
  # expanding the journal file it names, is how a resume ends up in the wrong place.
  [ -n "$NEXT" ] && HEAD="$HEAD Next: $NEXT"
fi

# --- sections b and c: both live behind the wiki kill switch ---------------------------------

NUDGE=""
BACKSTOP=""

if ! dk_flag_off wiki; then

  # b. Scoped ingest nudge, driven off the command name in `next:` — e.g. "/dk:plan:gate 03"
  # yields plan:gate. A two-segment command (`/dk:run`) or a missing `next:` matches nothing,
  # which is the correct outcome, not a gap.
  STEP="$(printf '%s' "$NEXT" | grep -oE '/dk:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+' | head -1 | sed 's|^/dk:||')"
  TYPES=""
  [ -n "$STEP" ] && TYPES="$(dk_types_for_step "$STEP")"

  if [ -n "$TYPES" ]; then
    NAMES=""
    for t in $TYPES; do
      NAMES="${NAMES:+$NAMES, }\"$(dk_type_name "$t")\""
    done

    SCOPE=""
    [ -n "$MILESTONE" ] && SCOPE="milestone $MILESTONE"
    [ -n "$PHASE" ]     && SCOPE="${SCOPE:+$SCOPE / }phase $PHASE"
    [ -z "$SCOPE" ]     && SCOPE="the current milestone"

    # Nudge, never ingest. At SessionStart there is no user prompt yet, so any vault query this
    # hook ran would be unscoped against an unknown task — the most expensive possible read for
    # the least possible relevance. Emit one sentence and let the model decide against the
    # operator's actual first message, which arrives moments from now.
    NUDGE="Vault: the next step ($STEP) is one the wiki can inform. Relevant note types: $NAMES."
    NUDGE="$NUDGE If the operator's first message takes up that work, dispatch \`claude-obsidian:wiki-ingest\`"
    NUDGE="$NUDGE scoped to those note types and to $SCOPE — scoped, not a whole-vault pull. If the"
    NUDGE="$NUDGE conversation goes elsewhere, skip it."
  fi

  # c. Queue backstop. The primary drain is `dk-stop-wiki-drain.sh`, which fires at Stop while the
  # reasoning behind the artifact is still in the window. Anything reaching this hook means that
  # drain did not land, so this is a lossy second chance — and the message says so, because a
  # save that silently loses the deliberation is worse than one the model knows is degraded.
  QUEUE="$(dk_queue)"
  if [ -s "$QUEUE" ]; then
    # Dedupe by path keeping the newest entry; the queue is append-only, so a later line for the
    # same path supersedes an earlier one. Output order is first-seen so the list reads
    # chronologically.
    PENDING="$(awk -F'\t' '
      NF >= 3 && $3 != "" {
        if (!($3 in ts) || $1 >= ts[$3]) { ts[$3] = $1; ty[$3] = $2 }
        if (!($3 in seen)) { seen[$3] = 1; ord[++n] = $3 }
      }
      END { for (i = 1; i <= n; i++) printf "%s\t%s\n", ty[ord[i]], ord[i] }
    ' "$QUEUE" 2>/dev/null)"

    if [ -n "$PENDING" ]; then
      COUNT="$(printf '%s\n' "$PENDING" | wc -l | tr -d ' ')"
      LIST=""
      while IFS="$(printf '\t')" read -r ty path; do
        [ -n "$path" ] || continue
        LIST="$LIST
  - $path — $(dk_type_name "$ty")"
      done <<EOF
$PENDING
EOF
      BACKSTOP="Unsaved to the vault: $COUNT artifact(s) were written but never made it into a note.$LIST"
      BACKSTOP="$BACKSTOP
Run \`claude-obsidian:save\` for these. Be honest about what survives: the files are still on
disk and can be saved from their contents, but the deliberation behind them — the alternatives
that lost, the reasoning that was rejected — went with the previous session's context and is
not recoverable from here. Save what the artifacts themselves support; do not invent the rest."
    fi
  fi
fi

# --- emit ------------------------------------------------------------------------------------
# One message, up to three sections. Invariant 4: if every section is empty, dk_emit says nothing.

MSG="$HEAD"
[ -n "$NUDGE" ]    && MSG="${MSG:+$MSG

}$NUDGE"
[ -n "$BACKSTOP" ] && MSG="${MSG:+$MSG

}$BACKSTOP"

dk_emit SessionStart "$MSG"
