'use strict';

describe('contentPreview', function () {
  const storeStubs = {};

  let spaceContext;

  beforeEach(function () {
    storeStubs.get = sinon.stub();
    storeStubs.set = sinon.stub();
    storeStubs.remove = sinon.stub();
    storeStubs.forKey = sinon.stub();

    module('contentful/test', function ($provide) {
      $provide.value('TheLocaleStore', {
        getDefaultLocale: _.constant({internal_code: 'en'})
      });
      $provide.value('TheStore', {
        getStore: () => {
          return storeStubs;
        }
      });
    });

    spaceContext = this.$inject('mocks/spaceContext').init();

    spaceContext.space = {
      endpoint: sinon.spy(function () {
        return this;
      }),
      payload: sinon.spy(function () {
        return this;
      }),
      headers: sinon.spy(function () {
        return this;
      }),
      post: sinon.stub().resolves(makeEnv('foo')),
      get: sinon.stub().resolves({items: [makeEnv('foo'), makeEnv('foo2')]}),
      put: sinon.stub(),
      delete: sinon.stub()
    };
    spaceContext.getId = sinon.stub().returns('space01');

    this.contentPreview = this.$inject('contentPreview');

    const getStore = this.$inject('TheStore').getStore;
    this.store = getStore();
  });

  afterEach(function () {
    spaceContext = null;
  });

  function makeEnv (id) {
    return {
      name: `PE - ${id}`,
      sys: { id: id },
      configurations: [
        {
          url: 'https://www.test.com/{entry_id}/{entry_field.title}/{entry_field.slug}',
          contentType: 'ct-1',
          enabled: true
        },
        {
          url: 'https://www.test.com/{entry_field.invalid}',
          contentType: 'ct-2',
          enabled: true
        },
        // for testing references:
        {
          url: 'https://www.test.com/{entry.linkedBy.sys.id}',
          contentType: 'ct-3',
          enabled: true
        },
        {
          url: 'https://www.test.com/{entry.linkedBy.fields.slug}',
          contentType: 'ct-4',
          enabled: true
        },
        {
          url: 'https://www.test.com/{entry.linkedBy.linkedBy.fields.name}/some/{entry.linkedBy.fields.slug}',
          contentType: 'ct-5',
          enabled: true
        }
      ]
    };
  }

  function makeEntry (id) {
    return {
      getId: _.constant(id),
      data: {
        sys: { id },
        fields: {
          'internal-title-id': {en: 'Title'},
          'internal-slug-id': {en: 'my-slug'},
          'internal-im-an-empty-string': {en: ''}
        }
      }
    };
  }

  function makeCt (id) {
    return {
      sys: {
        id: id
      },
      name: id,
      fields: [
        { id: 'internal-title-id', apiName: 'title' },
        { id: 'internal-slug-id', apiName: 'slug' },
        { id: 'internal-im-an-empty-string', apiName: 'empty' }
      ]
    };
  }

  describe('#getAll', function () {
    it('resolves preview environments', function () {
      function fetchEnvironmentsAndAssertResponse () {
        this.contentPreview.getAll().then(function (environments) {
          expect(environments.foo).toEqual(makeEnv('foo'));
          expect(environments.foo2).toEqual(makeEnv('foo2'));
        });
        this.$apply();
      }
      fetchEnvironmentsAndAssertResponse.call(this);
      fetchEnvironmentsAndAssertResponse.call(this);
    });

    it('only calls GET endpoint once', function () {
      this.contentPreview.getAll();
      this.$apply();
      this.contentPreview.getAll();
      this.$apply();
      sinon.assert.calledOnce(spaceContext.space.get);
    });
  });

  describe('#get', function () {
    it('resolves preview environment', function () {
      this.contentPreview.get('foo').then(env => {
        expect(env).toEqual(makeEnv('foo'));
      });
      this.$apply();
    });

    it('rejects promise if the requested environment does not exist', function () {
      this.contentPreview.get('bar').catch(function (err) {
        expect(err).toBe('Preview environment could not be found');
      });
      this.$apply();
    });
  });

  describe('#getForContentType', function () {
    it('returns all of the preview environments for the provided content type', function* () {
      const envs = yield this.contentPreview.getForContentType('ct-1');
      expect(envs.length).toBe(2);
    });
  });

  describe('#canCreate', function () {
    it('resolves to true when limit is not reached', function () {
      this.contentPreview.canCreate().then(function (allowed) {
        expect(allowed).toBe(true);
      });
    });

    it('resolves to false when limit is reached', async function () {
      // Create 100 preview environments
      _.times(100, function (idx) {
        const internal = this.contentPreview.toInternal(makeEnv('foo' + idx), [makeCt('ct-1')]);
        spaceContext.space.post.resolves(makeEnv('foo' + idx));
        this.contentPreview.create(internal);
      }.bind(this));

      this.$apply();

      const canCreate = await this.contentPreview.canCreate();

      expect(canCreate).toBe(false);
    });
  });

  describe('#create', function () {
    beforeEach(function () {
      const internal = this.contentPreview.toInternal(makeEnv('foo'), [makeCt('ct-1')]);
      this.contentPreview.create(internal).then(env => { this.env = env; });
      this.$apply();
    });

    it('returns environment object', function () {
      expect(this.env).toEqual(makeEnv('foo'));
    });

    it('calls POST method', function () {
      sinon.assert.calledOnce(spaceContext.space.post);
    });

    it('sends environment in payload', function () {
      const payload = spaceContext.space.payload.args[0][0];
      expect(payload.name).toBe('PE - foo');
      expect(payload.configurations.length).toBe(1);
    });
  });

  describe('#update', function () {
    beforeEach(function () {
      spaceContext.space.put.resolves(makeEnv('foo'));
      this.contentPreview.create(this.contentPreview.toInternal(makeEnv('bar'), [makeCt('ct-1')]))
      .then(env => { this.id = env.sys.id; });
      this.$apply();
      const payload = this.contentPreview.toInternal(makeEnv('foo'), [makeCt('ct-1'), makeCt('ct-2')]);
      this.contentPreview.update(_.merge(payload, {version: 0}));
      this.$apply();
      this.contentPreview.update(_.merge(payload, {version: 1}))
      .then(env => { this.env = env; });
      this.$apply();
    });

    it('returns environment object', function () {
      expect(this.env).toEqual(makeEnv('foo'));
    });

    it('calls correct endpoint', function () {
      sinon.assert.calledWith(spaceContext.space.endpoint, 'preview_environments', this.id);
    });

    it('calls PUT method', function () {
      sinon.assert.calledTwice(spaceContext.space.put);
    });

    it('sends environment in payload', function () {
      const payload = spaceContext.space.payload.args[2][0];
      expect(payload.name).toBe('PE - foo');
      expect(payload.configurations.length).toBe(2);
    });

    it('sends correct version number in header', function () {
      const headers = {'X-Contentful-Version': 1};
      sinon.assert.calledWith(spaceContext.space.headers, headers);
    });
  });

  describe('#remove', function () {
    beforeEach(function () {
      spaceContext.space.delete.resolves();
      const internal = this.contentPreview.toInternal(makeEnv('foo'), [makeCt('ct-1')]);
      this.contentPreview.create(internal)
      .then(env => { this.id = env.sys.id; });
      this.$apply();
      this.contentPreview.remove(internal);
      this.$apply();
    });

    it('calls correct endpoint', function () {
      sinon.assert.calledWith(spaceContext.space.endpoint, 'preview_environments', this.id);
    });

    it('calls DELETE method', function () {
      sinon.assert.calledOnce(spaceContext.space.delete);
    });
  });

  describe('#getInvalidFields', function () {
    it('returns non-existent fields', function () {
      const url = 'https://www.test.com/{entry_field.valid}/{entry_field.invalid}/{entry_field.invalid}';
      const fields = [{apiName: 'valid', type: 'Symbol'}];
      expect(this.contentPreview.getInvalidFields(url, fields).nonExistentFields)
      .toEqual(['invalid']);
    });

    it('returns invalid type fields', function () {
      const url = 'https://www.test.com/{entry_field.valid}/{entry_field.invalid}/{entry_field.invalid}';
      const fields = [{apiName: 'invalid', type: 'Array'}];
      expect(this.contentPreview.getInvalidFields(url, fields).invalidTypeFields)
      .toEqual(['invalid']);
    });

    it('returns empty arrays if all fields are valid', function () {
      const url = 'https://www.test.com/{entry_field.field1}/{entry_field.field2}/{entry_field.field1}';
      const fields = [{apiName: 'field1', type: 'Text'}, {apiName: 'field2', type: 'Symbol'}];
      const invalidFields = this.contentPreview.getInvalidFields(url, fields);
      expect(invalidFields.nonExistentFields).toEqual([]);
      expect(invalidFields.invalidTypeFields).toEqual([]);
    });
  });


  describe('#replaceVariablesInUrl', function () {
    it('replaces variables in URL', function* () {
      this.compiledUrl = yield this.contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[0].url,
        makeEntry('entry-1').data,
        makeCt('ct-1')
      );
      expect(this.compiledUrl).toBe('https://www.test.com/entry-1/Title/my-slug');
    });

    it('does not replace invalid field tokens', function* () {
      this.compiledUrl = yield this.contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[1].url,
        makeEntry('entry-1').data,
        makeCt('ct-1')
      );
      expect(this.compiledUrl).toBe('https://www.test.com/{entry_field.invalid}');
    });

    /**
     * we do it to avoid pasting {entry_field.something}
     * in case value is just an empty string, but exists.
     */
    it('does replace with empty value', function* () {
      this.compiledUrl = yield this.contentPreview.replaceVariablesInUrl(
        'http://test-domain.com/{entry_id}/{entry_field.empty}',
        makeEntry('entry-1').data,
        makeCt('ct-1')
      );
      expect(this.compiledUrl).toBe('http://test-domain.com/entry-1/');
    });

    it('does not replace invalid field tokens', function* () {
      this.compiledUrl = yield this.contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[1].url,
        makeEntry('entry-1').data,
        makeCt('ct-1')
      );
      expect(this.compiledUrl).toBe('https://www.test.com/{entry_field.invalid}');
    });

    it('calls for entries with linked current entry', function* () {
      spaceContext.cma.getEntries = sinon.stub().resolves();
      yield this.contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[2].url,
        makeEntry('entry-3').data,
        makeCt('ct-3')
      );

      expect(spaceContext.cma.getEntries.calledWith({
        links_to_entry: 'entry-3'
      })).toBe(true);
    });

    it('replaces referenced value in URL', function* () {
      spaceContext.cma.getEntries = () => Promise.resolve({
        items: [{
          sys: { id: 'some' }
        }]
      });

      this.compiledUrl = yield this.contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[2].url,
        makeEntry('entry-3').data,
        makeCt('ct-3')
      );

      expect(this.compiledUrl).toBe('https://www.test.com/some');
    });

    it('replaces referenced value in URL with fields path', function* () {
      spaceContext.cma.getEntries = () => Promise.resolve({
        items: [{
          sys: { id: 'some' },
          fields: { slug: { 'en': 'new-value' } }
        }]
      });

      this.compiledUrl = yield this.contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[3].url,
        makeEntry('entry-4').data,
        makeCt('ct-4')
      );

      expect(this.compiledUrl).toBe('https://www.test.com/new-value');
    });

    it('replaces several referenced values in URL', function* () {
      spaceContext.cma.getEntries = sinon.stub();
      spaceContext.cma.getEntries.withArgs({
        links_to_entry: 'entry-5'
      }).returns(Promise.resolve({
        items: [{
          sys: { id: 'second_reference_id' },
          fields: { slug: { en: 'second_reference_value' } }
        }]
      }));

      spaceContext.cma.getEntries.withArgs({
        links_to_entry: 'second_reference_id'
      }).returns(Promise.resolve({
        items: [{
          sys: { id: 'first_reference_id' },
          fields: { name: { en: 'first_reference_value' } }
        }]
      }));

      this.compiledUrl = yield this.contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[4].url,
        makeEntry('entry-5').data,
        makeCt('ct-5')
      );

      expect(this.compiledUrl).toBe('https://www.test.com/first_reference_value/some/second_reference_value');
    });

    it('returns baseURL in case some reference does not exist', function* () {
      spaceContext.cma.getEntries = () => Promise.resolve({});
      this.compiledUrl = yield this.contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[2].url,
        makeEntry('entry-3').data,
        makeCt('ct-3')
      );

      expect(this.compiledUrl).toBe('https://www.test.com/');
    });
  });

  describe('#urlFormatIsValid', function () {
    it('correctly validates URL templates', function () {
      const urlTests = [
        {url: 'https://www.foo.com/{entry_id}/{entry_field.id}', valid: true},
        {url: 'https://foo.foo?x=y', valid: true},
        {url: 'https://foo.com/{ entry_id }/{ entry_field.slug }', valid: true},
        {url: '//foo.bar', valid: false},
        {url: 'test', valid: false},
        {url: '://foo.bar', valid: false}
      ];
      urlTests.forEach(function (test) {
        const isValid = this.contentPreview.urlFormatIsValid(test.url);
        expect(isValid).toBe(test.valid);
      }.bind(this));
    });

    it('URL with missing protocol returns false', function () {
      const urlTemplate = 'www.foo.com';
      const isValid = this.contentPreview.urlFormatIsValid(urlTemplate);
      expect(isValid).toBe(false);
    });
  });

  describe('#getSelected', function () {
    beforeEach(function () {
      storeStubs.get.withArgs('selectedPreviewEnvsForSpace.space01')
      .returns('env1');
    });

    it('returns environment id', function () {
      const selectedEnvironmentId = this.contentPreview.getSelected('ct1');
      expect(selectedEnvironmentId).toBe('env1');
    });

    it('returns undefined if not found', function () {
      spaceContext.getId.returns('space02');
      const selectedEnvironmentId = this.contentPreview.getSelected('ct2');
      expect(selectedEnvironmentId).toBeUndefined();
    });
  });

  describe('#setSelected', function () {
    const environment = {
      contentType: 'ct1',
      envId: 'env1'
    };

    beforeEach(function () {
      const storage = {};

      // Analogous to the actual backing storage
      storeStubs.get = function (key) {
        return storage[key];
      };

      storeStubs.set = function (key, value) {
        storage[key] = value;
      };
    });

    it('updates store value', function () {
      this.contentPreview.setSelected(environment);
      expect(this.contentPreview.getSelected('ct1')).toBe('env1');
    });
  });
});
