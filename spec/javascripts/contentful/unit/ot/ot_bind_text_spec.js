'use strict';

describe('otBindText', function () {
  var scope, doc, subdoc, unbindTextArea, elem, controller;

  beforeEach(module('contentful/test', function ($provide) {
    $provide.value('ShareJS', {
      mkpath: sinon.stub(),
      peek: sinon.stub().returns('xx'),
      connection: {
        state: 'ok'
      },
      open: sinon.stub().yieldsAsync(null, doc = {
        on: sinon.stub(),
        at: sinon.stub().returns(subdoc ={
          attach_textarea: sinon.stub().returns(unbindTextArea = sinon.stub())
        })
      })
    });
  }));

  beforeEach(inject(function ($rootScope, $compile) {
    jasmine.Clock.useMock();
    $rootScope.entity = {value: 'xx'};
    elem = $compile('<input type="text" ng-model="entity.value" ot-doc-for="entity" ot-path="[\'value\']" ot-subdoc ot-bind-text>')($rootScope);
    scope = elem.scope();
    scope.otDisabled = false;
    controller = elem.controller('ngModel');
  }));

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('should not insert an accent into the text field', function () {
    expect(controller.$parsers[0]('´')).toBeNull();
  });

  it('should not insert a character into the text field', function () {
    expect(controller.$parsers[0]('e')).toBe('e');
  });


  it('should detach the textfield when otSubdoc is removed', function () {
    scope.$apply();
    jasmine.Clock.tick(10);
    expect(scope.otSubdoc).toBe(subdoc);
    expect(subdoc.attach_textarea.calledOnce).toBe(true);
    subdoc.attach_textarea.reset();

    scope.otSubdoc = null;
    scope.$apply();
    expect(unbindTextArea.calledOnce).toBe(true);


    scope.otSubdoc = subdoc;
    scope.$apply();
    expect(subdoc.attach_textarea.calledOnce).toBe(true);
  });
});
