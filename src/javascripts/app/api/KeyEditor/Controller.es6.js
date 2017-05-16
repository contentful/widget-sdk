import {assign, get, constant, find} from 'lodash';
import Command from 'command';
import marked from 'libs/marked';
import {truncate} from 'stringUtils';
import {deepFreeze} from 'utils/DeepFreeze';
import * as K from 'utils/kefir';
import * as $sce from '$sce';

import leaveConfirmator from 'navigation/confirmLeaveEditor';
import spaceContext from 'spaceContext';
import logger from 'logger';
import accessChecker from 'accessChecker';
import $state from '$state';
import notification from 'notification';
import {track} from 'analytics/Analytics';

import * as Boilerplate from './BoilerplateCode';


/**
 * Create a controller for the API Key editor template
 *
 * The controller exposes the following properties on
 * `$scope.apiKeyEditor`.
 *
 * - `data.spaceId`
 * - `data.canEdit`
 * - `data.canDelete`
 * - `data.deliveryToken`
 * - `data.previewToken`
 * - `model.name`
 * - `actions.remove`
 * - `actions.save`
 */
export default function attach ($scope, apiKey) {
  initBoilerplate($scope);
  $scope.track = createTracker();

  $scope.apiKeyEditor = $scope.$new();
  update(apiKey);

  function update (apiKey) {
    $scope.apiKeyEditor.$destroy();
    $scope.apiKeyEditor = $scope.$new();
    init($scope.apiKeyEditor, $scope.context, apiKey, update);
  }
}


function initBoilerplate ($scope) {
  Boilerplate.get()
  .then((boilerplates) => {
    $scope.boilerplate = {
      available: boilerplates,
      selectedId: boilerplates[0].id
    };

    $scope.$watchGroup(['apiKeyEditor.data.deliveryToken', 'boilerplate.selectedId'], function ([deliveryToken, selectedId]) {
      const bp = find(boilerplates, (bp) => bp.id === selectedId);
      const instructions = $sce.trustAsHtml(marked(bp.instructions));
      assign($scope.boilerplate, {
        repoUrl: bp.repoUrl,
        sourceUrl: bp.sourceUrl(spaceContext.getId(), deliveryToken),
        platform: bp.platform,
        instructions: instructions
      });
    });
  });
}


// Re-initialize the api key editor for the given API key.
// `scope` is the child scope available as `apiKeyEditor` from the
// template.
// `stateContext` will be the context object attached to the main scope when
// initializing the state.
// `update` is a function that accepts an API key and rerenders the
// editor with the new key. This will destroy the previous scope.
function init ($scope, stateContext, apiKey, update) {
  const canEdit = accessChecker.canModifyApiKeys();
  const notify = makeNotifier(truncate(apiKey.name, 50));

  stateContext.requestLeaveConfirmation = leaveConfirmator(save);

  $scope.data = deepFreeze({
    spaceId: spaceContext.getId(),
    canEdit: canEdit,
    deliveryToken: apiKey.accessToken,
    previewToken: get(apiKey, 'preview_api_key.accessToken')
  });

  $scope.model = {
    name: apiKey.name
  };

  const name$ = K.fromScopeValue($scope, (s) => s.model.name).skipDuplicates();
  const modified$ = name$.map((name) => name !== apiKey.name).skipDuplicates();

  modified$.onValue((modified) => {
    stateContext.dirty = modified;
  });

  name$.onValue((name) => {
    stateContext.title = name || 'New Api Key';
  });


  $scope.remove = Command.create(remove);

  $scope.save = Command.create(save, {
    disabled: function () {
      return (
        $scope.apiKeyForm.$invalid ||
        accessChecker.shouldDisable('createApiKey') ||
        !K.getValue(modified$)
      );
    },
    available: constant($scope.data.canEdit)
  });

  function remove () {
    return spaceContext.apiKeyRepo.remove(apiKey.sys.id)
    .then(() => {
      $state.go('spaces.detail.api.keys.list')
      .then(() => {
        notify.deleteSuccess();
      });
    }, notify.deleteFail);
  }

  function save () {
    const name = K.getValue(name$);
    apiKey.name = name;
    return spaceContext.apiKeyRepo.save(apiKey)
    .then((newKey) => {
      notify.saveSuccess();
      update(newKey);
    }, notify.saveFail);
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


function createTracker () {
  return {
    copy (source) {
      track('api_key:clipboard_copy', {source});
    },
    boilerplate: {
      select (platform) {
        track('api_key:boilerplate', {action: 'select', platform});
      },
      download (platform) {
        track('api_key:boilerplate', {action: 'download', platform});
      },
      viewRepo (platform) {
        track('api_key:boilerplate', {action: 'github', platform});
      }
    }
  };
}
