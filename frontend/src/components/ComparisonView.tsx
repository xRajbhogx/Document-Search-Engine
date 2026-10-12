import { CircleCheck, TriangleAlert } from "lucide-react"
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { algorithmLabel, type CompareRow } from "@/lib/types"

interface Props {
  rows: CompareRow[] | null
  query: string // the pattern that produced `rows`
  loading: boolean
}

/** All four algorithms on the same search: a table, then one bar chart per measure. */
export function ComparisonView({ rows, query, loading }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    )
  }

  if (!rows) {
    return (
      <p className="rounded-xl border border-dashed px-6 py-16 text-center text-sm text-muted-foreground">
        Run a search to compare all four algorithms on it.
      </p>
    )
  }

  const fewest = Math.min(...rows.map((r) => r.comparisons))
  const fastest = Math.min(...rows.map((r) => r.timeMs))
  const allAgree = rows.every((r) => r.totalMatches === rows[0].totalMatches)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            All algorithms on <code className="rounded bg-muted px-1.5 py-0.5 text-sm">{query}</code>
          </CardTitle>
          <CardDescription className="flex items-center gap-1.5">
            {allAgree ? (
              <>
                <CircleCheck className="size-4 text-green-600" />
                All four found the same {rows[0].totalMatches.toLocaleString()} matches.
              </>
            ) : (
              <>
                <TriangleAlert className="size-4 text-destructive" />
                The algorithms disagree on the number of matches.
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Algorithm</TableHead>
                <TableHead className="text-right">Comparisons</TableHead>
                <TableHead className="text-right">Time (ms)</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Matches</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.algorithm}>
                  <TableCell className="font-medium">{algorithmLabel(r.algorithm)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.comparisons === fewest && <Badge variant="secondary" className="mr-2 hidden sm:inline-flex">fewest</Badge>}
                    {r.comparisons.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.timeMs === fastest && <Badge variant="secondary" className="mr-2 hidden sm:inline-flex">fastest</Badge>}
                    {r.timeMs.toFixed(3)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{r.totalMatches.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <MeasureChart
          title="Character comparisons"
          description="The algorithm's work: same on every run."
          rows={rows}
          measure="comparisons"
          format={(v) => v.toLocaleString()}
        />
        <MeasureChart
          title="Time (ms)"
          description="Depends on the machine: varies between runs."
          rows={rows}
          measure="timeMs"
          format={(v) => v.toFixed(3)}
        />
      </div>

      <Card size="sm">
        <CardContent className="text-sm text-muted-foreground">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="font-medium text-foreground">Finite Automaton</span> always does exactly
              n comparisons (one table lookup per text character).
            </li>
            <li>
              <span className="font-medium text-foreground">Rabin-Karp</span> only counts characters
              checked after a hash hit. Its hashing work isn't a character comparison.
            </li>
            <li>
              <span className="font-medium text-foreground">Naive</span> does far more comparisons than KMP
              on repetitive text. Try <code>aaaaaaaaaab</code>.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

interface ChartProps {
  title: string
  description: string
  rows: CompareRow[]
  measure: "comparisons" | "timeMs"
  format: (value: number) => string
}

/** One horizontal bar per algorithm. The best (lowest) bar is dark, the rest grey. */
function MeasureChart({ title, description, rows, measure, format }: ChartProps) {
  const config = { [measure]: { label: title } } satisfies ChartConfig
  const data = rows.map((r) => ({ name: algorithmLabel(r.algorithm), [measure]: r[measure] }))
  const best = Math.min(...rows.map((r) => r[measure]))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-52 w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={110} />
            <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v: number) => compact(v)} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent formatter={(v) => format(Number(v))} />}
            />
            <Bar dataKey={measure} radius={[0, 4, 4, 0]} maxBarSize={24}>
              {data.map((d) => (
                <Cell
                  key={d.name}
                  fill={d[measure] === best ? "var(--foreground)" : "var(--chart-2)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

/** Axis ticks: 12000 -> "12K". */
function compact(value: number): string {
  return Intl.NumberFormat("en", { notation: "compact" }).format(value)
}
