export type ParsedApiError = Readonly<{
  status: number;
  code?: string;
  rawMessage: string;
  details?: Record<string, unknown>;
}>;

function readMessageField(message: unknown): string | undefined {
  if (typeof message === 'string') {
    return message;
  }
  if (Array.isArray(message)) {
    return message.filter((part): part is string => typeof part === 'string').join(', ');
  }
  return undefined;
}

/** Parse a Nest (or coded) error JSON body into status, optional stable code, and a fallback string. */
export function parseApiErrorResponse(status: number, body: unknown): ParsedApiError {
  if (typeof body === 'object' && body !== null) {
    const record = body as Record<string, unknown>;
    const details =
      typeof record.details === 'object' && record.details !== null
        ? (record.details as Record<string, unknown>)
        : undefined;
    if (typeof record.code === 'string') {
      return { status, code: record.code, rawMessage: record.code, details };
    }
    const nestedMessage = record.message;
    if (typeof nestedMessage === 'object' && nestedMessage !== null && 'code' in nestedMessage) {
      const nestedCode = (nestedMessage as { code: unknown }).code;
      if (typeof nestedCode === 'string') {
        return { status, code: nestedCode, rawMessage: nestedCode, details };
      }
    }
    const message = readMessageField(nestedMessage);
    if (message) {
      return { status, rawMessage: message, details };
    }
    if (typeof record.error === 'string') {
      return { status, rawMessage: record.error, details };
    }
  }

  return { status, rawMessage: `HTTP ${status}` };
}
