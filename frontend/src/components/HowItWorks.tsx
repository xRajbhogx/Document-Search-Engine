import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { algorithmLabel, type Algorithm, type Explanation, type Preprocessing } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Props {
  explanations: Explanation[] | null // one per algorithm, for the last searched pattern
  initialAlgo: Algorithm // the algorithm used for the last search is shown first
  loading: boolean
}

/** Explains each algorithm and shows the table it builds for the current pattern. */
export function HowItWorks({ explanations, initialAlgo, loading }: Props) {
  if (loading) {
    return <Skeleton className="h-72 w-full" />
  }

  if (!explanations) {
    return (
      <p className="rounded-xl border border-dashed px-6 py-16 text-center text-sm text-muted-foreground">
        Run a search to see the table each algorithm builds for your pattern.
      </p>
    )
  }

  return (
    <Tabs defaultValue={initialAlgo}>
      <TabsList variant="line">
        {explanations.map((e) => (
          <TabsTrigger key={e.algorithm} value={e.algorithm}>
            {algorithmLabel(e.algorithm)}
          </TabsTrigger>
        ))}
      </TabsList>
      {explanations.map((e) => (
        <TabsContent key={e.algorithm} value={e.algorithm} className="pt-2">
          <Card>
            <CardHeader>
              <CardTitle>{algorithmLabel(e.algorithm)}</CardTitle>
              <CardDescription>{e.description}</CardDescription>
              <div className="flex flex-wrap gap-2 pt-1">
                {e.complexity.split(". ").map((part) => (
                  <Badge key={part} variant="outline">
                    {part.replace(/\.$/, "")}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <PreprocessingView algorithm={e.algorithm} pre={e.preprocessing} />
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  )
}

function PreprocessingView({ algorithm, pre }: { algorithm: Algorithm; pre: Preprocessing }) {
  switch (algorithm) {
    case "NAIVE":
      return (
        <Note>
          No preprocessing: Naive starts comparing straight away. For <Code>{pre.pattern}</Code> it tries
          every shift s and compares up to m = {pre.m} characters at each one.
        </Note>
      )
    case "RABIN_KARP":
      return <RabinKarpView pre={pre} />
    case "FINITE_AUTOMATON":
      return <TransitionTable pre={pre} />
    case "KMP":
      return <PrefixTable pre={pre} />
  }
}

/** The four numbers Rabin-Karp computes before it starts sliding. */
function RabinKarpView({ pre }: { pre: Preprocessing }) {
  const values = [
    { name: "d", value: pre.d, meaning: "radix (alphabet size)" },
    { name: "q", value: pre.q, meaning: "prime modulus" },
    {
      name: "h",
      value: pre.h,
      meaning: (
        <>
          d<sup>m−1</sup> mod q = {pre.d}
          <sup>{pre.m - 1}</sup> mod {pre.q}
        </>
      ),
    },
    { name: "p", value: pre.p, meaning: "hash of the pattern" },
  ]
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {values.map((v) => (
          <div key={v.name} className="rounded-lg border p-3">
            <p className="font-mono text-xs text-muted-foreground">{v.name}</p>
            <p className="text-2xl font-semibold tabular-nums">{v.value}</p>
            <p className="text-xs text-muted-foreground">{v.meaning}</p>
          </div>
        ))}
      </div>
      <Note>
        Each window of the text gets a hash t. Only when <Code>t = p</Code> are the characters compared.
        Sliding one step uses the rolling hash, so each new hash costs O(1):
      </Note>
      <pre className="w-fit rounded-lg bg-muted px-3 py-2 font-mono text-xs">
        t′ = (d·(t − T[s]·h) + T[s+m]) mod q
      </pre>
    </div>
  )
}

/** δ(state, char). Forward transitions (to state q+1) are highlighted; they follow the pattern. */
function TransitionTable({ pre }: { pre: Preprocessing }) {
  const alphabet = pre.alphabet ?? []
  const delta = pre.delta ?? []
  return (
    <div className="flex flex-col gap-4">
      <Table className="font-mono text-xs">
        <TableHeader>
          <TableRow>
            <TableHead className="font-sans">state q</TableHead>
            <TableHead className="font-sans">matched</TableHead>
            {alphabet.map((a) => (
              <TableHead key={a} className="text-center">
                {a === "other" ? <span className="font-sans italic">other</span> : show(a)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {delta.map((row, q) => (
            <TableRow key={q} className={cn(q === pre.m && "bg-muted/60")}>
              <TableCell className="font-semibold">
                {q}
                {q === pre.m && <Badge className="ml-2 font-sans">match</Badge>}
              </TableCell>
              <TableCell className="text-muted-foreground">{show(pre.pattern.slice(0, q)) || "ε"}</TableCell>
              {row.map((next, c) => (
                <TableCell
                  key={c}
                  className={cn("text-center", next === q + 1 ? "font-bold" : next === 0 && "text-muted-foreground")}
                >
                  {next === q + 1 ? <span className="rounded bg-yellow-200 px-1.5 py-0.5 dark:bg-yellow-500/40">{next}</span> : next}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Note>
        Row q, column a gives δ(q, a), the next state after reading a. Highlighted cells move forward along the
        pattern. Every other cell is a fallback to the longest prefix that is still matched. Characters not
        in the pattern go to <Code>other</Code>, which always leads to 0.
      </Note>
    </div>
  )
}

/** The pattern with π[q] under each character. */
function PrefixTable({ pre }: { pre: Preprocessing }) {
  const pi = pre.pi ?? []
  const rows = [
    { label: "q", cells: pi.map((_, q) => q), muted: true },
    { label: "P[q]", cells: [...pre.pattern].map(show), muted: false },
    { label: "π[q]", cells: pi, muted: false },
  ]
  return (
    <div className="flex flex-col gap-4">
      <Table className="font-mono text-xs">
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.label}>
              <TableHead className="w-14 font-sans">{row.label}</TableHead>
              {row.cells.map((cell, q) => (
                <TableCell
                  key={q}
                  className={cn(
                    "text-center",
                    row.muted && "text-muted-foreground",
                    row.label === "π[q]" && pi[q] > 0 && "font-bold"
                  )}
                >
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Note>
        π[q] is the length of the longest proper prefix of <Code>P[0..q]</Code> that is also a suffix of it.
        After a mismatch with q characters matched, KMP continues from π[q−1] matched characters instead of
        starting over, so the text pointer never moves back.
      </Note>
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">{children}</code>
}

/** Makes spaces visible in tables: "a b" -> "a␣b". */
function show(text: string): string {
  return text.replaceAll(" ", "␣")
}
