import { partial, countBy, filter, get } from 'lodash';
import * as K from 'utils/kefir';
import * as List from 'utils/List';

import entitySelector from 'entitySelector';
import modalDialog from 'modalDialog';
import createEntity from 'cfReferenceEditor/createEntity';
import spaceContext from 'spaceContext';
import { onFeatureFlag } from 'utils/LaunchDarkly';
import { track } from 'analytics/Analytics';
import { onEntryCreate as trackEntryCreate } from 'analytics/events/ReferenceEditor';

import * as State from './State';
import {
  canPerformActionOnEntryOfType,
  Action
} from 'access_control/AccessChecker';
import { canLinkToContentType } from './utils';

const FEATURE_LOTS_OF_CT_ADD_ENTRY_REDESIGN =
  'feature-at-11-2017-lots-of-cts-add-entry-and-link-reference';
const INLINE_REFERENCE_FEATURE_FLAG =
  'feature-at-02-2018-inline-reference-field';

export default function create ($scope, widgetApi) {
  const field = widgetApi.field;
  const isDisabled$ = widgetApi.fieldProperties.isDisabled$;
  const state = State.create(
    field,
    widgetApi.fieldProperties.value$,
    widgetApi.space,
    $scope.type,
    $scope.single
  );

  const useBulkEditor =
    widgetApi.settings.bulkEditing && !!widgetApi._internal.editReferences;
  $scope.typePlural = { Entry: 'entries', Asset: 'assets' }[$scope.type];
  $scope.isAssetCard = is('Asset', 'card');
  $scope.referenceType = {};

  // Passed to cfEntityLink and cfAssetCard directive
  $scope.config = {
    showDetails: is('Entry', 'card'),
    largeImage: $scope.isAssetCard && $scope.single,
    link: true
  };

  K.onValueScope($scope, isDisabled$, function (isDisabled) {
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
  onFeatureFlag($scope, INLINE_REFERENCE_FEATURE_FLAG, function (isEnabled) {
    const featureEnabledForField = true;
    const isAsset = $scope.isAssetCard;
    const isOneToOne = $scope.single;

    if (isAsset) {
      $scope.referenceType = { asset: true };
    } else if (widgetApi._internal.createReferenceContext && isEnabled && featureEnabledForField && isOneToOne) {
      $scope.referenceType = { inline: true };
    } else {
      $scope.referenceType = { link: true };
    }
  });

  $scope.uiSortable.update = function () {
    // let uiSortable update the model, then sync
    $scope.$applyAsync(function () {
      const entityModelIds = $scope.entityModels.map(function (model) {
        return model.value.id;
      });

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
  $scope.addNew = function (event) {
    event.preventDefault();
    const contentType = spaceContext.publishedCTs.get($scope.type);
    return createEntity($scope.type, field, widgetApi.space)
      .then(makeNewEntityHandler(contentType));
  };

  $scope.addNewAsset = function () {
    return widgetApi.space.createAsset({})
      .then(makeNewEntityHandler());
  };

  $scope.addNewEntry = function (contentTypeId) {
    const contentType = spaceContext.publishedCTs.get(contentTypeId);
    return widgetApi.space
      .createEntry(contentTypeId, {})
      .then(makeNewEntityHandler(contentType))
      .then(entry => {
        trackEntryCreate({ contentType });
        return entry;
      });
  };

  function makeNewEntityHandler (contentType) {
    return function (entity) {
      if (entity.sys.type === 'Entry') {
        track('entry:create', {
          eventOrigin: 'reference-editor',
          contentType: contentType,
          response: { data: entity }
        });
      }
      state.addEntities([entity]);
      editEntityAction(entity, -1);
      return entity;
    };
  }

  $scope.addExisting = function (event) {
    event.preventDefault && event.preventDefault();
    const currentSize = $scope.entityModels.length;
    entitySelector.openFromField(field, currentSize).then(state.addEntities);
  };

  // Property that holds the items that are rendered with the
  // 'cfEntityLink' directive.
  const entityModels$ = K.combine([state.entities$, isDisabled$], function (
    entities,
    isDisabled
  ) {
    // entities is a list of [id, entityData] pairs
    if (entities) {
      return entities.map(([id, entity], index) => {
        return buildEntityModel(id, entity, index, isDisabled);
      });
    }
  });

  K.onValueScope($scope, entityModels$, function (models) {
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

  $scope.$on('$destroy', function () {
    unregisterPublicationWarning();
  });

  function is (type, style) {
    return type === $scope.type && style === $scope.style;
  }

  function hasUnpublishedReferences () {
    return getUnpublishedReferences().length > 0;
  }

  function getUnpublishedReferences () {
    const models = $scope.entityModels || [];
    return models.filter(function (item) {
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
    unpublishedRefs = filter(unpublishedRefs, function (ref) {
      return ref && ref.count > 0;
    });

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
    let refCtxt = widgetApi._internal.createReferenceContext ? widgetApi._internal.createReferenceContext(index, state.refreshEntities) : null;

    // This is passed down to the bulk entity editor actions
    // to be able to unlink an entry when the bulk editor is
    // rendered inline.
    if (refCtxt) {
      refCtxt = {
        ...refCtxt,
        remove: prepareRemoveAction(index, isDisabled)
      };
    }

    return {
      id: id,
      entity: entity,
      contentType,
      hash: hash,
      actions: {
        edit: prepareEditAction(entity, index, isDisabled),
        remove: prepareRemoveAction(index, isDisabled)
      },
      // TODO: This is used to create multiple reference contexts
      // to be able to open multiple instances of the bulk editor
      // simultaneously. This will be null if it is a nested reference.
      refCtxt: refCtxt
    };
  }

  function prepareEditAction (entity, index, isDisabled) {
    const entryId = widgetApi.entry.getSys().id;
    const linksParentEntry =
      entity && entity.sys.type === 'Entry' && entity.sys.id === entryId;

    if (entity && !isDisabled && !linksParentEntry && useBulkEditor) {
      return function () {
        widgetApi._internal.editReferences(index, state.refreshEntities);
      };
    } else {
      return null;
    }
  }

  function editEntityAction (entity, index) {
    if (useBulkEditor) {
      return widgetApi._internal.editReferences(index, state.refreshEntities);
    } else if (!$scope.referenceType.inline) {
      return widgetApi.state.goToEditor(entity);
    }
  }

  function prepareRemoveAction (index, isDisabled) {
    return isDisabled ? null : partial(state.removeAt, index);
  }
}
