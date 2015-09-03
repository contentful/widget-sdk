'use strict';

angular.module('contentful').directive('cfZenmode', ['$injector', function ($injector) {

  var $window        = $injector.get('$window');
  var MarkdownEditor = $injector.get('MarkdownEditor');
  var actions        = $injector.get('MarkdownEditor/actions');
  var keycodes       = $injector.get('keycodes');
  var modalDialog    = $injector.get('modalDialog');
  var win            = $($window);

  return {
    restrict: 'E',
    template: JST['cf_zenmode'](),
    scope: {
      zenApi: '=',
      preview: '='
    },
    link: function(scope, el) {
      var textarea   = el.find('textarea').get(0);
      var preview    = el.find('.markdown-preview').first();
      var editor     = null;
      var opts       = { height: '100%', fixedHeight: true };
      var containers = {
        editor:  el.find('.zenmode-editor').first(),
        preview: el.find('.zenmode-preview').first()
      };

      scope.togglePreview = togglePreview;
      scope.isPreviewActive = true;

      MarkdownEditor.create(textarea, opts).then(initEditor);

      function initEditor(editorInstance) {
        editor = editorInstance;
        scope.actions = actions.for(editor);
        scope.history = editor.history;

        scope.zenApi.registerChild(editorInstance);
        tieChildEditor();

        editor.events.onChange(scope.zenApi.syncToParent);
        editor.events.onScroll(handleScroll);
        win.on('keyup', handleEsc);

        scope.$on('$destroy', function () {
          tieParentEditor();
          win.off('keyup', handleEsc);
          editor.destroy();
        });
      }

      function togglePreview() {
        scope.isPreviewActive = !scope.isPreviewActive;

        if (scope.isPreviewActive) {
          containers.editor.css('width', '50%');
          containers.preview.css('width', '50%');
        } else {
          containers.editor.css('width', '100%');
          containers.preview.css('width', '0%');
        }
      }

      function tieChildEditor() {
        var parent = scope.zenApi.getParent();
        parent.tie.editorToEditor(editor);
      }

      function tieParentEditor() {
        editor.tie.editorToEditor(scope.zenApi.getParent());
      }

      function handleScroll() {
        editor.tie.previewToEditor(preview);
      }

      function handleEsc(e) {
        if (modalDialog.getOpened().length < 1 && e.keyCode === keycodes.ESC) {
          scope.zenApi.toggle();
        }
      }
    }
  };
}]);
