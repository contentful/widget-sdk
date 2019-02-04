const { parseTextQuery } = require('./query-builder');

describe('search#buildQuery()', () => {
  let testFiltersAndText, testFilters;

  beforeEach(function() {
    testFiltersAndText = async function(queryString, expected) {
      const result = await parseTextQuery(queryString);
      expect(result).toEqual(expected);
    };

    testFilters = async function(queryString, expectedFilters) {
      return testFiltersAndText(queryString, {
        filters: expectedFilters,
        queryText: ''
      });
    };
  });

  it('parses search term', async function() {
    await testFiltersAndText('some search term', {
      filters: [],
      queryText: 'some search term'
    });
  });

  it('parses single filter', async function() {
    await testFilters('foo = bar', [['foo', '=', 'bar']]);
    await testFilters('foo: bar', [['foo', ':', 'bar']]);
    await testFilters('number >= 42', [['number', '>=', '42']]);
    await testFilters('date < 2015-03-12', [['date', '<', '2015-03-12']]);
  });

  it('parses a filter and a search term', async function() {
    await testFiltersAndText('id: MYID some search term', {
      filters: [['id', ':', 'MYID']],
      queryText: 'some search term'
    });
  });

  it('parses filter value inside quotes correctly', async function() {
    await testFilters('id: "one two"', [['id', ':', 'one two']]);
  });

  it('parses multiple mixed filters', async function() {
    await testFiltersAndText(
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

  it('parses multiple duplicate filters', async function() {
    await testFilters('status:changed status: unknown status : draft status:published', [
      ['status', ':', 'changed'],
      ['status', ':', 'unknown'],
      ['status', ':', 'draft'],
      ['status', ':', 'published']
    ]);
  });
});
