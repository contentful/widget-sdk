import * as sinon from 'helpers/sinon';

describe('TextQueryConverter#textQueryToUISearch()', function () {
  beforeEach(function () {
    module('contentful/test');

    this.spaceContext = this.$inject('mocks/spaceContext').init();
    this.space = {};
    this.contentType = null;

    const convert =
      this.$inject('search/TextQueryConverter').textQueryToUISearch;

    this.convert = function (textQuery) {
      return convert(this.space, this.contentType, textQuery);
    };

    this.testConvert = function* (textQuery, expected) {
      const result = yield this.convert(textQuery);
      // For nicer test reporter output compare separately:
      expect(result.contentTypeId).toEqual(expected.contentTypeId);
      expect(result.searchText).toEqual(expected.searchText);
      expect(result.searchFilters).toEqual(expected.searchFilters);
    };
  });

  function itConverts (description, textQuery, expectedUISearchObject) {
    it(`converts ${description}`, function* () {
      yield* this.testConvert(textQuery, expectedUISearchObject);
    });
  }

  function itConvertsFilters (description, textQuery, searchFilters) {
    const expectedUISearchObject = {searchText: '', searchFilters};
    it(`converts ${description}`, function* () {
      if (this.contentType) {
        expectedUISearchObject.contentTypeId = this.contentType.getId();
      }
      yield* this.testConvert(textQuery, expectedUISearchObject);
    });
  }

  itConverts('sys field "id"',
    'id:MYID',
    {
      searchText: '',
      searchFilters: [
        ['sys.id', '', 'MYID']
      ]
    }
  );

  itConverts('search term',
    'some search term',
    {
      searchText: 'some search term',
      searchFilters: []
    }
  );

  itConverts('search term and sys "id"',
    'id: MYID some search term',
    {
      searchText: 'some search term',
      searchFilters: [
        ['sys.id', '', 'MYID']
      ]
    }
  );

  describe('for content type fields', function () {
    beforeEach(function () {
      this.contentType = {
        getId: () => 'CTID',
        data: {
          fields: [
            { id: 'ID_1', apiName: 'API_NAME_1', name: 'NAME_1' },
            { id: 'ID_2', apiName: 'API_NAME_2', name: 'NAME_2' }
          ]
        }
      };
    });

    itConvertsFilters('default type',
      'API_NAME_1: VAL_1 NAME_2 = "VAL 2"',
      [
        ['fields.API_NAME_1', '', 'VAL_1'],
        ['fields.API_NAME_2', '', 'VAL 2']
      ]
    );

    describe('of type "Text"', function () {
      beforeEach(function () {
        this.contentType.data.fields[0].type = 'Text';
      });

      itConvertsFilters('to `[match]` operator',
        'API_NAME_1: "SOME VALUE" NAME_1 : TEXT',
        [
          ['fields.API_NAME_1', 'match', 'SOME VALUE'],
          ['fields.API_NAME_1', 'match', 'TEXT']
        ]
      );
    });

    describe('of type "Boolean"', function () {
      beforeEach(function () {
        this.contentType.data.fields[0].type = 'Boolean';
      });

      itConvertsFilters('"true" and "yes" to "true"',
        'API_NAME_1: "true" NAME_1 = yes ',
        [
          ['fields.API_NAME_1', '', 'true'],
          ['fields.API_NAME_1', '', 'true']
        ]
      );

      itConvertsFilters('other values to "false"',
        'API_NAME_1 = false NAME_1 : no NAME_1 = "asdf"',
        [
          ['fields.API_NAME_1', '', false],
          ['fields.API_NAME_1', '', false],
          ['fields.API_NAME_1', '', false]
        ]
      );
    });

    describe('type "Integer"', function () {
      beforeEach(function () {
        this.contentType.data.fields[0].type = 'Integer';
      });

      itConvertsFilters('with ":" and "=" operators',
        'API_NAME_1: "42" NAME_1 = 1337',
        [
          ['fields.API_NAME_1', '', '42'],
          ['fields.API_NAME_1', '', '1337']
        ]
      );

      itConvertsFilters('with "<", ">", "<=" and ">=" operators',
        'API_NAME_1 < "42" NAME_1 > 1337 NAME_1 <= 0 NAME_1 >= 1',
        [
          ['fields.API_NAME_1', 'lt', '42'],
          ['fields.API_NAME_1', 'gt', '1337'],
          ['fields.API_NAME_1', 'lte', '0'],
          ['fields.API_NAME_1', 'gte', '1']
        ]
      );

      itConvertsFilters('invalid filter without a number',
        'API_NAME_1 < NOT_A_NUMBER',
        [
          ['fields.API_NAME_1', 'lt', 'NOT_A_NUMBER']
        ]
      );
    });

    describe('type "Date"', function () {
      beforeEach(function () {
        this.contentType.data.fields[0].type = 'Date';
      });

      testDateField('API_NAME_1', 'fields.API_NAME_1');
      testDateField('NAME_1', 'fields.API_NAME_1');
    });

    describe('type "Link"', function () {
      beforeEach(function () {
        this.contentType.data.fields[0].type = 'Link';
      });

      itConvertsFilters('to `sys.id` path',
        'NAME_1: VALUE1 API_NAME_1 = "VALUE 2"',
        [
          ['fields.API_NAME_1.sys.id', '', 'VALUE1'],
          ['fields.API_NAME_1.sys.id', '', 'VALUE 2']
        ]
      );
    });

    describe('type "Array" of "Link"', function () {
      beforeEach(function () {
        this.contentType.data.fields[0].type = 'Array';
        this.contentType.data.fields[0].items = {type: 'Link'};
      });

      itConvertsFilters('to `sys.id` path',
        'API_NAME_1=VALUE1 NAME_1: VALUE2',
        [
          ['fields.API_NAME_1.sys.id', '', 'VALUE1'],
          ['fields.API_NAME_1.sys.id', '', 'VALUE2']
        ]
      );
    });

    describe('multiple types and system field', function () {
      beforeEach(function () {
        this.contentType.data.fields[0].type = 'Link';
        this.contentType.data.fields[1].type = 'Text';
      });

      itConverts('sys field "id"',
        'status:archived API_NAME_1: "LINK 1" NAME_2:TEXT some search text',
        {
          contentTypeId: 'CTID',
          searchText: 'some search text',
          searchFilters: [
            ['__status', '', 'archived'],
            ['fields.API_NAME_1.sys.id', '', 'LINK 1'],
            ['fields.API_NAME_2', 'match', 'TEXT']
          ]
        }
      );
    });
  });

  describe('for special "status" filter', function () {
    const STATUSES = ['published', 'changed', 'draft', 'archived'];

    for (const status of STATUSES) {
      itConvertsFilters(`value "${status}"`,
        `status: ${status}`,
        [
          ['__status', '', status]
        ]
      );
    }
  });

  itConvertsFilters('"unknown" status to filter',
    'status:unknown',
    [
      ['__status', '', 'unknown']
    ]
  );

  describe('for user system fields', function () {
    beforeEach(function () {
      this.spaceContext.users = {};
      this.spaceContext.users.getAll = sinon.stub().resolves([
        { sys: { id: 'UID1' }, firstName: 'Jane', lastName: 'Doe' },
        { sys: { id: 'UID2' }, firstName: 'Jon', lastName: 'Doe' },
        { sys: { id: 'UID3' }, firstName: 'Jon', lastName: 'Doe' }
      ]);
    });

    const USER_SYSTEM_FIELDS = [
      ['author', 'createdBy'],
      ['updater', 'updatedBy']
    ];

    for (const [searchKey, queryKey] of USER_SYSTEM_FIELDS) {
      itConvertsFilters(`"${searchKey}" filter based on user name to user id`,
        `${searchKey}: "Jane Doe"`,
        [
          [`sys.${queryKey}.sys.id`, '', 'UID1']
        ]
      );

      itConvertsFilters(`"${searchKey}" filter based on user name and id to user id`,
        `${searchKey}: "Jon Doe (UID3)"`,
        [
          [`sys.${queryKey}.sys.id`, '', 'UID3']
        ]
      );

      itConvertsFilters(`unknown "${searchKey}" filter user to no filter`,
        `${searchKey}: "Unknown"`,
        []
      );
    }
  });

  const DATE_SYS_FIELDS = ['updatedAt', 'createdAt', 'publishedAt', 'firstPublishedAt'];

  for (const dateField of DATE_SYS_FIELDS) {
    describe(`for "${dateField}" field`, function () {
      testDateField(dateField, `sys.${dateField}`);
    });
  }

  function testDateField (name, key) {
    // We are currently ignoring this feature as it wasn't used a lot (or at all).
    itConvertsFilters('relative date to no filter',
      `${name}: "2 days ago"`,
      []
    );

    itConvertsFilters('> and <',
      `${name} > 2015-03-12 ${name} < "2016-08-04"`,
      [
        [key, 'gt', '2015-03-12'],
        [key, 'lt', '2016-08-04']
      ]
    );

    itConvertsFilters('>= and <=',
      `${name} >= "2015-03-12" ${name} <= 2016-08-04`,
      [
        [key, 'gte', '2015-03-12'],
        [key, 'lte', '2016-08-04']
      ]
    );

    itConvertsFilters('parses day equality ("=" or ":") into a single filter',
      `${name} = 2000-01-01 ${name}:"1985-05-25`,
      [
        [key, '', '2000-01-01'],
        [key, '', '1985-05-25']
      ]
    );
  }

  describe('for assets', function () {
    beforeEach(function () {
      this.contentType = this.$inject('assetContentType');
    });

    itConvertsFilters('"filename" filter',
      'filename:"FN 1"',
      [
        ['fields.file.fileName', '', 'FN 1']
      ]
    );

    itConvertsFilters('"type" filter',
      'type:image',
      [
        ['mimetype_group', '', 'image']
      ]
    );

    describe('"size" filter', function () {
      itConvertsFilters('with unit "K"',
        'size < 1K',
        [
          ['fields.file.details.size', 'lt', 1e3]
        ]
      );

      itConvertsFilters('unit "Kib"',
        'size <= 1Kib',
        [
          ['fields.file.details.size', 'lte', Math.pow(2, 10)]
        ]
      );

      itConvertsFilters('unit "mb"',
        'size > 1mb',
        [
          ['fields.file.details.size', 'gt', 1e6]
        ]
      );

      itConvertsFilters('unit "mib"',
        'size >= 1mib',
        [
          ['fields.file.details.size', 'gte', Math.pow(2, 20)]
        ]
      );

      itConvertsFilters('without unit',
        'size: 8',
        [
          ['fields.file.details.size', '', '8']
        ]
      );
    });

    for (const dim of ['width', 'height']) {
      itConvertsFilters(`"${dim}" filter`,
        `${dim} < 1000`,
        [
          [`fields.file.details.image.${dim}`, 'lt', '1000']
        ]
      );
    }

    itConvertsFilters('"width" and "height" filter',
      'width <= 42 height >= 42',
      [
        ['fields.file.details.image.width', 'lte', '42'],
        ['fields.file.details.image.height', 'gte', '42']
      ]
    );
  });
});
