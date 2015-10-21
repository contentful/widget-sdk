'use strict';

describe('otBindText', function () {
  var scope, doc, subdoc, unbindTextArea, elem, controller;

  beforeEach(module('contentful/test', function ($provide) {
    $provide.value('ShareJS', {
      mkpathAndSetValue: sinon.stub().yieldsAsync(null),
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
    ShareJS.open.resolves(doc = {
      // otDoc
      on: sinon.stub(),
      at: sinon.stub().returns(subdoc ={
        attach_textarea: sinon.stub().returns(unbindTextArea = sinon.stub()),
        path: ['value']
      }),
      snapshot: {}
    });

    jasmine.clock().install();
    $rootScope.entity = {value: 'xx'};
    elem = $compile('<input type="text" ng-model="entity.value" ot-doc-for="entity" ot-path="[\'value\']" ot-bind-text>')($rootScope);
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

});
