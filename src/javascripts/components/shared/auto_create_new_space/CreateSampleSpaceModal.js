import React, { useEffect, useState } from 'react';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import { Modal } from '@contentful/forma-36-react-components';
import { getTemplatesList } from 'services/SpaceTemplateLoader';
import * as logger from 'services/logger';
import ProgressScreen from 'app/SpaceWizards/shared/ProgressScreen';
import { createSpaceWithTemplate, FREE_SPACE_IDENTIFIER } from 'app/SpaceWizards/shared/utils';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { getSpaceProductRatePlans } from 'features/pricing-entities';

const styles = {
  modal: css({
    maxHeight: 'none',
  }),
};

export function CreateSampleSpaceModal({ isShown, onClose, organization, onFail, onSuccess }) {
  const [isCreatingSpace, setIsCreatingSpace] = useState(true);
  const TEMPLATE_NAME = 'the example app';

  useEffect(() => {
    async function setupSpace() {
      const startingMoment = Date.now();

      try {
        const organizationEndpoint = createOrganizationEndpoint(organization.sys.id);
        const [plans, template] = await Promise.all([
          getSpaceProductRatePlans(organizationEndpoint),
          loadExampleAppTemplate(),
        ]);
        const freeSpaceRatePlan = plans.find(
          (plan) => plan.productPlanType === FREE_SPACE_IDENTIFIER
        );
        const newSpace = await createSpaceWithTemplate({
          name: 'The example project',
          template,
          organizationId: organization.sys.id,
          plan: freeSpaceRatePlan,
          onTemplateCreationStarted: () => setIsCreatingSpace(true),
        });
        onSuccess(newSpace);
      } catch (err) {
        logger.captureError(err, {
          // which template we were trying to create
          template: TEMPLATE_NAME,
          // how long did it take to end up here
          runningTime: Date.now() - startingMoment,
        });
        onFail(err);
      } finally {
        setIsCreatingSpace(false);
      }
    }

    setupSpace();
  }, [organization, onFail, onSuccess]);

  async function loadExampleAppTemplate(name) {
    const templates = await getTemplatesList();
    const template = templates?.find((t) => t.name.toLowerCase() === TEMPLATE_NAME.toLowerCase());

    if (!template) {
      throw new Error(`Template named ${name} not found`);
    }

    return template;
  }

  return (
    <Modal
      isShown={isShown}
      onClose={onClose}
      size="large"
      position="top"
      shouldCloseOnEscapePress={false}
      shouldCloseOnOverlayClick={false}
      testId="create-sample-space-modal"
      className={styles.modal}>
      <ProgressScreen onConfirm={onClose} done={!isCreatingSpace} />
    </Modal>
  );
}

CreateSampleSpaceModal.propTypes = {
  organization: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  isShown: PropTypes.bool.isRequired,
  onFail: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};
