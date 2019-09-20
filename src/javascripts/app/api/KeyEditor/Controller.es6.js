import { assign, get, inRange, isEqual, assignWith } from 'lodash';
import { deepFreeze } from 'utils/Freeze.es6';
import { concat } from 'utils/Collections.es6';
import { getCurrentStateName } from 'states/Navigator.es6';
import * as accessChecker from 'access_control/AccessChecker/index.es6';
import * as LD from 'utils/LaunchDarkly/index.es6';
import { Notification } from '@contentful/forma-36-react-components';
import { track } from 'analytics/Analytics.es6';
import { CONTACT_US_BOILERPLATE_FLAG, ENVIRONMENTS_FLAG } from 'featureFlags.es6';
import { getModule } from 'NgRegistry.es6';
import * as logger from 'services/logger.es6';
import * as Intercom from 'services/intercom.es6';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog.es6';

import initKeyEditor from './KeyEditor.es6';
import { get as getBoilerplates } from './BoilerplateCode.es6';

// Pass $scope and API Key, the editor will get rendered and the
// following properties are exposed as `$scope.apiKeyEditor`:
// `canEdit` (bool), `remove` (action), `save` (action)
export default function attach($scope, apiKey, spaceEnvironments, spaceAliases) {
  mountBoilerplates($scope, apiKey);
  mountContactUs($scope);
  mountKeyEditor($scope, apiKey, spaceEnvironments, spaceAliases);
}

function mountBoilerplates($scope, apiKey) {
  const spaceContext = getModule('spaceContext');

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
            fromState: getCurrentStateName()
          }),
        openIntercom: () => Intercom.open()
      };
    }

    $scope.$applyAsync();
  });
}

function makeApiKeyModel(apiKey) {
  return {
    name: {
      value: apiKey.name || '',
      minLength: 1,
      maxLength: 41
    },
    description: {
      value: apiKey.description || '',
      minLength: 0,
      maxLength: 256
    },
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

const notify = {
  saveSuccess: function(apiKey) {
    Notification.success(`“${apiKey.name}” saved successfully`);
  },

  saveFail: function(error, apiKey) {
    Notification.error(`“${apiKey.name}” could not be saved`);
    // HTTP 422: Unprocessable entity
    if (get(error, 'statusCode') !== 422) {
      logger.logServerWarn('ApiKey could not be saved', { error });
    }
  },

  saveNoEnvironments: function(aliasesExist) {
    if (aliasesExist) {
      Notification.error('At least one environment or alias has to be selected.');
    } else {
      Notification.error('At least one environment has to be selected.');
    }
  },

  deleteSuccess: function(apiKey) {
    Notification.success(`“${apiKey.name}” deleted successfully`);
  },

  deleteFail: function(error, apiKey) {
    Notification.error(`“${apiKey.name}” could not be deleted`);
    logger.logServerWarn('ApiKey could not be deleted', { error });
  }
};

function mountKeyEditor($scope, apiKey, spaceEnvironments, spaceAliases) {
  const Command = getModule('command');

  // `environments` key is present only if there are environments other than master enabled
  if (!Array.isArray(apiKey.environments) || apiKey.environments.length === 0) {
    apiKey.environments = [{ sys: { id: 'master', type: 'Link', linkType: 'Environment' } }];
  }

  const canEdit = accessChecker.canModifyApiKeys();
  const model = makeApiKeyModel(apiKey);
  let pristineModel = makeApiKeyModel(apiKey);

  if (Array.isArray(spaceAliases) && spaceAliases.length > 0) {
    model.aliasesExist = true;
  }

  const reinitKeyEditor = (environmentsEnabled = false) => {
    const spaceContext = getModule('spaceContext');

    return initKeyEditor({
      data: deepFreeze({
        spaceId: spaceContext.getId(),
        isAdmin: !!spaceContext.getData(['spaceMember', 'admin']),
        canEdit,
        deliveryToken: apiKey.accessToken,
        previewToken: get(apiKey, 'preview_api_key.accessToken'),
        environmentsEnabled,
        spaceEnvironments,
        spaceAliases
      }),
      initialValue: model,
      connect: (updated, component) => {
        assign(model, updated);
        $scope.context.title = model.name.value || 'New Api Key';
        $scope.context.dirty = !isApiKeyModelEqual(model, pristineModel);
        $scope.keyEditorComponent = component;
        $scope.$applyAsync();
      },
      trackCopy: source => track('api_key:clipboard_copy', { source })
    });
  };

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
    const $state = getModule('$state');
    const spaceContext = getModule('spaceContext');

    return spaceContext.apiKeyRepo
      .remove(apiKey.sys.id)
      .then(
        () => $state.go('^.list').then(() => notify.deleteSuccess(apiKey)),
        err => notify.deleteFail(err, apiKey)
      );
  }

  function isSaveDisabled() {
    return (
      !inRange(model.name.value.length, model.name.minLength, model.name.maxLength) ||
      !inRange(
        model.description.value.length,
        model.description.minLength,
        model.description.maxLength
      ) ||
      accessChecker.shouldDisable('create', 'apiKey') ||
      !$scope.context.dirty
    );
  }

  function save() {
    const spaceContext = getModule('spaceContext');

    if (model.environments.length < 1) {
      notify.saveNoEnvironments(model.aliasesExist);
      return;
    }

    const toPersist = assignWith({}, Object.assign({}, apiKey, model), (_objValue, srcVal, key) => {
      if (key === 'name' || key === 'description') {
        return srcVal.value || '';
      }
    });

    return spaceContext.apiKeyRepo.save(toPersist).then(
      newKey => {
        apiKey = newKey;
        pristineModel = makeApiKeyModel(apiKey);
        $scope.context.dirty = false;
        notify.saveSuccess(newKey);
      },
      err => notify.saveFail(err, apiKey)
    );
  }
}
