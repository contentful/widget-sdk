import { $initialize, $inject } from 'test/utils/ng';

describe('cfNullEmptyInput directive', () => {
  beforeEach(async function() {
    await $initialize(this.system);
  });

  it('empty string sets model value to null', function() {
    const $compile = $inject('$compile');
    const scope = $inject('$rootScope').$new();

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
