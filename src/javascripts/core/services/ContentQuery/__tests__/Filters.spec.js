import { contentTypes } from './helpers';
import * as Filters from '../Filters';

describe('app/ContentList/Search/Filters', () => {
  const isApplicableMacro = (message, contentType, queryKey, expected) => {
    it(message, () => {
      expect(Filters.isFieldFilterApplicableToContentType(contentType, queryKey)).toEqual(expected);
    });
  };

  describe('isFieldFilterApplicableToContentType with contentType', () => {
    const isApplicableMacroWithContentType = (message, queryKey, expected) =>
      isApplicableMacro(message, contentTypes[0], queryKey, expected);

    isApplicableMacroWithContentType('sys field', 'sys.id', true);
    isApplicableMacroWithContentType('content type field', 'fields.companyName', true);
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
    isApplicableMacroWithoutContentType('content type field', 'fields.companyName', false);
    isApplicableMacroWithoutContentType(
      'non-existent content type field',
      'fields.companyName1',
      false
    );
  });

  describe('getMatchingFilters', () => {
    describe('without assets', () => {
      const getMatchingFiltersMacro = (message, { searchQuery, contentType }, expected) => {
        it(message, () => {
          const filters = Filters.getMatchingFilters(
            searchQuery,
            contentType,
            contentTypes,
            false,
            true
          );
          const queryKeys = filters.map(({ queryKey }) => queryKey);

          expect(queryKeys).toEqual(expected);

          expect(filters.find(({ type }) => type === 'Location')).toBeUndefined();

          expect(filters.find(({ type }) => type === 'Object')).toBeUndefined();
        });
      };

      getMatchingFiltersMacro(
        'returns all sys and all ct fields',
        {
          searchQuery: '',
          contentType: null,
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
          'metadata.tags.sys.id',
          'fields.companyName',
          'fields.logo.sys.id',
          'fields.companyDescription',
          'fields.website',
          'fields.twitter',
          'fields.email',
          'fields.phone',
          'fields.symbol1',
          'fields.symbol2',
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
          'fields.createdAt',
        ]
      );

      getMatchingFiltersMacro(
        'returns brand sys and ct fields',
        {
          searchQuery: '',
          contentType: contentTypes[0].sys.id,
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
          'metadata.tags.sys.id',
          'fields.companyName',
          'fields.logo.sys.id',
          'fields.companyDescription',
          'fields.website',
          'fields.twitter',
          'fields.email',
          'fields.phone',
          'fields.symbol1',
          'fields.symbol2',
        ]
      );

      getMatchingFiltersMacro(
        'returns filters if apiName startsWith searchQuery "cr"',
        {
          searchQuery: 'cr',
          contentType: null,
        },
        [
          'sys.createdAt',
          'sys.createdBy.sys.id',
          'fields.companyDescription',
          'fields.productDescription',
          'fields.createdAt',
        ]
      );

      getMatchingFiltersMacro(
        'returns filters if apiName startsWith searchQuery "t"',
        {
          searchQuery: 't',
          contentType: null,
        },
        [
          'sys.updatedAt',
          'sys.createdAt',
          'sys.publishedAt',
          'sys.firstPublishedAt',
          'sys.updatedBy.sys.id',
          'sys.createdBy.sys.id',
          '__status',
          'metadata.tags.sys.id',
          'fields.companyDescription',
          'fields.website',
          'fields.twitter',
          'fields.productName',
          'fields.productDescription',
          'fields.sizetypecolor',
          'fields.tags',
          'fields.categories.sys.id',
          'fields.quantity',
          'fields.website',
          'fields.createdAt',
        ]
      );

      getMatchingFiltersMacro(
        'returns filters if apiName startsWith searchQuery "twi"',
        {
          searchQuery: 'twi',
          contentType: null,
        },
        ['fields.twitter']
      );

      getMatchingFiltersMacro(
        'returns filters if apiName startsWith searchQuery "web"',
        {
          searchQuery: 'web',
          contentType: null,
        },
        ['fields.website', 'fields.website']
      );

      getMatchingFiltersMacro(
        'returns empty array if there is no matching filters "witter"',
        {
          searchQuery: 'witter',
          contentType: null,
        },
        ['fields.twitter']
      );
    });
  });
});
