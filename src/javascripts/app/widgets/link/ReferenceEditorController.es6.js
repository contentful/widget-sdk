import { countBy, filter, get } from 'lodash';
import * as K from 'utils/kefir';
import * as List from 'utils/List';

import entitySelector from 'entitySelector';
import modalDialog from 'modalDialog';
import createEntity from 'cfReferenceEditor/createEntity';
import spaceContext from 'spaceContext';
import { onFeatureFlag } from 'utils/LaunchDarkly';
import { track } from 'analytics/Analytics';
import { onEntryCreate as trackEntryCreate, onEntryEdit as trackEntryEdit } from 'analytics/events/ReferenceEditor';

import $state from '$state';

import * as State from './State';
import {
  canPerformActionOnEntryOfType,
  Action
} from 'access_control/AccessChecker';
import { canLinkToContentType, getInlineEditingStoreKey } from './utils';
import { getStore } from 'TheStore';

import {
  getSlideInEntities,
  goToSlideInEntity as goToSlideInEntityBase
} from 'states/EntityNavigationHelpers';

const FEATURE_LOTS_OF_CT_ADD_ENTRY_REDESIGN =
  'feature-at-11-2017-lots-of-cts-add-entry-and-link-reference';
const INLINE_REFERENCE_FEATURE_FLAG =
  'feature-at-02-2018-inline-reference-field';
const SLIDEIN_ENTRY_EDITOR_FEATURE_FLAG =
  'feature-at-05-2018-sliding-entry-editor-multi-level';

