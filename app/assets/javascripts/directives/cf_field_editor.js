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
          // value:   '=',
          type:    '=',
          fieldId: '=',
          doc:     '=',
          locale:  '=',
        },
        link: function(scope, elm, attr) {
          var widget = widgets.editor(scope.type, attr.editor);

          scope.$watch(function(scope){
            return scope.doc;
          }, function(doc){
            if (!doc) {
              scope.subdoc   = null;
              scope.fieldDoc = null;
            } else {
              scope.subdoc   = doc.at(['fields', scope.fieldId, scope.locale]);
              scope.fieldDoc = doc.at(['fields', scope.fieldId]);
            }
          })


          scope.$watch('fieldDoc', function(fieldDoc, old, scope){
            if (old && scope.fieldDocListener) {
              old.removeListener(scope.fieldDocListener);
              scope.fieldDocListener = null;
            }

            if (fieldDoc) {
              scope.value = scope.subdoc.get();
              scope.fieldDocListener = fieldDoc.on('replace', function(pos, was, now){
                console.log("Replacing", pos, was, now);
                scope.$apply(function(scope){
                  scope.value = now;
                })
              })
              console.log("subdoc adding listener", scope.fieldDocListener);
            }
          })

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
