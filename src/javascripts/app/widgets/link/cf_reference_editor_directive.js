'use strict';

angular.module('cf.app')
.directive('cfReferenceEditor', ['$injector', function ($injector) {

  var $timeout = $injector.get('$timeout');
  var entitySelector = $injector.get('entitySelector');
  var createEntityStore = $injector.get('EntityStore').create;

  return {
    restrict: 'E',
    scope: {
      type: '@',
      style: '@',
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
    $scope.uiSortable.update = function () {
      // let uiSortable update the model, then sync
      $timeout(syncValue);
    };

    field.onValueChanged(function (links) {
      if (!Array.isArray(links)) {
        links = links ? [links] : [];
      }

      store.prefetch(links).then(function () {
        $scope.links = _.map(links, wrapLink);
      });
    });

    /**
     * @ngdoc method
     * @name cfLinksEditor#$scope.is
     * @returns {boolean}
     */
    $scope.is = function (type, style) {
      return type === $scope.type && style === $scope.style;
    };

    /**
     * @ngdoc method
     * @name cfLinksEditor#$scope.addNew
     * @returns {void}
     */
    $scope.addNew = function () {
      console.log('Not implemented yet.');
    };

    /**
     * @ngdoc method
     * @name cfLinksEditor#$scope.addExisting
     * @returns {void}
     */
    $scope.addExisting = function () {
      entitySelector.open(field, unwrapLinks())
      .then(function (entities) {
        _.forEach(entities, function (entity) {
          store.add(entity);
          $scope.links.push(wrapLink(createLink(entity)));
        });
        syncValue();
      });
    };

    /**
     * @ngdoc property
     * @name cfLinksEditor#$scope.linksApi
     * @type {Object}
     */
    $scope.linksApi = _.extend({
      getEntity: store.get,
      removeFromList: removeFromList,
      goToEditor: widgetApi.state.goToEditor
    }, widgetApi.entityHelpers);

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
}]);
