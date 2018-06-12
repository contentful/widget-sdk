'use strict';

angular.module('contentful').directive('cfSelectAllInput', () => ({
  restrict: 'A',

  link: function(scope, el) {
    el.css('cursor', 'pointer');
    el.on('click', selectAll);

    function selectAll() {
      var end = el.val().length;
      el.textrange('set', 0, end);
    }
  }
}));
