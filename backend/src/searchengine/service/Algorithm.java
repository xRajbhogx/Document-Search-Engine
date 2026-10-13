package searchengine.service;

import searchengine.algorithms.FiniteAutomatonMatcher;
import searchengine.algorithms.KMPMatcher;
import searchengine.algorithms.NaiveMatcher;
import searchengine.algorithms.RabinKarpMatcher;
import searchengine.algorithms.StringMatcher;

/** The four algorithms the API accepts (the "algo" parameter), with their matcher and a short summary. */
public enum Algorithm {

    NAIVE(new NaiveMatcher(),
            "Preprocessing: none. Matching: O((n−m+1)·m)",
            "Tries every shift s of the pattern over the text and compares character by character "
                    + "until a mismatch. No preprocessing, but it may re-check the same text characters many times."),

    RABIN_KARP(new RabinKarpMatcher(),
            "Preprocessing: O(m). Matching: average O(n+m), worst O((n−m+1)·m)",
            "Treats each window of m characters as a number in base d, modulo a prime q. "
                    + "It compares the window hash with the pattern hash p and checks characters only on a hash hit. "
                    + "The window hash is updated in O(1) as it slides (rolling hash)."),

    FINITE_AUTOMATON(new FiniteAutomatonMatcher(),
            "Preprocessing: O(m³·|Σ|). Matching: O(n)",
            "Builds a state machine with states 0..m. State q means the last q text characters match the "
                    + "first q pattern characters. The table δ(q, a) gives the next state, so every text "
                    + "character is read exactly once. Reaching state m means a match."),

    KMP(new KMPMatcher(),
            "Preprocessing: O(m). Matching: O(n)",
            "Computes the prefix function π: π[q] is the length of the longest proper prefix of P[0..q] "
                    + "that is also a suffix of it. On a mismatch, π says how far the pattern can shift, "
                    + "so the text pointer never moves back.");

    public final StringMatcher matcher;
    public final String complexity;
    public final String description;

    Algorithm(StringMatcher matcher, String complexity, String description) {
        this.matcher = matcher;
        this.complexity = complexity;
        this.description = description;
    }

    /** Parses the "algo" parameter, e.g. "KMP" or "rabin_karp". */
    public static Algorithm parse(String value) {
        if (value == null) {
            throw new IllegalArgumentException("Missing parameter: algo");
        }
        try {
            return valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown algorithm: " + value);
        }
    }
}
