import * as sinon from 'helpers/sinon';

describe('The ContentType list directive', function () {
  it('filters content types by name', function () {
    module('contentful/test', function ($provide) {
      $provide.value('$state', {current: {}, href: () => {}});
    });

    const contentTypes = [
      {sys: {id: 1}, name: 'A'},
      {sys: {id: 2}, name: 'B'},
      {sys: {id: 3}, name: 'Bx'}
    ];

    const spaceContext = this.$inject('mocks/spaceContext').init();
    spaceContext.endpoint = sinon.stub().resolves({items: contentTypes});

    const element = this.$compile('<div cf-content-type-list />', { context: {} });
    const scope = element.scope();

    scope.context.searchTerm = 'B';
    scope.$apply();
    expect(element.find('.table tbody tr').length).toBe(2);
  });
});
