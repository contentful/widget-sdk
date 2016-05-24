'use strict';

angular.module('cf.app')
// TODO: Rename to “cfLinkEditor” once the legacy one got removed.
.directive('cfLinksEditor', [function () {
  var LINK_TYPES = ['Entry', 'Asset'];

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

}]);
