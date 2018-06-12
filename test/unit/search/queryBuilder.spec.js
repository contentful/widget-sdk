describe('search#buildQuery()', () => {
  beforeEach(function () {
    module('contentful/test');

    this.parseTextQuery = this.$inject('search/queryBuilder').parseTextQuery;

    this.testFiltersAndText = async function (queryString, expected) {
      const result = await this.parseTextQuery(queryString);
      expect(result).toEqual(expected);
    };

    this.testFilters = async function (queryString, expectedFilters) {
      return this.testFiltersAndText(queryString, {
        filters: expectedFilters,
        queryText: ''
      });
    };
  });

  it('parses search term', async function () {
    await this.testFiltersAndText(
      'some search term',
      {
        filters: [],
        queryText: 'some search term'
      }
    );
  });

  it('parses single filter', async function () {
    await this.testFilters(
      'foo = bar',
      [['foo', '=', 'bar']]
    );
    await this.testFilters(
      'foo: bar',
      [['foo', ':', 'bar']]
    );
    await this.testFilters(
      'number >= 42',
      [['number', '>=', '42']]
    );
    await this.testFilters(
      'date < 2015-03-12',
      [['date', '<', '2015-03-12']]
    );
  });

  it('parses a filter and a search term', async function () {
    await this.testFiltersAndText(
      'id: MYID some search term',
      {
        filters: [['id', ':', 'MYID']],
        queryText: 'some search term'
      }
    );
  });

  it('parses filter value inside quotes correctly', async function () {
    await this.testFilters(
      'id: "one two"',
      [['id', ':', 'one two']]
    );
  });

  it('parses multiple mixed filters', async function () {
    await this.testFiltersAndText(
      'status :archived API_NAME_1 = "LINK 1" NAME_2:TEXT some search text',
      {
        filters: [
          ['status', ':', 'archived'],
          ['API_NAME_1', '=', 'LINK 1'],
          ['NAME_2', ':', 'TEXT']
        ],
        queryText: 'some search text'
      }
    );
  });

  it('parses multiple duplicate filters', async function () {
    await this.testFilters(
      'status:changed status: unknown status : draft status:published',
      [
        ['status', ':', 'changed'],
        ['status', ':', 'unknown'],
        ['status', ':', 'draft'],
        ['status', ':', 'published']
      ]
    );
  });
});
