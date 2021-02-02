import { useCallback, useEffect } from 'react';

import { applyTemplateToSpace } from '../utils/spaceCreation';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import { useAsyncFn } from 'core/hooks/useAsync';

import { useSessionMetadata } from './useSessionMetadata';

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

    throw error;
  }
};

export function useTemplateCreation(newSpace, selectedTemplate) {
  const sessionMetadata = useSessionMetadata();

  const [
    { isLoading: isCreatingTemplate, error: templateCreationError },
    runTemplateCreation,
  ] = useAsyncFn(useCallback(addTemplate(newSpace, selectedTemplate, sessionMetadata), [newSpace]));

  useEffect(() => {
    if (newSpace && selectedTemplate) {
      runTemplateCreation();
    }
  }, [newSpace, selectedTemplate, runTemplateCreation]);

  return {
    isCreatingTemplate,
    templateCreationError,
  };
}
