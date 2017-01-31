'use strict';

describe('The ContentType list directive', function () {
  let spaceContext;

  beforeEach(function () {
    module('contentful/test');
    spaceContext = this.$inject('spaceContext');
  });

  afterEach(function () {
    spaceContext = null;
    this.$inject('$document').empty();
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

  it('filters content types by name', function () {
    spaceContext.contentTypes = [
      makeCT(1, 'A'),
      makeCT(2, 'B'),
      makeCT(3, 'Bx')
    ];

    spaceContext.refreshContentTypes = sinon.stub().resolves();

    const element = this.$compile('<div cf-content-type-list>', { context: {} });
    const scope = element.scope();

    scope.searchTerm = 'B';
    scope.$apply();
    expect(element.find('.table tbody tr').length).toBe(2);
  });
});
