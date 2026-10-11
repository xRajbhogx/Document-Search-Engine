package searchengine.algorithms;

import java.util.ArrayList;
import java.util.List;

/**
 * Rabin-Karp string matching.
 *
 * Idea: treat each m-character window as a number in base d and keep it
 * modulo a prime q. Compare the hash of the pattern with the hash of each
 * window first; only when the hashes are equal (a "hit") do we check the
 * characters, because different strings can share a hash (a spurious hit).
 * The window hash is updated in O(1) as it slides (rolling hash).
 *
 * Preprocessing: O(m).  Matching: average O(n + m), worst O((n - m + 1) * m).
 */
public class RabinKarpMatcher implements StringMatcher {

    public static final int d = 256;   // radix (size of the alphabet)
    public static final int q = 101;   // a prime modulus

    /** h = d^(m-1) mod q, the weight of the leading character of a window. */
    public static long computeH(int m) {
        long h = 1;
        for (int i = 0; i < m - 1; i++) {
            h = (h * d) % q;
        }
        return h;
    }

    /** Hash of the first len characters of S, using Horner's rule. */
    public static long hash(String S, int len) {
        long value = 0;
        for (int i = 0; i < len; i++) {
            value = (d * value + S.charAt(i)) % q;
        }
        return value;
    }

    /** p = hash of the whole pattern. */
    public static long patternHash(String P) {
        return hash(P, P.length());
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

        // Preprocessing: h, the pattern hash p, and the hash t of the first window
        long h = computeH(m);
        long p = patternHash(P);
        long t = hash(T, m);

        for (int s = 0; s <= n - m; s++) {
            // Hash hit: verify character by character (only these are counted)
            if (p == t) {
                int j = 0;
                while (j < m) {
                    comparisons++;
                    if (P.charAt(j) != T.charAt(s + j)) {
                        break;
                    }
                    j++;
                }
                if (j == m) {
                    positions.add(s);
                }
            }
            // Rolling hash: drop T[s], add T[s + m]
            if (s < n - m) {
                t = (d * (t - T.charAt(s) * h) + T.charAt(s + m)) % q;
                if (t < 0) {
                    t += q;   // keep the hash non-negative
                }
            }
        }
        return new MatchResult(positions, comparisons);
    }
}
