package searchengine.algorithms;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Finite Automaton string matching.
 *
 * Idea: build an automaton with states 0..m, where state q means "the last
 * q text characters read match the first q pattern characters". The
 * transition table δ(q, a) gives the next state after reading character a.
 * Reaching state m means a match. Each text character is read exactly once.
 *
 * Alphabet Σ = the distinct characters of the pattern, plus one "other"
 * column for every character not in the pattern (it always leads to state 0).
 *
 * Preprocessing: O(m³ · |Σ|).  Matching: O(n).
 */
public class FiniteAutomatonMatcher implements StringMatcher {

    /** Σ: distinct pattern characters in order of first appearance. */
    public static char[] alphabet(String P) {
        StringBuilder sigma = new StringBuilder();
        for (char c : P.toCharArray()) {
            if (sigma.indexOf(String.valueOf(c)) < 0) {
                sigma.append(c);
            }
        }
        return sigma.toString().toCharArray();
    }

    /**
     * CLRS COMPUTE-TRANSITION-FUNCTION.
     * Returns δ with m + 1 rows (states) and |Σ| + 1 columns (last = "other").
     */
    public static int[][] computeTransitionFunction(String P, char[] sigma) {
        int m = P.length();
        int[][] delta = new int[m + 1][sigma.length + 1];   // "other" column stays 0
        for (int q = 0; q <= m; q++) {
            for (int c = 0; c < sigma.length; c++) {
                char a = sigma[c];
                // Largest k such that P[0..k) is a suffix of P[0..q) + a
                int k = Math.min(m + 1, q + 2);
                do {
                    k--;
                } while (!isSuffix(P, k, q, a));
                delta[q][c] = k;
            }
        }
        return delta;
    }

    /** Is P_k (first k chars of P) a suffix of P_q a (first q chars of P, then a)? */
    private static boolean isSuffix(String P, int k, int q, char a) {
        if (k == 0) {
            return true;
        }
        if (P.charAt(k - 1) != a) {
            return false;
        }
        // Compare P[0..k-1) with the last k-1 chars of P_q
        for (int i = 0; i < k - 1; i++) {
            if (P.charAt(i) != P.charAt(q - (k - 1) + i)) {
                return false;
            }
        }
        return true;
    }

    @Override
    public MatchResult search(String T, String P) {
        int n = T.length();
        int m = P.length();
        List<Integer> positions = new ArrayList<>();
        long comparisons = 0;
        if (m == 0 || m > n) {
            return new MatchResult(positions, 0);
        }

        // Preprocessing: build δ and a lookup from character to column
        char[] sigma = alphabet(P);
        int[][] delta = computeTransitionFunction(P, sigma);
        int other = sigma.length;
        Map<Character, Integer> column = new HashMap<>();
        for (int c = 0; c < sigma.length; c++) {
            column.put(sigma[c], c);
        }

        // Matching: read each text character once and follow δ
        int q = 0;
        for (int i = 0; i < n; i++) {
            comparisons++;   // one table lookup per text character
            q = delta[q][column.getOrDefault(T.charAt(i), other)];
            if (q == m) {
                positions.add(i - m + 1);
            }
        }
        return new MatchResult(positions, comparisons);
    }
}
