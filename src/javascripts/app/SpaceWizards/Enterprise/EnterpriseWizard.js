import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
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
import POCInfo from './Info';
import Loader from '../shared/Loader';
import createResourceService from 'services/ResourceService';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { Organization as OrganizationPropType } from 'app/OrganizationSettings/PropTypes';

import {
  getSpaceRatePlans,
  isHighDemandEnterprisePlan,
  isEnterpriseTrialPlan,
} from 'account/pricing/PricingDataProvider';
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

import { useAsyncFn, useAsync } from 'core/hooks/useAsync';
import { getVariation, FLAGS } from 'LaunchDarkly';

const initialFetch = (organization, basePlan) => async () => {
  const endpoint = createOrganizationEndpoint(organization.sys.id);
  const orgResources = createResourceService(organization.sys.id, 'organization');
  const [
    freeSpaceResource,
    spaceRatePlans,
    templates,
    isTrialCommFeatureFlagEnabled,
  ] = await Promise.all([
    orgResources.get(FREE_SPACE_IDENTIFIER),
    getSpaceRatePlans(endpoint),
    getTemplatesList(),
    getVariation(FLAGS.PLATFORM_TRIAL_COMM, {
      organizationId: organization.sys.id,
    }),
  ]);

  const freeSpaceRatePlan = spaceRatePlans.find(
    (plan) => plan.productPlanType === FREE_SPACE_IDENTIFIER
  );

  const isHighDemand = isHighDemandEnterprisePlan(basePlan);
  const isEnterpriseTrial = isEnterpriseTrialPlan(basePlan);

  return {
    isHighDemand,
    isEnterpriseTrial,
    freeSpaceRatePlan,
    freeSpaceResource,
    templates,
    isTrialCommFeatureFlagEnabled,
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

  const {
    isHighDemand,
    isEnterpriseTrial,
    freeSpaceResource,
    freeSpaceRatePlan,
    templates,
    isTrialCommFeatureFlagEnabled,
  } = data;

  const includedResources = getIncludedResources(freeSpaceRatePlan.productRatePlanCharges);
  const usage = freeSpaceResource.usage;
  const limit = freeSpaceResource.limits.maximum;
  const reachedLimit = freeSpaceResource.usage >= freeSpaceResource.limits.maximum;
  const isFeatureDisabled = limit === 0;
  const showForm = !isFeatureDisabled && !reachedLimit;
  const showTrialSpaceInfo = isTrialCommFeatureFlagEnabled && !isHighDemand && !isEnterpriseTrial;

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
              <FormLabel htmlFor="spaceType">Space Type</FormLabel>
              {showTrialSpaceInfo && (
                <Paragraph>
                  Use a Trial Space to test out new projects for 30 days, free of charge
                </Paragraph>
              )}
              {!isTrialCommFeatureFlagEnabled && !isHighDemand && <POCInfo />}
              <POCPlan
                resources={includedResources}
                name={freeSpaceRatePlan.name}
                roleSet={freeSpaceRatePlan.roleSet}
                reachedLimit={reachedLimit}
                usage={usage}
                limit={limit}
                disabled={!showForm}
                showTrialSpaceInfo={showTrialSpaceInfo}
              />
              {showForm && (
                <Form onSubmit={handleSubmit}>
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
                  <TemplateSelector
                    onSelect={setSelectedTemplate}
                    selectedTemplate={selectedTemplate}
                    templates={templates}
                    formAlign="left"
                  />
                </Form>
              )}
              {!showForm && (
                <>
                  {reachedLimit && !isFeatureDisabled && (
                    <Note testId="reached-limit-note">
                      You’ve created {limit}{' '}
                      {isTrialCommFeatureFlagEnabled ? 'Trial Spaces' : 'proof of concept spaces'}.
                      Delete an existing one or talk to us if you need more.
                    </Note>
                  )}
                  {isFeatureDisabled && (
                    <Note testId="poc-not-enabled-note">
                      You can’t create{' '}
                      {isTrialCommFeatureFlagEnabled ? 'Trial Spaces' : 'proof of concept spaces'}{' '}
                      because they’re not a part of your enterprise deal with Contentful. Get in
                      touch with us if you want to create new spaces.
                    </Note>
                  )}
                </>
              )}
            </Typography>
          </Modal.Content>
          {!showForm && (
            <Modal.Controls>
              <ContactUsButton noIcon onClick={onClose}>
                Talk to us
              </ContactUsButton>
              <Button testId="close-wizard" buttonType="muted" onClick={onClose}>
                Close
              </Button>
            </Modal.Controls>
          )}
          {showForm && (
            <Modal.Controls>
              <Button
                testId="create-space-button"
                buttonType="primary"
                disabled={isCreatingSpace || spaceName === ''}
                loading={isCreatingSpace}
                onClick={handleSubmit}>
                Confirm and create space
              </Button>
            </Modal.Controls>
          )}
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
