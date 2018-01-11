import { contentTypes } from './helpers';

describe('app/ContentList/Search/QueryBuilder', function () {
  let Filters;
  beforeEach(function () {
    module('contentful/test');

    Filters = this.$inject('app/ContentList/Search/Filters');
  });

  const isApplicableMacro = (message, contentType, queryKey, expected) => {
    it(message, () => {
      expect(
        Filters.isFieldFilterApplicableToContentType(contentType, queryKey)
      ).toEqual(expected);
    });
  };

  describe('isFieldFilterApplicableToContentType with contentType', () => {
    const isApplicableMacroWithContentType = (message, queryKey, expected) =>
      isApplicableMacro(message, contentTypes[0], queryKey, expected);

    isApplicableMacroWithContentType('sys field', 'sys.id', true);
    isApplicableMacroWithContentType(
      'content type field',
      'fields.companyName',
      true
    );
    isApplicableMacroWithContentType(
      'non-existent content type field',
      'fields.companyName1',
      false
    );
  });

  describe('isFieldFilterApplicableToContentType without contentType', () => {
    const isApplicableMacroWithoutContentType = (message, queryKey, expected) =>
      isApplicableMacro(message, null, queryKey, expected);

    isApplicableMacroWithoutContentType('sys field', 'sys.id', true);
    isApplicableMacroWithoutContentType(
      'content type field',
      'fields.companyName',
      false
    );
    isApplicableMacroWithoutContentType(
      'non-existent content type field',
      'fields.companyName1',
      false
    );
  });

  describe('getMatchingFilters', () => {
    describe('without assets', () => {
      const getMatchingFiltersMacro = (
        message,
        { searchQuery, contentType },
        expected
      ) => {
        it(message, () => {
          const filters = Filters.getMatchingFilters(
            searchQuery,
            contentType,
            contentTypes
          );
          const queryKeys = filters.map(({ queryKey }) => queryKey);

          expect(queryKeys).toEqual(expected);

          expect(filters.find(({ type }) => type === 'Location')).toEqual(
            undefined,
            'Type Location is not supported'
          );

          expect(filters.find(({ type }) => type === 'Object')).toEqual(
            undefined,
            'Type Object field is not supported'
          );
        });
      };

      getMatchingFiltersMacro(
        'returns all sys and all ct fields',
        {
          searchQuery: '',
          contentType: null
        },
        [
          'sys.updatedAt',
          'sys.createdAt',
          'sys.publishedAt',
          'sys.firstPublishedAt',
          'sys.updatedBy.sys.id',
          'sys.createdBy.sys.id',
          'sys.publishedBy.sys.id',
          'sys.version',
          'sys.id',
          '__status',
          'fields.companyName',
          'fields.logo.sys.id',
          'fields.companyDescription',
          'fields.website',
          'fields.twitter',
          'fields.email',
          'fields.phone',
          'fields.productName',
          'fields.slug',
          'fields.productDescription',
          'fields.sizetypecolor',
          'fields.image.sys.id',
          'fields.tags',
          'fields.categories.sys.id',
          'fields.price',
          'fields.brand.sys.id',
          'fields.quantity',
          'fields.sku',
          'fields.website',
          'fields.createdAt'
        ]
      );

      getMatchingFiltersMacro(
        'returns all sys and ct fields',
        {
          searchQuery: '',
          contentType: contentTypes[0].sys.id
        },
        [
          'sys.updatedAt',
          'sys.createdAt',
          'sys.publishedAt',
          'sys.firstPublishedAt',
          'sys.updatedBy.sys.id',
          'sys.createdBy.sys.id',
          'sys.publishedBy.sys.id',
          'sys.version',
          'sys.id',
          '__status',
          'fields.companyName',
          'fields.logo.sys.id',
          'fields.companyDescription',
          'fields.website',
          'fields.twitter',
          'fields.email',
          'fields.phone'
        ]
      );

      getMatchingFiltersMacro(
        'returns filters if apiName startsWith searchQuery',
        {
          searchQuery: 'cr',
          contentType: null
        },
        ['sys.createdAt', 'sys.createdBy.sys.id', 'fields.createdAt']
      );

      getMatchingFiltersMacro(
        'returns filters if apiName startsWith searchQuery',
        {
          searchQuery: 't',
          contentType: null
        },
        ['fields.twitter', 'fields.tags']
      );

      getMatchingFiltersMacro(
        'returns filters if apiName startsWith searchQuery',
        {
          searchQuery: 'twi',
          contentType: null
        },
        ['fields.twitter']
      );

      getMatchingFiltersMacro(
        'returns filters if apiName startsWith searchQuery',
        {
          searchQuery: 'web',
          contentType: null
        },
        ['fields.website', 'fields.website']
      );

      getMatchingFiltersMacro(
        'returns empty array if there is no matching filters',
        {
          searchQuery: 'witter',
          contentType: null
        },
        []
      );
    });
  });
});
