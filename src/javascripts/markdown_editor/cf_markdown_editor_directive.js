'use strict';

angular.module('contentful').directive('cfMarkdownEditor', ['$injector', function ($injector) {

  var $timeout = $injector.get('$timeout');
  var LazyLoader = $injector.get('LazyLoader');
  var MarkdownEditor = $injector.get('MarkdownEditor');
  var actions = $injector.get('MarkdownEditor/actions');
  var startLivePreview = $injector.get('MarkdownEditor/preview');
  var notification = $injector.get('notification');

  return {
    restrict: 'E',
    template: JST['cf_markdown_editor'](),
    scope: {},
    require: '^cfWidgetApi',
    link: function (scope, el, attrs, api) {
      var field = api.field;
      var textarea = el.find('textarea').get(0);
      var preview = el.find('.markdown-preview').first();
      var currentMode = 'md';
      var editor = null;
      var childEditor = null;

      // @todo find a better way of hiding header in Zen Mode
      var editorHeader = el.closest('.workbench-main').siblings('.workbench-header').first();

      scope.preview = {};
      scope.setMode = setMode;
      scope.inMode = inMode;
      scope.canEdit = canEdit;

      var constraints = _(field.validations).map('size').filter().first() || {};

      scope.constraints = constraints;

      // simple bus that is used to synchronize between Zen Mode and main editor
      scope.zenApi = {
        syncToParent: syncFromChildToParent,
        registerChild: registerChildEditor,
        getParent: function () { return editor; },
        toggle: toggleZenMode
      };

      // No need to handle response:
      // 1. embedly integration is optional
      // 2. loading it even after elements are added to DOM works just fine
      LazyLoader.get('embedly');

      MarkdownEditor.create(textarea)
        .then(initEditor)
        .catch(function () { scope.hasCrashed = true; });

      function initEditor (editorInstance) {
        editor = editorInstance;
        scope.actions = actions.for(editor, api.locale);
        scope.history = editor.history;

        var stopPreview = startLivePreview(field.getValue, updatePreview);
        editor.events.onChange(field.setString);

        var detachValueHandler = field.onValueChanged(handleFieldChange);
        var detachStateHandler = field.onDisabledStatusChanged(handleStateChange);

        scope.isReady = true;

        scope.$on('$destroy', stopPreview);
        scope.$on('$destroy', editor.destroy);
        scope.$on('$destroy', detachValueHandler);
        scope.$on('$destroy', detachStateHandler);
      }

      function handleFieldChange (value) {
        editor.setContent(value);
        if (scope.zen && childEditor) {
          childEditor.setContent(value);
        }
      }

      function handleStateChange (isDisabled) {
        scope.isDisabled = isDisabled;
        if (isDisabled) {
          setMode('preview');
          if (scope.zen) { scope.zenApi.toggle(); }
        } else {
          setMode('md');
        }
      }

      function updatePreview (err, preview) {
        scope.preview = _.extend(preview, {
          field: scope.field,
          value: editor.getContent(),
          hasCrashed: !!err
        });
      }

      function inMode (mode) {
        return currentMode === mode;
      }

      function canEdit () {
        return inMode('md') && !scope.isDisabled;
      }

      function setMode (mode) {
        // 1. froze element height
        var areas = el.find('.markdown-areas');
        var height = areas.height();
        height = height > 40 ? height : 40;
        areas.height(height);

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

        // 3. when going to preview mode,tie preview position with editor
        if (currentMode === 'preview') {
          editor.tie.previewToEditor(preview);
        }

        // 4. when in Markdown mode:
        if (currentMode === 'md') {
          // tie editor position with preview
          editor.tie.editorToPreview(preview);
          // set height to "auto" to allow auto-expanding
          setAutoHeight();
        }

        function setAutoHeight () {
          $timeout(function () {
            areas.height('auto');
          });
        }
      }

      function syncFromChildToParent (value) {
        // it only changes field value
        // main editor will be updated when leaving Zen Mode
        if (childEditor) { field.setString(value); }
      }

      function registerChildEditor (editor) {
        childEditor = editor;
        childEditor.setContent(field.getValue());
      }

      function toggleZenMode () {
        scope.zen = !scope.zen;

        if (scope.zen) {
          // hide leftovers from the previous screen
          notification.clear();
          editorHeader.hide();
        } else {
          // leaving Zen Mode - update main editor
          editor.setContent(field.getValue());
          // show editor header again
          editorHeader.show();
        }
      }
    }
  };
}]);
