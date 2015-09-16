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

  it('counts characters correctly', function() {

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

  it('displays validation hints', function() {
    var testData = [
      {
        validations: [{size: {max: 20, min: 10}}],
        hint: 'Requires between 10 and 20 characters'
      }, {
        validations: [{size: {max: null, min: 10}}],
        hint: 'Requires at least 10 characters'
      }, {
        validations: [{size: {max: 20, min: null}}],
        hint: 'Requires less than 20 characters'
      }
    ];
    testData.forEach(function(data) {
      var txt = this.compileElement(data.input, data.validations).text();
      expect(txt).toMatch(data.hint);
    }, this);
  });

  it('changes color according to maxlength validation', function() {
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

  it('adds max constraints for symbol fields', function () {
    var elem = this.compileElement('', false, 'Symbol');
    expect(elem.text()).toMatch('Requires less than 256 characters');
  });

  it('adds max constraints to symbol fields with min validation', function () {
    var elem = this.compileElement('', [{size: {min: 20, max: null}}], 'Symbol');
    expect(elem.text()).toMatch('Requires between 20 and 256 characters');
  });

  it('does not overwrite constraints for symbol fields', function () {
    var elem = this.compileElement('', [{size: {min: null, max: 50}}], 'Symbol');
    expect(elem.text()).toMatch('Requires less than 50 characters');
  });

});
