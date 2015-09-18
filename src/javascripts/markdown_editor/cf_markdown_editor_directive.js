'use strict';

angular.module('contentful').directive('cfMarkdownEditor', ['$injector', function ($injector) {

  var $timeout         = $injector.get('$timeout');
  var LazyLoader       = $injector.get('LazyLoader');
  var MarkdownEditor   = $injector.get('MarkdownEditor');
  var actions          = $injector.get('MarkdownEditor/actions');
  var startLivePreview = $injector.get('MarkdownEditor/preview');
  var notification     = $injector.get('notification');

  return {
    restrict: 'E',
    template: JST['cf_markdown_editor'](),
    scope: {
      field: '=',
      fieldData: '=',
      locale: '=',
      isDisabled: '='
    },
    link: function (scope, el) {
      var textarea        = el.find('textarea').get(0);
      var preview         = el.find('.markdown-preview').first();
      var minorActions    = el.find('.markdown-minor-actions').first().hide();
      var currentMode     = 'md';
      var editor          = null;
      var childEditor     = null;
      var changedByWidget = false;
      var localeCode      = dotty.get(scope, 'locale.internal_code', null);

      scope.isInitialized      = false;
      scope.firstSyncDone      = false;
      scope.hasCrashed         = false;
      scope.minorActionsShown  = false;
      scope.zen                = false;
      scope.preview            = {};
      scope.isReady            = isReady;
      scope.setMode            = setMode;
      scope.inMode             = inMode;
      scope.canEdit            = canEdit;
      scope.toggleMinorActions = toggleMinorActions;

      // simple bus that is used to synchronize between Zen Mode and main editor
      scope.zenApi = {
        syncToParent:  syncFromChildToParent,
        registerChild: registerChildEditor,
        getParent:     function () { return editor; },
        toggle:        toggleZenMode
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

        var stopPreview = startLivePreview(getModelValue, updatePreview);
        editor.events.onChange(handleEditorChange);
        scope.$watch('fieldData.value', handleModelChange);
        scope.$watch('isDisabled',      handleStateChange);

        scope.$on('$destroy', stopPreview);
        scope.$on('$destroy', editor.destroy);
      }

      function getModelValue() {
        return dotty.get(scope, 'fieldData.value', '');
      }

      function setModelValue(value) {
        if (_.isObject(scope.fieldData) && value !== getModelValue()) {
          scope.fieldData.value = value;
          changedByWidget = true;
        }
      }

      function handleEditorChange() {
        setModelValue(editor.getContent());
      }

      function handleModelChange() {
        // if change originates from widget, don't do anything
        if (changedByWidget) {
          changedByWidget = false;
          return;
        }

        var value = getModelValue();
        // so it was external change (scope mutated, most probably by OT activity)
        // to propagate it, set content of both main editor and Zen Mode
        editor.setContent(value);
        if (scope.zen && childEditor) {
          childEditor.setContent(value);
        }

        // first change come from OT, so if we're there, we mark editor as initialized
        scope.isInitialized = true;
      }

      function handleStateChange(isDisabled) {
        if (isDisabled) {
          setMode('preview');
          if (scope.zen) { scope.zenApi.toggle(); }
        } else {
          setMode('md');
        }
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

      function canEdit() {
        return inMode('md') && !scope.isDisabled;
      }

      function setMode(mode) {
        // 1. froze element height
        var areas = el.find('.markdown-areas');
        areas.height(areas.height());

        // 2. change mode
        var nextMode = 'preview';
        if (mode === 'md' && !scope.isDisabled) {
          nextMode = 'md';
        }

        if (nextMode === currentMode) {
          if (currentMode === 'md') { setAutoHeight(); }
          return;
        } else {
          currentMode = nextMode;
        }

        // 3. when going to preview mode:
        //    - hide minor actions
        //    - tie preview position with editor
        if (currentMode === 'preview') {
          editor.tie.previewToEditor(preview);
          toggleMinorActions(true);
        }

        // 4. when in Markdown mode:
        //    - set height to "auto" to allow auto-expanding
        //    - tie editor position with preview
        if (currentMode === 'md') {
          editor.tie.editorToPreview(preview);
          setAutoHeight();
        }

        function setAutoHeight() {
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

      function syncFromChildToParent() {
        // it only changes model value
        // main editor will be updated when leaving Zen Mode
        if (childEditor) {
          setModelValue(childEditor.getContent());
        }
      }

      function registerChildEditor(editor) {
        childEditor = editor;
        childEditor.setContent(getModelValue());
      }

      function toggleZenMode() {
        scope.zen = !scope.zen;

        if (scope.zen) { notification.clear(); }
        // leaving Zen Mode - update main editor
        if (!scope.zen) {
          editor.setContent(getModelValue());
        }
      }
    }
  };
}]);
