'use strict';

angular.module('cf.app')
.directive('cfReferenceEditor', ['$injector', function ($injector) {

  var $q = $injector.get('$q');
  var $timeout = $injector.get('$timeout');
  var entitySelector = $injector.get('entitySelector');

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
    var cache = [];

    $scope.typePlural = {Entry: 'entries', Asset: 'assets'}[$scope.type];
    $scope.uiSortable.update = function () {
      // let uiSortable update the model, then sync
      $timeout(syncValue);
    };

    field.onValueChanged(function (links) {
      if (!Array.isArray(links)) {
        links = links ? [links] : [];
      }
      $scope.links = _.map(links, wrapLink);
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
        _.forEach(_.map(entities, createLink), function (link) {
          $scope.links.push(wrapLink(link));
        });
        syncValue();
      });
    };

    /**
     * @ngdoc property
     * @name cfLinksEditor#$scope.linksApi
     * @type {Object}
     */
    $scope.linksApi = {
      resolveLink: resolveLink,
      removeFromList: removeFromList,
      entityStatus: widgetApi.space.entityStatus,
      entityTitle: withLocale(widgetApi.space.entityTitle),
      entityDescription: withLocale(widgetApi.space.entityDescription),
      entryImage: withLocale(widgetApi.space.entryImage),
      assetFile: withLocale(widgetApi.space.assetFile),
      assetUrl: widgetApi.space.assetUrl,
      goToEditor: widgetApi.space.goToEditor
    };

    function withLocale (fn) {
      return _.partialRight(fn, field.locale);
    }

    function resolveLink (link) {
      var entityId = getEntityId(link);
      var cached = cache[entityId];

      if (cached) {
        return $q.resolve(cached);
      }

      return widgetApi.space['get' + $scope.type](entityId)
      .then(function (data) {
        cache[entityId] = data;
        return data;
      });
    }

    function removeFromList (link) {
      var index = _.findIndex($scope.links, {link: link});
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
        id: entity.getId(),
        linkType: entity.getType(),
        type: 'Link'
      }
    };
  }

  function getEntityId (link) {
    return dotty.get(link, 'sys.id');
  }
}]);
