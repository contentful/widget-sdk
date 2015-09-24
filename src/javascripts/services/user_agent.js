'use strict';

angular.module('contentful').factory('userAgent', ['$injector', function ($injector) {

  var $window   = $injector.get('$window');
  var userAgent = dotty.get($window, 'navigator.userAgent', '');
  var platform  = dotty.get($window, 'navigator.platform', '');
  var ctrlKey   = 'Ctrl';

  var tests = {
    ie: /msie/i.test(userAgent),
    ios: /(iphone os|ipad|iphone|ipod)/i.test(userAgent) && !$window.MSStream,
    apple: false
  };

  if (tests.ios || /mac(68k|ppc|intel)/i.test(platform)) {
    tests.apple = true;
    ctrlKey = 'Cmd';
  }

  return {
    getUserAgent: _.constant(userAgent),
    getPlatform:  _.constant(platform),
    getCtrlKey:   _.constant(ctrlKey),
    is: is
  };

  function is(name) {
    if (!_.has(tests, name)) {
      throw new Error('Development error: bad argument');
    }
    return tests[name];
  }

}]);
