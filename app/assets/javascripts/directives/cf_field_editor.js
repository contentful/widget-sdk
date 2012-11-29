define([
  'angular',
  'templates/entry_list',

  'services/widgets'
], function(angular, entryListTemplate){
  'use strict';

  return {
    name: 'cfFieldEditor',
    factory: function(widgets, $compile) {
      return {
        restrict: 'E',
        scope: {
          type:    '=',
          fieldId: '=',
          entryDoc:'=doc',
          locale:  '=',
        },
        link: function(scope, elm, attr) {
          var widget = widgets.editor(scope.type, attr.editor);


          scope.replaceValue = function(value) {
            this.$broadcast('replaceValue', value);
          };

          scope.valueInitialized = false;

          scope.$watch('entryDoc', updateDoc);
          scope.$watch('fieldId', updateDoc);
          scope.$watch('locale', updateDoc);

          function updateDoc(n,o,scope) {
            if (scope.entryDoc && scope.fieldId && scope.locale) {
              scope.doc = scope.entryDoc.subdoc([scope.fieldId, scope.locale]);
            } else {
              scope.doc = null;
            }
          }

          elm.html(widget.template + '<span class="help-inline">'+widget.name+'</span>');
          $compile(elm.contents())(scope);
          if(typeof widget.link === 'function') {
            widget.link(scope, elm, attr);
          }
        }
      };
    }
  };

});
