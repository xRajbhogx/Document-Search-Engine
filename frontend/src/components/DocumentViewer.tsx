import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { getDocument } from "@/lib/api"
import type { DocumentContent, DocumentInfo } from "@/lib/types"

interface Props {
  doc: DocumentInfo | null // the document to show, or null when closed
  onClose: () => void
}

/** Shows the full text of one document in a dialog. */
export function DocumentViewer({ doc, onClose }: Props) {
  const [loaded, setLoaded] = useState<DocumentContent | null>(null)
  const text = doc && loaded?.id === doc.id ? loaded.text : null

  useEffect(() => {
    if (!doc) return
    let cancelled = false
    getDocument(doc.id)
      .then((d) => !cancelled && setLoaded(d))
      .catch((e: Error) => {
        toast.error(e.message)
        onClose()
      })
    return () => {
      cancelled = true
    }
  }, [doc, onClose])

  return (
    <Dialog open={doc !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{doc?.name}</DialogTitle>
          <DialogDescription>
            {doc?.size.toLocaleString()} characters
            {text !== null && ` · ${lineCount(text).toLocaleString()} lines`}
          </DialogDescription>
        </DialogHeader>
        {text === null ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          // Radix wraps the content in a display:table div that grows to fit the longest line; block makes it wrap
          <ScrollArea className="min-w-0 rounded-lg border bg-muted/30 [&>[data-slot=scroll-area-viewport]]:max-h-[60vh] [&>[data-slot=scroll-area-viewport]>div]:block!">
            <pre className="p-4 font-mono text-xs leading-relaxed wrap-anywhere whitespace-pre-wrap">{text}</pre>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}

function lineCount(text: string): number {
  return text.split("\n").length
}
