'use strict';

describe('Number widgets', function () {
  beforeEach(function () {
    module('contentful/test');

    var widgetApi = this.$inject('mocks/widgetApi')();

    this.fieldApi = widgetApi.field;

    this.compileElement = function () {
      var el = this.$compile('<cf-number-editor class="cf-number-editor" />', {}, {
        cfWidgetApi: widgetApi
      });

      var inputEl = el.find('input');
      var statusEl = el.find('[role=status]');

      return _.assign(el, {
        inputEl: inputEl,
        setInput: function (val) {
          inputEl.val(val).trigger('input');
          this.$apply();
        }.bind(this),
        isStatusVisible: function () {
          return statusEl.css('display') !== 'none';
        }
      });
    };
  });

  describe('Number widget', function () {
    beforeEach(function () {
      this.fieldApi.type = 'Number';
      this.el = this.compileElement();
    });

    it('sets field value', function () {
      this.el.setInput('0');
      sinon.assert.calledWith(this.fieldApi.setValue, 0);

      this.el.setInput('10.0');
      sinon.assert.calledWith(this.fieldApi.setValue, 10);

      this.el.setInput('10.012');
      sinon.assert.calledWith(this.fieldApi.setValue, 10.012);
    });

    it('does not set field value for invalid input', function () {
      this.fieldApi.setValue.reset();
      this.el.setInput('foo');
      sinon.assert.notCalled(this.fieldApi.setValue);
    });

    it('shows warning if input cannot be parsed', function () {
      this.$apply();
      expect(this.el.isStatusVisible()).toEqual(false);

      this.el.setInput('6.');
      expect(this.el.isStatusVisible()).toEqual(true);

      this.el.setInput('asd');
      expect(this.el.isStatusVisible()).toEqual(true);
    });
  });

  describe('Integer widget', function () {
    beforeEach(function () {
      this.fieldApi.type = 'Integer';
      this.el = this.compileElement();
    });
    it('does not set value for invalid input', function () {
      this.fieldApi.setValue.reset();
      this.el.setInput('6.0');
      this.el.setInput('112.1231');
      this.el.setInput('.1231');
      sinon.assert.notCalled(this.fieldApi.setValue);
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
