'use strict';

/**
 * @ngdoc service
 * @name userAgent
 *
 * @description
 * Simple service that provides information about user's browser.
 * We can ask if browser is: IE, iOS or running on Apple device.
 * We also determine what key is used as keystroke action modifier ("Ctrl" or "Cmd")
 */
angular.module('contentful').factory('userAgent', ['require', require => {
  var $window = require('$window');
  var userAgent = _.get($window, 'navigator.userAgent', '');
  var platform = _.get($window, 'navigator.platform', '');
  var ctrlKey = 'Ctrl';

  /**
   * Tests reference:
   * https://msdn.microsoft.com/en-us/library/ms537509%28v=vs.85%29.aspx
   * http://stackoverflow.com/questions/10527983/best-way-to-detect-mac-os-x-or-windows-computers-with-javascript-or-jquery
   */
  var tests = {
    ie: /msie/i.test(userAgent),
    safari: /^((?!chrome|android).)*safari/i.test(userAgent),
    ios: /(iphone os|ipad|iphone|ipod)/i.test(userAgent) && !$window.MSStream,
    apple: false
  };

  if (tests.ios || /mac(68k|ppc|intel)/i.test(platform)) {
    tests.apple = true;
    ctrlKey = 'Cmd';
  }

  return {
    /**
     * @ngdoc method
     * @name userAgent#getUserAgent
     * @description Returns navigator.userAgent string
     */
    getUserAgent: _.constant(userAgent),
    /**
     * @ngdoc method
     * @name userAgent#getPlatform
     * @description Returns navigator.platform string
     */
    getPlatform: _.constant(platform),
    /**
     * @ngdoc method
     * @name userAgent#getCtrlKey
     * @description Returns modifier key as string ("Ctrl" or "Cmd")
     */
    getCtrlKey: _.constant(ctrlKey),
    /**
     * @ngdoc method
     * @name userAgent#isIE
     * @description Returns true if user is using IE
     */
    isIE: _.constant(tests.ie),
    /**
     * @ngdoc method
     * @name userAgent#isIOS
     * @description Returns true if user is using IOS
     */
    isIOS: _.constant(tests.ios),
    /**
     * @ngdoc method
     * @name userAgent#isApple
     * @description Returns true if user is using Apple device
     */
    isApple: _.constant(tests.apple),
    /**
     * @ngdoc method
     * @name userAgent#isSafari
     * @description Returns true if user is using Safari
     */
    isSafari: _.constant(tests.safari)
  };
}]);
