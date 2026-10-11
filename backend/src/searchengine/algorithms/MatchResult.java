package searchengine.algorithms;

import java.util.List;

/**
 * What a matcher returns: every shift s where the pattern occurs (0-based),
 * and how many character comparisons it took to find them.
 */
public record MatchResult(List<Integer> positions, long comparisons) {
}
