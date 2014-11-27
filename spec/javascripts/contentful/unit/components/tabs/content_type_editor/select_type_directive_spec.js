'use strict';

describe('The select type directive', function () {

  var container, scope;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.constant('availableFieldTypes', [
        {name: 'type1', group: 'Single'},
        {name: 'type2', group: 'Single'},
        {name: 'type3', group: 'Multiple'},
        {name: 'type4', group: 'Multiple'}
      ]);
      $provide.removeDirectives('contentTypeDescription', 'cfFieldtypeIcon');
    });

    inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();
      scope.testAction = sinon.stub();

      container = $('<div select-type="testAction"></div>');
      $compile(container)(scope);
      scope.$digest();
    });
  });

  afterEach(inject(function ($log) {
    container.remove();
    $log.assertEmpty();
  }));

  it('has first single type', function() {
    expect(container.find('[data-type-name="type1"]').get(0)).toBeDefined();
  });

  it('has second single type', function() {
    expect(container.find('[data-type-name="type2"]').get(0)).toBeDefined();
  });

  it('has first multiple type', function() {
    expect(container.find('[data-type-name="type3"]').get(0)).toBeDefined();
  });

  it('has second multiple type', function() {
    expect(container.find('[data-type-name="type4"]').get(0)).toBeDefined();
  });

  it('calls action', function() {
    container.find('.menu-list').scope().testAction();
    expect(scope.testAction).toBeCalled();
  });

});
