'use strict';

angular.module('contentful').directive('cfZenmode', ['require', require => {
  var $window = require('$window');
  var MarkdownEditor = require('markdown_editor/markdown_editor');
  var actions = require('markdown_editor/markdown_actions');
  var keycodes = require('utils/keycodes').default;
  var modalDialog = require('modalDialog');
  var win = $($window);
  var LocaleStore = require('TheLocaleStore');

  // This is persisted accross Zen Mode instances
  var initialShowPreview = true;

  return {
    restrict: 'E',
    template: JST['cf_zenmode'](),
    scope: {
      zenApi: '=',
      preview: '=',
      direction: '='
    },
    link: function (scope, el) {
      var textarea = el.find('textarea').get(0);
      var preview = el.find('.markdown-preview').first();
      var editor = null;
      var opts = {
        height: '100%',
        fixedHeight: true,
        direction: scope.direction
      };
      var containers = {
        editor: el.find('.zenmode-editor').first(),
        preview: el.find('.zenmode-preview').first()
      };

      scope.showPreview = show => {
        scope.isPreviewActive = show;
        initialShowPreview = show;
      };

      scope.showPreview(initialShowPreview);

      scope.$watch('isPreviewActive', active => {
        if (active) {
          containers.editor.css('width', '50%');
          containers.preview.css('width', '50%');
        } else {
          containers.editor.css('width', '100%');
          containers.preview.css('width', '0%');
        }
      });

      initEditor(MarkdownEditor.create(textarea, opts));

      function initEditor (editorInstance) {
        editor = editorInstance;
        var defaultLocale = LocaleStore.getDefaultLocale();

        var locales = LocaleStore.getLocales();
        var fieldLocaleCode = scope.zenApi.getLocale();
        var locale = locales.find(locale => locale.code === fieldLocaleCode);

        scope.actions = actions.create(editor, locale, defaultLocale.code);
        scope.history = editor.history;

        scope.zenApi.registerChild(editorInstance);
        tieChildEditor();

        editor.events.onChange(scope.zenApi.syncToParent);
        editor.events.onScroll(handleScroll);
        win.on('keyup', handleEsc);

        scope.$on('$destroy', () => {
          tieParentEditor();
          win.off('keyup', handleEsc);
          editor.destroy();
        });
      }

      function tieChildEditor () {
        var parent = scope.zenApi.getParent();
        parent.tie.editorToEditor(editor);
      }

      function tieParentEditor () {
        editor.tie.editorToEditor(scope.zenApi.getParent());
      }

      function handleScroll () {
        editor.tie.previewToEditor(preview);
      }

      function handleEsc (e) {
        if (modalDialog.getOpened().length < 1 && e.keyCode === keycodes.ESC) {
          scope.zenApi.toggle();
        }
      }
    }
  };
}]);
