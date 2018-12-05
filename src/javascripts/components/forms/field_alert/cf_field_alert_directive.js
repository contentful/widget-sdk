'use strict';

angular.module('contentful').directive('cfFieldAlert', [
  'require',
  require => {
    const _ = require('lodash');
    return {
      template: '<i class="cf-field-alert fa fa-exclamation-triangle" tooltip></i>',
      replace: true,
      restrict: 'A',

      link: function(_scope, elem, attr) {
        attr.$observe('cfFieldAlert', message => {
          attr.$set('tooltip', message);
          if (_.isEmpty(message)) {
            elem.hide();
          } else {
            elem.show();
          }
        });
      }
    };
  }
]);
