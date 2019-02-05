'use strict';

import $ from 'jquery';

describe('ui/inputControl', () => {
  let inputEl;

  beforeEach(function() {
    module('contentful/test');

    const createInputUpdater = this.$inject('ui/inputUpdater.es6').default;

    this.$inputEl = $('<input type="text" />')
      .appendTo('body')
      .focus();
    inputEl = this.$inputEl.get(0);

    this.updateInput = createInputUpdater(inputEl);
  });

  function resetInputAndCaret(value, caretPosition) {
    inputEl.value = value;
    inputEl.selectionStart = caretPosition;
  }

  afterEach(function() {
    this.$inputEl.remove();
    inputEl = null;
  });

  it('moves caret when changing before current position', function() {
    resetInputAndCaret('AABB', 2);
    this.updateInput('XAABB');
    expect(inputEl.selectionStart).toEqual(3);

    resetInputAndCaret('AABB', 2);
    this.updateInput('AAXBB');
    expect(inputEl.selectionStart).toEqual(3);

    resetInputAndCaret('AABB', 2);
    this.updateInput('ABB');
    expect(inputEl.selectionStart).toEqual(1);

    resetInputAndCaret('AABB', 2);
    this.updateInput('BB');
    expect(inputEl.selectionStart).toEqual(0);

    resetInputAndCaret('AA', 2);
    this.updateInput('');
    expect(inputEl.selectionStart).toEqual(0);

    resetInputAndCaret('', 0);
    this.updateInput('AA');
    expect(inputEl.selectionStart).toEqual(2);
  });

  it('does not move caret when changing after current position', function() {
    resetInputAndCaret('AABB', 2);
    this.updateInput('AAB');
    expect(inputEl.selectionStart).toEqual(2);

    resetInputAndCaret('AABB', 2);
    this.updateInput('AABXB');
    expect(inputEl.selectionStart).toEqual(2);

    resetInputAndCaret('AA', 0);
    this.updateInput('');
    expect(inputEl.selectionStart).toEqual(0);
  });

  it('does not update the caret when the element is not focused', function() {
    this.$inputEl.blur();
    resetInputAndCaret('AABB', 2);
    this.updateInput('XAABB');
    // Caret is at the end of the input
    expect(inputEl.selectionStart).toEqual(5);
  });
});
