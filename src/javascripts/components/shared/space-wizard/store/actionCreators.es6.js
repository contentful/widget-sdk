import client from 'client';
import { get, noop } from 'lodash';

import logger from 'logger';
import createResourceService from 'services/ResourceService.es6';
import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory.es6';
import {
  getSpaceRatePlans,
  getSubscriptionPlans,
  calculateTotalPrice,
  changeSpace as changeSpaceApiCall
} from 'account/pricing/PricingDataProvider.es6';
import createApiKeyRepo from 'data/CMA/ApiKeyRepo.es6';
import * as TokenStore from 'services/TokenStore.es6';
import * as Analytics from 'analytics/Analytics.es6';
import spaceContext from 'spaceContext';
import { getCreator as getTemplateCreator } from 'services/SpaceTemplateCreator';
import { getTemplatesList, getTemplate } from 'services/SpaceTemplateLoader.es6';
import { canCreate } from 'utils/ResourceUtils.es6';
import { createTrackingData } from '../WizardUtils.es6';
import { getIncludedResources } from 'components/shared/space-wizard/WizardUtils.es6';

import * as actions from './actions.es6';

const DEFAULT_LOCALE = 'en-US';

export function reset() {
  return dispatch => dispatch(actions.spaceWizardReset());
}

export function setPartnershipFields(fields) {
  return dispatch => {
    dispatch(actions.spacePartnershipFields(fields));
  };
}

export function sendPartnershipEmail({ spaceId, fields }) {
  return async dispatch => {
    dispatch(actions.spacePartnershipEmailPending(true));

    const endpoint = createSpaceEndpoint(spaceId);
    try {
      await endpoint({
        method: 'POST',
        path: ['partner_projects'],
        data: fields
      });
    } catch (e) {
      logger.logError(`Could not send partnership data to API`, {
        error: e,
        fields
      });

      dispatch(actions.spacePartnershipEmailFailure(e));
    }

    dispatch(actions.spacePartnershipEmailPending(false));
  };
}

export function fetchSpacePlans({ organization, spaceId }) {
  return async dispatch => {
    const resources = createResourceService(organization.sys.id, 'organization');
    const endpoint = createOrganizationEndpoint(organization.sys.id);

    dispatch(actions.spacePlansPending(true));

    let rawSpaceRatePlans;
    let freeSpacesResource;

    try {
      [rawSpaceRatePlans, freeSpacesResource] = await Promise.all([
        getSpaceRatePlans(endpoint, spaceId),
        resources.get('free_space')
      ]);
    } catch (e) {
      dispatch(actions.spacePlansFailure(e));
      dispatch(actions.spacePlansPending(false));

      return;
    }

    const spaceRatePlans = rawSpaceRatePlans.map(plan => {
      const isFree = plan.productPlanType === 'free_space';
      const includedResources = getIncludedResources(plan.productRatePlanCharges);
      let disabled = false;

      if (plan.unavailabilityReasons && plan.unavailabilityReasons.length > 0) {
        disabled = true;
      } else if (isFree) {
        disabled = !canCreate(freeSpacesResource);
      } else if (!organization.isBillable) {
        disabled = true;
      }

      return { ...plan, isFree, includedResources, disabled };
    });

    dispatch(actions.spacePlansSuccess(spaceRatePlans, freeSpacesResource));
    dispatch(actions.spacePlansPending(false));
  };
}

export function fetchTemplates() {
  return async dispatch => {
    dispatch(actions.spaceTemplatesPending(true));

    let templatesList;

    try {
      templatesList = await getTemplatesList();
    } catch (e) {
      dispatch(actions.spaceTemplatesFailure(e));
      dispatch(actions.spaceTemplatesPending(false));

      return;
    }

    // The templates are technically entries, but this abstraction doesn't matter
    // here, so we take the keys/values in "fields" and make them on the base object

    templatesList = templatesList.map(({ fields, sys }) => ({ ...fields, sys }));

    dispatch(actions.spaceTemplatesSuccess(templatesList));
    dispatch(actions.spaceTemplatesPending(false));
  };
}

