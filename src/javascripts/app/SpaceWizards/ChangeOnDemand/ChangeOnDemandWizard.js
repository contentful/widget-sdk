import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import SpacePlanSelector from '../shared/SpacePlanSelector';
import ConfirmScreen from './ConfirmScreen';
import * as PricingService from 'services/PricingService';

import {
  Modal,
  Tabs,
  Tab,
  TabPanel,
  IconButton,
  Notification,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { calculateTotalPrice } from 'account/pricing/PricingDataProvider';
import createResourceService from 'services/ResourceService';
import { getAllPlans, getSpaceProductRatePlans } from 'features/pricing-entities';

import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory';
import { useAsyncFn, useAsync } from 'core/hooks/useAsync';
import {
  changeSpacePlan,
  transformSpaceProductRatePlans,
  goToBillingPage,
  FREE_SPACE_IDENTIFIER,
  WIZARD_INTENT,
  WIZARD_EVENTS,
  trackWizardEvent,
} from '../shared/utils';
import Loader from '../shared/Loader';

const styles = {
  tabsWrapper: css({
    display: 'flex',
    backgroundColor: tokens.colorElementLightest,
  }),
  tabs: css({
    display: 'flex',
    flexDirection: 'row',
    margin: '0 auto',
  }),
  closeButton: css({
    margin: '0 20px 0 -20px',
  }),
};

const initialFetch = (organization, space) => async () => {
  const organizationId = organization.sys.id;
  const orgEndpoint = createOrganizationEndpoint(organizationId);
  const spaceEndpoint = createSpaceEndpoint(space.sys.id);

  const orgResources = createResourceService(orgEndpoint);
  const spaceResourceService = createResourceService(spaceEndpoint);

  const [spaceResources, freeSpaceResource, plans, rawSpaceProductRatePlans, recommendedPlan] =
    await Promise.all([
      spaceResourceService.getAll(),
      orgResources.get(FREE_SPACE_IDENTIFIER),
      getAllPlans(orgEndpoint),
      getSpaceProductRatePlans(orgEndpoint, space.sys.id),
      PricingService.recommendedSpacePlan(organizationId, space.sys.id),
    ]);

  const spaceRatePlans = transformSpaceProductRatePlans({
    organization,
    spaceProductRatePlans: rawSpaceProductRatePlans,
    freeSpaceResource,
  });

  const currentSpaceSubscriptionPlan = plans.find((plan) => plan.gatekeeperKey === space.sys.id);
  const currentSubscriptionPrice = calculateTotalPrice(plans);

  return {
    spaceResources,
    spaceRatePlans,
    recommendedPlan,
    currentSubscriptionPrice,
    currentSpaceSubscriptionPlan,
    freeSpaceResource,
  };
};

const submit = async (space, selectedPlan, sessionId, onProcessing, onClose) => {
  onProcessing(true);

  trackWizardEvent(WIZARD_INTENT.CHANGE, WIZARD_EVENTS.CONFIRM, sessionId);

  try {
    await changeSpacePlan({ space, plan: selectedPlan, sessionId });
    onClose(selectedPlan);
  } catch {
    Notification.error('Your space plan couldn’t be changed. Try again.');
    return;
  }
};

export default function Wizard(props) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedTab, setSelectedTab] = useState('spacePlanSelector');

  const { organization, space, sessionId, onClose, onProcessing } = props;

  const [{ isLoading: isChangingSpacePlan }, handleSubmit] = useAsyncFn(() =>
    submit(space, selectedPlan, sessionId, onProcessing, onClose)
  );

  const navigate = (newTab) => {
    trackWizardEvent(WIZARD_INTENT.CHANGE, WIZARD_EVENTS.NAVIGATE, sessionId, {
      currentStepId: selectedTab,
      targetStepId: newTab,
    });

    setSelectedTab(newTab);
  };

  const { isLoading, data } = useAsync(useCallback(initialFetch(organization, space), []));

  if (isLoading) {
    return <Loader />;
  }

  return (
    <>
      <Tabs withDivider className={styles.tabsWrapper}>
        <div className={styles.tabs}>
          <Tab
            id="spacePlanSelector"
            testId="space-plan-selector-tab"
            selected={selectedTab === 'spacePlanSelector'}
            onSelect={() => navigate('spacePlanSelector')}>
            1. Space type
          </Tab>
          <Tab
            id="confirmation"
            selected={selectedTab === 'confirmation'}
            testId="confirmation-tab"
            onSelect={() => navigate('confirmation')}
            disabled={!selectedPlan}>
            2. Confirmation
          </Tab>
        </div>
        {!isChangingSpacePlan && (
          <IconButton
            iconProps={{ icon: 'Close' }}
            label="Close space wizard"
            testId="close-icon"
            buttonType="muted"
            className={styles.closeButton}
            onClick={() => onClose()}
          />
        )}
      </Tabs>
      <Modal.Content testId="change-on-demand-wizard-contents">
        {selectedTab === 'spacePlanSelector' && (
          <TabPanel id="spacePlanSelector">
            <SpacePlanSelector
              organization={organization}
              space={space}
              spaceRatePlans={data.spaceRatePlans}
              freeSpacesResource={data.freeSpaceResource}
              selectedPlan={selectedPlan}
              onSelectPlan={(plan) => {
                trackWizardEvent(WIZARD_INTENT.CHANGE, WIZARD_EVENTS.SELECT_PLAN, sessionId, {
                  selectedPlan: plan,

                  // TODO: get rid of this here and in the tracking
                  currentPlan: null,
                  recommendedPlan: data.recommendedPlan,
                });

                setSelectedPlan(plan);
                navigate('confirmation');
              }}
              goToBillingPage={() =>
                goToBillingPage(organization, WIZARD_INTENT.CHANGE, sessionId, onClose)
              }
              spaceResources={data.spaceResources}
              recommendedPlan={data.recommendedPlan}
              isChanging
            />
          </TabPanel>
        )}
        {selectedTab === 'confirmation' && (
          <TabPanel id="confirmation">
            <ConfirmScreen
              selectedPlan={selectedPlan}
              currentSpaceSubscriptionPlan={data.currentSpaceSubscriptionPlan}
              currentSubscriptionPrice={data.currentSubscriptionPrice}
              changing={isChangingSpacePlan}
              onConfirm={handleSubmit}
              organization={organization}
              space={space}
            />
          </TabPanel>
        )}
      </Modal.Content>
    </>
  );
}

Wizard.propTypes = {
  organization: PropTypes.object.isRequired,
  space: PropTypes.object.isRequired,
  sessionId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onProcessing: PropTypes.func.isRequired,
};
