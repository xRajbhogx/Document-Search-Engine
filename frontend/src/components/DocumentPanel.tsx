import { useCallback, useRef, useState } from "react"
import { FileText, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import { DocumentViewer } from "@/components/DocumentViewer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { deleteDocument, uploadDocument } from "@/lib/api"
import type { DocumentInfo } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Props {
  documents: DocumentInfo[]
  loading: boolean
  onChanged: () => void
}

/** Lists the documents, and lets you open, upload (drop or pick) and delete .txt files. */
export function DocumentPanel({ documents, loading, onChanged }: Props) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [viewing, setViewing] = useState<DocumentInfo | null>(null)
  const closeViewer = useCallback(() => setViewing(null), [])

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return
    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith(".txt")) {
        toast.error(`${file.name}: only .txt files are supported`)
        continue
      }
      try {
        const doc = await uploadDocument(file.name, await file.text())
        toast.success(`Uploaded ${doc.name}`)
      } catch (e) {
        toast.error(`${file.name}: ${(e as Error).message}`)
      }
    }
    onChanged()
  }

  async function remove(doc: DocumentInfo) {
    try {
      await deleteDocument(doc.id)
      toast.success(`Deleted ${doc.name}`)
      onChanged()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>
          {loading ? "Loading…" : `${documents.length} loaded · ${totalChars(documents)} characters`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInput.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && fileInput.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            upload(e.dataTransfer.files)
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground transition-colors hover:bg-muted/50",
            dragging && "border-primary bg-muted"
          )}
        >
          <Upload className="size-5" />
          <span>
            Drop <span className="font-medium text-foreground">.txt</span> files here or click to upload
          </span>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".txt,text/plain"
          multiple
          hidden
          onChange={(e) => {
            upload(e.target.files)
            e.target.value = "" // allow uploading the same file again
          }}
        />

        {loading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No documents yet. Upload a .txt file to start.
          </p>
        ) : (
          // The height cap goes on the viewport, so the list scrolls only when it's long
          <ScrollArea className="[&>[data-slot=scroll-area-viewport]]:max-h-96">
            <ul className="flex flex-col gap-1">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center gap-1 rounded-lg hover:bg-muted/50"
                >
                  <button
                    type="button"
                    onClick={() => setViewing(doc)}
                    title={`Open ${doc.name}`}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.size.toLocaleString()} characters
                      </p>
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${doc.name}`}
                    onClick={() => remove(doc)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
      <DocumentViewer doc={viewing} onClose={closeViewer} />
    </Card>
  )
}

function totalChars(documents: DocumentInfo[]): string {
  return documents.reduce((sum, d) => sum + d.size, 0).toLocaleString()
}
