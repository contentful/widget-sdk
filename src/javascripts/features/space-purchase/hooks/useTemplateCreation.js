import { useCallback, useEffect } from 'react';

import { applyTemplateToSpace } from '../utils/spaceCreation';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import { useAsyncFn } from 'core/hooks/useAsync';

import { useSessionMetadata } from './useSessionMetadata';

export const TEMPLATE_CREATION_ERROR = 'TemplateCreationError';

class TemplateCreationError extends Error {
  constructor(...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TemplateCreationError);
    }

    this.name = TEMPLATE_CREATION_ERROR;
  }
}

const addTemplate = (newSpace, selectedTemplate, sessionMetadata) => async () => {
  try {
    await applyTemplateToSpace(newSpace, selectedTemplate);

    trackEvent(EVENTS.SPACE_TEMPLATE_CREATED, sessionMetadata, {
      selectedTemplate,
    });
  } catch (error) {
    trackEvent(EVENTS.ERROR, sessionMetadata, {
      errorType: 'CreateTemplateError',
      error,
    });

    throw new TemplateCreationError(error);
  }
};

export function useTemplateCreation(newSpace, selectedTemplate) {
  const sessionMetadata = useSessionMetadata();

  const [{ isLoading: isCreatingTemplate, error }, runTemplateCreation] = useAsyncFn(
    useCallback(addTemplate(newSpace, selectedTemplate, sessionMetadata), [newSpace])
  );

  useEffect(() => {
    if (newSpace && selectedTemplate) {
      runTemplateCreation();
    }
  }, [newSpace, selectedTemplate, runTemplateCreation]);

  return {
    isCreatingTemplate,
    error,
  };
}
