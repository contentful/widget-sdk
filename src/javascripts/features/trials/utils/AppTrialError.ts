class ExtendableError extends Error {
  constructor(message?) {
    super(message);
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class TrialSpaceServerError extends ExtendableError {}
export class ContentImportError extends ExtendableError {}
export class AppInstallationError extends ExtendableError {}
