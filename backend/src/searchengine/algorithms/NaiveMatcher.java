package searchengine.algorithms;

import java.util.ArrayList;
import java.util.List;

/**
 * Naive (brute-force) string matching.
 *
 * Idea: try every possible shift s of the pattern over the text, and compare
 * the pattern with the text character by character at that shift.
 *
 * Preprocessing: none.  Matching: O((n - m + 1) * m) in the worst case.
 */
public class NaiveMatcher implements StringMatcher {

    @Override
    public MatchResult search(String T, String P) {
        int n = T.length();
        int m = P.length();
        List<Integer> positions = new ArrayList<>();
        long comparisons = 0;
        if (m == 0 || m > n) {
            return new MatchResult(positions, 0);
        }

        // Try every shift s = 0 .. n - m
        for (int s = 0; s <= n - m; s++) {
            int j = 0;
            // Compare P[j] with T[s + j] until a mismatch or the whole pattern matches
            while (j < m) {
                comparisons++;
                if (P.charAt(j) != T.charAt(s + j)) {
                    break;
                }
                j++;
            }
            if (j == m) {
                positions.add(s);   // valid shift
            }
        }
        return new MatchResult(positions, comparisons);
    }
}
