import { FileText, Search, SearchX, type LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { algorithmLabel, type DocResult, type SearchResponse, type Snippet } from "@/lib/types"

/** How many match positions to list before "+N more". */
const MAX_POSITIONS = 30

interface Props {
  result: SearchResponse | null
  query: string // the pattern that produced `result`
  loading: boolean
}

/** Search summary, then one card per document with its match positions and highlighted snippets. */
export function ResultsList({ result, query, loading }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!result) {
    return (
      <EmptyState
        icon={Search}
        title="Search your documents"
        text="Type a pattern, pick an algorithm and press Search. Every match is listed with its position and surrounding text."
      />
    )
  }

  const totalMatches = result.results.reduce((sum, r) => sum + r.count, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">{totalMatches.toLocaleString()}</span>{" "}
          {totalMatches === 1 ? "match" : "matches"} for{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">{query}</code> in{" "}
          {result.results.length} {result.results.length === 1 ? "document" : "documents"}
        </span>
        <Badge variant="secondary">{algorithmLabel(result.algorithm)}</Badge>
        <Badge variant="outline">{result.timeMs.toFixed(3)} ms</Badge>
        <Badge variant="outline">{result.comparisons.toLocaleString()} comparisons</Badge>
      </div>

      {result.results.length === 0 ? (
        <EmptyState icon={SearchX} title="No matches" text={`"${query}" doesn't occur in any document.`} />
      ) : (
        result.results.map((doc) => <DocumentResult key={doc.docId} doc={doc} />)
      )}
    </div>
  )
}

function DocumentResult({ doc }: { doc: DocResult }) {
  const hidden = doc.positions.length - MAX_POSITIONS

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          {doc.name}
        </CardTitle>
        <CardDescription>
          Positions (shift s): {doc.positions.slice(0, MAX_POSITIONS).join(", ")}
          {hidden > 0 && ` … +${hidden} more`}
        </CardDescription>
        <CardAction>
          <Badge>
            {doc.count} {doc.count === 1 ? "match" : "matches"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y">
          {doc.snippets.map((snippet, i) => (
            <li key={i} className="flex gap-3 py-2 first:pt-0 last:pb-0">
              <span className="w-14 shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums">
                {doc.positions[i]}
              </span>
              <SnippetText snippet={snippet} />
            </li>
          ))}
        </ul>
        {doc.count > doc.snippets.length && (
          <p className="mt-3 text-xs text-muted-foreground">
            Showing the first {doc.snippets.length} of {doc.count} matches.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

/** The text around a match, with the match itself highlighted. */
function SnippetText({ snippet }: { snippet: Snippet }) {
  return (
    <p className="min-w-0 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap">
      <span className="text-muted-foreground">{snippet.before}</span>
      <mark className="rounded-sm bg-yellow-200 px-0.5 font-semibold text-foreground dark:bg-yellow-500/40">
        {snippet.match}
      </mark>
      <span className="text-muted-foreground">{snippet.after}</span>
    </p>
  )
}

function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-16 text-center">
      <Icon className="size-8 text-muted-foreground" />
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
