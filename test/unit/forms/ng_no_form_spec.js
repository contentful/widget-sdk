'use strict';

describe('cfNoForm directive', function () {
  beforeEach(module('cf.forms'));

  it('empty string sets model value to null', function () {
    var $compile = this.$inject('$compile');
    var scope = this.$inject('$rootScope').$new();

    var template = '<form name="myform">' +
                     '<input name="no-dirty" ng-model="x" cf-no-form>' +
                     '<input name="dirty" ng-model="y">' +
                   '</form>';

    var element = $compile(template)(scope);
    var form = scope.myform;

    element.find('[name=no-dirty]').trigger('change');
    expect(form.$dirty).toBe(false);

    element.find('[name=dirty]').trigger('change');
    expect(form.$dirty).toBe(true);
  });
});
