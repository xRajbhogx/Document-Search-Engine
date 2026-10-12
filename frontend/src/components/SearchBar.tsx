import { Loader2, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ALGORITHMS, type Algorithm } from "@/lib/types"

/** Same limit as SearchService.MAX_PATTERN_LENGTH on the backend. */
const MAX_PATTERN_LENGTH = 100

interface Props {
  query: string
  algo: Algorithm
  caseSensitive: boolean
  loading: boolean
  onQueryChange: (q: string) => void
  onAlgoChange: (algo: Algorithm) => void
  onCaseSensitiveChange: (value: boolean) => void
  onSearch: () => void
}

/** Pattern input, algorithm picker and case-sensitive toggle. */
export function SearchBar(props: Props) {
  const { query, algo, caseSensitive, loading } = props

  return (
    <Card>
      <CardContent>
        <form
          className="flex flex-col gap-3 md:flex-row md:items-center"
          onSubmit={(e) => {
            e.preventDefault()
            props.onSearch()
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => props.onQueryChange(e.target.value)}
              placeholder="Search for a pattern, e.g. fox or GATTACA"
              maxLength={MAX_PATTERN_LENGTH}
              className="pl-8"
              aria-label="Pattern"
            />
          </div>

          <Select value={algo} onValueChange={(v) => props.onAlgoChange(v as Algorithm)}>
            <SelectTrigger className="w-full md:w-44" aria-label="Algorithm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALGORITHMS.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="flex items-center gap-2 text-sm whitespace-nowrap">
            <Switch checked={caseSensitive} onCheckedChange={props.onCaseSensitiveChange} />
            Case-sensitive
          </label>

          <Button type="submit" disabled={loading || query.length === 0}>
            {loading ? <Loader2 className="animate-spin" /> : <Search />}
            Search
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
