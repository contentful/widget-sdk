'use strict';

angular.module('contentful').directive('cfZenmode', ['$injector', function ($injector) {

  var MarkdownEditor = $injector.get('MarkdownEditor');
  var actions        = $injector.get('MarkdownEditor/actions');

  return {
    restrict: 'E',
    template: JST['cf_zenmode'](),
    scope: {
      zenApi: '=',
      preview: '='
    },
    link: function(scope, el) {
      var textarea = el.find('textarea').get(0);
      var preview = el.find('.markdown-preview').first();
      var editor;
      var opts = { height: '100%', fixedHeight: true };

      MarkdownEditor.create(textarea, opts).then(initEditor);

      function initEditor(editorInstance) {
        editor = editorInstance;
        scope.actions = actions.for(editor);
        scope.history = editor.history;
        syncFromParent();
        scope.zenApi.setChildContent = syncFromParent;
        editor.events.onChange(syncToParent);
        editor.events.onScroll(handleScroll);
        scope.$on('$destroy', editor.destroy);
      }

      function syncFromParent(value) {
        editor.setContent(value || scope.zenApi.getParentContent());
      }

      function syncToParent() {
        scope.zenApi.setParentContent(editor.getContent());
      }

      function handleScroll(info) {
        var position = info.top / info.height;
        var top = preview.get(0).scrollHeight * position;
        preview.scrollTop(top);
      }
    }
  };
}]);
