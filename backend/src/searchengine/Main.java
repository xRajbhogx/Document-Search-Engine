package searchengine;

import java.net.InetSocketAddress;
import java.nio.file.Path;

import com.sun.net.httpserver.HttpServer;

import searchengine.http.Handlers;
import searchengine.service.SearchService;
import searchengine.store.DocumentStore;

/**
 * Starts the HTTP server on port 8080.
 * Documents are read from the "documents" folder (or the folder given as the first argument).
 */
public class Main {

    public static void main(String[] args) throws Exception {
        Path folder = Path.of(args.length > 0 ? args[0] : "documents");
        DocumentStore store = new DocumentStore(folder);
        Handlers handlers = new Handlers(store, new SearchService(store));

        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        server.createContext("/api/documents", handlers::documents);
        server.createContext("/api/search", handlers::search);
        server.createContext("/api/compare", handlers::compare);
        server.createContext("/api/explain", handlers::explain);
        server.start();   // no executor set: requests are handled one at a time

        System.out.println("Documents folder: " + folder.toAbsolutePath());
        System.out.println("Server running on http://localhost:8080");
    }
}
