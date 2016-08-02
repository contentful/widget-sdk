'use strict';

angular.module('cf.app')
.directive('cfReferenceEditor', ['require', function (require) {

  var $timeout = require('$timeout');
  var entitySelector = require('entitySelector');
  var createEntityStore = require('EntityStore').create;
  var createEntity = require('cfReferenceEditor/createEntity');
  var $q = require('$q');
  var modalDialog = require('modalDialog');

  return {
    restrict: 'E',
    scope: {
      type: '@',
      style: '@variant',
      single: '='
    },
    template: JST.cf_reference_editor(),
    controller: ['$scope', function ($scope) {
      $scope.uiSortable = {update: _.noop};
    }],
    require: '^cfWidgetApi',
    link: link
  };

  function link ($scope, _$elem, _$attrs, widgetApi) {
    var field = widgetApi.field;
    var fetchMethod = {Entry: 'getEntries', Asset: 'getAssets'}[$scope.type];
    var store = createEntityStore(widgetApi.space, fetchMethod);

    $scope.typePlural = {Entry: 'entries', Asset: 'assets'}[$scope.type];
    $scope.isAssetCard = is('Asset', 'card');

    $scope.config = {
      draggable: !$scope.single,
      showDetails: is('Entry', 'card'),
      asThumb: $scope.isAssetCard && !$scope.single
    };

    $scope.uiSortable.update = function () {
      // let uiSortable update the model, then sync
      $timeout(syncValue);
    };

    $scope.store = store;
    $scope.helpers = widgetApi.entityHelpers;
    $scope.actions = {
      removeFromList: removeFromList,
      goToEditor: widgetApi.state.goToEditor
    };

    $scope.addNew = function (event) {
      event.preventDefault();
      createEntity($scope.type, field, widgetApi.space)
      .then(function (entity) {
        linkEntity(entity);
        syncValue();
        widgetApi.state.goToEditor(entity);
      });
    };

    $scope.addExisting = function (event) {
      event.preventDefault();
      entitySelector.open(field, unwrapLinks())
      .then(function (entities) {
        _.forEach(entities, linkEntity);
        syncValue();
      });
    };

    var offValueChange = field.onValueChanged(function (links) {
      if (!Array.isArray(links)) {
        links = links ? [links] : [];
      }

      store.prefetch(links).then(function () {
        $scope.links = _.map(links, wrapLink);
        $scope.isReady = true;
      });
    });

    var offDisabledChange = field.onDisabledStatusChanged(function (isDisabled) {
      $scope.isDisabled = isDisabled;
    });

    var unregisterPublicationWarning = field.registerPublicationWarning(hasUnpublishedReferences, showWarning);

    $scope.$on('$destroy', function () {
      offValueChange();
      offDisabledChange();
      unregisterPublicationWarning();
    });

    function is (type, style) {
      return type === $scope.type && style === $scope.style;
    }

    function linkEntity (entity) {
      store.add(entity);
      $scope.links.push(wrapLink(createLink(entity)));
    }

    function removeFromList (link) {
      var index = _.findIndex($scope.links, function (item) {
        return item.link === link;
      });

      if (index > -1) {
        $scope.links.splice(index, 1);
        syncValue();
      }
    }

    function syncValue () {
      var links = unwrapLinks();
      if (links.length < 1) {
        field.removeValue();
      } else {
        links = $scope.single ? links[0] : links;
        field.setValue(links);
      }
    }

    function unwrapLinks () {
      return _.map($scope.links, 'link');
    }

    function hasUnpublishedReferences () {
      return getUnpublishedReferences().length > 0;
    }

    function getUnpublishedReferences () {
      return _.filter(_.map(unwrapLinks(), store.get), function (data) {
        return !dotty.get(data, 'sys.publishedVersion', false);
      });
    }

    function showWarning () {
      var numberOfReferences = getUnpublishedReferences().length;

      return modalDialog.openConfirmDialog({
        title: 'Unpublished references',
        message: [
          'The field <strong>' + field.name + ' (' + field.locale + ')</strong>',
          'references ' + numberOfReferences + ' unpublished',
          (numberOfReferences > 1 ? $scope.typePlural : $scope.type.toLowerCase()) + '.',
          'Do you want to continue?'
        ].join(' ')
      })
      .then(function (result) {
        return $q[result.confirmed ? 'resolve' : 'reject']();
      });
    }
  }

  /**
   * We cannot use linked entity's ID to track list items
   * because link to the same entity may occur on the list
   * more than once.
   *
   * When not tracking, Angular adds $$hashKey property that
   * may break putting values to ShareJS. As a workaround
   * we use list of wrapped links that we unwrap before sync.
   */
  function wrapLink (link) {
    return {link: link};
  }

  function createLink (entity) {
    return {
      sys: {
        id: entity.sys.id,
        linkType: entity.sys.type,
        type: 'Link'
      }
    };
  }
}])

.factory('cfReferenceEditor/createEntity', ['require', function (require) {

  var modalDialog = require('modalDialog');
  var $q = require('$q');

  return function createEntity (entityType, field, space) {
    if (entityType === 'Entry') {
      return maybeAskAndCreateEntry();
    } else if (entityType === 'Asset') {
      return space.createAsset({});
    }

    return $q.reject();

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
      var validation = _.find(field.itemValidations, function (validation) {
        return Array.isArray(validation.linkContentType);
      });
      var linkedCts = validation && validation.linkContentType;

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
