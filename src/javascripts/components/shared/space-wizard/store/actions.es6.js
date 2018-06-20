import client from 'client';
import { get, noop } from 'lodash';

import createResourceService from 'services/ResourceService';
import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory';
import {
  getSpaceRatePlans,
  getSubscriptionPlans,
  calculateTotalPrice,
  changeSpace as changeSpaceApiCall
} from 'account/pricing/PricingDataProvider';
import createApiKeyRepo from 'data/CMA/ApiKeyRepo';
import * as TokenStore from 'services/TokenStore';
import * as Analytics from 'analytics/Analytics';
import spaceContext from 'spaceContext';
import { getCreator as getTemplateCreator } from 'services/SpaceTemplateCreator';
import { getTemplatesList, getTemplate } from 'services/SpaceTemplateLoader';
import { canCreate } from 'utils/ResourceUtils';

const DEFAULT_LOCALE = 'en-US';

export function fetchSpacePlans ({ organization, spaceId }) {
  return async dispatch => {
    const resources = createResourceService(organization.sys.id, 'organization');
    const endpoint = createOrganizationEndpoint(organization.sys.id);

    dispatch({ type: 'SPACE_PLANS_LOADING', isLoading: true });

    let rawSpaceRatePlans;
    let freeSpacesResource;

    try {
      [ rawSpaceRatePlans, freeSpacesResource ] = await Promise.all([
        getSpaceRatePlans(endpoint, spaceId),
        resources.get('free_space')
      ]);
    } catch (e) {
      dispatch({
        type: 'SPACE_PLANS_ERRORED',
        error: e
      });

      dispatch({ type: 'SPACE_PLANS_LOADING', isLoading: false });

      return;
    }

    const spaceRatePlans = rawSpaceRatePlans.map(plan => {
      const isFree = (plan.productPlanType === 'free_space');
      const includedResources = getIncludedResources(plan.productRatePlanCharges);
      let disabled = false;

      if (plan.unavailabilityReasons && plan.unavailabilityReasons.length > 0) {
        disabled = true;
      } else if (plan.isFree) {
        disabled = !canCreate(freeSpacesResource);
      } else if (!organization.isBillable) {
        disabled = true;
      }

      return {...plan, isFree, includedResources, disabled};
    });


    dispatch({
      type: 'SPACE_PLANS_LOADED',
      spaceRatePlans,
      freeSpacesResource
    });

    dispatch({ type: 'SPACE_PLANS_LOADING', isLoading: false });
  };
}

export function fetchTemplates () {
  return async dispatch => {
    dispatch({ type: 'SPACE_TEMPLATES_LOADING', isLoading: true });

    let templatesList;

    try {
      templatesList = await getTemplatesList();
    } catch (e) {
      dispatch({ type: 'SPACE_TEMPLATES_ERROR', error: e });
      dispatch({ type: 'SPACE_TEMPLATES_LOADING', isLoading: false });

      return;
    }

    // The templates are technically entries, but this abstraction doesn't matter
    // here, so we take the keys/values in "fields" and make them on the base object

    templatesList = templatesList.map(({ fields, sys }) => ({ ...fields, sys }));

    dispatch({ type: 'SPACE_TEMPLATES_SUCCESS', templatesList });
    dispatch({ type: 'SPACE_TEMPLATES_LOADING', isLoading: false });
  };
}

export function createSpace ({
  action,
  organization,
  currentStepId,
  selectedPlan,
  newSpaceMeta,
  onSpaceCreated,
  onTemplateCreated
}) {
  return async dispatch => {
    const { name, template } = newSpaceMeta;
    const spaceData = {
      defaultLocale: 'en-US',
      name: name,
      productRatePlanId: get(selectedPlan, 'sys.id')
    };

    let newSpace;

    dispatch({ type: 'SPACE_CREATION_PENDING', pending: true });

    try {
      newSpace = await client.createSpace(spaceData, organization.sys.id);
    } catch (error) {
      dispatch({ type: 'SPACE_CREATION_ERROR', error });
      dispatch({ type: 'SPACE_CREATION_PENDING', pending: false });

      return;
    }

    const spaceEndpoint = createSpaceEndpoint(newSpace.sys.id);
    const apiKeyRepo = createApiKeyRepo(spaceEndpoint);

    await TokenStore.refresh();

    // Emit space creation event
    // This navigates to the new space
    onSpaceCreated(newSpace);

    const spaceCreateEventData =
      template
      ? {templateName: template.name, entityAutomationScope: {scope: 'space_template'}}
      : {templateName: 'Blank'};

    track('create', spaceCreateEventData, { action, organization, currentStepId, selectedPlan, newSpaceMeta });
    dispatch({ type: 'SPACE_CREATION_SUCCESS' });

    if (template) {
      dispatch({ type: 'SPACE_CREATION_TEMPLATE', pending: true });

      await createTemplate(template);
      await spaceContext.publishedCTs.refresh();

      // Emit template creation event
      onTemplateCreated();

      dispatch({ type: 'SPACE_CREATION_TEMPLATE', pending: false });
    } else {
      await apiKeyRepo.create(
        'Example Key',
        'We’ve created an example API key for you to help you get started.'
      );
    }

    dispatch({ type: 'SPACE_CREATION_PENDING', pending: false });
  };
}

