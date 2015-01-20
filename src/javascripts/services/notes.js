'use strict';

angular.module('contentful').factory('notes', ['$window', function notesFactory($window) {

  return {
    dismiss: function (key) {
      $window.localStorage.setItem('cf-notes-'+key, true);
    },

    isActive: function (key) {
      return !$window.localStorage.getItem('cf-notes-'+key);
    }
  };

}]);
