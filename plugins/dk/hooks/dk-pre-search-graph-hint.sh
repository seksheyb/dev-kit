#!/usr/bin/env bash
# dk-pre-search-graph-hint.sh — PreToolUse(Glob|Grep).
#
# When a repo graph exists, point the agent at docs/state/graphs/GRAPH_REPORT.md before it
# starts grepping raw files. Advisory only: this hook never blocks a search, it just makes
# the cheaper source visible first.
#
# WHY this exists even though /dk:discover:graph-update already fronts the graph at RUNBOOK
# step 5: step 5 is where the graph is *built*, and its own instruction dies with that turn.
# Glob and Grep then run constantly through steps 8-9 (build waves, debug) — hundreds of
# calls, hours later, almost always on the far side of a /clear or a session boundary. By
# then nothing in context says a graph exists at all, so the agent re-derives structure by
# reading files. That is the gap a command step cannot cover and a tool-triggered hook can.
#
# Fires at most ONCE per session (dk_once, marker keyed on session_id). During an execution
# wave an agent may search dozens of times; the same sentence re-injected on every one of
# them is pure context pollution and gets tuned out. Once is enough — the agent that has
# been told about the report keeps it in context.

. "$(dirname "$0")/lib/dk-common.sh"

dk_read_stdin
dk_guard
dk_flag_off graphify && exit 0

# No graph means there is nothing to point at. Silence, not a "you should build one" nudge —
# building it is RUNBOOK step 5's job, and a search is the wrong moment to derail.
[ -f "$(dk_root)/docs/state/graphs/graph.json" ] || exit 0

dk_once graph-hint || exit 0

dk_emit PreToolUse "dk graphify: this repo has a knowledge graph. Read docs/state/graphs/GRAPH_REPORT.md for structure — hotspots, clusters, dependency direction — before searching raw files. One-time reminder for this session."
exit 0
