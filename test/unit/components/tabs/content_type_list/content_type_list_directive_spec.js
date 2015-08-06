'use strict';

describe('The ContentType list directive', function () {
  beforeEach(module('contentful/test'));

  afterEach(function () {
    this.$inject('$document').empty();
  });

  function makeCT (id, name) {
    return {
      data: {},
      getId: sinon.stub().returns(id),
      getName: sinon.stub().returns(name),
      getPublishedAt: sinon.stub()
    };
  }

  it('filters content types by name', function() {
    var element = this.$compile('<div cf-content-type-list>', {
      context: {},
      spaceContext: {
        contentTypes: [
          makeCT(1, 'A'),
          makeCT(2, 'B'),
          makeCT(3, 'Bx')
        ],
        filterAndSortContentTypes: _.identity,
        refreshContentTypes: sinon.stub()
      },
      searchTerm: 'B'
    });
    expect(element.find('.main-results tbody tr').length).toBe(2);
  });

});
