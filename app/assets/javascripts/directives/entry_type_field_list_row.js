angular.module('contentful/directives').directive('entryTypeFieldListRow', function($compile) {
  'use strict';

  return {
    restrict: 'A',
    //template: template(),
    //replace: true,
    scope: {
      doc: '=',
      initialField: '=entryTypeFieldListRow',
      publishedIds: '=',
      availableTypes: '='
    },
    controller: 'EntryTypeFieldListRowCtrl',
    compile: function(elem) {
      // custom compilation because templates appparently can't carry TR tags
      var templateNode = $(JST.entry_type_field_list_row());
      elem.html(templateNode.contents());

      return function linkEntryTypeFieldListRow(scope, elm) {
        scope.index = elm.index();

        scope.$on('orderChanged', function(event) {
          event.currentScope.$apply(function(scope) {
            scope.index = elm.index('.existing-field');
          });
        });

        function attachNameField(val, old, scope) {
          if (scope.detachNameField){
            scope.detachNameField();
            scope.detachNameField = null;
          }
          if (scope.doc && scope.index !== undefined && scope.index !== null) {
            var nameDoc  = scope.doc.at(['fields', scope.index, 'name']);
            scope.detachNameField = nameDoc.attach_textarea(elm.find('.name input')[0]);
          }
        }

        scope.$watch('doc', attachNameField);
        scope.$watch('index', attachNameField);

        scope.$on('$destroy', function() {
          if (scope.detachNameField) scope.detachNameField();
          elm.remove();
        });

        scope.$on('closeAllValidations', function() {
          scope.closeValidations();
        });

        scope.validationsOpen = function() {
          return scope.validationsRow().length !== 0;
        };

        scope.validationsRow =  function() {
          return elem.siblings('.field-validations').filter(function() {
            return $(this).scope().$parent === scope;
          });
        };

        scope.closeValidations = function() {
          if (scope.validationsOpen()) {
            var validationsRow = scope.validationsRow();
            var childScope = validationsRow.scope();
            validationsRow.remove();
            childScope.$destroy();
          }
        };

        scope.openValidations = function() {
          var validationsTemplate = $('<tr class="field-validations"></tr>');
          var editor = $compile(validationsTemplate)(scope.$new());
          elem.after(editor);
        };

        scope.toggleValidations = function() {
          if (scope.validationsOpen()) {
            scope.closeValidations();
          } else {
            scope.openValidations();
          }
        };

      };
    },
  };
});
