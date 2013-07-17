'use strict';

describe('DateTime Editor', function () {
  var element, scope;
  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($compile, $rootscope){
    scope = $rootscope;
    scope.fieldData = {value: null};
    element = $('<div class="cf-datetime-editor" ng-model="fieldData.value"></div>')(scope);
  }));
});
