'use strict';

describe('Number widgets', function () {
  beforeEach(function () {
    module('contentful/test');

    this.fieldApi = {
      onValueChanged: sinon.stub(),
      onDisabledStatusChanged: sinon.stub(),
      type: '',
      setValue: sinon.stub()
    };

    this.compileElement = function () {
      return this.$compile('<cf-number-editor class="cf-number-editor" />', {}, {
        cfWidgetApi: {field: this.fieldApi}
      });
    };
  });

  describe('Number widget', function () {
    beforeEach(function () {
      this.fieldApi.type = 'Number';
      this.elem = this.compileElement();
    });
    it('should generate the right value', function () {
      this.elem.find('input').val('0').trigger('input');
      expect(this.elem.children('input').val()).toBe('0');
      expect(this.elem.find('.cf-field-alert').css('display')).toBe('none');

      this.elem.find('input').val('10.0').trigger('input');
      expect(this.elem.children('input').val()).toBe('10.0');
      expect(this.elem.find('.cf-field-alert').css('display')).toBe('none');

      this.elem.find('input').val('10.012').trigger('input');
      expect(this.elem.children('input').val()).toBe('10.012');
      expect(this.elem.find('.cf-field-alert').css('display')).toBe('none');
    });

    it('should not call setValue for invalid input', function () {
      this.elem.find('input').val('foo').trigger('input');
      sinon.assert.neverCalledWith(this.fieldApi.setValue, 'foo');
      expect(this.elem.find('input').val()).toBe('foo');
    });

    it('should generate a warning for characters and invalid inputs', function () {
      this.elem.find('input').val('6.').trigger('input');
      expect(this.elem.find('input').val()).toBe('6.');
      expect(this.elem.find('.cf-field-alert').css('display')).toBe('inline');

      this.elem.find('input').val('asd').trigger('input');
      expect(this.elem.find('input').val()).toBe('asd');
      expect(this.elem.find('.cf-field-alert').css('display')).toBe('inline');
    });
  });

  describe('Integer widget', function () {
    beforeEach(function () {
      this.fieldApi.type = 'Integer';
      this.elem = this.compileElement();
    });

    it('should generate 0', function () {
      this.elem.find('input').val('0').trigger('input');
      expect(this.elem.children('input').val()).toBe('0');
      expect(this.elem.find('.cf-field-alert').css('display')).toBe('none');
    });

    it('should not call setValue for invalid input', function () {
      this.elem.find('input').val('foo').trigger('input');
      sinon.assert.neverCalledWith(this.fieldApi.setValue, 'foo');
      expect(this.elem.find('input').val()).toBe('foo');

      this.elem.find('input').val('6.0').trigger('input');
      sinon.assert.neverCalledWith(this.fieldApi.setValue, '6.0');
      expect(this.elem.find('input').val()).toBe('6.0');

      this.elem.find('input').val('112.1231').trigger('input');
      sinon.assert.neverCalledWith(this.fieldApi.setValue, '112.1231');
      expect(this.elem.find('input').val()).toBe('112.1231');

      this.elem.find('input').val('.1231').trigger('input');
      sinon.assert.neverCalledWith(this.fieldApi.setValue, '.1231');
      expect(this.elem.find('input').val()).toBe('.1231');
    });

    it('should generate a warning for characters and invalid inputs', function () {
      this.elem.find('input').val('asd').trigger('input');
      expect(this.elem.find('input').val()).toBe('asd');
      expect(this.elem.find('.cf-field-alert').css('display')).toBe('inline');

      this.elem.find('input').val('6.7').trigger('input');
      expect(this.elem.find('input').val()).toBe('6.7');
      expect(this.elem.find('.cf-field-alert').css('display')).toBe('inline');
    });
  });
});

describe('cfNumberEditor/parseNumber', function () {
  var parseNumber;

  beforeEach(function () {
    module('contentful/test');
    parseNumber = this.$inject('cfNumberEditor/parseNumber');
  });
  describe('parse numbers', function() {
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

  describe('parse integers', function() {
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
