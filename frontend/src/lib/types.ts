// Shapes of the JSON returned by the Java backend (see docs/08-backend.md).

export type Algorithm = "NAIVE" | "RABIN_KARP" | "FINITE_AUTOMATON" | "KMP"

export const ALGORITHMS: { value: Algorithm; label: string }[] = [
  { value: "NAIVE", label: "Naive" },
  { value: "RABIN_KARP", label: "Rabin-Karp" },
  { value: "FINITE_AUTOMATON", label: "Finite Automaton" },
  { value: "KMP", label: "KMP" },
]

export function algorithmLabel(algo: Algorithm): string {
  return ALGORITHMS.find((a) => a.value === algo)?.label ?? algo
}

export interface DocumentInfo {
  id: string
  name: string
  size: number // number of characters
}

export interface Snippet {
  before: string
  match: string
  after: string
}

export interface DocResult {
  docId: string
  name: string
  count: number
  positions: number[]
  snippets: Snippet[]
}

export interface SearchResponse {
  algorithm: Algorithm
  timeMs: number
  comparisons: number
  results: DocResult[]
}

export interface CompareRow {
  algorithm: Algorithm
  timeMs: number
  comparisons: number
  totalMatches: number
}

/** Which fields are present depends on the algorithm. */
export interface Preprocessing {
  pattern: string
  m: number
  d?: number // Rabin-Karp
  q?: number
  h?: number
  p?: number
  alphabet?: string[] // Finite Automaton
  delta?: number[][]
  pi?: number[] // KMP
}

export interface Explanation {
  algorithm: Algorithm
  complexity: string
  description: string
  preprocessing: Preprocessing
}
