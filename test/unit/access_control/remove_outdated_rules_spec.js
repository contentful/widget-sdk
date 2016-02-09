'use strict';

describe('Remove outdated rules', function () {

  var toInternal, remove;

  beforeEach(function () {
    module('contentful/test');
    toInternal = this.$inject('PolicyBuilder/toInternal');
    remove = this.$inject('PolicyBuilder/removeOutdatedRules');
  });

  function createPolicy(ctId, path, type, effect) {
    type = type || 'Entry';
    effect = effect || 'allow';

    return {effect: effect, actions: ['update'], constraint: {
      and: [
        { equals: [{doc: 'sys.type'}, type] },
        { equals: [{doc: 'sys.contentType.sys.id'}, ctId] },
        { paths: [{doc: path}] }
      ]
    }};
  }

  function createCt(id, fields) {
    return {data: {
      sys: {id: id},
      fields: fields || []
    }};
  }

  describe('path constraints with non-existent components', function () {
    var role = {policies: [
      createPolicy('ctid', 'fields.test.%'),
      createPolicy('ctid', 'fields.z.%'),
      createPolicy('ctid2', 'fields.%.%')
    ]};

    var contentTypes = [
      createCt('ctid', [{apiName: 'x'}, {apiName: 'y'}, {apiName: 'z'}]),
      createCt('ctid2')
    ];

    it('removes rule if CT is missing', function () {
      var internal = toInternal(role);
      var result = remove(internal, [contentTypes[1]], []);
      expect(internal.entries.allowed.length).toBe(1);
      expect(result).toBe(true);
    });

    it('removes rule if a single field is missing', function () {
      var internal = toInternal(role);
      var result = remove(internal, contentTypes, []);
      expect(internal.entries.allowed.length).toBe(2);
      expect(result).toBe(true);
    });

    it('removes rules if a locale is missing', function () {
      var role = {policies: [createPolicy('ctid', 'fields.%.en-US')]};
      var internal = toInternal(role);

      var result = remove(internal, contentTypes, [{code: 'de-DE'}]);
      expect(internal.entries.allowed.length).toBe(0);
      expect(result).toBe(true);
    });

    it('fallbacks to internal field ID', function () {
      var role = {policies: [createPolicy('ctid', 'fields.internal.%')]};
      var internal = toInternal(role);
      var contentTypes = createCt('ctid',  {fields: [{id: 'internal'}, {apiName: 'xyz'}]});

      var result = remove(internal, contentTypes, []);
      expect(internal.entries.allowed.length).toBe(0);
      expect(result).toBe(true);
    });

    it('removes rules from all rule sets', function () {
      function t(path, cts, locales) {
        var internal = toInternal({policies: [
          createPolicy('ctid', path, 'Entry', 'allow'),
          createPolicy('ctid', path, 'Entry', 'deny'),
          createPolicy('ctid', path, 'Asset', 'allow'),
          createPolicy('ctid', path, 'Asset', 'deny')
        ]});

        var result = remove(internal, cts, locales);
        expect(internal.entries.allowed.length).toBe(0);
        expect(internal.entries.denied.length).toBe(0);
        expect(internal.assets.allowed.length).toBe(0);
        expect(internal.assets.denied.length).toBe(0);
        expect(result).toBe(true);
      }

      t('fields.%.%', [], []);
      t('fields.test.%', [createCt('ctid')], []);
      t('fields.test.en-US', [createCt('ctid')], [{code: 'de-DE'}]);
    });

    it('changes policy collections only when were autofixed', function () {
      var internal = toInternal({policies: [createPolicy('ctid', 'fields.%.%')]});
      var original = internal.entries.allowed;
      var result = remove(internal, [createCt('ctid')], []);
      expect(internal.entries.allowed).toBe(original);
      expect(result).toBe(false);

      internal = toInternal({policies: [createPolicy('ctid', 'fields.test.%')]});
      original = internal.entries.allowed;
      result = remove(internal, [createCt('ctid')], []);
      expect(internal.entries.allowed).not.toBe(original);
      expect(result).toBe(true);
    });
  });
});
