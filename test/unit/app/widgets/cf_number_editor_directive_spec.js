'use strict';
import _ from 'lodash';

describe('Number widgets', () => {
  beforeEach(function() {
    module('contentful/test');

    this.widgetApi = this.$inject('mocks/widgetApi').create();

    this.fieldApi = this.widgetApi.field;

    this.compileElement = function() {
      const el = this.$compile(
        '<cf-number-editor />',
        {},
        {
          cfWidgetApi: this.widgetApi
        }
      );

      const inputEl = el.find('input');
      const statusEl = el.find('[role=status]');

      return _.assign(el, {
        inputEl: inputEl,
        setInput: val => {
          inputEl.val(val).trigger('input');
          this.$apply();
        },
        isStatusVisible: function() {
          return statusEl.css('display') !== 'none';
        }
      });
    };
  });

  describe('Number widget', () => {
    beforeEach(function() {
      this.fieldApi.type = 'Number';
      this.el = this.compileElement();
    });

    it('sets field value', function() {
      this.el.setInput('0');
      sinon.assert.calledWith(this.fieldApi.setValue, 0);

      this.el.setInput('10.0');
      sinon.assert.calledWith(this.fieldApi.setValue, 10);

      this.el.setInput('10.012');
      sinon.assert.calledWith(this.fieldApi.setValue, 10.012);
    });

    it('does not set field value for invalid input', function() {
      this.fieldApi.setValue.reset();
      this.el.setInput('foo');
      sinon.assert.notCalled(this.fieldApi.setValue);
    });
  });

  describe('Integer widget', () => {
    beforeEach(function() {
      this.fieldApi.type = 'Integer';
      this.el = this.compileElement();
    });
    it('does not set value for invalid input', function() {
      this.fieldApi.setValue.reset();
      this.el.setInput('6.0');
      this.el.setInput('112.1231');
      this.el.setInput('.1231');
      sinon.assert.notCalled(this.fieldApi.setValue);
    });
  });
});

describe('cfNumberEditor/parseNumber', () => {
  let parseNumber;

  beforeEach(function() {
    module('contentful/test');
    parseNumber = this.$inject('cfNumberEditor/parseNumber');
  });

  describe('parse numbers', () => {
    it('should parse numbers correctly', () => {
      const specs = [
        ['12', true],
        ['12.12', true],
        ['0.12', true],
        ['.12', true],
        ['.0', true],
        ['-.12', true],
        ['-12', true],
        ['-0.12', true],
        ['+12', true],
        [' ', true],
        ['1 as', false],
        ['12.', false],
        ['.', false],
        ['asd', false],
        ['0.12 as', false],
        ['-.1 as', false],
        ['--', false]
      ];

      specs.forEach(spec => {
        expect(parseNumber(spec[0].trim(), 'Number').isValid).toEqual(spec[1]);
      });
    });
  });

  describe('parse integers', () => {
    it('should parse integers correctly', () => {
      const specs = [
        ['12', true],
        ['012', true],
        ['-12', true],
        ['+12', true],
        [' ', true],
        ['1 as', false],
        ['12.12', false],
        ['0.12', false],
        ['.12', false],
        ['.0', false],
        ['-.12', false],
        ['-0.12', false],
        ['12.', false],
        ['.', false],
        ['asd', false],
        ['0.12 as', false],
        ['-.1 as', false],
        ['--', false]
      ];

      specs.forEach(spec => {
        expect(parseNumber(spec[0].trim(), 'Integer').isValid).toEqual(spec[1]);
      });
    });
  });
});
