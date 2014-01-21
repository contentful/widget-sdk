'use strict';

describe('cfLinkEditor Directive', function () {
  var element, scope;
  var compileElement;
  var stubs;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
      ]);
    });

    inject(function ($compile, $rootScope) {
      scope = $rootScope.$new();
      compileElement = function () {
        element = $compile('<div></div>')(scope);
        scope.$digest();
      };
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

});
