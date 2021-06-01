export class ErrorWithExtras extends Error {
  constructor(message?: string, extras?: Record<string, unknown>) {
    super(message);

    // top-level properties will be added when sending to Sentry
    Object.entries(extras ?? {}).forEach(([key, value]) => (this[key] = value));
  }
}

/**
 * Use this class if you don't want to send your error to
 * Sentry but remain the flow of throwing uncatched errors
 * in your code.
 */
export class SilentError extends ErrorWithExtras {
  public readonly __isSilent = true;
}
