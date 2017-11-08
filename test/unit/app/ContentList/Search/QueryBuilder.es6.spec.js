import _ from 'lodash';
import moment from 'npm:moment';
import { contentTypes } from './helpers';

describe('app/ContentList/Search/QueryBuilder', function () {
  let buildQuery;
  beforeEach(function () {
    module('contentful/test');

    buildQuery = this.$inject('app/ContentList/Search/QueryBuilder').buildQuery;
  });

  const buildQueryMacro = (message, input, expected) => {
    it(message, () => {
      expect(buildQuery(input)).toEqual(expected);
    });
  };

  const buildQueryWithContentTypesMacro = (message, filterParams, expected) => {
    return buildQueryMacro(
      message,
      {
        contentTypes,
        filterParams
      },
      expected
    );
  };

  describe('General behaviour', () => {
    buildQueryWithContentTypesMacro(
      'contentTypeId only',
      { contentTypeId: 'contentTypeId' },
      { content_type: 'contentTypeId' }
    );

    buildQueryWithContentTypesMacro(
      'searchText only',
      { searchText: 'free text' },
      { query: 'free text' }
    );

    buildQueryWithContentTypesMacro(
      'searchFilters sys',
      {
        searchFilters: [['sys.id', '', '2']]
      },
      { 'sys.id': '2' }
    );

    buildQueryWithContentTypesMacro(
      'searchFilters with contentType specific field',
      {
        searchFilters: [['fields.website', '', '2']],
        contentTypeId: 'sFzTZbSuM8coEwygeUYes'
      },
      {
        'fields.website': '2',
        content_type: 'sFzTZbSuM8coEwygeUYes'
      }
    );

    buildQueryWithContentTypesMacro(
      'searchFilters with contentType specific field and search text',
      {
        searchFilters: [['fields.website', '', '2']],
        contentTypeId: 'sFzTZbSuM8coEwygeUYes',
        searchText: 'xoxo'
      },
      {
        'fields.website': '2',
        content_type: 'sFzTZbSuM8coEwygeUYes',
        query: 'xoxo'
      }
    );

    buildQueryWithContentTypesMacro(
      'contentTypeId and searchText',
      {
        contentTypeId: 'contentTypeId',
        searchText: 'free text'
      },
      {
        content_type: 'contentTypeId',
        query: 'free text'
      }
    );
  });

  describe('status conversion', () => {
    buildQueryWithContentTypesMacro(
      'status draft',
      {
        searchFilters: [['__status', '', 'draft']]
      },
      {
        'sys.publishedAt[exists]': 'false',
        'sys.archivedAt[exists]': 'false'
      }
    );

    buildQueryWithContentTypesMacro(
      'status published',
      {
        searchFilters: [['__status', '', 'published']]
      },
      {
        'sys.publishedAt[exists]': 'true',
        'sys.archivedAt[exists]': 'false'
      }
    );

    buildQueryWithContentTypesMacro(
      'status changed',
      {
        searchFilters: [['__status', '', 'changed']]
      },
      {
        'sys.publishedAt[exists]': 'true',
        'sys.archivedAt[exists]': 'false',
        changed: 'true'
      }
    );

    buildQueryWithContentTypesMacro(
      'status archived',
      {
        searchFilters: [['__status', '', 'archived']]
      },
      {
        'sys.archivedAt[exists]': 'true'
      }
    );

    buildQueryWithContentTypesMacro(
      'status empty value',
      {
        searchFilters: [['__status', '', '']]
      },
      {}
    );
  });

  describe('date conversion', () => {
    buildQueryWithContentTypesMacro(
      'sys. date field equals',
      {
        searchFilters: [['sys.createdAt', '', '2017-10-15']]
      },
      {
        'sys.createdAt[gte]': moment('2017-10-15').startOf('day').toISOString(),
        'sys.createdAt[lte]': moment('2017-10-15').endOf('day').toISOString()
      }
    );

    buildQueryWithContentTypesMacro(
      'sys. date field lt',
      {
        searchFilters: [['sys.createdAt', 'lt', '2017-10-15']]
      },
      {
        'sys.createdAt[lt]': moment('2017-10-15').toISOString()
      }
    );

    buildQueryWithContentTypesMacro(
      'sys. date field lte',
      {
        searchFilters: [['sys.createdAt', 'lte', '2017-10-15']]
      },
      {
        'sys.createdAt[lte]': moment('2017-10-15').endOf('day').toISOString()
      }
    );

    buildQueryWithContentTypesMacro(
      'sys. date field gt',
      {
        searchFilters: [['sys.createdAt', 'gt', '2017-10-15']]
      },
      {
        'sys.createdAt[gt]': moment('2017-10-15').endOf('day').toISOString()
      }
    );

    buildQueryWithContentTypesMacro(
      'sys. date field gte',
      {
        searchFilters: [['sys.createdAt', 'gte', '2017-10-15']]
      },
      {
        'sys.createdAt[gte]': moment('2017-10-15').toISOString()
      }
    );

    buildQueryWithContentTypesMacro(
      'sys. date field invalid date',
      {
        searchFilters: [['sys.createdAt', 'gte', '2017-99-99']]
      },
      {}
    );
  });
});
