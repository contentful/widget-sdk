'use strict';
angular.module('contentful').directive('cfFieldAlert', function(){
  return {
    template: '<i class="cf-field-alert ss-alert" tooltip></i>',
    replace: true,
    link: function(scope, elem, attr) {
      attr.$observe('cfFieldAlert', function (exp) {
        attr.$set('tooltip', exp);
        if (_.isEmpty(exp)) {
          elem.hide();
        } else {
          elem.show();
        }
      });
    }
  };
});

