define(function(){
  'use strict';

  return {
    name: 'otBindText',
    factory: function() {
      return {
        restrict: 'A',
        scope: {
          doc: '=',
          path: '=otBindText'
        },
        link: function(scope, elm) {
          scope.$watch('path', updateBinding);
          scope.$watch('doc',  updateBinding);
          
          function updateBinding(doc, old, scope){
            if (old) {
              console.error('Rebinding otBindText');
            }

            if (scope.doc && scope.path) {
              console.log('attaching text inpu', scope.doc, scope.path);
              scope.doc.subdoc(scope.path).attachToTextInput(elm[0]);
            }
          }
          //scope.$on('$destroy', function(){
            //console.log('otBindText scope being destroyed');
            //stopPathWatcher();
            //stopDocWatcher();
            //stopPathWatcher = null;
            //stopDocWatcher = null;
          //});

          //elm.on('$destroy', function(){
            //console.log('otBindText elm being destroyed');
            //stopPathWatcher();
            //stopDocWatcher();
            //stopPathWatcher = null;
            //stopDocWatcher = null;
          //});
        }

      };
    }
  };

});

