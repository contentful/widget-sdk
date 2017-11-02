'use strict';

describe('cfSearchResultsPaginator', function () {
  beforeEach(function () {
    let page = 0;

    module('contentful/test');
    this.paginator = {
      setPage: p => {
        page = p;
      },
      getPage: () => page,
      getPageCount: _.noop
    };

    this.setAndAssertPage = function (page = 0, pageCount = 2) {
      this.paginator.setPage(page);
      this.paginator.getPageCount = sinon.stub().returns(pageCount);

      const $el = this.$compile('<cf-search-results-paginator paginator="paginator" pages="7"/>', {
        paginator: this.paginator
      });
      const scope = $el.isolateScope();

      expect(scope.paginator.getPage()).toEqual(page);
      expect(scope.paginator.getPageCount()).toEqual(pageCount);

      return { $el, scope };
    };
  });

  it('should not be visible when there\'s only one page', function () {
    const { $el } = this.setAndAssertPage(0, 1);

    expect($el.children(':first-child').css('display')).toEqual('none');
  });

  it('should have a maximum of 7 pages in view excluding ellipsis', function () {
    // [page count, page, labels]
    // active page = page + 1 since pages are zero index
    // but labels are 1-indexed
    const specs = [
      [2, 1, [{ text: '1', value: 0 }, { text: '2', value: 1 }]],
      [0, 0, []],
      [8, 1, [
        { text: '1', value: 0 },
        { text: '2', value: 1 },
        { text: '3', value: 2 },
        { text: '4', value: 3 },
        { text: '5', value: 4 },
        { text: '6', value: 5 },
        { text: '…', value: null },
        { text: '8', value: 7 }
      ]],
      [8, 2, [
        { text: '1', value: 0 },
        { text: '2', value: 1 },
        { text: '3', value: 2 },
        { text: '4', value: 3 },
        { text: '5', value: 4 },
        { text: '6', value: 5 },
        { text: '…', value: null },
        { text: '8', value: 7 }
      ]],
      [8, 4, [
        { text: '1', value: 0 },
        { text: '…', value: null },
        { text: '3', value: 2 },
        { text: '4', value: 3 },
        { text: '5', value: 4 },
        { text: '6', value: 5 },
        { text: '7', value: 6 },
        { text: '8', value: 7 }
      ]],
      [9, 4, [
        { text: '1', value: 0 },
        { text: '…', value: null },
        { text: '3', value: 2 },
        { text: '4', value: 3 },
        { text: '5', value: 4 },
        { text: '6', value: 5 },
        { text: '7', value: 6 },
        { text: '…', value: null },
        { text: '9', value: 8 }
      ]],
      [9, 10, [
        { text: '1', value: 0 },
        { text: '…', value: null },
        { text: '4', value: 3 },
        { text: '5', value: 4 },
        { text: '6', value: 5 },
        { text: '7', value: 6 },
        { text: '8', value: 7 },
        { text: '9', value: 8 }
      ]]
    ];

    specs.forEach(spec => {
      const { scope } = this.setAndAssertPage(spec[1], spec[0]);

      expect(scope.labels).toEqual(spec[2]);
    });
  });
});
