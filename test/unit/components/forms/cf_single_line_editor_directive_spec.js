'use strict';

describe('Single Line Editor widget', function() {

  var compiledElement;
  var scope;
  beforeEach(function () {

    module('contentful/test', function ($provide) {
      $provide.removeDirectives('otBindText');
    });

    this.compileElement = function(textStr, validations) {
      var element = angular.element('<cf-single-line-editor />');
      var compile = this.$inject('$compile');
      scope = this.$inject('$rootScope').$new();
      scope.fieldData = {value: textStr};
      if (validations) {
        dotty.put(scope, 'widget.field.validations', validations);
      }
      compiledElement = compile(element)(scope);
      scope.$digest();
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
      this.compileElement(data.input);
      var txt = angular.element(compiledElement.find('div')).text();
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
    var html;
    testData.forEach(function(data) {
      this.compileElement(data.input, data.validations);
      html = angular.element(compiledElement.find('div')).html();
      expect(data.hasTxt.every(function(e) {return html.indexOf(e) > -1;})).toBe(true);
    }, this);
  });

  it ('changes color according to maxlength validation', function() {
    var testData = [
      {
        input: 'This text should turn orange',
        validations: [{size: {max: 30, min: 10}}],
        expectedClass: 'colors__orange'
      },
      {
        input: 'This text should turn red',
        validations: [{size: {max: 20, min: 10}}],
        expectedClass: 'colors__red'
      }
    ];
    var elem;
    testData.forEach(function(data) {
      this.compileElement(data.input, data.validations);
      elem = compiledElement[0].lastChild.innerHTML;
      expect(angular.element(elem).hasClass(data.expectedClass)).toBe(true);
    }, this);

  });

});
