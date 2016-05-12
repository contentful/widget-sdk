'use strict';

describe('cfSingleLineEditor directive', function () {
  beforeEach(function () {
    module('contentful/test');

    var path = ['fields', 'single_line', 'de-DE'];

    this.compileElement = function (validations, fieldType) {
      var widget = {};
      var $injector = this.$inject('$injector');
      var $controller = this.$inject('$controller');

      this.controllerScope = this.$inject('$rootScope').$new();
      this.controllerScope.otPath = path;

      dotty.put(widget, 'field.validations', validations);
      dotty.put(widget, 'field.type', fieldType);
      dotty.put(widget, 'settings.helpText', 'wat');

      _.extend(this.controllerScope, {
        widget: widget,
        otSubDoc: {
          changeString: sinon.stub(),
          getValue: sinon.stub()
        },
        isDisabled: sinon.stub(),
        locale: {}
      });

      // TODO(mudit): Mock the WidgetApiController
      var cfWidgetApi = $controller('WidgetApiController', {
        '$scope': this.controllerScope,
        '$injector': $injector
      });

      var el = this.$compile('<cf-single-line-editor>', {}, {
        cfWidgetApi: cfWidgetApi
      });

      return el;
    };

    // TODO(mudit): Remove dependency on this once WidgetApiController
    // is mocked.
    this.emitOtValueChanged = function (value) {
      this.controllerScope.$emit('otValueChanged', path, value);
      this.$apply();
    };

  });

  it('updates correctly when value change is indicated by sharejs', function () {
    var $el = this.compileElement();

    this.emitOtValueChanged('test');
    expect($el.children('input').val()).toEqual('test');
  });

  it('input event on text field calls changeString (via setString)', function () {
    var $el = this.compileElement();

    $el.children('input').trigger('input', 'what');
    sinon.assert.calledOnce(this.controllerScope.otSubDoc.changeString);
  });

  it('counts characters correctly', function () {

    var testData = [
      {input: 'Test', expected: '4 characters'},
      {input: 'A  sentence with lots of  spaces', expected: '32 characters'},
      {input: '', expected: '0 characters'},
      {input: undefined, expected: '0 characters'}
    ];

    testData.forEach(function (data) {
      var $el = this.compileElement();

      this.emitOtValueChanged(data.input);
      expect($el.text()).toBe(data.expected);
    }, this);

  });

  it('displays validation hints', function () {
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
    testData.forEach(function (data) {
      var $el = this.compileElement(data.validations);

      this.emitOtValueChanged('');
      expect($el.text()).toMatch(data.hint);
    }, this);
  });

  it('changes color according to maxlength validation', function () {
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
    testData.forEach(function (data) {
      var el = this.compileElement(data.validations);

      this.emitOtValueChanged(data.input);
      expect(el.find(data.expectedClass).length).toBe(1);
    }, this);

  });

  it('adds max constraints for symbol fields', function () {
    var elem = this.compileElement(false, 'Symbol');

    this.emitOtValueChanged('');
    expect(elem.text()).toMatch('Requires less than 256 characters');
  });

  it('adds max constraints to symbol fields with min validation', function () {
    var elem = this.compileElement([{size: {min: 20, max: null}}], 'Symbol');

    this.emitOtValueChanged('');
    expect(elem.text()).toMatch('Requires between 20 and 256 characters');
  });

  it('does not overwrite constraints for symbol fields', function () {
    var elem = this.compileElement([{size: {min: null, max: 50}}], 'Symbol');

    this.emitOtValueChanged('');
    expect(elem.text()).toMatch('Requires less than 50 characters');
  });

});
