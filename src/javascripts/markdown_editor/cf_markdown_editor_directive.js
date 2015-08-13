'use strict';

angular.module('contentful').directive('cfMarkdownEditor', ['$injector', function ($injector) {

  var $sce            = $injector.get('$sce');
  var $timeout        = $injector.get('$timeout');
  var LazyLoader      = $injector.get('LazyLoader');
  var MarkdownEditor  = $injector.get('MarkdownEditor');
  var advancedActions = $injector.get('MarkdownEditor/advancedActions');
  var requirements    = $injector.get('MarkdownEditor/requirements');
  var LinkOrganizer   = $injector.get('LinkOrganizer');
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
      var currentMode = 'md';
      var editor = null;
      var localeCode = dotty.get(scope, 'locale.internal_code', null);

      scope.isInitialized = false;
      scope.firstSyncDone = false;
      scope.hasCrashed = false;
      scope.isReady = isReady;
      scope.requirements = requirements.getInfoLine(scope.field);
      scope.preview = '';
      scope.info = {};
      scope.setMode = setMode;
      scope.inMode = inMode;
      scope.notInProduction = notInProduction;
      scope.openHelp = function () { window.alert('Not implemented.'); };

      scope.insertAsset   = function () { advancedActions.asset(localeCode, editor.insert); };
      scope.insertLink    = function () { advancedActions.link(editor.insert);              };
      scope.insertSpecial = function () { advancedActions.special(editor.insert);           };
      scope.insertTable   = function () { advancedActions.table(editor.actions.table);      };
      scope.embed         = function () { advancedActions.embed(editor.insert);             };
      scope.organizeLinks = organizeLinks;

      // No need to handle response:
      // 1. embedly integration is optional
      // 2. loading it even after elements are added to DOM works just fine
      LazyLoader.get('embedly');

      MarkdownEditor.create(textarea).then(function (editorInstance) {
        editor = editorInstance;
        scope.actions = editor.actions;
        scope.$watch('fieldData.value', handleValueChange);
        scope.$watch('fieldData.value', addSizeMarker);
        scope.$on('$destroy', function () {
          editor.destroy();
          scope = null;
        });
      }).catch(function () {
        scope.hasCrashed = true;
      });

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
        scope.$apply(function() {
          scope.fieldData.value = value;
          scope.preview = $sce.trustAsHtml(preview);
          scope.info = info;
          scope.firstSyncDone = true;
        });
      }

      function addSizeMarker() {
        scope.marker = requirements.getSizeMarker(scope.field, scope.fieldData);
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

        // 3. when rerendered and in Markdown mode,
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

      function notInProduction() {
        return environment.env !== 'production';
      }

      function organizeLinks() {
        var text = scope.fieldData.value;
        text = LinkOrganizer.convertInlineToRef(text);
        text = LinkOrganizer.rewriteRefs(text);
        scope.fieldData.value = text;
      }
    }
  };
}]);