export function changeSpace ({ space, selectedPlan, onConfirm }) {
  return async dispatch => {
    dispatch({ type: 'SPACE_CHANGE_PENDING', pending: true });

    const spaceId = space.sys.id;
    const endpoint = createSpaceEndpoint(spaceId);
    const planId = get(selectedPlan, 'sys.id');

    try {
      await changeSpaceApiCall(endpoint, planId);
    } catch (e) {
      dispatch({ type: 'SPACE_CHANGE_ERROR', error: e });
      dispatch({ type: 'SPACE_CHANGE_PENDING', pending: false });
      return;
    }

    // We don't fire a "success" event since we close the modal directly
    onConfirm();
  };
}

export function fetchSubscriptionPrice ({ organization }) {
  return async dispatch => {
    const orgId = organization.sys.id;
    const endpoint = createOrganizationEndpoint(orgId);
    let plans;

    dispatch({ type: 'SUBSCRIPTION_PRICE_LOADING', isLoading: true });

    try {
      plans = await getSubscriptionPlans(endpoint);
    } catch (e) {
      dispatch({
        type: 'SUBSCRIPTION_PRICE_ERROR',
        error: e
      });

      dispatch({ type: 'SUBSCRIPTION_PRICE_LOADING', isLoading: false });

      return;
    }

    const totalPrice = calculateTotalPrice(plans.items);

    dispatch({
      type: 'SUBSCRIPTION_PRICE_SUCCESS',
      totalPrice
    });

    dispatch({ type: 'SUBSCRIPTION_PRICE_LOADING', isLoading: false });
  };
}

export function track (eventName, data, props) {
  return dispatch => {
    const trackingData = { ...data, ...createTrackingData(props) };

    Analytics.track(`space_wizard:${eventName}`, trackingData);

    return dispatch({
      type: 'SPACE_WIZARD_TRACK',
      eventName,
      trackingData
    });
  };
}

export function navigate (stepId) {
  return dispatch => {
    return dispatch({
      type: 'SPACE_WIZARD_NAVIGATE',
      id: stepId
    });
  };
}

export function setNewSpaceName (name) {
  return dispatch => {
    return dispatch({
      type: 'NEW_SPACE_NAME',
      name
    });
  };
}

export function setNewSpaceTemplate (template) {
  return dispatch => {
    return dispatch({
      type: 'NEW_SPACE_TEMPLATE',
      template
    });
  };
}

export function selectPlan (currentPlan, selectedPlan) {
  return dispatch => {
    return dispatch({
      type: 'SPACE_PLAN_SELECTED',
      selected: selectedPlan,
      current: currentPlan
    });
  };
}

function createTrackingData ({ action, organization, currentStepId, selectedPlan, currentPlan, newSpaceMeta }) {
  const { spaceName, template } = newSpaceMeta;

  const eventData = {
    currentStep: currentStepId,
    action: action,
    paymentDetailsExist: organization.isBillable,
    spaceType: get(selectedPlan, 'internalName'),
    spaceName: spaceName,
    template: get(template, 'name'),
    currentSpaceType: get(currentPlan, 'internalName')
  };

  return eventData;
}

async function createTemplate (templateInfo) {
  const templateCreator = getTemplateCreator(
    spaceContext,
    // TODO add analytics tracking
    {onItemSuccess: noop, onItemError: noop},
    templateInfo,
    DEFAULT_LOCALE
  );

  const templateData = await getTemplate(templateInfo);
  return tryCreateTemplate(templateCreator, templateData);
}

async function tryCreateTemplate (templateCreator, templateData, retried) {
  const {spaceSetup, contentCreated} = templateCreator.create(templateData);

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

function getIncludedResources (charges) {
  const ResourceTypes = {
    Environments: 'Environments',
    Roles: 'Roles',
    Locales: 'Locales',
    ContentTypes: 'Content types',
    Records: 'Records'
  };

  return Object.values(ResourceTypes).map((value) => ({
    type: value,
    number: get(charges.find(({name}) => name === value), 'tiers[0].endingUnit')
  }));
}
