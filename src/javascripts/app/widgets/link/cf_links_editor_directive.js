'use strict';

angular.module('cf.app')
// TODO: rename to “cfLinkEditor” once the legacy one got removed.
.directive('cfLinksEditor', ['$injector', function ($injector) {
  var LINK_TYPES = ['Entry', 'Asset'];

  var entitySelector = $injector.get('entitySelector');
  var $q = $injector.get('$q');

  return {
    restrict: 'E',
    scope: {
      type: '@forLinkType',
      singleLink: '=',
      linkStyle: '@'
    },
    template: JST.cf_links_editor(),
    require: '^cfWidgetApi',
    link: linkCfLinkEditor
  };

  function linkCfLinkEditor ($scope, $elem, $attrs, widgetApi) {
    var ignoreNextLinksChange;
    var field = widgetApi.field;
    var type = $scope.type;

    if (!_.includes(LINK_TYPES, type)) {
      throw new Error(
        '"for-link-type" is expected to be one of ' + LINK_TYPES.join('|'));
    }

    $scope.locale = field.locale;
    $scope.typePlural = {Entry: 'entries', Asset: 'assets'}[type];

    $scope.$watchCollection('links', function (newLinks, oldLinks) {
      if (ignoreNextLinksChange || newLinks === oldLinks) {
        ignoreNextLinksChange = false;
      } else if ($scope.links.length === 0) {
        field.removeValue();
      } else {
        setValue(newLinks);
      }
    });

    /**
     * @ngdoc property
     * @name cfLinksEditor#$scope.links
     * @type {string[]}
     */
    field.onValueChanged(function (links) {
      if (!Array.isArray(links)) {
        links = links ? [links] : [];
      }
      $scope.links = links.slice();
      ignoreNextLinksChange = true;
    });

    $scope.addExisting = function () {
      return entitySelector.open(field, $scope.links)
      .then(function (entries) {
        var links = _.map(entries, createLink);
        return $q.all(_.map(links, function (link) {
          $scope.links.push(link);
          return field.pushValue(link);
        }));
      });
    };

    /**
     * @ngdoc property
     * @name cfLinksEditor#$scope.linksApi
     * @type {Object}
     */
    $scope.linksApi = {
      /**
       * @name cfLinksEditor#$scope.linksApi.loadEntity
       * @param {Object} link
       * @returns {*}
       */
      loadEntity: function (link) {
        var entityId = getEntityId(link);
        var getter = 'get' + type; // getEntry() or getAsset()
        return widgetApi.space[getter](entityId);
      },
      /**
       * @name cfLinksEditor#$scope.linksApi.removeLink
       * @ngdoc method
       * @param {number} index
       */
      remove: function (index) {
        $scope.links.splice(index, 1);
      },
      /**
       * @name cfLinksEditor#$scope.linksApi.setUsedLinksDirective
       * @ngdoc method
       * @param value
       */
      setUsedLinksDirective: function (value) {
        $scope.linksDirective = value;
      }
    };

    function getEntityId (link) {
      return dotty.get(link, 'sys.id');
    }

    function setValue (value) {
      value = $scope.singleLink ? value[0] : value;
      field.setValue(value);
    }
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

}]);
