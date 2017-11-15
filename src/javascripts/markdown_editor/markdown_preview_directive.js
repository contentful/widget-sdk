'use strict';

angular.module('contentful')

.directive('cfMarkdownPreview', ['require', function (require) {
  var ReactDOM = require('libs/react-dom');

  return {
    restrict: 'E',
    scope: {
      preview: '=',
      isDisabled: '='
    },
    template: [
      '<div ng-show="!preview.hasCrashed" class="markdown-preview-mounting-point"></div>',
      '<div ng-show="preview.hasCrashed || mountHasCrashed" class="markdown-preview-crashed">',
      '<i class="fa fa-warning"></i> ',
      'We cannot render the preview. ',
      'If you use HTML tags, check if these are valid.',
      '</div>'
    ].join(''),
    link: function (scope, el) {
      var mountingPoint = el.find('.markdown-preview-mounting-point').get(0);
      scope.mountHasCrashed = false;

      scope.$watch('preview.tree', update);
      scope.$watch('isDisabled', update);

      scope.$on('$destroy', unmount);

      function update () {
        var newTree = scope.preview && scope.preview.tree;
        if (!newTree || scope.isDisabled) { return; }

        try {
          mount();
          scope.mountHasCrashed = false;
        } catch (e) {
          scope.mountHasCrashed = true;
        }
      }

      function mount () {
        ReactDOM.render(scope.preview.tree, mountingPoint);
      }

      function unmount () {
        ReactDOM.unmountComponentAtNode(mountingPoint);
      }
    }
  };
}]);
