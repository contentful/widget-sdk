'use strict';

describe('otBindText', function () {
  var scope, doc, subdoc, unbindTextArea, elem, controller;

  beforeEach(module('contentful/test', function ($provide) {
    $provide.value('ShareJS', {
      mkpath: sinon.stub().yieldsAsync(null),
      peek: sinon.stub().returns('xx'),
      isConnected: function () { return true; },
      open: sinon.stub().yieldsAsync(null, doc = {
        // otDoc
        on: sinon.stub(),
        at: sinon.stub().returns(subdoc ={
          attach_textarea: sinon.stub().returns(unbindTextArea = sinon.stub()),
          path: ['value']
        }),
        snapshot: {}
      })
    });
    $provide.value('ReloadNotification', {
      trigger: sinon.stub()
    });
  }));

  beforeEach(inject(function ($rootScope, $compile) {
    jasmine.clock().install();
    $rootScope.entity = {value: 'xx'};
    elem = $compile('<input type="text" ng-model="entity.value" ot-doc-for="entity" ot-path="[\'value\']" ot-subdoc ot-bind-text>')($rootScope);
    scope = elem.scope();
    scope.otDisabled = false;
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
    expect(scope.otSubdoc).not.toBe(null);
    expect(scope.otSubdoc).toBe(subdoc);
    sinon.assert.calledOnce(subdoc.attach_textarea);
    subdoc.attach_textarea.reset();

    scope.otSubdoc = null;
    scope.$apply();
    sinon.assert.calledOnce(unbindTextArea);


    scope.otSubdoc = subdoc;
    scope.$apply();
    sinon.assert.calledOnce(subdoc.attach_textarea);
  });

});
