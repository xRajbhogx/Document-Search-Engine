package searchengine.algorithms;

/**
 * Common interface for all string matching algorithms.
 * T is the text (length n), P is the pattern (length m).
 * An empty pattern, or one longer than the text, gives no matches.
 */
public interface StringMatcher {
    MatchResult search(String T, String P);
}
