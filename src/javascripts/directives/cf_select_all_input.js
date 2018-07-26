'use strict';

angular.module('contentful').directive('cfSelectAllInput', () => ({
  restrict: 'A',

  link: function (_scope, el) {
    el.css('cursor', 'pointer');
    el.on('click', selectAll);

    function selectAll () {
      const end = el.val().length;
      el.textrange('set', 0, end);
    }
  }
}));
