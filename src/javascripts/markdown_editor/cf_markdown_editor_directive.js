'use strict';

angular.module('contentful').directive('cfMarkdownEditor', ['$injector', function ($injector) {

  var $sce            = $injector.get('$sce');
  var $timeout        = $injector.get('$timeout');
  var LazyLoader      = $injector.get('LazyLoader');
  var MarkdownEditor  = $injector.get('MarkdownEditor');
  var actions         = $injector.get('MarkdownEditor/actions');
  var requirements    = $injector.get('MarkdownEditor/requirements');
  var environment     = $injector.get('environment');

  return {
    restrict: 'E',
    template: JST['cf_markdown_editor'](),
    scope: {
      field: '=',
      fieldData: '=',
      locale: '='
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
      scope.requirements = requirements.getInfoLine(scope.field);
      scope.preview = '';
      scope.info = {};
      scope.setMode = setMode;
      scope.inMode = inMode;
      scope.inDevelopment = inDevelopment;

      scope.zenApi = {
        get: function () { return scope.fieldData.value; },
        sync: function (content) { editor.setContent(content); },
        toggle: function () {
          scope.zen = !scope.zen;
          editor[scope.zen ? 'startSync' : 'stopSync']();
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
        scope.$watch('fieldData.value', handleValueChange);
        scope.$watch('fieldData.value', addSizeMarker);
        scope.$on('$destroy', function () {
          editor.destroy();
          scope = null;
        });
      }

      function handleValueChange(value) {
        if (scope.isInitialized) {
          editor.setContent(value);
        } else {
          scope.isInitialized = true;
          editor.setContent(value);
          editor.subscribe(receiveData);
        }
      }

      function receiveData(value, preview, info) {
        scope.fieldData.value = value;
        scope.preview = $sce.trustAsHtml(preview);
        scope.info = info;
        scope.firstSyncDone = true;
      }

      function isReady() {
        return scope.isInitialized && scope.firstSyncDone;
      }

      function setMode(mode) {
        // 1. froze element height
        var areas = el.find('.markdown-areas');
        areas.height(areas.height());

        // 2. change mode
        var nextMode = _.contains(['md', 'html', 'rich'], mode) ? mode : 'md';
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

      function inMode(mode) {
        return currentMode === mode;
      }

      function toggleMinorActions(forceHide) {
        scope.minorActionsShown = forceHide ? false : !scope.minorActionsShown;
        var method = 'slide' + (scope.minorActionsShown ? 'Down' : 'Up');
        minorActions.stop()[method]();
      }

      function inDevelopment() {
        return environment.env === 'development';
      }

      function addSizeMarker() {
        scope.marker = requirements.getSizeMarker(scope.field, scope.fieldData);
      }
    }
  };
}]);
