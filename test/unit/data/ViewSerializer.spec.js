describe('ViewSerializer', () => {
  beforeEach(function() {
    module('contentful/test');

    const ViewSerializer = this.$inject('data/ViewSerializer.es6');
    this.serialize = ViewSerializer.serialize;
    this.unserialize = ViewSerializer.unserialize;
  });

  function itRoundTrips(description, view, flattened) {
    itFlattens(description, view, flattened);
    itUnflattens(description, flattened, view);
  }

  function itFlattens(description, view, flattened) {
    it('does not mutate passed-in view object', function() {
      const viewClone = _.cloneDeep(view);
      this.serialize(view);
      expect(view).toEqual(viewClone);
    });

    it(`flattens ${description}`, function() {
      expect(this.serialize(view)).toEqual(flattened);
    });
  }

  function itUnflattens(description, flattened, view) {
    it('does not mutate passed-in object', function() {
      const flattenedClone = _.cloneDeep(flattened);
      this.unserialize(flattened);
      expect(flattened).toEqual(flattenedClone);
    });

    it(`unflattens ${description}`, function() {
      expect(this.unserialize(flattened)).toEqual(view);
    });
  }

  describe('#serialize() and #unserialize() round-trip', () => {
    itRoundTrips(
      '`order` object',
      {
        order: {
          direction: 'descending',
          fieldId: 'updatedAt'
        },
        searchTerm: 'foo'
      },
      {
        'order.direction': 'descending',
        'order.fieldId': 'updatedAt',
        searchTerm: 'foo'
      }
    );

    itRoundTrips(
      '`displayFieldIds` array without touching it',
      {
        displayFieldIds: ['publishedAt', 'author'],
        searchTerm: 'foo'
      },
      {
        displayFieldIds: ['publishedAt', 'author'],
        searchTerm: 'foo'
      }
    );

    itRoundTrips(
      ' `searchFilters` object',
      {
        searchFilters: [['__status', '', 'draft'], ['fields.foo', 'lt', '0'], ['sys.id', '', '']]
      },
      {
        'filters.0.key': '__status',
        'filters.0.val': 'draft',
        'filters.1.key': 'fields.foo',
        'filters.1.op': 'lt',
        'filters.1.val': '0',
        'filters.2.key': 'sys.id'
      }
    );

    itRoundTrips(
      'whole view object',
      {
        id: 'VIEW_ID',
        order: {
          direction: 'descending',
          fieldId: 'updatedAt'
        },
        displayFieldIds: ['publishedAt', 'author'],
        contentTypeId: 'CTID',
        searchText: 'SEARCH TEXT',
        searchFilters: [['__status', '', 'published']]
      },
      {
        id: 'VIEW_ID',
        'order.direction': 'descending',
        'order.fieldId': 'updatedAt',
        displayFieldIds: ['publishedAt', 'author'],
        contentTypeId: 'CTID',
        searchText: 'SEARCH TEXT',
        'filters.0.key': '__status',
        'filters.0.val': 'published'
      }
    );
  });

  describe('#serialize()', () => {
    itFlattens(
      'and removes empty `searchTerm`',
      {
        id: 'VIEW_ID',
        searchFilters: []
      },
      {
        id: 'VIEW_ID'
      }
    );
  });

  describe('#unserialize()', () => {
    itUnflattens(
      'and adds empty `searchFilters` if `searchTerm` is not set',
      {
        id: 'VIEW_ID'
      },
      {
        id: 'VIEW_ID',
        searchFilters: []
      }
    );

    itUnflattens(
      'removes `searchTerm` if `searchFilters` is present',
      {
        searchTerm: 'foo:bar text',
        'filters.0.val': 'draft',
        'filters.0.key': '__status'
      },
      {
        searchFilters: [['__status', '', 'draft']]
      }
    );

    itUnflattens(
      'removes `searchTerm` if `searchText` is present',
      {
        searchTerm: 'foo:bar text',
        searchText: 'text'
      },
      {
        searchText: 'text',
        searchFilters: []
      }
    );
  });
});
