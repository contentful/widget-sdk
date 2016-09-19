'use strict';

describe('uiKeyInputReject directive', function () {

  beforeEach(function () {
    module('cf.ui');
    this.el = this.$compile('<input ui-allow-input="a-z">')[0];
  });

  it('prevents keypress event default when character is invalid', function () {
    const triggerDefault = dispatchKeyPress(this.el, 'X');
    expect(triggerDefault).toBe(false);
  });

  it('does not prevent keypress event default when character is valid', function () {
    const triggerDefault = dispatchKeyPress(this.el, 'a');
    expect(triggerDefault).toBe(true);
  });

  function dispatchKeyPress (el, character) {
    const ev = new window.KeyboardEvent('keypress', {
      charCode: character.charCodeAt(0),
      cancelable: true
    });
    return el.dispatchEvent(ev);
  }
});
