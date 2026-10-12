// Small wrappers around fetch() for each backend route.
// "/api" is forwarded to the Java server by the Vite dev server.

import type {
  Algorithm,
  CompareRow,
  DocumentInfo,
  Explanation,
  SearchResponse,
} from "./types"

const OFFLINE = "Can't reach the server. Is the backend running on port 8080?"

/** Fetches a URL and parses JSON. A non-2xx answer throws the backend's {"error"} message. */
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init).catch(() => null)
  if (!res?.ok) {
    // The backend always sends {"error": "..."}. No JSON means the proxy couldn't reach it.
    const body = await res?.json().catch(() => null)
    throw new Error(body?.error ?? OFFLINE)
  }
  return (res.status === 204 ? undefined : await res.json()) as T
}

function query(params: Record<string, string | boolean>): string {
  return new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ).toString()
}

export function listDocuments() {
  return request<DocumentInfo[]>("/api/documents")
}

export function uploadDocument(name: string, text: string) {
  return request<DocumentInfo>(`/api/documents?${query({ name })}`, {
    method: "POST",
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    body: text,
  })
}

export function deleteDocument(id: string) {
  return request<void>(`/api/documents/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
}

export function search(q: string, algo: Algorithm, caseSensitive: boolean) {
  return request<SearchResponse>(`/api/search?${query({ q, algo, caseSensitive })}`)
}

export function compare(q: string, caseSensitive: boolean) {
  return request<CompareRow[]>(`/api/compare?${query({ q, caseSensitive })}`)
}

export function explain(q: string, algo: Algorithm) {
  return request<Explanation>(`/api/explain?${query({ q, algo })}`)
}
