package searchengine.store;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * Keeps the documents as plain .txt files in one folder.
 * A document's id is its file name without ".txt", e.g. "dna-sample".
 */
public class DocumentStore {

    public record Document(String id, String name, String text) {
    }

    private final Path folder;

    public DocumentStore(Path folder) throws IOException {
        this.folder = folder;
        Files.createDirectories(folder);
    }

    public List<Document> all() throws IOException {
        List<Document> docs = new ArrayList<>();
        try (DirectoryStream<Path> files = Files.newDirectoryStream(folder, "*.txt")) {
            for (Path file : files) {
                docs.add(read(file));
            }
        }
        docs.sort((a, b) -> a.name().compareToIgnoreCase(b.name()));
        return docs;
    }

    /** Saves text under a cleaned-up file name (overwrites a file with the same name). */
    public Document save(String name, String text) throws IOException {
        String fileName = cleanName(name);
        Path file = folder.resolve(fileName);
        Files.writeString(file, text, StandardCharsets.UTF_8);
        return read(file);
    }

    /** One document by id, or null if it does not exist. */
    public Document find(String id) throws IOException {
        if (!isValidId(id)) {
            return null;
        }
        Path file = folder.resolve(id + ".txt");
        return Files.exists(file) ? read(file) : null;
    }

    /** Deletes a document. Returns false if it does not exist. */
    public boolean delete(String id) throws IOException {
        if (!isValidId(id)) {
            return false;
        }
        return Files.deleteIfExists(folder.resolve(id + ".txt"));
    }

    /** Ids may only use these characters, which also blocks paths like "../x". */
    private static boolean isValidId(String id) {
        return id.matches("[A-Za-z0-9._-]+");
    }

    private Document read(Path file) throws IOException {
        String name = file.getFileName().toString();
        String id = name.substring(0, name.length() - ".txt".length());
        return new Document(id, name, Files.readString(file, StandardCharsets.UTF_8));
    }

    /** "My Notes!.txt" becomes "My-Notes.txt": only letters, digits, '.', '_' and '-' are kept. */
    private static String cleanName(String name) {
        String base = name.toLowerCase().endsWith(".txt")
                ? name.substring(0, name.length() - 4)
                : name;
        base = base.trim().replaceAll("\\s+", "-").replaceAll("[^A-Za-z0-9._-]", "");
        base = base.replaceAll("^\\.+", "");   // no hidden files or ".."
        if (base.isEmpty()) {
            throw new IllegalArgumentException("Invalid document name");
        }
        return base + ".txt";
    }
}
