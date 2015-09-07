'use strict';

angular.module('contentful').directive('cfMarkdownEditorBridge', function () {
  return {
    restrict: 'E',
    template: JST['cf_markdown_editor_bridge'](),
    link: function (scope, el) {
      var textarea = el.find('.markdown-transfer-textarea').get(0);

      // when field value changes, we dispatch "paste" event
      // on transfer textarea - this way OT knows about the change
      scope.$watch('fieldData.value', dispatchPasteEvent);

      function dispatchPasteEvent() {
        /*global Event*/
        var event;
        try {
          event = new Event('paste');
        } catch(e) {
          event = document.createEvent('Event');
          event.initEvent('paste', true, true);
        }
        textarea.dispatchEvent(event);
      }
    }
  };
});
