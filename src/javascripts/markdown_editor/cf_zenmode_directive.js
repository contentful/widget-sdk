'use strict';

angular.module('contentful').directive('cfZenmode', ['$injector', function ($injector) {

  var MarkdownEditor = $injector.get('MarkdownEditor');
  var actions        = $injector.get('MarkdownEditor/actions');

  return {
    restrict: 'E',
    template: JST['cf_zenmode'](),
    scope: { zenApi: '=' },
    link: function(scope, el) {
      var textarea = el.find('textarea').get(0);
      var editor;
      var opts = { height: '100%', fixedHeight: true };

      MarkdownEditor.create(textarea, opts).then(initEditor);

      function initEditor(editorInstance) {
        editor = editorInstance;
        scope.actions = actions.for(editor);
        editor.setContent(scope.zenApi.get());
        editor.subscribe(function(content, preview) {
          scope.zenApi.sync(content);
          scope.preview = preview;
        });
        scope.$on('$destroy', function () {
          editor.destroy();
          scope = null;
        });
      }
    }
  };
}]);
