import { Toaster } from "@/components/ui/sonner"

export default function App() {
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
      <main className="mx-auto max-w-7xl p-6" />
      <Toaster richColors />
    </div>
  )
}
