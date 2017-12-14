import {assign, get, inRange, omit} from 'lodash';
import Command from 'command';
import {truncate} from 'stringUtils';
import {deepFreeze} from 'utils/Freeze';

import leaveConfirmator from 'navigation/confirmLeaveEditor';
import spaceContext from 'spaceContext';
import logger from 'logger';
import accessChecker from 'accessChecker';
import $state from '$state';
import notification from 'notification';
import {track} from 'analytics/Analytics';
import TheStore from 'TheStore';
import * as LD from 'utils/LaunchDarkly';
import * as Intercom from 'intercom';

import initKeyEditor from './KeyEditor';
import {get as getBoilerplates} from './BoilerplateCode';
import initBoilerplate from './Boilerplate';
import renderContactUs from './ContactUs';
import {makeLink} from './EnvironmentSelector';

const CONTACT_US_BOILERPLATE_FLAG_NAME = 'feature-ps-10-2017-contact-us-boilerplate';
const ENVIRONMENTS_FLAG_NAME = 'feature-dv-11-2017-environments';

// Entity representing the default "master" environment
const MASTER_ENV = {sys: {id: 'master'}, name: 'Master'};

// Keys of the map are properties of API Keys that can be changed.
// Values of the map are functions producting default model values.
const CHANGABLE = {name: () => '', description: () => '', environments: () => []};

// Pass $scope and API Key, the editor will get rendered and the
// following properties are exposed as `$scope.apiKeyEditor`:
// `canEdit` (bool), `remove` (action), `save` (action)
export default function attach ($scope, apiKey, spaceEnvironments) {
  mountBoilerplates($scope, apiKey);
  mountContactUs($scope);
  mountKeyEditor($scope, apiKey, [MASTER_ENV].concat(spaceEnvironments));
}

function mountBoilerplates ($scope, apiKey) {
  getBoilerplates().then(boilerplates => initBoilerplate({
    boilerplates,
    connect: component => {
      $scope.boilerplateComponent = component;
      $scope.$applyAsync();
    },
    spaceId: spaceContext.getId(),
    deliveryToken: apiKey.accessToken,
    track: {
      select: platform => track('api_key:boilerplate', {action: 'select', platform}),
      download: platform => track('api_key:boilerplate', {action: 'download', platform})
    }
  }));
}

function mountContactUs ($scope) {
  LD.onFeatureFlag($scope, CONTACT_US_BOILERPLATE_FLAG_NAME, isVisible => {
    $scope.contactUsComponent = null;
    if (isVisible) {
      $scope.contactUsComponent = renderContactUs({
        track: () => track('element:click', {
          elementId: 'contact_sales_boilerplate',
          groupId: 'contact_sales',
          fromState: $state.current.name
        }),
        openIntercom: () => Intercom.open()
      });
    }
    $scope.$applyAsync();
  });
}

function mountKeyEditor ($scope, apiKey, spaceEnvironments) {
  // TODO: remove this localStorage mock; this property should come from the API
  const stored = TheStore.get(`tmp.envsFor.${apiKey.sys.id}`);
  apiKey.environments = Array.isArray(stored) ? stored : undefined;
  // end of mock implementation

  // This condition depends on the API implementation.
  // For the time being if `environments` are not present "master" is used.
  if (!Array.isArray(apiKey.environments) || apiKey.environments.length === 0) {
    apiKey.environments = [makeLink(MASTER_ENV)];
  }

  const canEdit = accessChecker.canModifyApiKeys();
  const notify = makeNotifier(truncate(apiKey.name, 50));

  const model = Object.keys(CHANGABLE).reduce((acc, property) => {
    acc[property] = apiKey[property] || CHANGABLE[property]();
    return acc;
  }, {});

  const reinitKeyEditor = (environmentsEnabled = false) => initKeyEditor({
    data: deepFreeze({
      spaceId: spaceContext.getId(),
      canEdit,
      deliveryToken: apiKey.accessToken,
      previewToken: get(apiKey, 'preview_api_key.accessToken'),
      environmentsEnabled,
      spaceEnvironments
    }),
    initialValue: model,
    connect: (updated, component) => {
      assign(model, updated);
      $scope.context.title = model.name || 'New Api Key';
      $scope.context.dirty = isDirty();
      $scope.keyEditorComponent = component;
      $scope.$applyAsync();
    },
    trackCopy: source => track('api_key:clipboard_copy', {source})
  });

  reinitKeyEditor();
  LD.onFeatureFlag($scope, ENVIRONMENTS_FLAG_NAME, reinitKeyEditor);

  $scope.context.requestLeaveConfirmation = leaveConfirmator(save);
  $scope.apiKeyEditor = {
    canEdit,
    remove: Command.create(remove),
    save: Command.create(save, {
      disabled: isSaveDisabled,
      available: () => canEdit
    })
  };

  function remove () {
    return spaceContext.apiKeyRepo.remove(apiKey.sys.id)
    .then(
      () => $state.go('spaces.detail.api.keys.list').then(notify.deleteSuccess),
      notify.deleteFail
    );
  }

  function isSaveDisabled () {
    return (
      !inRange(model.name.length, 1, 256) ||
      accessChecker.shouldDisable('createApiKey') ||
      !$scope.context.dirty ||
      model.environments.length < 1
    );
  }

  function save () {
    // TODO: remove this localStorage mock; this property should be accepted by the API
    TheStore.set(`tmp.envsFor.${apiKey.sys.id}`, model.environments);
    // it means `environments` shouldn't be omitted here:
    assign(apiKey, omit(model, ['environments']));
    // end of mock implementation

    return spaceContext.apiKeyRepo.save(apiKey)
    .then(newKey => {
      apiKey = newKey;
      apiKey.environments = model.environments; // TODO faking behavior, should be gone
      $scope.context.dirty = false;
      notify.saveSuccess();
    }, notify.saveFail);
  }

  function isDirty () {
    const detailsChanged = ['name', 'description'].some(property => {
      const entityValue = apiKey[property] || CHANGABLE[property]();
      return model[property] !== entityValue;
    });

    const sortedIds = envs => (envs || []).map(env => env.sys.id).sort().join(',');
    const envsChanged = sortedIds(model.environments) !== sortedIds(apiKey.environments);

    return detailsChanged || envsChanged;
  }
}

function makeNotifier (title) {
  return {
    saveSuccess: function () {
      notification.info(`“${title}” saved successfully`);
    },

    saveFail: function (error) {
      notification.error(`“${title}” could not be saved`);
      // HTTP 422: Unprocessable entity
      if (get(error, 'statusCode') !== 422) {
        logger.logServerWarn('ApiKey could not be saved', {error: error});
      }
    },

    deleteSuccess: function () {
      notification.info(`“${title}” deleted successfully`);
    },

    deleteFail: function (error) {
      notification.error(`“${title}” could not be deleted`);
      logger.logServerWarn('ApiKey could not be deleted', {error: error});
    }
  };
}
