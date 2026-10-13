# Learning Guide — Document Search Engine

These notes explain **what this project is**, **how it's built**, and **the theory behind it**, so you can learn every concept from one place. They are updated as each feature is built.

> **Diagrams:** the flowcharts and state diagrams use [Mermaid](https://mermaid.js.org/). They render automatically on GitHub. In VS Code, install the *Markdown Preview Mermaid Support* extension and open the preview (`Ctrl+Shift+V`).

## Reading order

| # | File | What you'll learn | Status |
|---|---|---|---|
| 1 | [Project overview](01-project-overview.md) | What the app does, architecture, folder layout, build progress | ✅ |
| 2 | [String matching basics](02-string-matching-basics.md) | Text, pattern, shift, prefix/suffix, how we measure cost | ✅ |
| 3 | [Naive algorithm](03-naive.md) | Brute force: try every shift | ✅ |
| 4 | [Rabin-Karp](04-rabin-karp.md) | Hashing and the rolling hash | ✅ |
| 5 | [Finite Automaton](05-finite-automaton.md) | Transition table δ, reading each char once | ✅ |
| 6 | [KMP](06-kmp.md) | Prefix function π, never moving the text pointer back | ✅ |
| 7 | [Comparing the algorithms](07-comparing-the-algorithms.md) | Side-by-side complexity and real comparison counts | ✅ |
| 8 | [Backend](08-backend.md) | Document store, search/compare/explain, HTTP API, real numbers | ✅ |
| 9 | [Frontend](09-frontend.md) | Toolchain, `/api` proxy, state, Results / Comparison / How it works | ✅ |

## One running example

Every algorithm page uses the **same example**, so you can compare them directly:

```
Text    T = a b a b a b a c a b a      (n = 11)
Pattern P = a b a b a c a              (m = 7)
Answer: one match at shift s = 2
```

| Algorithm | Character comparisons on this example |
|---|---|
| Naive | 19 |
| Rabin-Karp | 7 |
| Finite Automaton | 11 |
| KMP | 12 |

(These numbers come from running the actual code in `backend/src/searchengine/algorithms/`.)

## Quick glossary

| Term | Meaning |
|---|---|
| **T, n** | The text being searched and its length |
| **P, m** | The pattern we look for and its length |
| **shift s** | Placing P under T starting at position s (0-based) |
| **valid shift** | A shift where P matches T exactly, i.e. a match |
| **prefix / suffix** | Start / end piece of a string. `"ab"` is a prefix of `"abc"`, `"bc"` is a suffix |
| **preprocessing** | Work done on P *before* looking at T (π table, δ table, hash) |
| **π (pi)** | KMP prefix function |
| **δ (delta)** | Finite automaton transition function |
| **d, q, h** | Rabin-Karp radix, prime modulus, and `d^(m-1) mod q` |
