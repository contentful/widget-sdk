'use strict';

describe('cfTagEditor directive', function () {
  beforeEach(function () {
    module('cf.app');

    this.fieldApi = {
      onValueChanged: sinon.stub(),
      onDisabledStatusChanged: sinon.stub()
    };

    this.compile = function (items) {
      var el = this.$compile('<cf-tag-editor />', {}, {
        cfWidgetApi: {field: this.fieldApi}
      });
      this.fieldApi.onValueChanged.yield(items);
      this.$apply();
      return el;
    };
  });

  it('renders initial items', function () {
    var values = ['X', 'Y', 'Z'];
    var el = this.compile(values);
    var listedValues = getListContent(el);
    expect(listedValues).toEqual(values);
  });

  it('renders undefined value', function () {
    var el = this.compile();
    var listedValues = getListContent(el);
    expect(listedValues).toEqual([]);
  });

  describe('adding an item', function () {
    beforeEach(function () {
      this.fieldApi.pushValue = sinon.stub();
    });

    it('renders the new item', function () {
      var el = this.compile(['X', 'Y']);
      triggerEnterKeypress(el.find('input').val('NEW'));
      this.$apply();
      var listedValues = getListContent(el);
      expect(listedValues).toEqual(['X', 'Y', 'NEW']);
    });

    it('clears the input', function () {
      var el = this.compile();
      var input = el.find('input');
      input.val('NEW');
      triggerEnterKeypress(input);
      this.$apply();
      expect(input.val()).toEqual('');
    });

    it('calls #insertValue on field API', function () {
      var el = this.compile(['X', 'Y']);
      triggerEnterKeypress(el.find('input').val('NEW'));
      sinon.assert.calledOnce(this.fieldApi.pushValue);
      sinon.assert.calledWithExactly(this.fieldApi.pushValue, 'NEW');
    });
  });

  describe('removing an item', function () {
    beforeEach(function () {
      this.fieldApi.removeValueAt = sinon.stub();
    });

    it('does not render the removed item', function () {
      var el = this.compile(['X', 'REMOVE', 'Y']);
      findRemoveButton(el, 1).trigger('click');
      this.$apply();
      var listedValues = getListContent(el);
      expect(listedValues).toEqual(['X', 'Y']);
    });

    it('calls #removeValueAt on field api', function () {
      var el = this.compile(['X', 'REMOVE', 'Y']);
      findRemoveButton(el, 1).trigger('click');
      sinon.assert.calledOnce(this.fieldApi.removeValueAt);
      sinon.assert.calledWithExactly(this.fieldApi.removeValueAt, 1);
    });

    it('removes the list completely if there is no element left', function () {
      this.fieldApi.removeValue = sinon.stub();
      var el = this.compile(['REMOVE']);
      findRemoveButton(el, 0).trigger('click');
      this.$apply();
      sinon.assert.calledOnce(this.fieldApi.removeValue);
    });
  });

  describe('contraint hints', function () {
    it('is shown for maximum constraint', function () {
      this.fieldApi.validations = [{size: {max: 10}}];
      var el = this.compile();
      expect(el.text()).toMatch('Requires no more than 10 tags');
    });

    it('is shown for minimum constraint', function () {
      this.fieldApi.validations = [{size: {min: 3}}];
      var el = this.compile();
      expect(el.text()).toMatch('Requires at least 3 tags');
    });

    it('is shown for max and min constraint', function () {
      this.fieldApi.validations = [{size: {min: 3, max: 10}}];
      var el = this.compile();
      expect(el.text()).toMatch('Requires between 3 and 10 tags');
    });
  });

  function getListContent ($el) {
    return $el.find('li').map(function () {
      return $(this).text();
    }).get();
  }

  function findRemoveButton (parent, index) {
    return parent.find('li').eq(index).find('button[aria-label="remove"]');
  }

  function triggerEnterKeypress ($el) {
    $el.trigger($.Event('keypress', {keyCode: 13}));
  }
});
