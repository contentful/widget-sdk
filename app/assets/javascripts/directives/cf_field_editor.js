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
          doc:     '=',
          locale:  '=',
        },
        link: function(scope, elm, attr) {
          var widget = widgets.editor(scope.type, attr.editor);


          scope.getPath = function() {
            return ['fields', this.fieldId, this.locale];
          }

          scope.replaceValue = function(value) {
            this.$broadcast('replaceValue', value);
          }

          scope.valueInitialized = false;

          scope.$watch('doc', function(doc, old, scope){
            if (old && scope.docListener) {
              old.removeListener(scope.docListener);
              scope.docListener = null;
            }

            if (doc) {
              if (!scope.valueInitialized) {
                var value = doc.getAt(scope.getPath());
                scope.replaceValue(value);
                scope.valueInitialized = true;
              }

              scope.docListener = doc.at(scope.getPath().slice(0,-1)).on('replace', function(position, was, now) {
                if (position === scope.getPath().slice(-1)[0]) {
                  // console.log('received replace at', position, was, now, scope.getPath().slice(-1)[0])
                  scope.$apply(function(){
                    scope.replaceValue(now);
                  })
                }
              })
            }
          });

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
