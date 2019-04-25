const { parseTextQuery } = require('./query-builder');

describe('search#buildQuery()', () => {
  let testFiltersAndText, testFilters;

  beforeEach(function() {
    testFiltersAndText = function(queryString, expected) {
      const result = parseTextQuery(queryString);
      expect(result).toEqual(expected);
    };

    testFilters = function(queryString, expectedFilters) {
      return testFiltersAndText(queryString, {
        filters: expectedFilters,
        queryText: ''
      });
    };
  });

  it('parses search term', function() {
    testFiltersAndText('some search term', {
      filters: [],
      queryText: 'some search term'
    });
  });

  it('parses single filter', function() {
    testFilters('foo = bar', [['foo', '=', 'bar']]);
    testFilters('foo: bar', [['foo', ':', 'bar']]);
    testFilters('number >= 42', [['number', '>=', '42']]);
    testFilters('date < 2015-03-12', [['date', '<', '2015-03-12']]);
  });

  it('parses a filter and a search term', function() {
    testFiltersAndText('id: MYID some search term', {
      filters: [['id', ':', 'MYID']],
      queryText: 'some search term'
    });
  });

  it('parses filter value inside quotes correctly', function() {
    testFilters('id: "one two"', [['id', ':', 'one two']]);
  });

  it('parses multiple mixed filters', function() {
    testFiltersAndText('status :archived API_NAME_1 = "LINK 1" NAME_2:TEXT some search text', {
      filters: [
        ['status', ':', 'archived'],
        ['API_NAME_1', '=', 'LINK 1'],
        ['NAME_2', ':', 'TEXT']
      ],
      queryText: 'some search text'
    });
  });

  it('parses multiple duplicate filters', function() {
    testFilters('status:changed status: unknown status : draft status:published', [
      ['status', ':', 'changed'],
      ['status', ':', 'unknown'],
      ['status', ':', 'draft'],
      ['status', ':', 'published']
    ]);
  });
});
