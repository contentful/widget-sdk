'use strict';

angular.module('cf.app')
.directive('cfReferenceEditor', ['require', function (require) {

  var entitySelector = require('entitySelector');
  var State = require('app/widgets/link/State');
  var K = require('utils/kefir');
  var createEntity = require('cfReferenceEditor/createEntity');
  var modalDialog = require('modalDialog');
  var List = require('utils/List');

  return {
    restrict: 'E',
    scope: {
      type: '@',
      style: '@variant',
      single: '='
    },
    template: JST.cf_reference_editor(),
    controller: ['$scope', function ($scope) {
      // We need to define the uiSortable property in the pre-link
      // stage. The ui-sortable directive will obtain a reference to
      // the object that we can later modify.
      $scope.uiSortable = {update: _.noop};
    }],
    require: '^cfWidgetApi',
    link: link
  };

  function link ($scope, _$elem, _$attrs, widgetApi) {
    var field = widgetApi.field;
    var isDisabled$ = widgetApi.fieldProperties.isDisabled$;
    var state = State.create(field, widgetApi.fieldProperties.value$, widgetApi.space, $scope.type, $scope.single);

    $scope.typePlural = {Entry: 'entries', Asset: 'assets'}[$scope.type];
    $scope.isAssetCard = is('Asset', 'card');

    // Passed to cfEntityLink and cfAssetCard directive
    $scope.config = {
      showDetails: is('Entry', 'card'),
      asThumb: $scope.isAssetCard && !$scope.single
    };

    K.onValueScope($scope, isDisabled$, function (isDisabled) {
      $scope.config.draggable = !$scope.single && !isDisabled;
    });


    $scope.uiSortable.update = function () {
      // let uiSortable update the model, then sync
      $scope.$applyAsync(function () {
        state.setIds($scope.entityModels.map(function (model) {
          return model.value.id;
        }));
      });
    };

    $scope.helpers = widgetApi.entityHelpers;

    $scope.addNew = function (event) {
      event.preventDefault();
      createEntity($scope.type, field, widgetApi.space)
      .then(function (entity) {
        state.addEntities([entity]);
        widgetApi.state.goToEditor(entity);
      });
    };

    $scope.addExisting = function (event) {
      var currentSize = $scope.entityModels.length;
      event.preventDefault();
      entitySelector.open(field, currentSize)
      .then(state.addEntities);
    };

    // Property that holds the items that are rendered with the
    // 'cfEntityLink' directive.
    var entityModels$ = K.combine([state.entities$, isDisabled$], function (entities, isDisabled) {
      // entities is a list of [id, entityData] pairs
      if (entities) {
        return entities.map(function (value, index) {
          var id = value[0];
          var entity = value[1];
          return buildEntityModel(id, entity, index, isDisabled);
        });
      }
    });

    K.onValueScope($scope, entityModels$, function (models) {
      if (models) {
        // We could just use models but for performance reasons we use
        // a keyed list.
        $scope.entityModels = List.makeKeyed(models, function (model) {
          return model.hash;
        });
        $scope.isReady = true;
      }
    });

    var unregisterPublicationWarning = field.registerPublicationWarning({
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
      var models = $scope.entityModels || [];
      return models.filter(function (item) {
        if (item.value.entity) {
          return !item.value.entity.sys.publishedVersion;
        } else {
          return true;
        }
      });
    }

    function getWarningData () {
      var references = getUnpublishedReferences();

      return {
        fieldName: field.name + ' (' + field.locale + ')',
        count: references.length,
        linked: $scope.type,
        type: (references.length > 1 ? $scope.typePlural : $scope.type).toLowerCase()
      };
    }

    function showWarning (unpublishedRefs) {
      unpublishedRefs = _.filter(unpublishedRefs, function (ref) {
        return ref && ref.count > 0;
      });

      var counts = _.countBy(unpublishedRefs, 'linked');
      var linkedEntityTypes = [counts.Entry > 0 && 'entries', counts.Asset > 0 && 'assets'];

      return modalDialog.open({
        template: 'unpublished_references_warning',
        scopeData: {
          unpublishedRefs: unpublishedRefs,
          linkedEntityTypes: _.filter(linkedEntityTypes).join(' and ')
        }
      }).promise;
    }

    // Build an object that is passed to the 'cfEntityLink' directive
    function buildEntityModel (id, entity, index, isDisabled) {
      var edit = entity && !isDisabled
        ? _.partial(widgetApi.state.goToEditor, entity)
        : null;
      var remove = !isDisabled && _.partial(state.removeAt, index);

      var version = entity ? entity.sys.version : '';
      var hash = [id, version, isDisabled].join('!');

      return {
        id: id,
        entity: entity,
        hash: hash,
        actions: {
          edit: edit,
          remove: remove
        }
      };
    }
  }
}])

.factory('cfReferenceEditor/createEntity', ['require', function (require) {
  var modalDialog = require('modalDialog');

  return function createEntity (entityType, field, space) {
    if (entityType === 'Entry') {
      return maybeAskAndCreateEntry();
    } else if (entityType === 'Asset') {
      return space.createAsset({});
    } else {
      throw new TypeError('Unknown entity type ' + entityType);
    }

    function maybeAskAndCreateEntry () {
      return getAvailableContentTypes()
      .then(function (cts) {
        if (cts.length === 1) {
          return createEntry(cts[0]);
        } else {
          return askForContentType(cts)
          .then(createEntry);
        }
      });
    }

    function getAvailableContentTypes () {
      return space.getContentTypes()
      .then(function (res) {
        return _.filter(res.items, canCreate(field));
      });
    }

    function canCreate (field) {
      var validations = [].concat(field.validations || [], field.itemValidations || []);
      var found = _.find(validations, function (v) {
        return Array.isArray(v.linkContentType) || _.isString(v.linkContentType);
      });
      var linkedCts = found && found.linkContentType;
      linkedCts = _.isString(linkedCts) ? [linkedCts] : linkedCts;

      return function (ct) {
        var canLink = !linkedCts || linkedCts.indexOf(ct.sys.id) > -1;
        return !!ct.sys.publishedVersion && canLink;
      };
    }

    function askForContentType (cts) {
      return modalDialog.open({
        template: 'select_ct_of_new_entry',
        scopeData: {cts: cts}
      }).promise;
    }

    function createEntry (ct) {
      return space.createEntry(ct.sys.id, {});
    }
  };
}]);
