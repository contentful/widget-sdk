import type { EntityLink } from './BulkActionService';

enum BulkActionErrorMessage {
  VersionMismatch = 'Provided version is not valid.',
  Default = 'Something went wrong.',
}

type BulkActionError = {
  entity: EntityLink;
  error: {
    sys: {
      type: 'Error';
      id: string;
    };
  };
};

interface ErroredEntity extends EntityLink {
  error: {
    message: string;
  };
}

// Converts the bulkActionError to current format of the ReferenceTree
// Check: findValidationErrorForEntity in ../ReferencesTree.js
// We can skip converting after A/B testing
export function convertBulkActionErrors(errors: BulkActionError[]): ErroredEntity[] {
  return errors.map((item) => ({
    sys: { ...item.entity.sys },
    error: {
      message: BulkActionErrorMessage[item.error.sys.id] || BulkActionErrorMessage.Default,
      ...item.error,
    },
  }));
}
