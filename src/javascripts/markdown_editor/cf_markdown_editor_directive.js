'use strict';

angular.module('contentful').directive('cfMarkdownEditor', ['$injector', function ($injector) {

  var $sce            = $injector.get('$sce');
  var MarkdownEditor  = $injector.get('MarkdownEditor');
  var advancedActions = $injector.get('MarkdownEditor/advancedActions');
  var LinkOrganizer   = $injector.get('LinkOrganizer');
  var environment     = $injector.get('environment');

  return {
    restrict: 'E',
    template: JST['cf_markdown_editor'](),
    scope: {
      field: '=',
      fieldData: '=',
      locale: '=',
      spaceContext: '='
    },
    link: function (scope, el) {
      var textarea = el.find('textarea').get(0);
      var currentMode = 'md';
      var editor = null;

      scope.isInitialized = false;
      scope.firstSyncDone = false;
      scope.hasCrashed = false;
      scope.isReady = isReady;
      scope.preview = '';
      scope.info = {};
      scope.setMode = setMode;
      scope.inMode = inMode;
      scope.notInProduction = notInProduction;
      scope.openHelp = function () { window.alert('Not implemented.'); };

      scope.insertAsset   = function () { advancedActions.asset(scope, editor.insert); };
      scope.insertLink    = function () { advancedActions.link(editor.insert);         };
      scope.insertSpecial = function () { advancedActions.special(editor.insert);      };
      scope.insertTable   = function () { advancedActions.table(editor.actions.table); };
      scope.organizeLinks = organizeLinks;

      MarkdownEditor.create(textarea).then(function (editorInstance) {
        editor = editorInstance;
        scope.actions = editor.actions;
        scope.$watch('fieldData.value', handleValueChange);
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

      function isReady() {
        return scope.isInitialized && scope.firstSyncDone;
      }

      function setMode(mode) {
        currentMode = _.contains(['md', 'html', 'rich'], mode) ? mode : 'md';
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
