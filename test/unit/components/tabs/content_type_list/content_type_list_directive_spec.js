'use strict';

describe('The ContentType list directive', function () {
  var $q, spaceContext;

  beforeEach(function () {
    module('contentful/test');
    $q = this.$inject('$q');
    spaceContext = this.$inject('spaceContext');
  });

  afterEach(function () {
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

  it('filters content types by name', function() {
    var contentTypes = [
      makeCT(1, 'A'),
      makeCT(2, 'B'),
      makeCT(3, 'Bx')
    ];

    spaceContext.getFilteredAndSortedContentTypes = sinon.stub().returns(contentTypes);
    spaceContext.refreshContentTypes = sinon.stub().returns($q.when([]));

    var element = this.$compile('<div cf-content-type-list>', { context: {} });
    var scope = element.scope();

    scope.searchTerm = 'B';
    scope.$apply();
    expect(element.find('.main-results tbody tr').length).toBe(2);
  });
});
