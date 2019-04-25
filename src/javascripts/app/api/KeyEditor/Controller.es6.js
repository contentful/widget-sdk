import { assign, get, inRange, isEqual } from 'lodash';
import { truncate } from 'utils/StringUtils.es6';
import { deepFreeze } from 'utils/Freeze.es6';
import { concat } from 'utils/Collections.es6';
import * as accessChecker from 'access_control/AccessChecker/index.es6';
import * as LD from 'utils/LaunchDarkly/index.es6';
import { Notification } from '@contentful/forma-36-react-components';
import { track } from 'analytics/Analytics.es6';
import { CONTACT_US_BOILERPLATE_FLAG, ENVIRONMENTS_FLAG } from 'featureFlags.es6';
import { getModule } from 'NgRegistry.es6';
import * as logger from 'services/logger.es6';
import * as Intercom from 'services/intercom.es6';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog.es6';

const $state = getModule('$state');
const Command = getModule('command');
const spaceContext = getModule('spaceContext');

import initKeyEditor from './KeyEditor.es6';
import { get as getBoilerplates } from './BoilerplateCode.es6';

// Pass $scope and API Key, the editor will get rendered and the
// following properties are exposed as `$scope.apiKeyEditor`:
// `canEdit` (bool), `remove` (action), `save` (action)
export default function attach($scope, apiKey, spaceEnvironments) {
  mountBoilerplates($scope, apiKey);
  mountContactUs($scope);
  mountKeyEditor($scope, apiKey, spaceEnvironments);
}

function mountBoilerplates($scope, apiKey) {
  getBoilerplates().then(boilerplates => {
    $scope.boilerplateProps = {
      boilerplates,
      spaceId: spaceContext.getId(),
      deliveryToken: apiKey.accessToken,
      track: {
        select: platform => track('api_key:boilerplate', { action: 'select', platform }),
        download: platform => track('api_key:boilerplate', { action: 'download', platform })
      }
    };
  });
}

function mountContactUs($scope) {
  LD.onFeatureFlag($scope, CONTACT_US_BOILERPLATE_FLAG, flag => {
    if (flag && Intercom.isEnabled()) {
      $scope.contactUsProps = {
        track: () =>
          track('element:click', {
            elementId: 'contact_sales_boilerplate',
            groupId: 'contact_sales',
            fromState: $state.current.name
          }),
        openIntercom: () => Intercom.open()
      };
    }

    $scope.$applyAsync();
  });
}

function makeApiKeyModel(apiKey) {
  return {
    name: apiKey.name || '',
    description: apiKey.description || '',
    environments: concat([], apiKey.environments || [])
  };
}

function isApiKeyModelEqual(m1, m2) {
  const sortedIds = envs =>
    (envs || [])
      .map(env => env.sys.id)
      .sort()
      .join(',');
  return isEqual(
    { ...m1, environments: sortedIds(m1.environments) },
    { ...m2, environments: sortedIds(m2.environments) }
  );
}

function mountKeyEditor($scope, apiKey, spaceEnvironments) {
  // `environments` key is present only if there are environments other than master enabled
  if (!Array.isArray(apiKey.environments) || apiKey.environments.length === 0) {
    apiKey.environments = [{ sys: { id: 'master', type: 'Link', linkType: 'Environment' } }];
  }

  const canEdit = accessChecker.canModifyApiKeys();
  const notify = makeNotifier(truncate(apiKey.name, 50));
  const model = makeApiKeyModel(apiKey);
  let pristineModel = makeApiKeyModel(apiKey);

  const reinitKeyEditor = (environmentsEnabled = false) =>
    initKeyEditor({
      data: deepFreeze({
        spaceId: spaceContext.getId(),
        isAdmin: !!spaceContext.getData(['spaceMember', 'admin']),
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
        $scope.context.dirty = !isApiKeyModelEqual(model, pristineModel);
        $scope.keyEditorComponent = component;
        $scope.$applyAsync();
      },
      trackCopy: source => track('api_key:clipboard_copy', { source })
    });

  reinitKeyEditor();
  LD.onFeatureFlag($scope, ENVIRONMENTS_FLAG, reinitKeyEditor);

  $scope.context.requestLeaveConfirmation = createUnsavedChangesDialogOpener(save);
  $scope.apiKeyEditor = {
    canEdit,
    remove: Command.create(remove),
    save: Command.create(save, {
      disabled: isSaveDisabled,
      available: () => canEdit
    })
  };

  function remove() {
    return spaceContext.apiKeyRepo
      .remove(apiKey.sys.id)
      .then(() => $state.go('^.list').then(notify.deleteSuccess), notify.deleteFail);
  }

  function isSaveDisabled() {
    return (
      !inRange(model.name.length, 1, 256) ||
      accessChecker.shouldDisable('create', 'apiKey') ||
      !$scope.context.dirty
    );
  }

  function save() {
    if (model.environments.length < 1) {
      notify.saveNoEnvironments();
      return;
    }

    const toPersist = Object.assign({}, apiKey, model);
    // no need to send `environments` over the wire if in default state
    // TODO remove when space environments go public
    if (toPersist.environments.length === 1 && toPersist.environments[0].sys.id === 'master') {
      delete toPersist.environments;
    }

    return spaceContext.apiKeyRepo.save(toPersist).then(newKey => {
      apiKey = newKey;
      pristineModel = makeApiKeyModel(apiKey);
      $scope.context.dirty = false;
      notify.saveSuccess();
    }, notify.saveFail);
  }
}

function makeNotifier(title) {
  return {
    saveSuccess: function() {
      Notification.success(`“${title}” saved successfully`);
    },

    saveFail: function(error) {
      Notification.error(`“${title}” could not be saved`);
      // HTTP 422: Unprocessable entity
      if (get(error, 'statusCode') !== 422) {
        logger.logServerWarn('ApiKey could not be saved', { error });
      }
    },

    saveNoEnvironments: function() {
      Notification.error('At least one environment has to be selected.');
    },

    deleteSuccess: function() {
      Notification.success(`“${title}” deleted successfully`);
    },

    deleteFail: function(error) {
      Notification.error(`“${title}” could not be deleted`);
      logger.logServerWarn('ApiKey could not be deleted', { error });
    }
  };
}
