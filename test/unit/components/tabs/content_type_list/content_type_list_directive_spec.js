import * as sinon from 'helpers/sinon';

describe('The ContentType list directive', function () {
  beforeEach(function () {
    module('contentful/test');
  });


  it('filters content types by name', function () {
    const spaceContext = this.$inject('mocks/spaceContext').init();

    const contentTypes = [
      makeCT(1, 'A'),
      makeCT(2, 'B'),
      makeCT(3, 'Bx')
    ];

    spaceContext.space.getContentTypes = sinon.stub().resolves(contentTypes);

    const element = this.$compile('<div cf-content-type-list>', { context: {} });
    const scope = element.scope();

    scope.context.searchTerm = 'B';
    scope.$apply();
    expect(element.find('.table tbody tr').length).toBe(2);
  });

  function makeCT (id, name) {
    return {
      data: {},
      getId: sinon.stub().returns(id),
      getName: sinon.stub().returns(name),
      getPublishedAt: sinon.stub(),
      isDeleted: _.constant(false)
    };
  }
});
