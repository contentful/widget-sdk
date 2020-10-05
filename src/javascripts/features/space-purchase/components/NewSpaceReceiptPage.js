import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import {
  DisplayText,
  Button,
  Paragraph,
  Notification,
} from '@contentful/forma-36-react-components';
import { Flex } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';

import { go } from 'states/Navigator';
import { makeNewSpace, createTemplate } from '../utils/spaceCreation';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import { useAsyncFn } from 'core/hooks/useAsync';

import { PaymentSummary } from './PaymentSummary';

const styles = {
  grid: css({
    maxWidth: '470px',
    margin: `${tokens.spacing2Xl} auto 0`,
  }),
  sectionHeading: css({
    fontWeight: tokens.fontWeightMedium,
    marginBottom: tokens.spacingXs,
  }),
  successMsg: css({
    marginBottom: tokens.spacingXl,
  }),
  button: css({
    marginBottom: tokens.spacing2Xl,
  }),
};

const fetchSpace = (organizationId, sessionMetadata, selectedPlan, spaceName) => async () => {
  try {
    const newSpace = await makeNewSpace(organizationId, selectedPlan, spaceName);
    trackEvent(EVENTS.SPACE_CREATED, sessionMetadata, {
      selectedPlan,
    });
    return newSpace;
  } catch (error) {
    trackEvent(EVENTS.ERROR, sessionMetadata, {
      location: 'NewSpaceReceiptPage',
      error,
    });
    Notification.error('Space could not be created, please try again.');
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
      location: 'NewSpaceReceiptPage',
      error,
    });
    Notification.warning(
      'Something happened while creating the template. You can still use your space, but some content from the template may be missing.'
    );
  }
};

export const NewSpaceReceiptPage = ({
  spaceName,
  selectedPlan,
  sessionMetadata,
  organizationId,
  selectedTemplate,
}) => {
  const [{ isLoading: isCreatingSpace, data: newSpace }, runSpaceCreation] = useAsyncFn(
    useCallback(fetchSpace(organizationId, sessionMetadata, selectedPlan, spaceName), [])
  );

  const [{ isLoading: isCreatingTemplate }, runTemplateCreation] = useAsyncFn(
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

  useEffect(() => {
    const eventHandler = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    // We want to ensure that users don't click away if their space is not yet created
    // or if the template is actively being created
    if (!newSpace || isCreatingTemplate) {
      window.addEventListener('beforeunload', eventHandler);
    }

    return () => {
      window.removeEventListener('beforeunload', eventHandler);
    };
  }, [newSpace, isCreatingTemplate]);

  const goToCreatedSpace = async () => {
    await go({
      path: ['spaces', 'detail'],
      params: { spaceId: newSpace.sys.id },
    });
  };

  // Button should be disabled during loading && if creating the new space failed
  const isButtonDisabled = isCreatingSpace || isCreatingTemplate || !newSpace;

  return (
    <section
      aria-labelledby="new-space-receipt-section-heading"
      data-test-id="new-space-receipt-section">
      <Flex className={styles.grid} flexDirection="column" alignItems="center">
        <DisplayText
          id="new-space-receipt-section-heading"
          element="h2"
          testId="new-space-receipt-section-heading"
          className={styles.sectionHeading}>
          Nice one!{' '}
          <span role="img" aria-label="Shopping bag">
            🛍
          </span>
        </DisplayText>
        <Paragraph className={styles.successMsg} testId="new-space-receipt-success">
          You successfully purchased the {selectedPlan.name} space {spaceName}.
        </Paragraph>
        <Button
          testId="receipt-page.redirect-to-new-space"
          loading={isCreatingSpace || isCreatingTemplate}
          disabled={isButtonDisabled}
          onClick={goToCreatedSpace}
          className={styles.button}>
          Take me to {spaceName}
        </Button>
        <PaymentSummary selectedPlan={selectedPlan} isReceipt />
      </Flex>
    </section>
  );
};

NewSpaceReceiptPage.propTypes = {
  spaceName: PropTypes.string.isRequired,
  selectedPlan: PropTypes.object.isRequired,
  selectedTemplate: PropTypes.object,
  organizationId: PropTypes.string.isRequired,
  sessionMetadata: PropTypes.object.isRequired,
};
