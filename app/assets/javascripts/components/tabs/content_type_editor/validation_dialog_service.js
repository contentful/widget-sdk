'use strict';

angular.module('contentful').factory('validationDialog', function (modalDialog) {

  return {
    open: function (scope) {
      modalDialog.open({
        title: 'Validations',
        template: 'validation_dialog',
        scope: scope
      });
    },

    close: function () {
      
    }
  };
});
