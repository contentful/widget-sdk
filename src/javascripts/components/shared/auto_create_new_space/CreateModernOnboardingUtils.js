import { getStore } from 'browserStorage';
import { user$ } from 'services/TokenStore';

import { create as createToken } from 'app/settings/api/cma-tokens/TokenResourceManager';
import * as auth from 'Authentication';
import { getValue } from 'utils/kefir';
import { getModule } from 'NgRegistry';
import * as Entries from 'data/entries';
import { getApiKeyRepo } from 'app/settings/api/services/ApiKeyRepoInstance';
import * as Analytics from 'analytics/Analytics';
import { getCurrentStateName } from 'states/Navigator';

const store = getStore();

export const MODERN_STACK_ONBOARDING_SPACE_NAME = 'Gatsby Starter for Contentful';
export const MODERN_STACK_ONBOARDING_FEATURE_FLAG = 'feature-dl-05-2018-modern-stack-onboarding';
export const MODERN_STACK_ONBOARDING_COMPLETE_EVENT = 'onboardingComplete';
export const getUser = () => getValue(user$);
export const getStoragePrefix = () => `ctfl:${getUser().sys.id}:modernStackOnboarding`;
export const getDeploymentProvider = () => store.get(`${getStoragePrefix()}:deploymentProvider`);
export const isOnboardingComplete = () => store.get(`${getStoragePrefix()}:completed`);
export const isDevOnboardingSpace = (currentSpace) => {
  const currentSpaceId = currentSpace && currentSpace.getSys().id;
  const currentSpaceName = currentSpace && currentSpace.data.name;
  const msDevChoiceSpace = store.get(`${getStoragePrefix()}:developerChoiceSpace`);

  if (!msDevChoiceSpace && currentSpaceName === MODERN_STACK_ONBOARDING_SPACE_NAME) {
    store.set(`${getStoragePrefix()}:developerChoiceSpace`, currentSpaceId);
  }

  return (
    !!currentSpace &&
    (currentSpaceId === msDevChoiceSpace || currentSpaceName === MODERN_STACK_ONBOARDING_SPACE_NAME)
  );
};
export const isContentOnboardingSpace = (currentSpace) => {
  const currentSpaceId = currentSpace && currentSpace.getSys().id;
  const msContentChoiceSpace = store.get(`${getStoragePrefix()}:contentChoiceSpace`);

  return !!currentSpace && currentSpaceId === msContentChoiceSpace;
};

function getPersonalAccessTokenKey() {
  return `${getStoragePrefix()}:personalAccessToken`;
}

function getMSOnboardingSpaceKey() {
  return `${getStoragePrefix()}:developerChoiceSpace`;
}

/**
 * @description
 * Get the first entry that has content type "person"
 *
 * @return {Promise<Entry>}
 */
export const getPerson = async () => {
  const spaceContext = getModule('spaceContext');
  const person = 'person';
  const personEntryPromise = spaceContext.space.getEntries({ content_type: person });
  const personCTPromise = spaceContext.space.getContentType(person);

  try {
    const [personEntry, personCT] = await Promise.all([personEntryPromise, personCTPromise]);

    if (!personEntry.total) {
      return null;
    }

    // this is needed as getEntries returns entries with internal field ids
    return Entries.internalToExternal(personEntry[0].data, personCT.data);
  } catch (_) {
    return null;
  }
};
export const markSpace = (spaceId) => {
  store.set(getMSOnboardingSpaceKey(), spaceId);
};
export const checkSpace = (spaceId) => store.get(getMSOnboardingSpaceKey()) === spaceId;

// used for grouping all related analytics events
export const getGroupId = () => 'modernStackOnboarding';

export const createDeliveryToken = () => {
  return getApiKeyRepo().create(
    'Example Key',
    'We’ve created an example API key for you to help you get started.'
  );
};

export const createManagementToken = async () => {
  const data = await createToken(auth).create('Gatsby Starter for Contentful import token');
  const token = data.token;

  store.set(getPersonalAccessTokenKey(), token);

  return token;
};

export const getManagementToken = () => {
  const token = store.get(getPersonalAccessTokenKey());

  if (token) {
    return token;
  }

  return createManagementToken();
};

export const getDeliveryToken = async () => {
  const keys = await getApiKeyRepo().getAll();
  const key = keys[0];

  if (key) {
    return key.accessToken;
  } else {
    const createdKey = await createDeliveryToken();

    return createdKey.accessToken;
  }
};

export const track = (elementId, toState) => {
  const payload = {
    elementId,
    groupId: getGroupId(),
    fromState: getCurrentStateName(),
  };

  if (toState) {
    payload.toState = toState;
  }

  Analytics.track('element:click', payload);
};

export const getCredentials = () =>
  Promise.all([
    getDeliveryToken(),
    getManagementToken(),
  ]).then(([deliveryToken, managementToken]) => ({ managementToken, deliveryToken }));
