import React, { useCallback, useReducer } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import moment from 'moment';
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
  WIZARD_INTENT,
  WIZARD_EVENTS,
  transformSpaceProductRatePlans,
  trackWizardEvent,
  goToBillingPage,
  sendParnershipEmail,
} from '../shared/utils';
import { getTemplatesList } from 'services/SpaceTemplateLoader';
import { calculateTotalPrice } from 'account/pricing/PricingDataProvider';
import { getAllPlans, getSpaceProductRatePlans } from 'features/pricing-entities';
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
  const orgResources = createResourceService(endpoint);

  const [freeSpaceResource, rawSpaceProductRatePlans, templates, plans] = await Promise.all([
    orgResources.get(FREE_SPACE_IDENTIFIER),
    getSpaceProductRatePlans(endpoint),
    getTemplatesList(),
    getAllPlans(endpoint),
  ]);

  const currentSubscriptionPrice = calculateTotalPrice(plans);
  const spaceRatePlans = transformSpaceProductRatePlans({
    organization,
    spaceProductRatePlans: rawSpaceProductRatePlans,
    freeSpaceResource,
  });

  return {
    freeSpaceResource,
    spaceRatePlans,
    templates,
    currentSubscriptionPrice,
  };
};

const submit = async ({
  organization,
  sessionId,
  selectedPlan,
  spaceName,
  selectedTemplate,
  partnerDetails,
  onTemplateCreationStarted,
  onProcessing,
  onClose,
}) => {
  onProcessing(true);

  trackWizardEvent(WIZARD_INTENT.CREATE, WIZARD_EVENTS.CONFIRM, sessionId);

  let newSpaceId;

  try {
    if (selectedTemplate) {
      const newSpace = await createSpaceWithTemplate({
        name: spaceName,
        plan: selectedPlan,
        template: selectedTemplate,
        organizationId: organization.sys.id,
        sessionId,
        onTemplateCreationStarted,
      });

      newSpaceId = newSpace.sys.id;

      onProcessing(false);
    } else {
      const newSpace = await createSpace({
        name: spaceName,
        plan: selectedPlan,
        organizationId: organization.sys.id,
        sessionId,
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

  const { organization, sessionId, onClose, onProcessing } = props;

  const [{ isLoading: isCreatingSpace }, handleSubmit] = useAsyncFn(() =>
    submit({
      organization,
      sessionId,
      selectedPlan,
      spaceName,
      selectedTemplate,
      partnerDetails,
      onTemplateCreationStarted: () => dispatch({ type: 'SHOW_PROCESS_SCREEN', payload: true }),
      onProcessing,
      onClose,
    })
  );

  const navigate = (newTab) => {
    trackWizardEvent(WIZARD_INTENT.CREATE, WIZARD_EVENTS.NAVIGATE, sessionId, {
      currentStepId: selectedTab,
      targetStepId: newTab,
    });

    dispatch({ type: 'SET_SELECTED_TAB', payload: newTab });
  };

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
                onSelect={() => navigate('spacePlanSelector')}>
                1. Space type
              </Tab>
              <Tab
                id="spaceDetails"
                testId="space-details-tab"
                selected={selectedTab === 'spaceDetails'}
                onSelect={() => navigate('spaceDetails')}
                disabled={!selectedPlan}>
                2. Space details
              </Tab>
              <Tab
                id="confirmation"
                testId="confirmation-tab"
                selected={selectedTab === 'confirmation'}
                onSelect={() => navigate('confirmation')}
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
                onClick={() => onClose()}
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
                    trackWizardEvent(WIZARD_INTENT.CREATE, WIZARD_EVENTS.SELECT_PLAN, sessionId, {
                      selectedPlan: plan,
                    });
                    dispatch({ type: 'SET_SELECTED_PLAN', payload: plan });

                    navigate('spaceDetails');
                  }}
                  goToBillingPage={() =>
                    goToBillingPage(organization, WIZARD_INTENT.CREATE, sessionId, onClose)
                  }
                  shouldShowMicroSmallCTA={data.shouldShowMicroSmallCTA}
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
                  onSubmit={() => {
                    trackWizardEvent(
                      WIZARD_INTENT.CREATE,
                      WIZARD_EVENTS.ENTERED_DETAILS,
                      sessionId,
                      {
                        newSpaceName: spaceName,
                        newSpaceTemplate: selectedTemplate,
                      }
                    );

                    navigate('confirmation');
                  }}
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
  sessionId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onProcessing: PropTypes.func.isRequired,
};
