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

import { getSpaceRatePlans, isHighDemandEnterprisePlan } from 'account/pricing/PricingDataProvider';
import { getTemplatesList } from 'services/SpaceTemplateLoader';

import {
  TextField,
  Modal,
  Form,
  Button,
  Note,
  Typography,
} from '@contentful/forma-36-react-components';

import { useAsyncFn, useAsync } from 'core/hooks/useAsync';

const initialFetch = (organization, basePlan) => async () => {
  const endpoint = createOrganizationEndpoint(organization.sys.id);
  const orgResources = createResourceService(organization.sys.id, 'organization');
  const [freeSpaceResource, spaceRatePlans, templates] = await Promise.all([
    orgResources.get(FREE_SPACE_IDENTIFIER),
    getSpaceRatePlans(endpoint),
    getTemplatesList(),
  ]);

  const freeSpaceRatePlan = spaceRatePlans.find(
    (plan) => plan.productPlanType === FREE_SPACE_IDENTIFIER
  );

  const isHighDemand = isHighDemandEnterprisePlan(basePlan);

  return {
    isHighDemand,
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
  setProcessing
) => {
  setProcessing(true);

  if (selectedTemplate) {
    await createSpaceWithTemplate({
      name: spaceName,
      plan: freeSpaceRatePlan,
      template: selectedTemplate,
      organizationId: organization.sys.id,
      onTemplateCreationStarted: () => setShowProgressScreen(true),
    });

    setProcessing(false);
  } else {
    await createSpace({
      name: spaceName,
      plan: freeSpaceRatePlan,
      organizationId: organization.sys.id,
    });

    onClose();
  }
};

export default function Wizard(props) {
  const [spaceName, setSpaceName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showProgressScreen, setShowProgressScreen] = useState(false);

  const { organization, basePlan, onProcessing, onClose } = props;

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

  const { isHighDemand, freeSpaceResource, freeSpaceRatePlan, templates } = data;

  const includedResources = getIncludedResources(freeSpaceRatePlan.productRatePlanCharges);
  const usage = freeSpaceResource.usage;
  const limit = freeSpaceResource.limits.maximum;
  const reachedLimit = freeSpaceResource.usage >= freeSpaceResource.limits.maximum;
  const isFeatureDisabled = limit === 0;
  const showForm = !isFeatureDisabled && !reachedLimit;

  return (
    <>
      {showProgressScreen && (
        <Modal.Content>
          <ProgressScreen done={!isCreatingSpace} onConfirm={onClose} />
        </Modal.Content>
      )}
      {!showProgressScreen && (
        <>
          <Modal.Header title="Create a space" onClose={onClose} />
          <Modal.Content>
            <Typography>
              {!isHighDemand && <POCInfo />}
              <POCPlan
                resources={includedResources}
                name={freeSpaceRatePlan.name}
                roleSet={freeSpaceRatePlan.roleSet}
                reachedLimit={reachedLimit}
                usage={usage}
                limit={limit}
                disabled={!showForm}
              />
              {showForm && (
                <Form onSubmit={handleSubmit}>
                  <TextField
                    countCharacters
                    required
                    value={spaceName}
                    disabled={isCreatingSpace}
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
                    <Note>
                      You’ve created {limit} proof of concept spaces. Delete an existing one or talk
                      to us if you need more.
                    </Note>
                  )}
                  {isFeatureDisabled && (
                    <Note>
                      You can’t create proof of concept spaces because they’re not a part of your
                      enterprise deal with Contentful. Get in touch with us if you want to create
                      new spaces.
                    </Note>
                  )}
                </>
              )}
            </Typography>
          </Modal.Content>
          {!showForm && (
            <Modal.Controls>
              <ContactUsButton noIcon onClick={() => onClose()}>
                Talk to us
              </ContactUsButton>
              <Button buttonType="muted" onClick={() => onClose()}>
                Close
              </Button>
            </Modal.Controls>
          )}
          {showForm && (
            <Modal.Controls>
              <Button
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

Wizard.propTypes = {
  onClose: PropTypes.func.isRequired,
  onProcessing: PropTypes.func.isRequired,
  basePlan: PropTypes.object.isRequired,
  organization: OrganizationPropType.isRequired,
};
