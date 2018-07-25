'use strict';

describe('cfNullEmptyInput directive', () => {
  beforeEach(module('contentful/test'));

  it('empty string sets model value to null', function () {
    const $compile = this.$inject('$compile');
    const scope = this.$inject('$rootScope').$new();

    let template = '<input type=text ng-model=myvalue>';
    let element = $compile(template)(scope);
    element.val('').trigger('change');
    expect(scope.myvalue).toBe('');

    template = '<input type=text ng-model=myvalue cf-null-empty-input>';
    element = $compile(template)(scope);

    element.val('').trigger('change');
    expect(scope.myvalue).toBe(null);
  });
});
