'use strict';

angular.module('contentful').directive('cfMarkdownEditor', ['$injector', function ($injector) {

  var $timeout         = $injector.get('$timeout');
  var LazyLoader       = $injector.get('LazyLoader');
  var MarkdownEditor   = $injector.get('MarkdownEditor');
  var actions          = $injector.get('MarkdownEditor/actions');
  var startLivePreview = $injector.get('MarkdownEditor/preview');

  return {
    restrict: 'E',
    template: JST['cf_markdown_editor'](),
    scope: {
      field: '=',
      fieldData: '=',
      locale: '=',
      disabled: '='
    },
    link: function (scope, el) {
      var textarea = el.find('textarea').get(0);
      var minorActions = el.find('.markdown-minor-actions').first().hide();
      var currentMode = 'md';
      var editor = null;
      var localeCode = dotty.get(scope, 'locale.internal_code', null);

      scope.isInitialized = false;
      scope.firstSyncDone = false;
      scope.hasCrashed = false;
      scope.isReady = isReady;
      scope.minorActionsShown = false;
      scope.toggleMinorActions = toggleMinorActions;
      scope.preview = {};
      scope.setMode = setMode;
      scope.inMode = inMode;

      // simple bus that is used to synchronize between Zen Mode and main editor
      scope.zenApi = {
        getParentContent: function () { return editor.getContent(); },
        setParentContent: function (content) { editor.setContent(content); },
        setChildContent: _.noop,
        toggle: function () {
          scope.zen = !scope.zen;
          if (!scope.zen) { this.setChildContent = _.noop; }
        }
      };

      // No need to handle response:
      // 1. embedly integration is optional
      // 2. loading it even after elements are added to DOM works just fine
      LazyLoader.get('embedly');

      MarkdownEditor.create(textarea)
        .then(initEditor)
        .catch(function () { scope.hasCrashed = true; });

      function initEditor(editorInstance) {
        editor = editorInstance;
        scope.actions = actions.for(editor, localeCode);
        scope.history = editor.history;
        var off = startLivePreview(editor, updatePreview);
        editor.events.onChange(handleEditorChange);
        scope.$watch('fieldData.value', handleModelChange);
        scope.$on('$destroy', off);
        scope.$on('$destroy', editor.destroy);
      }

      function handleEditorChange() {
        scope.fieldData.value = editor.getContent();
      }

      function handleModelChange(value) {
        // sets main editor's content; if change originates from editor,
        // it won't emit "change" again
        editor.setContent(value);
        // sets content of Zen Mode editor
        // if there's no Zen Mode opened, "setChildContent" is noop
        scope.zenApi.setChildContent(value);

        scope.isInitialized = true;
      }

      function updatePreview(err, preview) {
        scope.firstSyncDone = true;
        scope.preview = _.extend(preview, {
          field: scope.field,
          value: editor.getContent(),
          hasCrashed: err ? true : false
        });
      }

      function isReady() {
        return scope.isInitialized && scope.firstSyncDone;
      }

      function inMode(mode) {
        return currentMode === mode;
      }

      function setMode(mode) {
        // 1. froze element height
        var areas = el.find('.markdown-areas');
        areas.height(areas.height());

        // 2. change mode
        var nextMode = _.contains(['md', 'preview'], mode) ? mode : 'md';
        if (nextMode === currentMode) { return; }
        currentMode = nextMode;

        // 3. hide minor actions if going to preview mode
        if (currentMode !== 'md') {
          toggleMinorActions(true);
        }

        // 4. when rerendered and in Markdown mode,
        // set height to "auto" to allow auto-expanding
        if (currentMode === 'md') {
          $timeout(function () {
            areas.height('auto');
          });
        }
      }

      function toggleMinorActions(forceHide) {
        scope.minorActionsShown = forceHide ? false : !scope.minorActionsShown;
        var method = 'slide' + (scope.minorActionsShown ? 'Down' : 'Up');
        minorActions.stop()[method](300);
      }
    }
  };
}]);
