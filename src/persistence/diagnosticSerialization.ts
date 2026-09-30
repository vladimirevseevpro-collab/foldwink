export function jsonSafeForDiagnostic(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === "bigint") return `${value.toString()}n`;
  if (typeof value === "number" && !Number.isFinite(value)) return String(value);
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return "[Circular]";
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => jsonSafeForDiagnostic(item, seen));
  if (value instanceof Date) return value.toISOString();
  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return { type: "Blob", mimeType: value.type, size: value.size };
  }
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    result[key] = jsonSafeForDiagnostic((value as Record<string, unknown>)[key], seen);
  }
  return result;
}

export function diagnosticFingerprint(value: unknown): string {
  return JSON.stringify(canonical(value, new Map<object, number>()));
}

function canonical(value: unknown, seen: Map<object, number>): unknown {
  if (value === null) return ["null"];
  if (typeof value === "undefined") return ["undefined"];
  if (typeof value === "string") return ["string", value];
  if (typeof value === "boolean") return ["boolean", value];
  if (typeof value === "number") {
    const encoded = Number.isNaN(value)
      ? "NaN"
      : value === Number.POSITIVE_INFINITY
        ? "+Infinity"
        : value === Number.NEGATIVE_INFINITY
          ? "-Infinity"
          : Object.is(value, -0)
            ? "-0"
            : String(value);
    return ["number", encoded];
  }
  if (typeof value === "bigint") return ["bigint", value.toString()];
  if (typeof value === "symbol") return ["symbol", String(value.description ?? "")];
  if (typeof value === "function") return ["function", value.name];

  const existingId = seen.get(value);
  if (existingId !== undefined) return ["reference", existingId];
  const id = seen.size;
  seen.set(value, id);
  if (Array.isArray(value)) {
    return ["array", id, value.map((item) => canonical(item, seen))];
  }
  if (value instanceof Date) return ["date", id, value.toISOString()];
  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return ["blob", id, value.type, value.size];
  }
  return [
    "object",
    id,
    Object.keys(value)
      .sort()
      .map((key) => [key, canonical((value as Record<string, unknown>)[key], seen)]),
  ];
}
