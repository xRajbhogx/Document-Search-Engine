package searchengine.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import searchengine.algorithms.FiniteAutomatonMatcher;
import searchengine.algorithms.KMPMatcher;
import searchengine.algorithms.MatchResult;
import searchengine.algorithms.RabinKarpMatcher;
import searchengine.store.DocumentStore;
import searchengine.store.DocumentStore.Document;

/**
 * The "search engine" part: runs a matcher over every document,
 * handles case-insensitivity, timing and snippets.
 */
public class SearchService {

    /** Longer patterns are rejected: the finite automaton's O(m³·|Σ|) table would get too slow. */
    public static final int MAX_PATTERN_LENGTH = 100;
    private static final int SNIPPET_CONTEXT = 40;   // characters shown before and after a match
    private static final int MAX_SNIPPETS = 20;      // snippets per document

    public record Snippet(String before, String match, String after) {
    }

    public record DocResult(String docId, String name, int count, List<Integer> positions, List<Snippet> snippets) {
    }

    public record SearchResponse(String algorithm, double timeMs, long comparisons, List<DocResult> results) {
    }

    public record CompareRow(String algorithm, double timeMs, long comparisons, int totalMatches) {
    }

    public record Explanation(String algorithm, String complexity, String description, Map<String, Object> preprocessing) {
    }

    private final DocumentStore store;

    public SearchService(DocumentStore store) {
        this.store = store;
    }

    /** Searches every document with one algorithm. Only documents with at least one match are returned. */
    public SearchResponse search(String q, Algorithm algo, boolean caseSensitive) throws IOException {
        String P = prepare(q, caseSensitive);
        long totalNanos = 0;
        long totalComparisons = 0;
        List<DocResult> results = new ArrayList<>();

        for (Document doc : store.all()) {
            String T = caseSensitive ? doc.text() : lower(doc.text());

            long start = System.nanoTime();
            MatchResult r = algo.matcher.search(T, P);
            totalNanos += System.nanoTime() - start;
            totalComparisons += r.comparisons();

            if (!r.positions().isEmpty()) {
                results.add(new DocResult(doc.id(), doc.name(), r.positions().size(), r.positions(),
                        snippets(doc.text(), r.positions(), P.length())));
            }
        }
        return new SearchResponse(algo.name(), toMs(totalNanos), totalComparisons, results);
    }

    /** Runs all four algorithms on the same search so their cost can be compared. */
    public List<CompareRow> compare(String q, boolean caseSensitive) throws IOException {
        String P = prepare(q, caseSensitive);
        List<String> texts = new ArrayList<>();
        for (Document doc : store.all()) {
            texts.add(caseSensitive ? doc.text() : lower(doc.text()));
        }

        // Warm-up pass: lets the JIT compile every matcher before we time anything
        for (Algorithm algo : Algorithm.values()) {
            for (String T : texts) {
                algo.matcher.search(T, P);
            }
        }

        List<CompareRow> rows = new ArrayList<>();
        for (Algorithm algo : Algorithm.values()) {
            long nanos = 0;
            long comparisons = 0;
            int matches = 0;
            for (String T : texts) {
                long start = System.nanoTime();
                MatchResult r = algo.matcher.search(T, P);
                nanos += System.nanoTime() - start;
                comparisons += r.comparisons();
                matches += r.positions().size();
            }
            rows.add(new CompareRow(algo.name(), toMs(nanos), comparisons, matches));
        }
        return rows;
    }

    /** Describes an algorithm and shows the preprocessing it does for pattern q. */
    public Explanation explain(String q, Algorithm algo) {
        String P = prepare(q, true);
        Map<String, Object> pre = new LinkedHashMap<>();
        pre.put("pattern", P);
        pre.put("m", P.length());

        switch (algo) {
            case NAIVE -> {
                // Naive does no preprocessing
            }
            case RABIN_KARP -> {
                pre.put("d", RabinKarpMatcher.d);
                pre.put("q", RabinKarpMatcher.q);
                pre.put("h", RabinKarpMatcher.computeH(P.length()));
                pre.put("p", RabinKarpMatcher.patternHash(P));
            }
            case FINITE_AUTOMATON -> {
                char[] sigma = FiniteAutomatonMatcher.alphabet(P);
                List<String> columns = new ArrayList<>();
                for (char a : sigma) {
                    columns.add(String.valueOf(a));
                }
                columns.add("other");
                pre.put("alphabet", columns);
                pre.put("delta", FiniteAutomatonMatcher.computeTransitionFunction(P, sigma));
            }
            case KMP -> pre.put("pi", KMPMatcher.computePrefixFunction(P));
        }
        return new Explanation(algo.name(), algo.complexity, algo.description, pre);
    }

    /** Checks the pattern and lowercases it when the search is not case-sensitive. */
    private static String prepare(String q, boolean caseSensitive) {
        if (q == null || q.isEmpty()) {
            throw new IllegalArgumentException("Missing parameter: q");
        }
        if (q.length() > MAX_PATTERN_LENGTH) {
            throw new IllegalArgumentException("Pattern is longer than " + MAX_PATTERN_LENGTH + " characters");
        }
        return caseSensitive ? q : lower(q);
    }

    /** Lowercases char by char, so positions in the result still line up with the original text. */
    private static String lower(String s) {
        char[] chars = s.toCharArray();
        for (int i = 0; i < chars.length; i++) {
            chars[i] = Character.toLowerCase(chars[i]);
        }
        return new String(chars);
    }

    /** Text around the first few matches, taken from the original (not lowercased) text. */
    private static List<Snippet> snippets(String text, List<Integer> positions, int m) {
        List<Snippet> list = new ArrayList<>();
        for (int s : positions.subList(0, Math.min(MAX_SNIPPETS, positions.size()))) {
            int from = Math.max(0, s - SNIPPET_CONTEXT);
            int to = Math.min(text.length(), s + m + SNIPPET_CONTEXT);
            list.add(new Snippet(
                    oneLine(text.substring(from, s)),
                    oneLine(text.substring(s, s + m)),
                    oneLine(text.substring(s + m, to))));
        }
        return list;
    }

    private static String oneLine(String s) {
        return s.replaceAll("\\s", " ");
    }

    private static double toMs(long nanos) {
        return Math.round(nanos / 1_000.0) / 1_000.0;   // milliseconds, 3 decimals
    }
}
