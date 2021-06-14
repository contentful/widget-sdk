import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import {
  getIncludedResources,
  createSpace,
  createSpaceWithTemplate,
  FREE_SPACE_IDENTIFIER,
} from '../shared/utils';

import TemplateSelector from '../shared/TemplateSelector';
import ProgressScreen from '../shared/ProgressScreen';

import ContactUsButton from 'ui/Components/ContactUsButton';
import POCPlan from './Plan';
import Loader from '../shared/Loader';
import createResourceService from 'services/ResourceService';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { Organization as OrganizationPropType } from 'app/OrganizationSettings/PropTypes';

import { isHighDemandEnterprisePlan } from 'account/pricing/PricingDataProvider';
import { getSpaceProductRatePlans } from 'features/pricing-entities';
import { getTemplatesList } from 'services/SpaceTemplateLoader';

import {
  TextField,
  Modal,
  Form,
  Button,
  Note,
  Typography,
  FormLabel,
  Paragraph,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { useAsyncFn, useAsync } from 'core/hooks/useAsync';
import { Pluralized } from 'core/components/formatting';
import { isOrganizationOnTrial } from 'features/trials';

const styles = {
  controlButtons: css({
    marginTop: tokens.spacingXl,
  }),
  talkToUsButton: css({
    marginRight: tokens.spacingM,
  }),
};

const initialFetch = (organization, basePlan) => async () => {
  const endpoint = createOrganizationEndpoint(organization.sys.id);
  const orgResources = createResourceService(endpoint);
  const [freeSpaceResource, spaceProductRatePlans, templates] = await Promise.all([
    orgResources.get(FREE_SPACE_IDENTIFIER),
    getSpaceProductRatePlans(endpoint),
    getTemplatesList(),
  ]);

  const freeSpaceRatePlan = spaceProductRatePlans.find(
    (plan) => plan.productPlanType === FREE_SPACE_IDENTIFIER
  );

  const isHighDemand = isHighDemandEnterprisePlan(basePlan);
  const isEnterpriseTrial = isOrganizationOnTrial(organization);

  return {
    isHighDemand,
    isEnterpriseTrial,
    freeSpaceRatePlan,
    freeSpaceResource,
    templates,
  };
};

const submit = async (
  spaceName,
  selectedTemplate,
  organization,
  freeSpaceRatePlan,
  setShowProgressScreen,
  onClose,
  onProcessing
) => {
  onProcessing(true);

  if (selectedTemplate) {
    await createSpaceWithTemplate({
      name: spaceName,
      plan: freeSpaceRatePlan,
      template: selectedTemplate,
      organizationId: organization.sys.id,
      onTemplateCreationStarted: () => setShowProgressScreen(true),
    });

    onProcessing(false);
  } else {
    await createSpace({
      name: spaceName,
      plan: freeSpaceRatePlan,
      organizationId: organization.sys.id,
    });

    onClose();
  }
};

export default function EnterpriseWizard(props) {
  const [spaceName, setSpaceName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showProgressScreen, setShowProgressScreen] = useState(false);

  const { organization, basePlan, onProcessing, isProcessing, onClose } = props;

  const { isLoading, data = {} } = useAsync(useCallback(initialFetch(organization, basePlan), []));

  const [{ isLoading: isCreatingSpace }, handleSubmit] = useAsyncFn(() =>
    submit(
      spaceName,
      selectedTemplate,
      organization,
      data.freeSpaceRatePlan,
      setShowProgressScreen,
      onClose,
      onProcessing
    )
  );

  if (isLoading) {
    return <Loader />;
  }

  const { isHighDemand, isEnterpriseTrial, freeSpaceResource, freeSpaceRatePlan, templates } = data;

  const includedResources = getIncludedResources(freeSpaceRatePlan.productRatePlanCharges);
  const usage = freeSpaceResource.usage;
  const limit = freeSpaceResource.limits.maximum;
  const reachedLimit = freeSpaceResource.usage >= freeSpaceResource.limits.maximum;
  const isFeatureDisabled = limit === 0;
  const canCreate = !isFeatureDisabled && !reachedLimit;
  const showTrialSpaceInfo = !isHighDemand && !isEnterpriseTrial;

  return (
    <>
      {showProgressScreen && (
        <Modal.Content>
          <ProgressScreen done={!isCreatingSpace} onConfirm={onClose} />
        </Modal.Content>
      )}
      {!showProgressScreen && (
        <>
          <Modal.Header title="Create a space" onClose={isProcessing ? null : onClose} />
          <Modal.Content testId="enterprise-wizard-contents">
            <Typography>
              <Form>
                {!canCreate && !isEnterpriseTrial && (
                  <>
                    {reachedLimit && !isFeatureDisabled && (
                      <Note testId="reached-limit-note">
                        You’ve created <Pluralized text="Trial Space" count={limit} />. Delete an
                        existing one or talk to us if you need more.
                      </Note>
                    )}
                    {isFeatureDisabled && (
                      <Note testId="poc-not-enabled-note">
                        You can’t create Trial Spaces because they’re not a part of your enterprise
                        deal with Contentful. Get in touch with us if you want to create new spaces.
                      </Note>
                    )}
                  </>
                )}
                {canCreate && (
                  <TextField
                    countCharacters
                    required
                    value={spaceName}
                    disabled={isCreatingSpace}
                    testId="space-name"
                    name="spaceName"
                    id="spaceName"
                    labelText="Space name"
                    helpText="Can have up to 30 characters"
                    textInputProps={{
                      maxLength: 30,
                      width: 'large',
                    }}
                    onChange={(e) => setSpaceName(e.target.value)}
                  />
                )}
              </Form>
              <FormLabel htmlFor="spaceType">Space Type</FormLabel>
              {showTrialSpaceInfo && (
                <Paragraph>
                  Use a Trial Space to test out new projects for 30 days, free of charge
                </Paragraph>
              )}
              <POCPlan
                resources={includedResources}
                name={freeSpaceRatePlan.name}
                roleSet={freeSpaceRatePlan.roleSet}
                reachedLimit={reachedLimit}
                usage={usage}
                limit={limit}
                disabled={!canCreate}
                showTrialSpaceInfo={showTrialSpaceInfo}
              />
              {canCreate && (
                <TemplateSelector
                  onSelect={setSelectedTemplate}
                  selectedTemplate={selectedTemplate}
                  templates={templates}
                  formAlign="left"
                />
              )}
              <div className={styles.controlButtons}>
                {!canCreate && (
                  <>
                    <ContactUsButton noIcon onClick={onClose} className={styles.talkToUsButton}>
                      Talk to us
                    </ContactUsButton>
                    <Button testId="close-wizard" buttonType="muted" onClick={onClose}>
                      Close
                    </Button>
                  </>
                )}
                {canCreate && (
                  <Button
                    testId="create-space-button"
                    buttonType="primary"
                    disabled={isCreatingSpace || spaceName === ''}
                    loading={isCreatingSpace}
                    onClick={handleSubmit}>
                    Confirm and create space
                  </Button>
                )}
              </div>
            </Typography>
          </Modal.Content>
        </>
      )}
    </>
  );
}

EnterpriseWizard.propTypes = {
  onClose: PropTypes.func.isRequired,
  onProcessing: PropTypes.func.isRequired,
  basePlan: PropTypes.object.isRequired,
  organization: OrganizationPropType.isRequired,
  isProcessing: PropTypes.bool.isRequired,
};
