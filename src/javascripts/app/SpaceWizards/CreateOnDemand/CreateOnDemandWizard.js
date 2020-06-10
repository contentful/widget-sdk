import React, { useCallback, useReducer } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import moment from 'moment';
import { getVariation } from 'LaunchDarkly';
import { COMMUNITY_PLAN_FLAG } from 'featureFlags';
import SpaceDetails from './SpaceDetails';
import ConfirmScreenNormal from './ConfirmScreenNormal';
import SpacePlanSelector from '../shared/SpacePlanSelector';
import ConfirmScreenPartnerPlan from './ConfirmScreenPartnerPlan';
import ProgressScreen from '../shared/ProgressScreen';
import Loader from '../shared/Loader';

import {
  Notification,
  Modal,
  Tabs,
  Tab,
  TabPanel,
  IconButton,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { createOrganizationEndpoint } from 'data/EndpointFactory';
import createResourceService from 'services/ResourceService';
import { useAsyncFn, useAsync } from 'core/hooks/useAsync';
import {
  createSpace,
  createSpaceWithTemplate,
  FREE_SPACE_IDENTIFIER,
  transformSpaceRatePlans,
  goToBillingPage,
  sendParnershipEmail,
} from '../shared/utils';
import { getTemplatesList } from 'services/SpaceTemplateLoader';
import {
  getSpaceRatePlans,
  getSubscriptionPlans,
  calculateTotalPrice,
} from 'account/pricing/PricingDataProvider';
import { createImmerReducer } from 'core/utils/createImmerReducer';

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

const initialFetch = (organization) => async () => {
  const organizationId = organization.sys.id;
  const endpoint = createOrganizationEndpoint(organizationId);
  const orgResources = createResourceService(organizationId, 'organization');

  const [
    freeSpaceResource,
    rawSpaceRatePlans,
    templates,
    subscriptionPlans,
    isCommunityPlanEnabled,
  ] = await Promise.all([
    orgResources.get(FREE_SPACE_IDENTIFIER),
    getSpaceRatePlans(endpoint),
    getTemplatesList(),
    getSubscriptionPlans(endpoint),
    getVariation(COMMUNITY_PLAN_FLAG, { organizationId }),
  ]);

  const currentSubscriptionPrice = calculateTotalPrice(subscriptionPlans.items);
  const spaceRatePlans = transformSpaceRatePlans({
    organization,
    spaceRatePlans: rawSpaceRatePlans,
    freeSpaceResource,
  });

  return {
    freeSpaceResource,
    spaceRatePlans,
    templates,
    currentSubscriptionPrice,
    isCommunityPlanEnabled,
  };
};

const submit = async ({
  organization,
  selectedPlan,
  spaceName,
  selectedTemplate,
  partnerDetails,
  onTemplateCreationStarted,
  onProcessing,
  onClose,
}) => {
  onProcessing(true);

  let newSpaceId;

  try {
    if (selectedTemplate) {
      const newSpace = await createSpaceWithTemplate({
        name: spaceName,
        plan: selectedPlan,
        template: selectedTemplate,
        organizationId: organization.sys.id,
        onTemplateCreationStarted,
      });

      newSpaceId = newSpace.sys.id;

      onProcessing(false);
    } else {
      const newSpace = await createSpace({
        name: spaceName,
        plan: selectedPlan,
        organizationId: organization.sys.id,
      });

      newSpaceId = newSpace.sys.id;

      Notification.success(`${spaceName} successfully created!`);

      onClose();
    }

    if (partnerDetails.clientName !== '') {
      // Ignore errors from this API call
      try {
        await sendParnershipEmail(newSpaceId, partnerDetails);
      } catch {
        //
      }
    }
  } catch {
    onProcessing(false);
    Notification.error('Your space couldn’t be created. Try again.');
  }
};

const reducer = createImmerReducer({
  SET_SELECTED_PLAN(state, { payload: selectedPlan }) {
    state.selectedPlan = selectedPlan;

    if (selectedPlan.productType === 'partner' && selectedPlan.productPlanType === 'space') {
      state.isPartnerPlan = true;
    } else {
      state.isPartnerPlan = false;
    }
  },
  SET_SPACE_NAME(state, { payload }) {
    state.spaceName = payload;
  },
  SET_SELECTED_TEMPLATE(state, { payload }) {
    state.selectedTemplate = payload;
  },
  SET_SELECTED_TAB(state, { payload }) {
    state.selectedTab = payload;
  },
  SHOW_PROCESS_SCREEN(state, { payload }) {
    state.showProgressScreen = payload;
  },
  SET_PARTNER_DETAILS(state, { payload: { fieldName, value } }) {
    state.partnerDetails[fieldName] = value;
  },
});

export default function CreateOnDemandWizard(props) {
  const [state, dispatch] = useReducer(reducer, {
    selectedPlan: null,
    isPartnerPlan: false,
    spaceName: '',
    selectedTemplate: null,
    selectedTab: 'spacePlanSelector',
    showProgressScreen: false,
    partnerDetails: {
      clientName: '',
      projectDescription: '',
      estimatedDeliveryDate: moment().format('YYYY-MM-DD'),
    },
  });

  const {
    selectedPlan,
    isPartnerPlan,
    spaceName,
    selectedTemplate,
    selectedTab,
    showProgressScreen,
    partnerDetails,
  } = state;

  const { organization, onClose, onProcessing } = props;

  const [{ isLoading: isCreatingSpace }, handleSubmit] = useAsyncFn(() =>
    submit({
      organization,
      selectedPlan,
      spaceName,
      selectedTemplate,
      partnerDetails,
      onTemplateCreationStarted: () => dispatch({ type: 'SHOW_PROCESS_SCREEN', payload: true }),
      onProcessing,
      onClose,
    })
  );

  const { isLoading, data } = useAsync(useCallback(initialFetch(organization), []));

  if (isLoading) {
    return <Loader />;
  }

  return (
    <>
      {showProgressScreen && (
        <Modal.Content>
          <ProgressScreen done={!isCreatingSpace} onConfirm={() => onClose(true)} />
        </Modal.Content>
      )}
      {!showProgressScreen && (
        <>
          <Tabs withDivider className={styles.tabsWrapper}>
            <div className={styles.tabs}>
              <Tab
                id="spacePlanSelector"
                testId="space-plan-selector-tab"
                selected={selectedTab === 'spacePlanSelector'}
                onSelect={() =>
                  dispatch({ type: 'SET_SELECTED_TAB', payload: 'spacePlanSelector' })
                }>
                1. Space type
              </Tab>
              <Tab
                id="spaceDetails"
                testId="space-details-tab"
                selected={selectedTab === 'spaceDetails'}
                onSelect={() => dispatch({ type: 'SET_SELECTED_TAB', payload: 'spaceDetails' })}
                disabled={!selectedPlan}>
                2. Space details
              </Tab>
              <Tab
                id="confirmation"
                testId="confirmation-tab"
                selected={selectedTab === 'confirmation'}
                onSelect={() => dispatch({ type: 'SET_SELECTED_TAB', payload: 'confirmation' })}
                disabled={!spaceName}>
                3. Confirmation
              </Tab>
            </div>
            {!isCreatingSpace && (
              <IconButton
                iconProps={{ icon: 'Close' }}
                label="Close space wizard"
                testId="close-icon"
                buttonType="muted"
                className={styles.closeButton}
                onClick={onClose}
              />
            )}
          </Tabs>
          <Modal.Content testId="create-on-demand-wizard-contents">
            {selectedTab === 'spacePlanSelector' && (
              <TabPanel id="spacePlanSelector">
                <SpacePlanSelector
                  organization={organization}
                  spaceRatePlans={data.spaceRatePlans}
                  freeSpacesResource={data.freeSpaceResource}
                  selectedPlan={selectedPlan}
                  onSelectPlan={(plan) => {
                    dispatch({ type: 'SET_SELECTED_PLAN', payload: plan });
                    dispatch({ type: 'SET_SELECTED_TAB', payload: 'spaceDetails' });
                  }}
                  goToBillingPage={() => goToBillingPage(organization, onClose)}
                  isCommunityPlanEnabled={data.isCommunityPlanEnabled}
                />
              </TabPanel>
            )}
            {selectedTab === 'spaceDetails' && (
              <TabPanel id="spaceDetails">
                <SpaceDetails
                  selectedPlan={selectedPlan}
                  selectedTemplate={selectedTemplate}
                  templates={data.templates}
                  spaceName={spaceName}
                  onChangeSpaceName={(name) => dispatch({ type: 'SET_SPACE_NAME', payload: name })}
                  onChangeSelectedTemplate={(template) =>
                    dispatch({ type: 'SET_SELECTED_TEMPLATE', payload: template })
                  }
                  onSubmit={() => dispatch({ type: 'SET_SELECTED_TAB', payload: 'confirmation' })}
                />
              </TabPanel>
            )}
            {selectedTab === 'confirmation' && (
              <TabPanel id="confirmation">
                {!isPartnerPlan && (
                  <ConfirmScreenNormal
                    selectedPlan={selectedPlan}
                    creating={isCreatingSpace}
                    onConfirm={handleSubmit}
                    organization={organization}
                    currentSubscriptionPrice={data.currentSubscriptionPrice}
                    spaceName={spaceName}
                    selectedTemplate={selectedTemplate}
                  />
                )}
                {isPartnerPlan && (
                  <ConfirmScreenPartnerPlan
                    selectedTemplate={selectedTemplate}
                    creating={isCreatingSpace}
                    onConfirm={handleSubmit}
                    organization={organization}
                    spaceName={spaceName}
                    partnerDetails={partnerDetails}
                    onChangePartnerDetails={(fieldName, value) =>
                      dispatch({ type: 'SET_PARTNER_DETAILS', payload: { fieldName, value } })
                    }
                  />
                )}
              </TabPanel>
            )}
          </Modal.Content>
        </>
      )}
    </>
  );
}

CreateOnDemandWizard.propTypes = {
  organization: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onProcessing: PropTypes.func.isRequired,
};
