'use strict';

describe('Number widgets', function () {
  beforeEach(function () {
    module('contentful/test');

    var widgetApi = this.$inject('mocks/widgetApi')();

    this.fieldApi = widgetApi.field;

    this.compileElement = function () {
      return this.$compile('<cf-number-editor class="cf-number-editor" />', {}, {
        cfWidgetApi: widgetApi
      });
    };

    this.assertValAndErrorStatus = function (val, errorStatus) {
      this.$inputEl.val(val).trigger('input');
      expect(this.$inputEl.val()).toBe(val);
      expect(this.$errorEl.css('display')).toBe(errorStatus);
    };

    this.assertSetValueOnInvalidInput = function (val) {
      this.$inputEl.val(val).trigger('input');
      sinon.assert.neverCalledWith(this.fieldApi.setValue, val);
      expect(this.elem.find('input').val()).toBe(val);
    };
  });

  describe('Number widget', function () {
    beforeEach(function () {
      this.fieldApi.type = 'Number';
      this.elem = this.compileElement();
      this.$inputEl = this.elem.find('input');
      this.$errorEl = this.elem.find('[role=status]');
    });
    it('should generate the correct value', function () {
      this.assertValAndErrorStatus('0', 'none');
      this.assertValAndErrorStatus('10.0', 'none');
      this.assertValAndErrorStatus('10.012', 'none');
    });

    it('should not call setValue for invalid input', function () {
      this.assertSetValueOnInvalidInput('foo');
    });

    it('should generate a warning for characters and invalid inputs', function () {
      this.assertValAndErrorStatus('6.', 'block');
      this.assertValAndErrorStatus('asd', 'block');
    });
  });

  describe('Integer widget', function () {
    beforeEach(function () {
      this.fieldApi.type = 'Integer';
      this.elem = this.compileElement();
      this.$inputEl = this.elem.find('input');
      this.$errorEl = this.elem.find('[role=status]');
    });

    it('should generate 0', function () {
      this.assertValAndErrorStatus('0', 'none');
    });

    it('should not call setValue for invalid input', function () {
      this.assertSetValueOnInvalidInput('foo');
      this.assertSetValueOnInvalidInput('6.0');
      this.assertSetValueOnInvalidInput('112.1231');
      this.assertSetValueOnInvalidInput('.1231');
    });

    it('should generate a warning for characters and invalid inputs', function () {
      this.assertValAndErrorStatus('asd', 'block');
      this.assertValAndErrorStatus('6.7', 'block');
    });
  });
});

describe('cfNumberEditor/parseNumber', function () {
  var parseNumber;

  beforeEach(function () {
    module('contentful/test');
    parseNumber = this.$inject('cfNumberEditor/parseNumber');
  });

  describe('parse numbers', function () {
    it('should parse numbers correctly', function () {
      var specs = [
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

      specs.forEach(function (spec) {
        expect(parseNumber(spec[0].trim(), 'Number').isValid).toEqual(spec[1]);
      });
    });
  });

  describe('parse integers', function () {
    it('should parse integers correctly', function () {
      var specs = [
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

      specs.forEach(function (spec) {
        expect(parseNumber(spec[0].trim(), 'Integer').isValid).toEqual(spec[1]);
      });
    });
  });
});
