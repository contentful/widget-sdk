'use strict';

angular.module('contentful')

.directive('cfMarkdownPreview', ['require', require => {
  var createMountPoint = require('ui/Framework/DOMRenderer').default;

  return {
    restrict: 'E',
    scope: {
      preview: '=',
      isDisabled: '='
    },
    template: [
      '<div ng-show="!preview.hasCrashed" class="markdown-preview-mounting-point x--directed"></div>',
      '<div ng-show="preview.hasCrashed || renderHasCrashed" class="markdown-preview-crashed">',
      '<i class="fa fa-warning"></i> ',
      'We cannot render the preview. ',
      'If you use HTML tags, check if these are valid.',
      '</div>'
    ].join(''),
    link: function (scope, el) {
      var container = el.find('.markdown-preview-mounting-point').get(0);
      var mountPoint = createMountPoint(container);

      scope.renderHasCrashed = false;

      scope.$watch('preview.tree', update);
      scope.$watch('isDisabled', update);

      scope.$on('$destroy', mountPoint.destroy);

      function update () {
        var newTree = scope.preview && scope.preview.tree;

        if (newTree && !scope.isDisabled) {
          try {
            mountPoint.render(newTree);
            scope.renderHasCrashed = false;
          } catch (e) {
            scope.renderHasCrashed = true;
          }
        }
      }
    }
  };
}]);
