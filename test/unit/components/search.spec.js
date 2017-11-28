import * as sinon from 'helpers/sinon';

describe('search#buildQuery()', function () {
  beforeEach(function () {
    module('contentful/test');
    this.spaceContext = this.$inject('mocks/spaceContext').init();

    const buildQuery = this.$inject('search/queryBuilder').buildQuery;
    this.space = {};
    this.buildQuery = function (textQuery) {
      return buildQuery(this.space, this.contentType, textQuery);
    };

    this.testFieldQuery = function* (queryString, key, value) {
      // Make a mutable copy
      const query = _.cloneDeep(yield this.buildQuery(queryString));
      delete query.content_type;
      const expectedQuery = {[key]: value};
      expect(query).toEqual(expectedQuery);
    };

    this.testQueryObject = function* (queryString, expectedQuery) {
      if (this.contentType) {
        _.defaults(expectedQuery, { content_type: this.contentType.getId() });
      }
      const query = yield this.buildQuery(queryString);
      expect(query).toEqual(expectedQuery);
    };
  });

  it('parses "id"', function* () {
    const q = yield this.buildQuery('id:MYID');
    expect(q['sys.id']).toEqual('MYID');
  });

  it('parses search term', function* () {
    yield* this.testQueryObject(
      'some search term',
      {
        'query': 'some search term'
      }
    );

    yield* this.testQueryObject(
      'id: MYID some search term',
      {
        'query': 'some search term',
        'sys.id': 'MYID'
      }
    );
  });

  describe('content type fields', function () {
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

    it('handles default types', function* () {
      yield* this.testQueryObject(
        'API_NAME_1: VAL_1 NAME_2: "VAL 2"',
        {
          'fields.API_NAME_1': 'VAL_1',
          'fields.API_NAME_2': 'VAL 2'
        }
      );
    });

    it('handles "Text" type with [match] operator', function* () {
      this.contentType.data.fields[0].type = 'Text';
      yield* this.testFieldQuery(
        'API_NAME_1: VALUE',
        'fields.API_NAME_1[match]', 'VALUE'
      );
    });

    it('handles "Link" type with sys.id path', function* () {
      this.contentType.data.fields[0].type = 'Link';
      yield* this.testFieldQuery(
        'API_NAME_1: VALUE',
        'fields.API_NAME_1.sys.id', 'VALUE'
      );
    });

    it('handles "Array" of "Link" type with sys.id path', function* () {
      this.contentType.data.fields[0].type = 'Array';
      this.contentType.data.fields[0].items = {type: 'Link'};
      yield* this.testFieldQuery(
        'API_NAME_1: VALUE',
        'fields.API_NAME_1.sys.id', 'VALUE'
      );
    });

    it('handles multiple mixed filters', function* () {
      this.contentType.data.fields[0].type = 'Link';
      this.contentType.data.fields[1].type = 'Text';
      yield* this.testQueryObject(
        'status:archived API_NAME_1: "LINK 1" NAME_2:TEXT some search text',
        {
          'sys.archivedAt[exists]': 'true',
          'fields.API_NAME_1.sys.id': 'LINK 1',
          'fields.API_NAME_2[match]': 'TEXT',
          'query': 'some search text'
        }
      );
    });
  });

  it('parses "status"', function* () {
    yield* this.testQueryObject(
      'status: published',
      {'sys.publishedAt[exists]': 'true'}
    );
    yield* this.testQueryObject(
      'status: changed',
      {
        'sys.archivedAt[exists]': 'false',
        'changed': 'true'
      }
    );
    yield* this.testQueryObject(
      'status: draft',
      {
        'sys.archivedAt[exists]': 'false',
        'sys.publishedVersion[exists]': 'false',
        'changed': 'true'
      }
    );
    yield* this.testQueryObject(
      'status: archived',
      {'sys.archivedAt[exists]': 'true'}
    );
    // Only default values for unknown status
    yield* this.testQueryObject('status: unknown', {});
  });

  // TODO: This behaves buggy, the final status is the sum of them all.
  xit('parses last "status" only', function* () {
    yield* this.testQueryObject(
      'status:changed status: unknown status : draft status:published',
      {'sys.publishedAt[exists]': 'true'}
    );
  });

  describe('user system fields', function () {
    beforeEach(function () {
      this.spaceContext.users = {};
      this.spaceContext.users.getAll = sinon.stub().resolves([
        { sys: { id: 'UID1' }, firstName: 'Jane', lastName: 'Doe' },
        { sys: { id: 'UID2' }, firstName: 'Jon', lastName: 'Doe' },
        { sys: { id: 'UID3' }, firstName: 'Jon', lastName: 'Doe' }
      ]);
    });

    const fields = [
      ['author', 'createdBy'],
      ['updater', 'updatedBy']
    ];

    for (const [searchKey, queryKey] of fields) {
      it(`parses "${searchKey}"`, function* () {
        yield* this.testFieldQuery(
          `${searchKey}: "Jane Doe"`,
          `sys.${queryKey}.sys.id`, 'UID1'
        );

        yield* this.testFieldQuery(
          `${searchKey}: "Jon Doe (UID3)"`,
          `sys.${queryKey}.sys.id`, 'UID3'
        );

        // Unknown users are ignored
        yield* this.testQueryObject(`${searchKey}: "Unknown"`, {});
      });
    }
  });

  describe('"updatedAt" field', function () {
    beforeEach(function () {
      this.clock = sinon.useFakeTimers();
      this.moment = this.$inject('moment');
    });

    afterEach(function () {
      this.clock.restore();
    });

    const DAY = 24 * 60 * 60 * 1000;

    it('parses relative days', function* () {
      this.clock.tick(3 * DAY);
      yield* this.testFieldQuery(
        'updatedAt: "2 days ago"',
        'sys.updatedAt', this.moment(1 * DAY).toISOString()
      );
    });

    it('parses day equality into day boundaries', function* () {
      yield* this.testQueryObject(
        'updatedAt = 2000-01-01',
        {
          'sys.updatedAt[lte]': this.moment('2000-01-01').endOf('day').toISOString(),
          'sys.updatedAt[gte]': this.moment('2000-01-01').startOf('day').toISOString()
        }
      );
    });

    it('parses date times', function* () {
      this.clock.tick(0.5 * DAY);
      const date = this.moment();
      yield* this.testFieldQuery(
        `updatedAt > "${date.format('YYYY-MM-DD HH:mm')}"`,
        'sys.updatedAt[gt]', date.toISOString()
      );
    });
  });

  describe('for assets', function () {
    beforeEach(function () {
      this.contentType = this.$inject('assetContentType');
    });

    it('parses "filename"', function* () {
      yield* this.testFieldQuery(
        'filename:"FN 1"',
        'fields.file.fileName', 'FN 1'
      );
    });

    it('parses "type"', function* () {
      yield* this.testFieldQuery(
        'type:image',
        'mimetype_group', 'image'
      );
    });

    it('parses "size"', function* () {
      yield* this.testFieldQuery(
        'size < 1K',
        'fields.file.details.size[lt]', 1e3
      );
      yield* this.testFieldQuery(
        'size <= 1Kib',
        'fields.file.details.size[lte]', Math.pow(2, 10)
      );
      yield* this.testFieldQuery(
        'size > 1mb',
        'fields.file.details.size[gt]', 1e6
      );
      yield* this.testFieldQuery(
        'size >= 1mib',
        'fields.file.details.size[gte]', Math.pow(2, 20)
      );
      yield* this.testFieldQuery(
        'size: 8',
        'fields.file.details.size', '8'
      );
    });

    it('parses "width" and "height"', function* () {
      for (const dim of ['width', 'height']) {
        yield* this.testFieldQuery(
          `${dim} < 1000`,
          `fields.file.details.image.${dim}[lt]`, '1000'
        );
      }
    });
  });
});
