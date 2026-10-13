import { useEffect, useState } from "react"
import { toast } from "sonner"

import { ComparisonView } from "@/components/ComparisonView"
import { DocumentPanel } from "@/components/DocumentPanel"
import { HowItWorks } from "@/components/HowItWorks"
import { ResultsList } from "@/components/ResultsList"
import { SearchBar } from "@/components/SearchBar"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Toaster } from "@/components/ui/sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import * as api from "@/lib/api"
import { ALGORITHMS, type Algorithm, type CompareRow, type DocumentInfo, type Explanation, type SearchResponse } from "@/lib/types"

/** The search that produced the results on screen. */
interface SearchParams {
  q: string
  algo: Algorithm
  caseSensitive: boolean
}

export default function App() {
  const [documents, setDocuments] = useState<DocumentInfo[]>([])
  const [loadingDocs, setLoadingDocs] = useState(true)

  const [query, setQuery] = useState("")
  const [algo, setAlgo] = useState<Algorithm>("KMP")
  const [caseSensitive, setCaseSensitive] = useState(false)

  const [lastSearch, setLastSearch] = useState<SearchParams | null>(null)
  const [result, setResult] = useState<SearchResponse | null>(null)
  const [comparison, setComparison] = useState<CompareRow[] | null>(null)
  const [explanations, setExplanations] = useState<Explanation[] | null>(null)
  const [searching, setSearching] = useState(false)

  function loadDocuments() {
    return api
      .listDocuments()
      .then(setDocuments)
      .catch((e: Error) => toast.error(e.message, { id: e.message })) // id: same message shows once
      .finally(() => setLoadingDocs(false))
  }

  async function runSearch(params: SearchParams) {
    setSearching(true)
    try {
      // The pattern the matchers really use: lowercased when the search ignores case
      const P = params.caseSensitive ? params.q : params.q.toLowerCase()
      // One click fills every tab: the chosen algorithm's results, all four compared, all four explained
      const [found, compared, explained] = await Promise.all([
        api.search(params.q, params.algo, params.caseSensitive),
        api.compare(params.q, params.caseSensitive),
        Promise.all(ALGORITHMS.map((a) => api.explain(P, a.value))),
      ])
      setResult(found)
      setComparison(compared)
      setExplanations(explained)
      setLastSearch(params)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSearching(false)
    }
  }

  // After an upload or delete: refresh the list, and redo the last search so results stay in sync
  function onDocumentsChanged() {
    loadDocuments()
    if (lastSearch) runSearch(lastSearch)
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold">Document Search Engine</h1>
            <p className="text-sm text-muted-foreground">
              Naive · Rabin-Karp · Finite Automaton · KMP
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[300px_1fr]">
        <aside>
          <DocumentPanel documents={documents} loading={loadingDocs} onChanged={onDocumentsChanged} />
        </aside>

        <section className="flex min-w-0 flex-col gap-6">
          <SearchBar
            query={query}
            algo={algo}
            caseSensitive={caseSensitive}
            loading={searching}
            onQueryChange={setQuery}
            onAlgoChange={setAlgo}
            onCaseSensitiveChange={setCaseSensitive}
            onSearch={() => runSearch({ q: query, algo, caseSensitive })}
          />

          <Tabs defaultValue="results">
            <TabsList>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="compare">Comparison</TabsTrigger>
              <TabsTrigger value="explain">How it works</TabsTrigger>
            </TabsList>
            <TabsContent value="results" className="pt-2">
              <ResultsList result={result} query={lastSearch?.q ?? ""} loading={searching} />
            </TabsContent>
            <TabsContent value="compare" className="pt-2">
              <ComparisonView rows={comparison} query={lastSearch?.q ?? ""} loading={searching} />
            </TabsContent>
            <TabsContent value="explain" className="pt-2">
              <HowItWorks
                // a new search remounts it, so it opens on the algorithm that was just used
                key={JSON.stringify(lastSearch)}
                explanations={explanations}
                initialAlgo={lastSearch?.algo ?? algo}
                loading={searching}
              />
            </TabsContent>
          </Tabs>
        </section>
      </main>

      <Toaster richColors />
    </div>
  )
}
