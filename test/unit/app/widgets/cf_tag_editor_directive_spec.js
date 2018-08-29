'use strict';

describe('cfTagEditor directive', () => {
  beforeEach(function() {
    module('contentful/test');

    const widgetApi = this.$inject('mocks/widgetApi').create();
    this.fieldApi = widgetApi.field;

    this.compile = function(items) {
      const el = this.$compile(
        '<cf-tag-editor />',
        {},
        {
          cfWidgetApi: widgetApi
        }
      );
      this.fieldApi.onValueChanged.yield(items);
      this.$apply();
      return el;
    };
  });

  it('renders initial items', function() {
    const values = ['X', 'Y', 'Z'];
    const el = this.compile(values);
    const listedValues = getListContent(el);
    expect(listedValues).toEqual(values);
  });

  it('renders undefined value', function() {
    const el = this.compile();
    const listedValues = getListContent(el);
    expect(listedValues).toEqual([]);
  });

  describe('adding an item', () => {
    beforeEach(function() {
      this.fieldApi.pushValue = sinon.stub();
    });

    it('renders the new item', function() {
      const el = this.compile(['X', 'Y']);
      triggerEnterKeypress(el.find('input').val('NEW'));
      this.$apply();
      const listedValues = getListContent(el);
      expect(listedValues).toEqual(['X', 'Y', 'NEW']);
    });

    it('clears the input', function() {
      const el = this.compile();
      const input = el.find('input');
      input.val('NEW');
      triggerEnterKeypress(input);
      this.$apply();
      expect(input.val()).toEqual('');
    });

    it('calls #insertValue on field API', function() {
      const el = this.compile(['X', 'Y']);
      triggerEnterKeypress(el.find('input').val('NEW'));
      sinon.assert.calledOnce(this.fieldApi.pushValue);
      sinon.assert.calledWithExactly(this.fieldApi.pushValue, 'NEW');
    });
  });

  describe('removing an item', () => {
    beforeEach(function() {
      this.fieldApi.removeValueAt = sinon.stub();
    });

    it('does not render the removed item', function() {
      const el = this.compile(['X', 'REMOVE', 'Y']);
      findRemoveButton(el, 1).trigger('click');
      this.$apply();
      const listedValues = getListContent(el);
      expect(listedValues).toEqual(['X', 'Y']);
    });

    it('calls #removeValueAt on field api', function() {
      const el = this.compile(['X', 'REMOVE', 'Y']);
      findRemoveButton(el, 1).trigger('click');
      sinon.assert.calledOnce(this.fieldApi.removeValueAt);
      sinon.assert.calledWithExactly(this.fieldApi.removeValueAt, 1);
    });

    it('removes the list completely if there is no element left', function() {
      this.fieldApi.removeValue = sinon.stub();
      const el = this.compile(['REMOVE']);
      findRemoveButton(el, 0).trigger('click');
      this.$apply();
      sinon.assert.calledOnce(this.fieldApi.removeValue);
    });
  });

  describe('contraint hints', () => {
    it('is shown for maximum constraint', function() {
      this.fieldApi.validations = [{ size: { max: 10 } }];
      const el = this.compile();
      expect(el.text()).toMatch('Requires no more than 10 tags');
    });

    it('is shown for minimum constraint', function() {
      this.fieldApi.validations = [{ size: { min: 3 } }];
      const el = this.compile();
      expect(el.text()).toMatch('Requires at least 3 tags');
    });

    it('is shown for max and min constraint', function() {
      this.fieldApi.validations = [{ size: { min: 3, max: 10 } }];
      const el = this.compile();
      expect(el.text()).toMatch('Requires between 3 and 10 tags');
    });
  });

  function getListContent($el) {
    return $el
      .find('li')
      .map(function() {
        return $(this).text();
      })
      .get();
  }

  function findRemoveButton(parent, index) {
    return parent
      .find('li')
      .eq(index)
      .find('button[aria-label="remove"]');
  }

  function triggerEnterKeypress($el) {
    $el.trigger($.Event('keypress', { keyCode: 13 }));
  }
});
