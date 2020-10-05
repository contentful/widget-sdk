import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import {
  DisplayText,
  Button,
  Paragraph,
  Notification,
  Modal,
} from '@contentful/forma-36-react-components';
import { Flex, ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';

import { go } from 'states/Navigator';
import { makeNewSpace, createTemplate } from '../utils/spaceCreation';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import { useAsyncFn } from 'core/hooks/useAsync';
import { getModule } from 'core/NgRegistry';

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
    let offStateChangeStart;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    // We want to ensure that users don't click away if their space is not yet created
    // or if the template is actively being created
    if (!newSpace || isCreatingTemplate) {
      const $rootScope = getModule('$rootScope');

      // Angular $on functions return a callback that is the event listener
      // remover, rather than $rootScope.$off.
      offStateChangeStart = $rootScope.$on(
        '$stateChangeStart',
        async (event, toState, toParams) => {
          event.preventDefault();

          const confirmed = await ModalLauncher.open(({ isShown, onClose }) => (
            <ConfirmNavigateModal
              isShown={isShown}
              onClose={onClose}
              withTemplate={!!selectedTemplate}
            />
          ));

          if (confirmed) {
            offStateChangeStart();

            go({
              path: toState,
              params: toParams,
            });
          }
        }
      );

      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      offStateChangeStart && offStateChangeStart();
    };
  }, [newSpace, selectedTemplate, isCreatingTemplate]);

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

function ConfirmNavigateModal({ isShown, onClose, withTemplate = false }) {
  return (
    <Modal
      position="center"
      isShown={isShown}
      testId="confirm-navigate-modal"
      title="Are you sure?"
      onClose={() => onClose(false)}>
      {({ title }) => (
        <>
          <Modal.Header title={title} />
          <Modal.Content>
            Are you sure you want to leave this page? Your space may not be created{' '}
            {withTemplate && 'and you may have issues with your template'}.
          </Modal.Content>
          <Modal.Controls>
            <Button
              onClick={() => onClose(true)}
              buttonType="negative"
              testId="confirm-navigate-modal.confirm">
              Confirm
            </Button>
            <Button
              onClick={() => onClose(false)}
              testId="confirm-navigate-modal.cancel"
              buttonType="muted">
              Cancel
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
}

ConfirmNavigateModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  withTemplate: PropTypes.bool,
};