export default function create ($scope, widgetApi) {
  const store = getStore();
  const {
    field,
    fieldProperties: { isDisabled$ },
    contentType: { sys: { id: contentTypeId } }
  } = widgetApi;
  const state = State.create(
    field,
    widgetApi.fieldProperties.value$,
    widgetApi.space,
    $scope.type,
    $scope.single
  );

  let slideInEditorEnabled = false;
  const canEditReferences = !!widgetApi._internal.editReferences;
  const bulkEditorEnabled = canEditReferences && widgetApi.settings.bulkEditing;
  $scope.canAddNewAsset = true;
  $scope.typePlural = { Entry: 'entries', Asset: 'assets' }[$scope.type];
  $scope.isAssetCard = is('Asset', 'card');
  $scope.referenceType = {};
  $scope.$on(
    'ct-expand-state:toggle',
    (_event, [...args]) => handleInlineReferenceEditorToggle(...args)
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

  onFeatureFlag($scope, FEATURE_LOTS_OF_CT_ADD_ENTRY_REDESIGN,
    (isEnabled) => {
      $scope.isNewAddAndLinkRefButtonEnabled = isEnabled;
    }
  );

  // TODO: This is for inline reference editing
  // BETA release. Remove this once we are done with
  // the experiment.
  onFeatureFlag($scope, INLINE_REFERENCE_FEATURE_FLAG, isEnabled => {
    $scope.isInlineEditingEnabled = isEnabled;
    const featureEnabledForField = isInlineEditingEnabledForField();
    const isAsset = $scope.isAssetCard;
    const isOneToOne = !!$scope.single;

    if (isAsset) {
      $scope.referenceType = { asset: true };
    } else if (widgetApi._internal.createReferenceContext && isEnabled && featureEnabledForField && isOneToOne) {
      $scope.referenceType = { inline: true };
    } else {
      $scope.referenceType = { link: true };
    }
  });

  onFeatureFlag($scope, SLIDEIN_ENTRY_EDITOR_FEATURE_FLAG, flagState => {
    const isEnabled = flagState === 2;
    $scope.isSlideinEntryEditorEnabled = isEnabled;
    if (!slideInEditorEnabled && canEditReferences && isEnabled) {
      slideInEditorEnabled = true;
    }
  });

  function isInlineEditingEnabledForField () {
    const ctExpandedStoreKey = getInlineEditingStoreKey(
      spaceContext.user.sys.id,
      contentTypeId,
      field.id,
      field.locale
    );
    return store.get(ctExpandedStoreKey);
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

  function updateAccessibleCts () {
    $scope.allowedCTs = spaceContext.publishedCTs
      .getAllBare()
      .filter(contentType => {
        return canPerformActionOnEntryOfType(Action.CREATE, contentType.sys.id);
      })
      .filter((ct) => canLinkToContentType(field, ct));
  }

  // TODO: Legacy code to be removed with FEATURE_LOTS_OF_CT_ADD_ENTRY_REDESIGN
  $scope.addNew = event => {
    event.preventDefault();
    const contentType = spaceContext.publishedCTs.get($scope.type);
    return createEntity($scope.type, field, widgetApi.space)
      .then(makeNewEntityHandler(contentType));
  };

  $scope.addNewAsset = () => {
    if (!$scope.canAddNewAsset) {
      return;
    }
    $scope.canAddNewAsset = false;
    return widgetApi.space.createAsset({})
      .then(makeNewEntityHandler())
      .then(() => { $scope.canAddNewAsset = true; });
  };

  $scope.addNewEntry = contentTypeId => {
    const contentType = spaceContext.publishedCTs.get(contentTypeId);
    if ($scope.referenceType.inline) {
      // necessary to prompt loading state
      $scope.isReady = false;
    }

    return widgetApi.space
      .createEntry(contentTypeId, {})
      .then(makeNewEntityHandler(contentType))
      .then(entry => {
        if ($scope.single) {
          trackEntryCreate({
            contentType,
            isInlineEditingFeatureFlagEnabled: $scope.isInlineEditingEnabled,
            isInlineEditingEnabledForField: isInlineEditingEnabledForField()
          });
        }
        track('reference_editor_actions:create', { ctId: contentTypeId });
        return entry;
      });
  };

  function makeNewEntityHandler (contentType) {
    return entity => {
      if ($scope.referenceType.inline) {
        $scope.isReady = true;
      }
      const numEntities = getSlideInEntities().length;
      const shouldTrackSlideInOpen =
        slideInEditorEnabled &&
        (!bulkEditorEnabled || numEntities > 1);

      state.addEntities([entity]);
      editEntityAction(entity, -1);

      if (shouldTrackSlideInOpen) {
        track('slide_in_editor:open_create', {
          targetSlideLevel: numEntities,
          currentSlideLevel: numEntities - 1
        });
      }

      if (entity.sys.type === 'Entry') {
        track('entry:create', {
          eventOrigin: 'reference-editor',
          contentType: contentType,
          response: { data: entity }
        });
      }

      return entity;
    };
  }

  $scope.addExisting = event => {
    event.preventDefault && event.preventDefault();
    const currentSize = $scope.entityModels.length;
    entitySelector.openFromField(field, currentSize).then((entities) => {
      if ($scope.isAssetCard === false) {
        entities.map(entity => track('reference_editor_actions:link', { ctId: entity.sys.contentType.sys.id }));
      }
      state.addEntities(entities);
    });
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

  const unregisterPublicationWarning = field.registerPublicationWarning({
    group: 'reference_widget_unpublished_references',
    shouldShow: hasUnpublishedReferences,
    warnFn: showWarning,
    getData: getWarningData
  });

  const unlistenStateChangeSuccess = $scope.$on('$stateChangeSuccess', state.refreshEntities);
  const unlistenLocationChangeSuccess = $scope.$on('$locationChangeSuccess', state.refreshEntities);

  $scope.$on('$destroy', () => {
    unregisterPublicationWarning();
    unlistenStateChangeSuccess();
    unlistenLocationChangeSuccess();
  });

  function is (type, style) {
    return type === $scope.type && style === $scope.style;
  }

  function hasUnpublishedReferences () {
    return getUnpublishedReferences().length > 0;
  }

  function handleInlineReferenceEditorToggle (id, locale, enableInlineEditing) {
    if (id !== field.id || locale !== field.locale) {
      return;
    }
    if (enableInlineEditing) {
      $scope.referenceType = { inline: true };
      return;
    }
    const type = $scope.isAssetCard ? 'asset' : 'link';
    $scope.referenceType = { [type]: true };
  }

  function getUnpublishedReferences () {
    const models = $scope.entityModels || [];
    return models.filter(item => {
      if (item.value.entity) {
        return !item.value.entity.sys.publishedVersion;
      } else {
        return true;
      }
    });
  }

  function getWarningData () {
    const references = getUnpublishedReferences();

    return {
      fieldName: field.name + ' (' + field.locale + ')',
      count: references.length,
      linked: $scope.type,
      type: (references.length > 1
        ? $scope.typePlural
        : $scope.type
      ).toLowerCase()
    };
  }

  function showWarning (unpublishedRefs) {
    unpublishedRefs = filter(unpublishedRefs, ref => ref && ref.count > 0);

    const counts = countBy(unpublishedRefs, 'linked');
    const linkedEntityTypes = [
      counts.Entry > 0 && 'entries',
      counts.Asset > 0 && 'assets'
    ];

    return modalDialog.open({
      template: 'unpublished_references_warning',
      scopeData: {
        unpublishedRefs: unpublishedRefs,
        linkedEntityTypes: filter(linkedEntityTypes).join(' and ')
      }
    }).promise;
  }

  // Build an object that is passed to the 'cfEntityLink' directive
  function buildEntityModel (id, entity, index, isDisabled) {
    const version = entity ? entity.sys.version : '';
    const contentTypeId = get(entity, 'sys.contentType.sys.id');
    const hash = [id, version, isDisabled, contentTypeId].join('!');
    const contentType =
      contentTypeId && spaceContext.publishedCTs.fetch(contentTypeId);

    // This is passed down to the bulk entity editor actions
    // to be able to unlink an entry when the bulk editor is
    // rendered inline.
    let refCtxt;
    if (widgetApi._internal.createReferenceContext) {
      refCtxt = {
        ...widgetApi._internal.createReferenceContext(index, state.refreshEntities),
        remove: prepareRemoveAction(index, isDisabled)
      };
    } else {
      refCtxt = null;
    }

    const entityModel = {
      id,
      entity,
      contentType,
      hash,
      actions: {
        edit: prepareEditAction(entity, index, isDisabled),
        remove: prepareRemoveAction(index, isDisabled),
        trackEdit: () => trackEdit(entity),
        inlineEdit: () => goToSlideInEntity(entity)
      },
      // TODO: This is used to create multiple reference contexts
      // to be able to open multiple instances of the bulk editor
      // simultaneously. This will be null if it is a nested reference.
      refCtxt
    };

    const shouldSlideIn =
      $scope.isSlideinEntryEditorEnabled &&
      !bulkEditorEnabled &&
      refCtxt !== null &&
      !$state.params.inlineEntryId;

    if (shouldSlideIn && entity) {
      entityModel.actions.slideinEdit = () => goToSlideInEntity(entity);
    }

    return entityModel;
  }

  function prepareEditAction (entity, index, isDisabled) {
    if (entity && !isDisabled && !isCurrentEntry(entity) && bulkEditorEnabled) {
      return $event => {
        if ($event && $event.preventDefault) {
          $event.preventDefault();
        }
        bulkEditorAction(entity, index);
      };
    } else {
      return null;
    }
  }

  function trackEdit (entity) {
    // only track for 1:1 entry references that will open in a new entry editor.
    if (entity.sys.type === 'Entry' && !!$scope.single && !isCurrentEntry(entity)) {
      trackEntryEdit({
        contentType: spaceContext.publishedCTs.get(
          entity.sys.contentType.sys.id
        ),
        isInlineEditingFeatureFlagEnabled: $scope.isInlineEditingEnabled
      });
    }
  }

  function editEntityAction (entity, index) {
    if ($scope.referenceType.inline) {
      return;
    } else if (bulkEditorEnabled) {
      bulkEditorAction(entity, index);
    } else if (slideInEditorEnabled) {
      goToSlideInEntity(entity);
    } else {
      widgetApi.state.goToEditor(entity);
    }
  }

  function bulkEditorAction (entity, index) {
    if (getSlideInEntities().length > 1) {
      trackOpenSlideIn();
      goToSlideInEntity(entity);
    } else {
      widgetApi._internal.editReferences(index, state.refreshEntities);
    }
  }

  function trackOpenSlideIn () {
    track('bulk_editor:open_slide_in', {
      parentEntryId: widgetApi.entry.getSys().id,
      refCount: $scope.entityModels.length
    });
  }

  function goToSlideInEntity ({ sys: { id, type } }) {
    return goToSlideInEntityBase(
      { id, type },
      $scope.isSlideinEntryEditorEnabled
    );
  }

  function prepareRemoveAction (index, isDisabled) {
    if (isDisabled) {
      return null;
    } else {
      return () => {
        if ($scope.isAssetCard === false) {
          track('reference_editor_actions:delete', {
            ctId:
              $scope.entityModels[index].value.entity.sys.contentType.sys.id
          });
        }
        state.removeAt(index);
      };
    }
  }

  function isCurrentEntry (entity) {
    return entity.sys.id === widgetApi.entry.getSys().id;
  }
}
