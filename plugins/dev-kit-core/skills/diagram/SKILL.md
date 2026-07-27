---
name: diagram
description: English in, editable diagram out. Authors mermaid from a plain-English request, renders it to SVG/PNG, and keeps the .mmd source as the editable single source of truth (plus an optional .excalidraw scene for flowcharts). Use when asked to "draw a diagram", "diagram this", "make a flowchart", "visualize the architecture", or turn mermaid into an image.
---

# /diagram — English in, editable diagram out

Every run emits an **artifact set**, never a dead pixel dump:

| Artifact | What it's for |
|---|---|
| `<slug>.mmd` | the mermaid source — the LLM-friendly, editable interchange format |
| `<slug>.svg` + `<slug>.png` | crisp vector for docs + raster for chat/issues/READMEs |
| `<slug>.excalidraw` | optional editable scene (flowcharts only) — open at excalidraw.com, move a box, keep working |

## Step 1 — Author the diagram

Write mermaid for the user's request. Rules:

- **Flowcharts (`graph LR`/`graph TD`) are the sweet spot.** Prefer `graph LR` for pipelines/flows, `graph TD` for hierarchies.
- Sequence, state, gantt, and other mermaid types render to SVG/PNG fine, but excalidraw conversion only supports flowcharts — for other types skip the `.excalidraw` artifact and tell the user: "sequence diagrams render but aren't excalidraw-editable (converter limitation — flowcharts are)."
- Keep node labels short; put detail in edge labels. 5-15 nodes is the readable range. If the ask needs more, split into multiple diagrams and say why.

Decide the output directory: the current working directory when it's a git repo (artifacts the user can commit alongside their existing files), else a temp directory. Derive `<slug>` from the diagram's subject (kebab-case, ≤40 chars).

Write the mermaid source to `<outdir>/<slug>.mmd` first — the source is the single source of truth for every later edit.

## Step 2 — Render SVG + PNG

Use whichever renderer is available, in this order:

1. **mermaid-cli (`mmdc`)** — the standard offline renderer:
   ```bash
   npx -y @mermaid-js/mermaid-cli -i <outdir>/<slug>.mmd -o <outdir>/<slug>.svg
   npx -y @mermaid-js/mermaid-cli -i <outdir>/<slug>.mmd -o <outdir>/<slug>.png --scale 3
   ```
   (`--scale 3` gives a print-quality raster of a ~6.5in placement.)
2. **A rendering surface that supports mermaid natively** (e.g. an artifact/preview pane that renders ` ```mermaid ` fences) — deliver the fence there and still keep the `.mmd` on disk, marked per "Keeping `.mmd` and embedded fences in sync" below.
3. Neither available → show the mermaid source in a fenced block so the user can paste it into mermaid.live, and say exactly what to install (`npm i -g @mermaid-js/mermaid-cli`). Do not pretend a render happened.

If the mermaid render returns a parse error, show it, fix the mermaid, and retry — never hand the user a broken source file.

**Excalidraw scene (optional, flowcharts only):** producing `<slug>.excalidraw` requires the mermaid-to-excalidraw converter (requires wiring: `@excalidraw/mermaid-to-excalidraw` in a small node script or a browser page). If it isn't wired, skip the artifact and mention that flowcharts can be made excalidraw-editable if the user wants it set up.

## Step 3 — Show and deliver

1. Read the PNG with the Read tool so the user sees the diagram inline.
2. List the artifact paths.
3. If an `.excalidraw` was produced, one-line editability note: "opens at excalidraw.com (File → Open) — edit there and I can re-render."
4. **Iteration loop:** when the user wants changes to the diagram's content or structure, edit the `.mmd` source and re-run Step 2. Never edit the SVG/PNG directly — they are derived artifacts.
5. **Excalidraw round-trip:** if the user instead edited the `.excalidraw` scene directly (moved boxes, restyled in excalidraw.com) and wants that reflected, re-export SVG/PNG from the edited scene file itself — do not regenerate from the `.mmd` and clobber their layout edits. Only fall back to regenerating from `.mmd` if the user's change was to the diagram's content/wording rather than its layout.

## Keeping `.mmd` and embedded fences in sync

Two delivery routes leave a **second copy** of the mermaid source living inside a document: embedding a ` ```mermaid ` fence in a markdown/PDF doc (below), and delivering a fence on a native-mermaid rendering surface while keeping the `.mmd` on disk (Step 2, route 2). Nothing about a `.mmd` file and an embedded fence keeps them identical on its own — the first time either side is edited without touching the other, they silently diverge, and both copies look fine in isolation.

**Marking convention:** every embedded fence derived from an `.mmd` carries an HTML comment immediately above it naming the source path, so the pairing is mechanical instead of implicit:

````
<!-- diagram:source=<path/to/slug.mmd> -->
```mermaid
...
```
````

This is greppable: `grep -rn "diagram:source=" <doc-or-repo-root>` finds every embedded copy of any `.mmd` in scope.

**The duty, both directions:**
1. **`.mmd` edited** (the Step 3 iteration loop, or any other edit to the source file): before calling the diagram done, grep for `diagram:source=<that .mmd's path>`. For every match, overwrite the fence's contents with the updated `.mmd` source verbatim, and re-render the SVG/PNG if that same `.mmd` also feeds a rendered artifact.
2. **Fence edited in place** (a human or another skill changed the mermaid inside the markdown doc directly, not via the `.mmd`): read the `diagram:source=` comment above it, open that `.mmd`, and overwrite it with the fence's content verbatim. Then re-run Step 2 so the SVG/PNG stay current.
3. **No marker above an edited fence:** treat it as an orphan — find or create the `.mmd` it corresponds to, write the fence's content there, and add the `diagram:source=` comment above the fence so the pairing is discoverable next time, rather than leaving a second, untracked copy of the source.

## Rules

- **Never ship without rendering** (or, if rendering is impossible, without saying so and surfacing the install command). A `.mmd` file alone is not a diagram.
- For diagrams destined for a markdown doc or PDF pipeline that renders ` ```mermaid ` fences natively, embed the mermaid source rather than the PNG — it stays diffable and editable. Mark it per "Keeping `.mmd` and embedded fences in sync" above and honor that re-sync duty for the life of the doc.

## Completion status

- DONE — source + SVG/PNG delivered and shown (plus `.excalidraw` or its limitation note).
- BLOCKED — no renderer available; install/setup command surfaced.
