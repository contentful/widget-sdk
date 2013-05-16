'use strict';

describe('otPath', function() {
  var elem;
  beforeEach(function() {
    module('contentful/test');
    inject(function ($compile, $rootScope) {
      elem = $compile('<div ot-path="[foo, \'bar\']"></div>')($rootScope);
    });
  });

  it('should provide otChangeValue', inject(function() {
    expect(angular.element(elem).scope().otChangeValue).toBeDefined();
  }));

});
