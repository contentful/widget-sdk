'use strict';

angular.module('contentful').directive('cfWebhookCall', function () {
  return {
    restrict: 'E',
    template: JST['webhook_call']()
  };
});
