'use strict';

angular.module('cf.app')
.directive('cfLinksEditorLink', ['$compile', function ($compile) {

  // TODO: Once we implement placeholders, reevaluate whether this directive is
  //  really necessary or whether a simple service would do instead.

  var LINK_TEMPLATES = {
    Entry: {
      link: $('<cf-entity-link />'),
      card: $('<cf-entity-link show-details="true" />')
    },
    Asset: {
      link: $('<cf-entity-link />'),
      card: $('<cf-asset-card as-thumb="!singleLink" />')
    }
  };

  var LINK_TOOLBARS = {
    Entry: $(JST.cf_entry_toolbar()),
    Asset: $(JST.cf_asset_toolbar())
  };

  return {
    restrict: 'E',
    scope: {
      index: '=',
      link: '=',
      linksApi: '=',
      linkStyle: '@',
      locale: '@'
    },
    link: link
  };

  function link ($scope, $elem) {
    var linksApi = $scope.linksApi;
    var link = $scope.link;
    var linkType = dotty.get(link, 'sys.linkType');
    var $link = buildLinkNode();
    $link.attr('locale', '{{ locale }}');
    $link.append(getToolbarNode());

    propagateUsedLinksDirectiveName($link);

    linksApi.loadEntity(link)
    .then(function (entity) {
      $scope.entity = entity;
      $link.attr('entity', 'entity');

      $elem.html($link.get(0).outerHTML);
      $compile($elem.contents())($scope);
    });
    // TODO: While pending, display placeholders? Pass promise to variation?

    function buildLinkNode () {
      var $link = dotty.get(LINK_TEMPLATES, [linkType, $scope.linkStyle]);
      if (!$link) {
        throw new Error('“' + $scope.linkStyle +
          '” is an unsupported “link-style” for “' + linkType + '” type links');
      }
      return $link.clone();
    }

    function getToolbarNode () {
      var $toolbar = LINK_TOOLBARS[linkType];
      return $toolbar.clone();
    }

    function propagateUsedLinksDirectiveName ($link) {
      var linkDirective = $link.get(0).tagName.toLowerCase();
      linksApi.setUsedLinksDirective(linkDirective);
    }
  }

}]);
