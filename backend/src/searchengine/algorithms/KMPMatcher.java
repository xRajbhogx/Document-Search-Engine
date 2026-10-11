package searchengine.algorithms;

import java.util.ArrayList;
import java.util.List;

/**
 * Knuth-Morris-Pratt (KMP) string matching.
 *
 * Idea: when a mismatch happens after q matched characters, we already know
 * those q text characters (they equal P[0..q)). The prefix function π[q-1]
 * tells us the longest proper prefix of P[0..q) that is also a suffix of it,
 * so we can continue from there instead of starting over. The text pointer
 * never moves back.
 *
 * Preprocessing: O(m).  Matching: O(n).
 */
public class KMPMatcher implements StringMatcher {

    /**
     * CLRS COMPUTE-PREFIX-FUNCTION (0-based).
     * pi[i] = length of the longest proper prefix of P[0..i] that is also a suffix of it.
     */
    public static int[] computePrefixFunction(String P) {
        int m = P.length();
        int[] pi = new int[m];
        int k = 0;
        for (int q = 1; q < m; q++) {
            // Fall back until the next character extends the current prefix
            while (k > 0 && P.charAt(k) != P.charAt(q)) {
                k = pi[k - 1];
            }
            if (P.charAt(k) == P.charAt(q)) {
                k++;
            }
            pi[q] = k;
        }
        return pi;
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

        // Preprocessing: the prefix function π
        int[] pi = computePrefixFunction(P);

        // q = number of pattern characters matched so far
        int q = 0;
        for (int i = 0; i < n; i++) {
            // On a mismatch, shift the pattern using π (i never moves back)
            while (q > 0 && P.charAt(q) != T.charAt(i)) {
                comparisons++;   // failed comparison
                q = pi[q - 1];
            }
            comparisons++;       // the final P[q] vs T[i] comparison
            if (P.charAt(q) == T.charAt(i)) {
                q++;   // next character matches
            }
            if (q == m) {
                positions.add(i - m + 1);   // pattern occurs with shift i - m + 1
                q = pi[q - 1];              // look for the next match
            }
        }
        return new MatchResult(positions, comparisons);
    }
}
