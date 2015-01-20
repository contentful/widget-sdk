'use strict';

angular.module('contentful').directive('cfHover', function() {
  return {
    restrict: 'AC',
    link: function(scope, elem) {
      function onMouseOver() {
        elem.find('.off-hover').hide();
        elem.find('.on-hover').show();
      }

      function onMouseOut() {
        elem.find('.on-hover').hide();
        elem.find('.off-hover').show();
      }

      elem.on('mouseover', onMouseOver);
      elem.on('mouseout', onMouseOut);

      elem.on('$destroy', function () {
        elem.off('mouseover', onMouseOver);
        elem.off('mouseout', onMouseOut);
      });
    }
  };
});
