import { useCallback, useEffect } from 'react';

import { go } from 'states/Navigator';
import { makeNewSpace, createTemplate } from '../utils/spaceCreation';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import { useAsyncFn } from 'core/hooks/useAsync';

const fetchSpace = (organizationId, sessionMetadata, selectedPlan, spaceName) => async () => {
  try {
    const newSpace = await makeNewSpace(organizationId, selectedPlan, spaceName);

    trackEvent(EVENTS.SPACE_CREATED, sessionMetadata, {
      selectedPlan,
    });

    return newSpace;
  } catch (error) {
    trackEvent(EVENTS.ERROR, sessionMetadata, {
      errorType: 'CreateSpaceError',
      error,
    });

    throw error;
  }
};

const fetchTemplate = (newSpace, selectedTemplate, sessionMetadata) => async () => {
  try {
    await createTemplate(newSpace, selectedTemplate);

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

function useCreateSpaceAndTemplate(
  organizationId,
  selectedPlan,
  selectedTemplate,
  sessionMetadata,
  spaceName
) {
  const [
    { isLoading: isCreatingSpace, data: newSpace, error: spaceCreationError },
    runSpaceCreation,
  ] = useAsyncFn(
    useCallback(fetchSpace(organizationId, sessionMetadata, selectedPlan, spaceName), [])
  );

  const [
    { isLoading: isCreatingTemplate, error: templateCreationError },
    runTemplateCreation,
  ] = useAsyncFn(
    useCallback(fetchTemplate(newSpace, selectedTemplate, sessionMetadata), [newSpace])
  );

  useEffect(() => {
    runSpaceCreation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (newSpace && selectedTemplate) {
      runTemplateCreation();
    }
  }, [newSpace, selectedTemplate, runTemplateCreation]);

  const goToCreatedSpace = async () => {
    await go({
      path: ['spaces', 'detail'],
      params: { spaceId: newSpace.sys.id },
    });
  };

  const pending = isCreatingSpace || isCreatingTemplate;
  const buttonAction = spaceCreationError ? runSpaceCreation : goToCreatedSpace;

  return {
    pending,
    buttonAction,
    spaceCreationError,
    templateCreationError,
  };
}

export { useCreateSpaceAndTemplate };
