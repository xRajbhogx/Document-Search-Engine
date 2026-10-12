package searchengine.http;

import java.io.IOException;
import java.io.OutputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.sun.net.httpserver.HttpExchange;

import searchengine.service.Algorithm;
import searchengine.service.SearchService;
import searchengine.store.DocumentStore;
import searchengine.store.DocumentStore.Document;

/**
 * One method per route. Each one reads the request, calls the service,
 * and writes the answer as JSON. Errors become {"error": "..."}.
 */
public class Handlers {

    /** What the API shows for a document (without its text). */
    public record DocumentInfo(String id, String name, int size) {
        static DocumentInfo of(Document doc) {
            return new DocumentInfo(doc.id(), doc.name(), doc.text().length());
        }
    }

    private final DocumentStore store;
    private final SearchService service;

    public Handlers(DocumentStore store, SearchService service) {
        this.store = store;
        this.service = service;
    }

    /** GET /api/documents, POST /api/documents?name=x.txt, DELETE /api/documents/{id} */
    public void documents(HttpExchange ex) throws IOException {
        run(ex, () -> {
            String method = ex.getRequestMethod();
            String path = ex.getRequestURI().getPath();
            String id = path.replaceFirst("^/api/documents/?", "");

            if (method.equals("GET") && id.isEmpty()) {
                List<DocumentInfo> list = store.all().stream().map(DocumentInfo::of).toList();
                sendJson(ex, 200, list);
            } else if (method.equals("POST") && id.isEmpty()) {
                String name = query(ex).get("name");
                if (name == null || name.isBlank()) {
                    throw new IllegalArgumentException("Missing parameter: name");
                }
                String text = new String(ex.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                if (text.isEmpty()) {
                    throw new IllegalArgumentException("The document is empty");
                }
                sendJson(ex, 201, DocumentInfo.of(store.save(name, text)));
            } else if (method.equals("DELETE") && !id.isEmpty()) {
                if (store.delete(id)) {
                    send(ex, 204, null);
                } else {
                    sendJson(ex, 404, Map.of("error", "No document with id " + id));
                }
            } else {
                sendJson(ex, 405, Map.of("error", "Method not allowed"));
            }
        });
    }

    /** GET /api/search?q=&algo=&caseSensitive= */
    public void search(HttpExchange ex) throws IOException {
        run(ex, () -> {
            Map<String, String> params = query(ex);
            sendJson(ex, 200, service.search(params.get("q"), Algorithm.parse(params.get("algo")),
                    caseSensitive(params)));
        });
    }

    /** GET /api/compare?q=&caseSensitive= */
    public void compare(HttpExchange ex) throws IOException {
        run(ex, () -> {
            Map<String, String> params = query(ex);
            sendJson(ex, 200, service.compare(params.get("q"), caseSensitive(params)));
        });
    }

    /** GET /api/explain?q=&algo= */
    public void explain(HttpExchange ex) throws IOException {
        run(ex, () -> {
            Map<String, String> params = query(ex);
            sendJson(ex, 200, service.explain(params.get("q"), Algorithm.parse(params.get("algo"))));
        });
    }

    // ---- helpers ----

    private interface Action {
        void run() throws IOException;
    }

    /** Runs a route and turns exceptions into JSON errors (bad input = 400, anything else = 500). */
    private static void run(HttpExchange ex, Action action) throws IOException {
        try {
            action.run();
        } catch (IllegalArgumentException e) {
            sendJson(ex, 400, Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            sendJson(ex, 500, Map.of("error", "Server error: " + e.getMessage()));
        } finally {
            ex.close();
        }
    }

    /** Parses "?a=1&b=x%20y" into {a=1, b=x y}. */
    private static Map<String, String> query(HttpExchange ex) {
        Map<String, String> params = new HashMap<>();
        String raw = ex.getRequestURI().getRawQuery();
        if (raw == null) {
            return params;
        }
        for (String pair : raw.split("&")) {
            int eq = pair.indexOf('=');
            String key = eq < 0 ? pair : pair.substring(0, eq);
            String value = eq < 0 ? "" : pair.substring(eq + 1);
            params.put(URLDecoder.decode(key, StandardCharsets.UTF_8),
                    URLDecoder.decode(value, StandardCharsets.UTF_8));
        }
        return params;
    }

    /** caseSensitive defaults to false. */
    private static boolean caseSensitive(Map<String, String> params) {
        return Boolean.parseBoolean(params.get("caseSensitive"));
    }

    private static void sendJson(HttpExchange ex, int status, Object body) throws IOException {
        ex.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        send(ex, status, Json.write(body));
    }

    private static void send(HttpExchange ex, int status, String body) throws IOException {
        if (body == null) {
            ex.sendResponseHeaders(status, -1);   // -1 = no body
            return;
        }
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        ex.sendResponseHeaders(status, bytes.length);
        try (OutputStream out = ex.getResponseBody()) {
            out.write(bytes);
        }
    }
}
