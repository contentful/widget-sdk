'use strict';

angular.module('contentful').directive('cfFieldDisplay', function(){
  return {
    template: JST.cf_field_display(),
    restrict: 'E',
    replace: true,
    link: function (scope) {

      scope.displayType = function (field) {
        if(field.type == 'Date' && field.id == 'updatedAt')
          return 'updatedAt';

        if(field.type == 'Symbol' && field.id == 'author')
          return 'author';

        return field.type;
      };

      scope.dataForField = function(entry, field) {
        return scope.spaceContext.localizedField(entry, 'data.fields.'+field.id);
      };

      scope.displayBool = function (value) {
        return value ? 'Yes' : 'No';
      };

    }
  };
});
