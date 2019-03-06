import * as sinon from 'test/helpers/sinon';

xdescribe('The ContentType list directive', () => {
  it('filters content types by name', function() {
    module('contentful/test', $provide => {
      $provide.value('$state', { current: {}, href: () => {} });
    });

    const contentTypes = [
      { sys: { id: 1, publishedBy: { sys: { id: 1 } } }, name: 'A' },
      { sys: { id: 2, publishedBy: { sys: { id: 1 } } }, name: 'B' },
      { sys: { id: 3, publishedBy: { sys: { id: 1 } } }, name: 'Bx' }
    ];

    const spaceContext = this.$inject('mocks/spaceContext').init();
    spaceContext.endpoint = sinon.stub().resolves({ items: contentTypes });

    const element = this.$compile(
      '<react-component name="components/tabs/content_type_list/ContentTypeListPage.es6" />',
      { context: {} }
    );
    const scope = element.scope();

    scope.context.searchTerm = 'B';
    scope.$apply();
    expect(element.find('table tbody tr').length).toBe(2);
  });
});
