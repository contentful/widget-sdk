import { find, get } from 'lodash';
import * as K from 'utils/kefir.es6';
import * as List from 'utils/List.es6';

import { onFeatureFlag } from 'utils/LaunchDarkly/index.es6';
import { track } from 'analytics/Analytics.es6';
import {
  onEntryCreate as trackEntryCreate,
  onEntryEdit as trackEntryEdit
} from 'analytics/events/ReferenceEditor.es6';
import {
  getSlideInEntities,
  goToSlideInEntity as goToSlideInEntityBase
} from 'navigation/SlideInNavigator/index.es6';

import * as State from './State.es6';

import {
  canPerformActionOnEntryOfType,
  canCreateAsset,
  Action
} from 'access_control/AccessChecker/index.es6';
import { canLinkToContentType } from './utils.es6';
import { getModule } from 'NgRegistry.es6';

const entitySelector = getModule('entitySelector');
const createEntity = getModule('cfReferenceEditor/createEntity');
const spaceContext = getModule('spaceContext');

const FEATURE_LOTS_OF_CT_ADD_ENTRY_REDESIGN =
  'feature-at-11-2017-lots-of-cts-add-entry-and-link-reference';

export default function create($scope, widgetApi) {
  const {
    field,
    fieldProperties: { isDisabled$ }
  } = widgetApi;
  const state = State.create(
    field,
    widgetApi.fieldProperties.value$,
    widgetApi.space,
    $scope.type,
    $scope.single
  );

  const isBulkEditorEnabled = widgetApi.settings.bulkEditing;
  const isAnotherBulkEditorOpen = () => find(getSlideInEntities(), { type: 'BulkEditor' });
  $scope.canCreateAsset = canCreateAsset();
  $scope.isAssetCreationInProgress = true;
  $scope.typePlural = { Entry: 'entries', Asset: 'assets' }[$scope.type];
  $scope.isAssetCard = is('Asset', 'card');
  $scope.referenceType = {};
  $scope.$on('ct-expand-state:toggle', (_event, [...args]) =>
    handleInlineReferenceEditorToggle(...args)
  );

  // Passed to cfEntityLink and cfAssetCard directive
  $scope.config = {
    showDetails: is('Entry', 'card'),
    largeImage: $scope.isAssetCard && $scope.single,
    link: true
  };

  K.onValueScope($scope, isDisabled$, isDisabled => {
    $scope.isDisabled = isDisabled;
    $scope.config.draggable = !$scope.single && !isDisabled;
  });

  onFeatureFlag($scope, FEATURE_LOTS_OF_CT_ADD_ENTRY_REDESIGN, isEnabled => {
    $scope.isNewAddAndLinkRefButtonEnabled = isEnabled;
  });

  const isAsset = $scope.isAssetCard;

  if (isAsset) {
    $scope.referenceType = { asset: true };
  } else {
    $scope.referenceType = { link: true };
  }

  $scope.uiSortable.update = () => {
    // let uiSortable update the model, then sync
    $scope.$applyAsync(() => {
      const entityModelIds = $scope.entityModels.map(model => model.value.id);

      state.setIds(entityModelIds);
    });
  };

  $scope.helpers = widgetApi.entityHelpers;

  $scope.allowedCTs = [];

  K.onValueScope($scope, spaceContext.publishedCTs.items$, () => updateAccessibleCts());

  function updateAccessibleCts() {
    $scope.allowedCTs = spaceContext.publishedCTs
      .getAllBare()
      .filter(contentType => {
        return canPerformActionOnEntryOfType(Action.CREATE, contentType.sys.id);
      })
      .filter(ct => canLinkToContentType(field, ct));
  }

  // TODO: Legacy code to be removed with FEATURE_LOTS_OF_CT_ADD_ENTRY_REDESIGN
  $scope.addNew = event => {
    event.preventDefault();
    const contentType = spaceContext.publishedCTs.get($scope.type);
    return createEntity($scope.type, field, widgetApi.space).then(
      makeNewEntityHandler(contentType)
    );
  };

  $scope.addNewAsset = makeAddNewEntityHandler(() => {
    return widgetApi.space.createAsset({}).then(makeNewEntityHandler());
  });

  $scope.addNewEntry = makeAddNewEntityHandler(contentTypeId => {
    const contentType = spaceContext.publishedCTs.get(contentTypeId);
    return widgetApi.space
      .createEntry(contentTypeId, {})
      .then(makeNewEntityHandler(contentType))
      .then(entry => {
        if ($scope.single) {
          trackEntryCreate({
            contentType
          });
        }
        track('reference_editor_action:create', { ctId: contentTypeId });
        return entry;
      });
  });

  function makeAddNewEntityHandler(fn) {
    let currentJob;
    return (...args) => {
      if (currentJob) {
        return currentJob;
      }
      $scope.isAssetCreationInProgress = false;
      currentJob = fn(...args).then(doneHandler, doneHandler);
      return currentJob;
    };
    function doneHandler(result) {
      $scope.isAssetCreationInProgress = true;
      currentJob = null;
      return result;
    }
  }

  function makeNewEntityHandler(contentType) {
    return entity => {
      state.addEntities([entity]);
      const slideEventData = editEntityAction(entity, -1);
      track('slide_in_editor:open_create', slideEventData);

      if (entity.sys.type === 'Entry') {
        track('entry:create', {
          eventOrigin: 'reference-editor',
          contentType,
          response: { data: entity }
        });
      }

      return entity;
    };
  }

  $scope.addExisting = event => {
    event.preventDefault && event.preventDefault();
    const currentSize = $scope.entityModels.length;
    entitySelector.openFromField(field, currentSize).then(
      entities => {
        if ($scope.type !== 'Asset') {
          entities.map(entity =>
            track('reference_editor_action:link', { ctId: get(entity, 'sys.contentType.sys.id') })
          );
        }
        state.addEntities(entities);
      },
      e => {
        if (e) {
          return Promise.reject(e);
        }
        // User cancelled.
      }
    );
  };

  // Property that holds the items that are rendered with the
  // 'cfEntityLink' directive.
  const entityModels$ = K.combine([state.entities$, isDisabled$], (entities, isDisabled) => {
    // entities is a list of [id, entityData] pairs
    if (entities) {
      return entities.map(([id, entity], index) => {
        return buildEntityModel(id, entity, index, isDisabled);
      });
    }
  });

  K.onValueScope($scope, entityModels$, models => {
    if (models) {
      // We could just use models but for performance reasons we use
      // a keyed list.
      $scope.entityModels = List.makeKeyed(models, model => model.hash);
      $scope.isReady = true;
    }
  });

  const unregisterPublicationWarning = field.registerUnpublishedReferencesWarning({
    getData: () => ({
      field,
      references: getUnpublishedReferences()
    })
  });

  const unlistenStateChangeSuccess = $scope.$on('$stateChangeSuccess', state.refreshEntities);
  const unlistenLocationChangeSuccess = $scope.$on('$locationChangeSuccess', state.refreshEntities);

  $scope.$on('$destroy', () => {
    unregisterPublicationWarning();
    unlistenStateChangeSuccess();
    unlistenLocationChangeSuccess();
  });

  function is(type, style) {
    return type === $scope.type && style === $scope.style;
  }

  function handleInlineReferenceEditorToggle(id, locale) {
    if (id !== field.id || locale !== field.locale) {
      return;
    }
    const type = $scope.isAssetCard ? 'asset' : 'link';
    $scope.referenceType = { [type]: true };
  }

  function getUnpublishedReferences() {
    const models = $scope.entityModels || [];
    return models
      .filter(item => {
        if (item.value.entity) {
          return !item.value.entity.sys.publishedVersion;
        } else {
          return false;
        }
      })
      .map(item => item.value.entity);
  }

  // Build an object that is passed to the 'cfEntityLink' directive
  function buildEntityModel(id, entity, index, isDisabled) {
    const version = entity ? entity.sys.version : '';
    const contentTypeId = get(entity, 'sys.contentType.sys.id');
    const hash = [id, version, isDisabled, contentTypeId].join('!');
    const contentType = contentTypeId && spaceContext.publishedCTs.fetch(contentTypeId);
    return {
      id,
      entity,
      contentType,
      hash,
      actions: {
        edit: prepareEditAction(entity, index),
        remove: prepareRemoveAction(index, isDisabled)
      }
    };
  }

  function prepareEditAction(entity, index) {
    return _event => {
      if (!entity || isCurrentEntry(entity)) {
        return;
      }
      const slideEventData = editEntityAction(entity, index);
      track('slide_in_editor:open', slideEventData);
      trackEdit(entity);
    };
  }

  // TODO: We should get rid of this affordable tracking introduced for inline editing.
  function trackEdit(entity) {
    // only track for 1:1 entry references that will open in a new entry editor.
    if (entity.sys.type === 'Entry' && !!$scope.single && !isCurrentEntry(entity)) {
      trackEntryEdit({
        contentType: spaceContext.publishedCTs.get(entity.sys.contentType.sys.id)
      });
    }
  }

  function editEntityAction(entity, index) {
    if (isBulkEditorEnabled) {
      if (!isAnotherBulkEditorOpen()) {
        return bulkEditorAction(index);
      } else {
        // Limiting the user to only one bulk editor was decided for the sake of
        // UX and performance. Since the bulk editor as a slide refactoring we allow
        // the bulk editor to be opened from any slide level, not just the first one.
        trackOpenSlideInInsteadOfBulk();
      }
    }
    return goToSlideInEntity(entity);
  }

  function bulkEditorAction(index) {
    const path = [widgetApi.entry.getSys().id, field.id, field.locale, index];
    return goToSlideInEntityBase({ type: 'BulkEditor', path });
  }

  function trackOpenSlideInInsteadOfBulk() {
    track('bulk_editor:open_slide_in', {
      parentEntryId: widgetApi.entry.getSys().id,
      refCount: $scope.entityModels.length
    });
  }

  function goToSlideInEntity({ sys: { id, type } }) {
    return goToSlideInEntityBase({ id, type });
  }

  function prepareRemoveAction(index, isDisabled) {
    if (isDisabled) {
      return null;
    } else {
      return () => {
        if ($scope.type !== 'Asset') {
          track('reference_editor_action:delete', {
            ctId: get($scope.entityModels, [
              index,
              'value',
              'entity',
              'sys',
              'contentType',
              'sys',
              'id'
            ])
          });
        }
        state.removeAt(index);
      };
    }
  }

  function isCurrentEntry(entity) {
    return entity.sys.id === widgetApi.entry.getSys().id;
  }
}
