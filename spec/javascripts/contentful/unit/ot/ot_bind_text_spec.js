'use strict';

describe('otBindText', function () {
  var scope, doc, subdoc, unbindTextArea, elem, controller;

  beforeEach(module('contentful/test', function ($provide) {
    $provide.value('ShareJS', {
      mkpath: sinon.stub().yieldsAsync(null),
      peek: sinon.stub().returns('xx'),
      isConnected: function () { return true; },
      open: sinon.stub().yieldsAsync(null, doc = {
        on: sinon.stub(),
        at: sinon.stub().returns(subdoc ={
          attach_textarea: sinon.stub().returns(unbindTextArea = sinon.stub()),
          path: ['value']
        })
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
    expect(subdoc.attach_textarea).toBeCalledOnce();
    subdoc.attach_textarea.reset();

    scope.otSubdoc = null;
    scope.$apply();
    expect(unbindTextArea).toBeCalledOnce();


    scope.otSubdoc = subdoc;
    scope.$apply();
    expect(subdoc.attach_textarea).toBeCalledOnce();
  });

  describe('when mkPath fails', function () {
    it('should throw an error', inject(function (ShareJS, $rootScope, environment){
      ShareJS.mkpath = sinon.stub().yieldsAsync('error');
      ShareJS.peek.withArgs(undefined, ['value']).returns(undefined);
      $rootScope.entity.value = null;

      scope.$apply();
      elem.val('a').trigger('input');
      expect(function(){
        jasmine.clock().tick(10);
      }).toThrow(new Error('makeAndAttach mkpath failed'));
    }));
  });

});
