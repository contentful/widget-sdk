import _ from 'lodash';

/**
 * @ngdoc service
 * @name userAgent
 *
 * @description
 * Simple service that provides information about user's browser.
 * We can ask if browser is: IE, iOS or running on Apple device.
 * We also determine what key is used as keystroke action modifier ("Ctrl" or "Cmd")
 */
const userAgent = _.get(window, 'navigator.userAgent', '');
const platform = _.get(window, 'navigator.platform', '');
let ctrlKey = 'Ctrl';

/**
 * Tests reference:
 * https://msdn.microsoft.com/en-us/library/ms537509%28v=vs.85%29.aspx
 * http://stackoverflow.com/questions/10527983/best-way-to-detect-mac-os-x-or-windows-computers-with-javascript-or-jquery
 */
const tests = {
  ie: /msie/i.test(userAgent),
  safari: /^((?!chrome|android).)*safari/i.test(userAgent),
  ios: /(iphone os|ipad|iphone|ipod)/i.test(userAgent) && !window.MSStream,
  apple: false,
};

if (tests.ios || /mac(68k|ppc|intel)/i.test(platform)) {
  tests.apple = true;
  ctrlKey = 'Cmd';
}

/**
 * @ngdoc method
 * @name userAgent#getCtrlKey
 * @description Returns modifier key as string ("Ctrl" or "Cmd")
 */
export const getCtrlKey = _.constant(ctrlKey);
