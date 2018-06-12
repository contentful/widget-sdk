'use strict';

describe('cfNullEmptyInput directive', () => {
  beforeEach(module('contentful/test'));

  it('empty string sets model value to null', function () {
    var $compile = this.$inject('$compile');
    var scope = this.$inject('$rootScope').$new();

    var template = '<input type=text ng-model=myvalue>';
    var element = $compile(template)(scope);
    element.val('').trigger('change');
    expect(scope.myvalue).toBe('');

    template = '<input type=text ng-model=myvalue cf-null-empty-input>';
    element = $compile(template)(scope);

    element.val('').trigger('change');
    expect(scope.myvalue).toBe(null);
  });
});
