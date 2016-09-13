'use strict';

describe('contentPreview', function () {

  let spaceContext;

  beforeEach(function () {

    spaceContext = {};

    module('contentful/test', function ($provide) {
      $provide.value('TheLocaleStore', {
        getDefaultLocale: _.constant({internal_code: 'en'})
      });
      $provide.value('spaceContext', spaceContext);
    });

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
    spaceContext.getId = _.constant('space01');

    this.contentPreview = this.$inject('contentPreview');
    this.TheStore = this.$inject('TheStore');
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
          url: 'https://www.test.com/{entry_id}/{entry_field.title}/{entry_field.slug }',
          contentType: 'ct-1',
          enabled: true
        },
        {
          url: 'https://www.test.com/{entry_field.invalid}',
          contentType: 'ct-2',
          enabled: true
        }
      ]
    };
  }

  function makeEntry (id) {
    return {
      getId: _.constant(id),
      data: {
        fields: {
          'internal-title-id': {en: 'Title'},
          'internal-slug-id': {en: 'my-slug'}
        }
      }
    };
  }

  function makeCt (id) {
    return {
      getId: _.constant(id),
      getName: _.constant(id),
      data: {
        fields: [
          { id: 'internal-title-id', apiName: 'title' },
          { id: 'internal-slug-id', apiName: 'slug' }
        ]
      }
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
    it('returns all of the preview environments for the provided content type', function () {
      let environments;
      this.contentPreview.getForContentType(makeCt('ct-1')).then(function (resp) {
        environments = resp;
      });
      this.$apply();
      expect(environments.length).toBe(2);
    });
  });

  describe('#canCreate', function () {
    it('resolves to true when limit is not reached', function () {
      this.contentPreview.canCreate().then(function (allowed) {
        expect(allowed).toBe(true);
      });
    });

    it('resolves to false when limit is reached', function () {
      // Create 25 preview environments
      _.times(25, function (idx) {
        const internal = this.contentPreview.toInternal(makeEnv('foo' + idx), [makeCt('ct-1')]);
        this.contentPreview.create(internal);
      }.bind(this));
      this.contentPreview.canCreate().then(function (allowed) {
        expect(allowed).toBe(true);
      });
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
    it('replaces variables in URL', function () {
      this.compiledUrl = this.contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[0].url,
        makeEntry('entry-1'),
        makeCt('ct-1')
      );
      expect(this.compiledUrl).toBe('https://www.test.com/entry-1/Title/my-slug');
    });

    it('does not replace invalid field tokens', function () {
      this.compiledUrl = this.contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[1].url,
        makeEntry('entry-1'),
        makeCt('ct-1')
      );
      expect(this.compiledUrl).toBe('https://www.test.com/{entry_field.invalid}');
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
      this.TheStore.get = sinon.stub();
      this.TheStore.get.withArgs('selectedPreviewEnvsForSpace.space01')
      .returns({'ct1': 'env1'});
    });

    it('returns environment id', function () {
      const selectedEnvironmentId = this.contentPreview.getSelected('ct1');
      expect(selectedEnvironmentId).toBe('env1');
    });

    it('returns undefined if not found', function () {
      const selectedEnvironmentId = this.contentPreview.getSelected('ct2');
      expect(selectedEnvironmentId).toBeUndefined();
    });
  });

  describe('#setSelected', function () {
    it('updates store value', function () {
      var environment = {
        contentType: 'ct1',
        envId: 'env1'
      };
      this.contentPreview.setSelected(environment);
      expect(this.contentPreview.getSelected('ct1')).toBe('env1');
    });
  });
});
