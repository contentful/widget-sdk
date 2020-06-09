import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import SpacePlanSelector from '../shared/SpacePlanSelector';
import ConfirmScreen from './ConfirmScreen';

import {
  Modal,
  Tabs,
  Tab,
  TabPanel,
  IconButton,
  Notification,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import {
  getSpaceRatePlans,
  getSubscriptionPlans,
  calculateTotalPrice,
} from 'account/pricing/PricingDataProvider';
import createResourceService from 'services/ResourceService';

import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { useAsyncFn, useAsync } from 'core/hooks/useAsync';
import {
  changeSpacePlan,
  transformSpaceRatePlans,
  goToBillingPage,
  FREE_SPACE_IDENTIFIER,
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
  const orgEndpoint = createOrganizationEndpoint(organization.sys.id);
  const orgResources = createResourceService(organization.sys.id, 'organization');
  const spaceResourceService = createResourceService(space.sys.id);

  const [
    spaceResources,
    freeSpaceResource,
    subscriptionPlans,
    rawSpaceRatePlans,
  ] = await Promise.all([
    spaceResourceService.getAll(),
    orgResources.get(FREE_SPACE_IDENTIFIER),
    getSubscriptionPlans(orgEndpoint),
    getSpaceRatePlans(orgEndpoint, space.sys.id),
  ]);

  const spaceRatePlans = transformSpaceRatePlans({
    organization,
    spaceRatePlans: rawSpaceRatePlans,
    freeSpaceResource,
  });

  const currentPlan = spaceRatePlans.find((plan) => plan.current);
  const currentSubscriptionPrice = calculateTotalPrice(subscriptionPlans.items);

  return {
    spaceResources,
    spaceRatePlans,
    currentSubscriptionPrice,
    currentPlan,
    freeSpaceResource,
  };
};

const submit = async (space, selectedPlan, onProcessing, onClose) => {
  onProcessing(true);

  try {
    await changeSpacePlan({ space, plan: selectedPlan });
    onClose(selectedPlan);
  } catch {
    Notification.error('Your space plan couldn’t be changed. Try again.');
    return;
  }
};

export default function Wizard(props) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedTab, setSelectedTab] = useState('spacePlanSelector');

  const { organization, space, onClose, onProcessing } = props;

  const [{ isLoading: isChangingSpacePlan }, handleSubmit] = useAsyncFn(() =>
    submit(space, selectedPlan, onProcessing, onClose)
  );

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
            onSelect={() => setSelectedTab('spacePlanSelector')}>
            1. Space type
          </Tab>
          <Tab
            id="confirmation"
            selected={selectedTab === 'confirmation'}
            testId="confirmation-tab"
            onSelect={() => setSelectedTab('confirmation')}
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
              spaceRatePlans={data.spaceRatePlans}
              freeSpacesResource={data.freeSpaceResource}
              currentPlan={data.currentPlan}
              selectedPlan={selectedPlan}
              onSelectPlan={(plan) => {
                setSelectedPlan(plan);
                setSelectedTab('confirmation');
              }}
              goToBillingPage={() => goToBillingPage(organization, onClose)}
              spaceResources={data.spaceResources}
              isChanging
            />
          </TabPanel>
        )}
        {selectedTab === 'confirmation' && (
          <TabPanel id="confirmation">
            <ConfirmScreen
              selectedPlan={selectedPlan}
              currentPlan={data.currentPlan}
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
  onClose: PropTypes.func.isRequired,
  onProcessing: PropTypes.func.isRequired,
};
