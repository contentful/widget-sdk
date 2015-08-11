'use strict';

angular.module('contentful').directive('cfEmbedlyStatus', function () {
  return {
    restrict: 'E',
    scope: { urlStatus: '=' },
    template: JST['cf_embedly_status']()
  };
});
