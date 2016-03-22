'use strict';

describe('otBindText', function () {
  var scope, doc, subdoc, unbindTextArea, elem, controller;

  beforeEach(module('contentful/test', function ($provide) {
    $provide.value('ShareJS', {
      mkpathAndSetValue: sinon.stub(),
      peek: sinon.stub().returns('xx'),
      isConnected: sinon.stub().returns(true),
      connectionFailed: sinon.stub().returns(false),
      open: sinon.stub()
    });
    $provide.value('ReloadNotification', {
      trigger: sinon.stub()
    });
  }));

  beforeEach(inject(function ($rootScope, $compile, ShareJS) {
    ShareJS.mkpathAndSetValue.resolves();
    ShareJS.open.resolves(doc = {
      // otDoc
      on: sinon.stub(),
      at: sinon.stub().returns(subdoc ={
        attach_textarea: sinon.stub().returns(unbindTextArea = sinon.stub()),
        path: ['value']
      }),
      snapshot: {sys: {}},
      close: sinon.stub(),
      removeListener: sinon.stub()
    });

    jasmine.clock().install();
    $rootScope.entity = {value: 'xx'};
    var template = '<input type="text" ng-model="entity.value" ot-doc-for="entity" ot-path="[\'value\']" ot-bind-text>';
    elem = this.$compile(template, {
      value: 'xx',
      entity: {
        data: {sys: {}},
        update: sinon.stub()
      }
    });
    scope = elem.scope();
    scope.otDoc.state.disabled = false;
    controller = elem.controller('ngModel');
  }));

  afterEach(function () {
    jasmine.clock().uninstall();
  });

  it('should not insert an accent into the text field', function () {
    expect(controller.$parsers[0]('´')).toBeNull();
  });

  it('should not insert a character into the text field', function () {
    expect(controller.$parsers[0]('e')).toBe('e');
  });


  it('should detach the textfield when otSubdoc is removed', function () {
    scope.$apply();
    jasmine.clock().tick(10);
    expect(scope.otSubDoc.doc).not.toBe(null);
    expect(scope.otSubDoc.doc).toBe(subdoc);
    sinon.assert.calledOnce(subdoc.attach_textarea);
    subdoc.attach_textarea.reset();

    scope.otSubDoc.doc = undefined;
    scope.$apply();
    sinon.assert.calledOnce(unbindTextArea);


    scope.otSubDoc.doc = subdoc;
    scope.$apply();
    sinon.assert.calledOnce(subdoc.attach_textarea);
  });

  /**
   * This test ensures that when a textfield is cleared and the directive wants
   * to detach from shareJS, it does so by calling
   * `scope.otSubDoc.changeValue()` with undefined instead of null.
   * See BUG#6696
   */
  it('should call shareJS with undefined when clearing out a field',
  function() {
    scope.otSubDoc.changeValue = sinon.spy();
    //Simulate input changes. This can also be done by changing
    //`controller.$modelValue`, but wont trigger `$scope.viewChangeListeners`
    elem.val('some text which will be removed').trigger('input');
    //NOTE: Angular treats `''` and `null` as the same when passed to
    //`elem.val()` but test both just to be sure
    elem.val('').trigger('input');
    elem.val('some text which will be removed').trigger('input');
    elem.val(null).trigger('input');
    sinon.assert.calledWith(scope.otSubDoc.changeValue, undefined);
    sinon.assert.calledTwice(scope.otSubDoc.changeValue);
  });

});
