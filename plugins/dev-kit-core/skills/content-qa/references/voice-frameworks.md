# Voice Frameworks: AI-Pattern Detection

Full detection framework for Pass 1 of content-qa. Scan across every category below and
record each finding with a severity (see scoring-rubric.md) before moving to Pass 2.

## Formatting patterns
- **Em dashes:** replace with commas, periods, or sentence breaks. Target: zero. Hard max:
  one per 1,000 words.
- **Bold overuse:** strip bold from most phrases. One bolded phrase per major section at most.
- **Emoji in headers:** remove entirely. Social posts may use one or two sparingly at line ends.
- **Excessive bullet lists:** convert to prose paragraphs. Bullets only for genuinely
  list-like content (5+ item lists that read as prose should become prose).

## Sentence structure patterns
- **"It's not X, it's Y" constructions:** rewrite as direct positive statements.
- **Hollow intensifiers:** cut "genuine," "truly," "quite frankly," "let's be clear,"
  "it's worth noting that."
- **Hedging stacks:** cut "perhaps," "could potentially," "it's important to note that,"
  "it's important to consider."
- **Sycophantic/stock openers:** cut "Great question!", "Certainly!", "Absolutely!"
- **Filler transitions:** cut "Furthermore," "Moreover," "In conclusion," — replace with
  real bridge sentences; each paragraph should connect to the last.
- **Compulsive rule of three:** vary groupings; max one triad pattern per piece.
- **Formulaic openings and generic conclusions.**

## Vocabulary (tiered system)

**Tier 1 (always replace on sight)** — words 5-20x more common in AI text than human text:
delve, landscape (metaphor), tapestry, realm, paradigm, embark, beacon, testament to, robust,
comprehensive, cutting-edge, leverage, pivotal, seamless, game-changer, utilize, nestled,
showcasing, deep dive, holistic, actionable, synergy, streamline.

**Tier 2 (flag in clusters)** — individually fine, but two or more in one paragraph signals
AI origin: harness, navigate, foster, elevate, unleash, empower, bolster, spearhead,
resonate, revolutionize, facilitate, nuanced, crucial, multifaceted, ecosystem (metaphor),
myriad, cornerstone, paramount, transformative.

**Tier 3 (flag by density)** — common words AI overuses; flag when they exceed roughly 3% of
total word count: significant, innovative, effective, dynamic, scalable, compelling,
unprecedented, exceptional, remarkable, sophisticated, instrumental, world-class.

## Content-type profiles (strictness by format)
- **LinkedIn/social posts:** relaxed on formatting and structure, strict on vocabulary.
- **Blog/newsletter:** all rules at full strength (default).
- **Technical blog:** relaxed on hedging and Tier 2 words with legitimate technical meaning
  ("navigate a filesystem", "robust to failure" in an engineering sense).
- **Investor/exec emails:** extra strict on promotional language and significance inflation.
- **Documentation:** relaxed overall — clarity over voice; keep bullets where they aid scanning.
- **Casual:** only flag P0 credibility killers.

**Always preserve:** code blocks, URLs, technical terms, quoted material, and the author's
intended meaning.
