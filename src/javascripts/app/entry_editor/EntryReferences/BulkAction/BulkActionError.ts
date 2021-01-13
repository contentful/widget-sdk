import type { Link } from '@contentful/types';
import { BulkActionErrorEntry } from '@contentful/errors';

export enum BulkActionErrorMessage {
  Default = 'Could not perform the given action',
  InvalidEntry = 'Some required fields are missing',
  RateLimitExceeded = 'You have reached the limit for the number of active jobs you can create at this time. Try again in a few minutes.',
  VersionMismatch = 'A new version has already been published',
  ValidationFailed = 'Validation Failed in some of the fields in this Content',
}

export interface BulkActionErrorJSON extends Omit<BulkActionErrorEntry, 'error'> {
  error: {
    sys: {
      id: string;
      type: 'Error';
    };
    message?: string;
    details?: object;
  };
}

interface ErroredEntity extends Link {
  error: {
    message?: string;
  };
}

/**
 * @description
 * Converts the incoming BulkActionError[] to the current expected format in the ReferenceTree.
 * Check: findValidationErrorForEntity function in ../ReferencesTree.js
 *
 * Important: if the error already has a `message` property present, this function will still use it.
 * */
export function convertBulkActionErrors(errors: BulkActionErrorJSON[]): ErroredEntity[] {
  return errors.map((item) => ({
    sys: { ...item.entity.sys },
    error: {
      message: BulkActionErrorMessage[item.error.sys.id] || BulkActionErrorMessage.Default,
      ...item.error,
    },
  }));
}
