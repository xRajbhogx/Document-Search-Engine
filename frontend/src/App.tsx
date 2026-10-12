import { useEffect, useState } from "react"
import { toast } from "sonner"

import { DocumentPanel } from "@/components/DocumentPanel"
import { ResultsList } from "@/components/ResultsList"
import { SearchBar } from "@/components/SearchBar"
import { Toaster } from "@/components/ui/sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import * as api from "@/lib/api"
import type { Algorithm, DocumentInfo, SearchResponse } from "@/lib/types"

/** The search that produced the results on screen. */
interface SearchParams {
  q: string
  algo: Algorithm
  caseSensitive: boolean
}

export default function App() {
  // Documents (left sidebar)
  const [documents, setDocuments] = useState<DocumentInfo[]>([])
  const [loadingDocs, setLoadingDocs] = useState(true)

  // Search bar inputs
  const [query, setQuery] = useState("")
  const [algo, setAlgo] = useState<Algorithm>("KMP")
  const [caseSensitive, setCaseSensitive] = useState(false)

  // Results
  const [lastSearch, setLastSearch] = useState<SearchParams | null>(null)
  const [result, setResult] = useState<SearchResponse | null>(null)
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
      setResult(await api.search(params.q, params.algo, params.caseSensitive))
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
        <div className="mx-auto max-w-7xl px-6 py-4">
          <h1 className="text-lg font-semibold">Document Search Engine</h1>
          <p className="text-sm text-muted-foreground">
            Naive · Rabin-Karp · Finite Automaton · KMP
          </p>
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
            </TabsList>
            <TabsContent value="results" className="pt-2">
              <ResultsList result={result} query={lastSearch?.q ?? ""} loading={searching} />
            </TabsContent>
          </Tabs>
        </section>
      </main>

      <Toaster richColors />
    </div>
  )
}
