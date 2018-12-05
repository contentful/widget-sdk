'use strict';
angular.module('contentful').config([
  '$provide',
  '$injector',
  ($provide, $injector) => {
    var _ = $injector.get('lodash');
    $provide.value('debounce', _.debounce);
    $provide.value('throttle', _.throttle);
    $provide.value('defer', _.defer);
    $provide.value('delay', _.delay);
  }
]);
