'use strict';

describe('Single Line Editor widget', function() {
  beforeEach(function () {

    module('contentful/test', function ($provide) {
      $provide.removeDirectives('otBindText');
    });

    this.compileElement = function(value, validations, fieldType) {
      var widget = {};
      dotty.put(widget, 'field.validations', validations);
      dotty.put(widget, 'field.type', fieldType);
      var el = this.$compile('<cf-single-line-editor>', {
        fieldData: {value: value},
        widget: widget
      });
      this.$apply();
      return el;
    };

  });

  it ('counts characters correctly', function() {

    var testData = [
      {input: 'Test', expected: '4 characters'},
      {input: 'A  sentence with lots of  spaces', expected: '32 characters'},
      {input: '', expected: '0 characters'},
      {input: undefined, expected: '0 characters'}
    ];

    testData.forEach(function(data) {
      var txt = this.compileElement(data.input).text();
      expect(txt).toBe(data.expected);
    }, this);

  });

  it ('validates by min and max length', function() {
    var testData = [
      {
        input: 'Test',
        validations: [{size: {max: 20, min: 10}}],
        hasTxt: ['Min: 10', 'Max: 20']
      },
      {
        input: 'Test',
        validations: [{size: {}}],
        hasTxt: []
      }, {
        input: '',
        validations: [{size: {max: 30}}],
        hasTxt: ['Max: 30']
      }
    ];
    testData.forEach(function(data) {
      var txt = this.compileElement(data.input, data.validations).text();
      expect(data.hasTxt.every(function(e) {return txt.indexOf(e) > -1;})).toBe(true);
    }, this);
  });

  it ('changes color according to maxlength validation', function() {
    var testData = [
      {
        input: 'This text should turn orange',
        validations: [{size: {max: 30, min: 10}}],
        expectedClass: '.colors__orange'
      },
      {
        input: 'This text should turn red',
        validations: [{size: {max: 20, min: 10}}],
        expectedClass: '.colors__red'
      }
    ];
    testData.forEach(function(data) {
      var el = this.compileElement(data.input, data.validations);
      expect(el.find(data.expectedClass).length).toBe(1);
    }, this);

  });

  it('adds constraints for symbol fields', function () {
    var elem = this.compileElement('', false, 'Symbol');
    expect(elem.text()).toMatch('Required characters: Max: 256');
  });

  it('does not overwrite constraints for symbol fields', function () {
    var elem = this.compileElement('', [{size: {max: 50}}], 'Symbol');
    expect(elem.text()).toMatch('Required characters: Max: 50');
  });

});
