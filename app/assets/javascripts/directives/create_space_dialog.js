angular.module('contentful').directive('createSpaceDialog', function (client, notification, cfSpinner) {
    'use strict';

    return {
      restrict: 'EC',
      scope: true,
      template: JST['create_space_dialog'](),
      link: function (scope, elem) {
        scope.$watch('displayCreateSpaceDialog', function (display) {
          if (display) elem.find('input').eq(0).focus();
        });

        elem.on('keyup', function(e) {
          if (e.keyCode === 27) scope.$apply(scope.hideCreateSpaceDialog());
        });
      }
    };
});
