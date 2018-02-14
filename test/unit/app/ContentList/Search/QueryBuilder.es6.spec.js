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

  const buildQueryWithContentTypesMacro = (message, search, expected) => {
    return buildQueryMacro(
      message,
      {
        contentType: contentTypes[0],
        search
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
      'filesize field',
      {
        searchFilters: [['fields.file.details.size', '', '52']]
      },
      { 'fields.file.details.size': 52000 }
    );

    buildQueryWithContentTypesMacro(
      'searchFilters with contentType specific field',
      {
        searchFilters: [['fields.website', '', '2']],
        contentTypeId: 'TEST_CT_ID'
      },
      {
        'fields.website': '2',
        content_type: 'TEST_CT_ID'
      }
    );

    buildQueryWithContentTypesMacro(
      'searchFilters with contentType specific field and search text',
      {
        searchFilters: [['fields.website', '', '2']],
        contentTypeId: 'TEST_CT_ID',
        searchText: 'xoxo'
      },
      {
        'fields.website': '2',
        content_type: 'TEST_CT_ID',
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

    buildQueryWithContentTypesMacro(
      'ignore filters with empty value',
      {
        searchFilters: [['sys.id', '', '']]
      },
      {}
    );

    buildQueryWithContentTypesMacro(
      'ignore filters with null value',
      {
        searchFilters: [['sys.id', '', null]]
      },
      {}
    );

    buildQueryWithContentTypesMacro(
      'ignore filters with undefined value',
      {
        searchFilters: [['sys.id', '', undefined]]
      },
      {}
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
        'sys.archivedAt[exists]': 'false',
        changed: 'true'
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

    buildQueryWithContentTypesMacro(
      'status undefined value',
      {
        searchFilters: [['__status', '', undefined]]
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
