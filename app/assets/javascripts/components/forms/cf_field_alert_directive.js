'use strict';
angular.module('contentful').directive('cfFieldAlert', function(){
  return {
    template: '<i class="cf-field-alert ss-alert" tooltip></i>',
    replace: true,
    link: function(scope, elem, attr) {
      attr.$observe('cfFieldAlert', function (message) {
        attr.$set('tooltip', message);
        if (_.isEmpty(message)) {
          elem.hide();
        } else {
          elem.show();
        }
      });
    }
  };
});