export function createSpace({
  organization,
  selectedPlan,
  newSpaceMeta,
  partnershipMeta,
  onSpaceCreated,
  onTemplateCreated,
  onConfirm
}) {
  return async dispatch => {
    const { name, template } = newSpaceMeta;
    const spaceData = {
      defaultLocale: 'en-US',
      name: name,
      productRatePlanId: get(selectedPlan, 'sys.id')
    };

    let newSpace;

    dispatch(actions.spaceCreationPending(true));

    try {
      newSpace = await client.createSpace(spaceData, organization.sys.id);
    } catch (error) {
      dispatch(actions.spaceCreationFailure(error));
      dispatch(actions.spaceCreationPending(false));

      return;
    }

    const isPartnerSpacePlan = get(partnershipMeta, 'isPartnerSpacePlan', false);

    if (isPartnerSpacePlan) {
      // Send partnerships email if this is a partnership space
      const { fields } = partnershipMeta;

      dispatch(sendPartnershipEmail({ fields, spaceId: newSpace.sys.id }));
    }

    const spaceEndpoint = createSpaceEndpoint(newSpace.sys.id);
    const apiKeyRepo = createApiKeyRepo(spaceEndpoint);

    await TokenStore.refresh();

    // Emit space creation event
    // This navigates to the new space
    onSpaceCreated(newSpace);

    const spaceCreateEventData = template
      ? { templateName: template.name, entityAutomationScope: { scope: 'space_template' } }
      : { templateName: 'Blank' };

    Analytics.track('space:create', spaceCreateEventData);

    dispatch(
      track('space_create', {
        action: 'create',
        spaceId: newSpace.sys.id
      })
    );
    dispatch(actions.spaceCreationSuccess());

    if (template) {
      dispatch(actions.spaceCreationTemplate(true));

      await createTemplate(template);
      await spaceContext.publishedCTs.refresh();

      // Emit template creation event
      onTemplateCreated();

      dispatch(actions.spaceCreationTemplate(false));
    } else {
      await apiKeyRepo.create(
        'Example Key',
        'We’ve created an example API key for you to help you get started.'
      );

      onConfirm();
    }

    dispatch(actions.spaceCreationPending(false));
  };
}

export function changeSpace({ space, selectedPlan, onConfirm }) {
  return async dispatch => {
    dispatch(actions.spaceChangePending(true));

    const spaceId = space.sys.id;
    const endpoint = createSpaceEndpoint(spaceId);
    const planId = get(selectedPlan, 'sys.id');

    try {
      await changeSpaceApiCall(endpoint, planId);
    } catch (e) {
      dispatch(actions.spaceChangeFailure(e));
      dispatch(actions.spaceChangePending(false));
      return;
    }

    dispatch(
      track('space_type_change', {
        action: 'change'
      })
    );

    // We don't fire a "success" event since we close the modal directly
    onConfirm();
  };
}

export function fetchSubscriptionPrice({ organization }) {
  return async dispatch => {
    const orgId = organization.sys.id;
    const endpoint = createOrganizationEndpoint(orgId);
    let plans;

    dispatch(actions.subscriptionPricePending(true));

    try {
      plans = await getSubscriptionPlans(endpoint);
    } catch (e) {
      dispatch(actions.subscriptionPriceFailure(e));
      dispatch(actions.subscriptionPricePending(false));

      return;
    }

    const totalPrice = calculateTotalPrice(plans.items);

    dispatch(actions.subscriptionPriceSuccess(totalPrice));
    dispatch(actions.subscriptionPricePending(false));
  };
}

export function track(eventName, data) {
  return dispatch => {
    const trackingData = createTrackingData(data);

    Analytics.track(`space_wizard:${eventName}`, trackingData);

    return dispatch(actions.spaceWizardTrack(eventName, trackingData));
  };
}

export function navigate(stepId) {
  return dispatch => dispatch(actions.spaceWizardNavigate(stepId));
}

export function setNewSpaceName(name) {
  return dispatch => dispatch(actions.newSpaceName(name));
}

export function setNewSpaceTemplate(template) {
  return dispatch => dispatch(actions.newSpaceTemplate(template));
}

export function selectPlan(currentPlan, selectedPlan) {
  return dispatch => {
    const { productType, productPlanType } = selectedPlan;
    const isPartnerSpace = productType === 'partner' && productPlanType === 'space';

    if (isPartnerSpace) {
      dispatch(actions.spacePartnership(true));
    } else {
      dispatch(actions.spacePartnership(false));
    }

    dispatch(actions.spacePlanSelected(currentPlan, selectedPlan));
  };
}

async function createTemplate(templateInfo) {
  const templateCreator = getTemplateCreator(
    spaceContext,
    // TODO add analytics tracking
    { onItemSuccess: noop, onItemError: noop },
    templateInfo,
    DEFAULT_LOCALE
  );

  const templateData = await getTemplate(templateInfo);
  return tryCreateTemplate(templateCreator, templateData);
}

async function tryCreateTemplate(templateCreator, templateData, retried) {
  const { spaceSetup, contentCreated } = templateCreator.create(templateData);

  try {
    await Promise.all([
      // we suppress errors, since `contentCreated` will handle them
      spaceSetup.catch(noop),
      contentCreated
    ]);
  } catch (err) {
    if (!retried) {
      await tryCreateTemplate(templateCreator, err.template, true);
    }
  }
}
