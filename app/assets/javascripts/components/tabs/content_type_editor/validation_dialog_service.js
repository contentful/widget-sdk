'use strict';

angular.module('contentful').factory('validationDialog', function (modalDialog, can) {

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
