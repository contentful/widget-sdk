import {partial, countBy, filter} from 'lodash';
import * as K from 'utils/kefir';
import * as List from 'utils/List';

import entitySelector from 'entitySelector';
import modalDialog from 'modalDialog';
import createEntity from 'cfReferenceEditor/createEntity';
import spaceContext from 'spaceContext';
import { onFeatureFlag } from 'utils/LaunchDarkly';
import { track } from 'analytics/Analytics';

import * as State from './State';
import { getAvailableContentTypes } from './utils';

export default function create ($scope, widgetApi) {
  const field = widgetApi.field;
  const isDisabled$ = widgetApi.fieldProperties.isDisabled$;
  const state = State.create(field, widgetApi.fieldProperties.value$, widgetApi.space, $scope.type, $scope.single);
  const useBulkEditor =
    widgetApi.settings.bulkEditing &&
    widgetApi._internal.editReferences;

  $scope.typePlural = {Entry: 'entries', Asset: 'assets'}[$scope.type];
  $scope.isAssetCard = is('Asset', 'card');

  // Passed to cfEntityLink and cfAssetCard directive
  $scope.config = {
    showDetails: is('Entry', 'card'),
    largeImage: $scope.isAssetCard && $scope.single,
    link: true
  };

  K.onValueScope($scope, isDisabled$, function (isDisabled) {
    $scope.config.draggable = !$scope.single && !isDisabled;
  });

  onFeatureFlag(
    $scope,
    'feature-at-11-2017-lots-of-cts-add-entry-and-link-reference',
    function (variation) {
      $scope.isNewAddAndLinkRefButtonEnabled = variation;
    }
  );

  $scope.uiSortable.update = function () {
    // let uiSortable update the model, then sync
    $scope.$applyAsync(function () {
      state.setIds($scope.entityModels.map(function (model) {
        return model.value.id;
      }));
    });
  };

  $scope.helpers = widgetApi.entityHelpers;

  $scope.allowedCTs = [];
  getAvailableContentTypes(widgetApi.space, field).then(cts => {
    $scope.allowedCTs = cts;
  });

  $scope.addNew = function (event) {
    if (event.preventDefault) {
      event.preventDefault();
      const contentType = spaceContext.publishedCTs.get($scope.type);
      createEntity($scope.type, field, widgetApi.space)
        .then(function (entity) {
          if ($scope.type === 'Entry') {
            track('entry:create', {
              eventOrigin: 'reference-editor',
              contentType: contentType,
              response: { data: entity }
            });
          }
          state.addEntities([entity]);
          editEntityAction(entity, -1);
        });
    } else {
      let newEntityPromise;

      if ($scope.type === 'Entry') {
        // With the new ref button, event is actually the CT id.
        // TODO: Clean this up once we roll out feature-at-11-2017-lots-of-cts-add-entry-and-link-reference
        // to everyone.
        const contentTypeId = event;
        const contentType = spaceContext.publishedCTs.get(contentTypeId);

        newEntityPromise = widgetApi.space.createEntry(contentTypeId, {})
          .then((entry) => {
            track('entry:create', {
              eventOrigin: 'reference-editor',
              contentType: contentType,
              response: { data: entry }
            });
            return entry;
          });
      } else {
        newEntityPromise = widgetApi.space.createAsset({});
      }

      newEntityPromise
        .then(entity => {
          state.addEntities([entity]);
          editEntityAction(entity, -1);
        });
    }
  };

  $scope.addExisting = function (event) {
    event.preventDefault && event.preventDefault();
    const currentSize = $scope.entityModels.length;
    entitySelector.openFromField(field, currentSize)
    .then(state.addEntities);
  };

  // Property that holds the items that are rendered with the
  // 'cfEntityLink' directive.
  const entityModels$ = K.combine([state.entities$, isDisabled$], function (entities, isDisabled) {
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
      $scope.entityModels = List.makeKeyed(models, (model) => model.hash);
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
      type: (references.length > 1 ? $scope.typePlural : $scope.type).toLowerCase()
    };
  }

  function showWarning (unpublishedRefs) {
    unpublishedRefs = filter(unpublishedRefs, function (ref) {
      return ref && ref.count > 0;
    });

    const counts = countBy(unpublishedRefs, 'linked');
    const linkedEntityTypes = [counts.Entry > 0 && 'entries', counts.Asset > 0 && 'assets'];

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
    const contentTypeId = entity && entity.sys.contentType && entity.sys.contentType.sys.id;
    const hash = [id, version, isDisabled, contentTypeId].join('!');

    const contentType = contentTypeId && spaceContext.publishedCTs.fetch(contentTypeId);

    return {
      id: id,
      entity: entity,
      contentType,
      hash: hash,
      actions: {
        edit: prepareEditAction(entity, index, isDisabled),
        remove: prepareRemoveAction(index, isDisabled)
      }
    };
  }

  function prepareEditAction (entity, index, isDisabled) {
    const entryId = widgetApi.entry.getSys().id;
    const linksParentEntry = entity &&
      entity.sys.type === 'Entry' &&
      entity.sys.id === entryId;

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
    } else {
      return widgetApi.state.goToEditor(entity);
    }
  }

  function prepareRemoveAction (index, isDisabled) {
    return isDisabled ? null : partial(state.removeAt, index);
  }
}
