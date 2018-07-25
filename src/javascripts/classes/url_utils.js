'use strict';

angular.module('contentful').constant('urlUtils', ((() => {
  /** @const */
  const URL_REGEX = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;
  /**
   * Tests for validaity using the Regex used by AngularJS for <input type="url"/>
   * @see https://github.com/angular/angular.js/blob/v1.3.11/src/ng/directive/input.js#L14
   * @param {!string} value
   * @return {!boolean}
   */
  function isValid(value) {
    return URL_REGEX.test(value);
  }

  return {
    isValid: isValid,
    regexp:  URL_REGEX
  };
}))());
