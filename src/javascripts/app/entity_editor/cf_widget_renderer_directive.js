'use strict';

/**
 * @ngdoc directive
 * @module cf.app
 * @name cfWidgetRenderer
 * @description
 * Render the widget template in the element.
 *
 * @scope.requires {Widget.Renderable} widget
 * @scope.requires {Client.ContentType?} contentType
 * @scope.requires {FieldLocaleController} fieldLocale
 *
 * @property {string} $scope.contentTypeHref
 */
angular.module('cf.app')
.directive('cfWidgetRenderer', ['require', function (require) {
  var $compile = require('$compile');
  var $state = require('$state');

  return {
    scope: true,
    restrict: 'E',
    link: function (scope, element) {
      var template = scope.widget.template;
      if (!template) {
        throw new Error('Widget template is required');
      }

      scope.contentTypeHref = buildContentTypeHref(scope.contentType);

      var $widget = $(template);
      element.append($widget);
      $compile($widget)(scope);

      element.on('focusin', function () {
        scope.$applyAsync(function () {
          scope.fieldLocale.setActive(true);
        });
      });

      element.on('focusout', function () {
        scope.$applyAsync(function () {
          scope.fieldLocale.setActive(false);
        });
      });
    }
  };

  // TODO We should replace this with a helper method that generates a state
  // reference. The template then should use the `ui-sref`
  // directive.
  function buildContentTypeHref (contentType) {
    if (contentType && contentType.getId) {
      return $state.href(
        'spaces.detail.content_types.detail.home',
        {contentTypeId: contentType.getId()}
      );
    }
  }
}]);
