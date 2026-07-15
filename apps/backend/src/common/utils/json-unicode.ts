const REPLACEMENT_CHARACTER = '\ufffd';

export function sanitizeUnicodeString(value: string): string {
  let sanitized = '';

  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    const isHighSurrogate = codeUnit >= 0xd800 && codeUnit <= 0xdbff;
    const isLowSurrogate = codeUnit >= 0xdc00 && codeUnit <= 0xdfff;

    if (isHighSurrogate) {
      const nextCodeUnit = value.charCodeAt(index + 1);
      if (nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff) {
        sanitized += value.charAt(index) + value.charAt(index + 1);
        index += 1;
      } else {
        sanitized += REPLACEMENT_CHARACTER;
      }
    } else {
      sanitized += isLowSurrogate ? REPLACEMENT_CHARACTER : value.charAt(index);
    }
  }

  return sanitized;
}

function sanitizeJsonValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return sanitizeUnicodeString(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeJsonValue);
  }

  if (value !== null && typeof value === 'object') {
    return sanitizeJsonRecord(Object.fromEntries(Object.entries(value)));
  }

  return value;
}

export function sanitizeJsonRecord(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [key, sanitizeJsonValue(nestedValue)]),
  );
}
