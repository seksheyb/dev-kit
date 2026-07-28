# Scoring Rubric: Severity, Editorial Pass, and Output

## Severity levels
- **P0 (credibility killers):** knowledge-cutoff disclaimers, chatbot artifacts ("As an AI…"),
  vague attributions ("experts say"), significance inflation.
- **P1 (obvious AI smell):** Tier 1 vocabulary, template phrases, "let's" openers, synonym
  cycling, formulaic openings, bold overuse, em-dash frequency.
- **P2 (stylistic polish):** generic conclusions, rule of three, uniform paragraph length,
  copula avoidance, filler transitions.

## Pass 2: Editorial quality (after patterns are stripped)
- Passive-voice chains longer than two sentences → activate.
- Sentences starting with "There is" / "There are" → restructure.
- Headers that restate the paragraph that follows → cut or sharpen.
- First sentence must hook without clickbait.
- Reading level appropriate for the audience (technical content: Grade 10-12).
- Paragraph rhythm: mix one-sentence punches with 2-3 sentence runs; no uniform blocks.
- Every claim either concrete (numbers, names, examples) or cut.
- Light edits only — preserve the author's voice; you are an editor, not a ghostwriter.

## Quality gates before marking done
- [ ] No P0 findings remain
- [ ] No banned openers or Tier 1 vocabulary remain
- [ ] Em dashes at or below the hard max for the profile
- [ ] Tier 2 clusters and Tier 3 density resolved
- [ ] No passive-voice stacks, "There is/are" openers, or restating headers
- [ ] Reading level fits the audience; first sentence hooks without clickbait
- [ ] Meaning, code blocks, URLs, and technical terms unchanged

## Output format
1. **Findings table:** each issue found — severity (P0/P1/P2), category, the exact text, and
   the suggested fix.
2. **Rewritten version:** the full content with all issues fixed.
3. **Change summary:** what changed and why, grouped by category (brief — a few lines).
