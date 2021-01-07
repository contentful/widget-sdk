import type { EntityLink } from './BulkActionService';

export enum BulkActionErrorMessage {
  RateLimitExceededError = 'You have reached the limit for the number of active jobs you can create at this time. Try again in a few minutes.',
  VersionMismatch = 'A newer version of this Content might be available, please refresh.',
  Default = 'Something went wrong.',
}
interface BulkActionError {
  entity: EntityLink;
  error: {
    sys: {
      type: 'Error';
      id: string;
    };
  };
}

interface ErroredEntity extends EntityLink {
  error: {
    message: string;
  };
}

/**
 * @description
 * Converts the incoming BulkActionError[] to the current expected format in the ReferenceTree.
 * Check: findValidationErrorForEntity function in ../ReferencesTree.js
 * */
export function convertBulkActionErrors(errors: BulkActionError[]): ErroredEntity[] {
  return errors.map((item) => ({
    sys: { ...item.entity.sys },
    error: {
      message: BulkActionErrorMessage[item.error.sys.id] || BulkActionErrorMessage.Default,
      ...item.error,
    },
  }));
}
