package searchengine.http;

import java.lang.reflect.RecordComponent;
import java.util.Collection;
import java.util.Map;

/**
 * A tiny hand-written JSON writer (no libraries).
 * Supports null, strings, numbers, booleans, maps, lists, int arrays and records.
 * A record becomes an object whose keys are its component names.
 */
public final class Json {

    private Json() {
    }

    public static String write(Object value) {
        StringBuilder out = new StringBuilder();
        write(value, out);
        return out.toString();
    }

    private static void write(Object value, StringBuilder out) {
        if (value == null) {
            out.append("null");
        } else if (value instanceof String || value instanceof Character) {
            writeString(value.toString(), out);
        } else if (value instanceof Number || value instanceof Boolean) {
            out.append(value);
        } else if (value instanceof Map<?, ?> map) {
            out.append('{');
            boolean first = true;
            for (Map.Entry<?, ?> e : map.entrySet()) {
                if (!first) out.append(',');
                first = false;
                writeString(e.getKey().toString(), out);
                out.append(':');
                write(e.getValue(), out);
            }
            out.append('}');
        } else if (value instanceof Collection<?> list) {
            out.append('[');
            boolean first = true;
            for (Object item : list) {
                if (!first) out.append(',');
                first = false;
                write(item, out);
            }
            out.append(']');
        } else if (value instanceof int[] array) {
            out.append('[');
            for (int i = 0; i < array.length; i++) {
                if (i > 0) out.append(',');
                out.append(array[i]);
            }
            out.append(']');
        } else if (value instanceof Object[] array) {   // e.g. int[][] is an array of int[]
            write(java.util.Arrays.asList(array), out);
        } else if (value instanceof Record record) {
            writeRecord(record, out);
        } else {
            throw new IllegalArgumentException("Can't write " + value.getClass() + " as JSON");
        }
    }

    private static void writeRecord(Record record, StringBuilder out) {
        out.append('{');
        RecordComponent[] fields = record.getClass().getRecordComponents();
        for (int i = 0; i < fields.length; i++) {
            if (i > 0) out.append(',');
            writeString(fields[i].getName(), out);
            out.append(':');
            try {
                write(fields[i].getAccessor().invoke(record), out);
            } catch (ReflectiveOperationException e) {
                throw new IllegalStateException(e);
            }
        }
        out.append('}');
    }

    /** Writes a quoted string, escaping quotes, backslashes and control characters. */
    private static void writeString(String s, StringBuilder out) {
        out.append('"');
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                case '\n' -> out.append("\\n");
                case '\r' -> out.append("\\r");
                case '\t' -> out.append("\\t");
                default -> {
                    if (c < 0x20) {
                        out.append(String.format("\\u%04x", (int) c));
                    } else {
                        out.append(c);
                    }
                }
            }
        }
        out.append('"');
    }
}
