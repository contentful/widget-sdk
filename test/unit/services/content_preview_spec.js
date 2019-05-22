'use strict';

import { times, merge, cloneDeep } from 'lodash';

import createContentPreview from 'services/contentPreview.es6';
import { getStore } from 'TheStore/index.es6';

describe('contentPreview', () => {
  beforeEach(function() {
    this.space = {
      data: {
        sys: { id: 'space01' }
      },
      endpoint: sinon.spy(function() {
        return this;
      }),
      payload: sinon.spy(function() {
        return this;
      }),
      headers: sinon.spy(function() {
        return this;
      }),
      post: sinon.stub().resolves(makeEnv('foo')),
      get: sinon.stub().resolves({ items: [makeEnv('foo'), makeEnv('foo2')] }),
      put: sinon.stub(),
      delete: sinon.stub()
    };

    this.getEntriesStub = sinon.stub().resolves();

    this.contentPreview = createContentPreview({
      space: this.space,
      cma: { getEntries: this.getEntriesStub }
    });
  });

  function makeEnv(id) {
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
          url:
            'https://www.test.com/{entry.linkedBy.linkedBy.fields.name}/some/{entry.linkedBy.fields.slug}',
          contentType: 'ct-5',
          enabled: true
        }
      ]
    };
  }

  function makeEntry(id) {
    return {
      getId: () => id,
      data: {
        sys: { id },
        fields: {
          title: { en: 'Title' },
          slug: { en: 'my-slug' },
          empty: { en: '' },
          undefined: {}
        }
      }
    };
  }

  function makeCt(id) {
    return {
      sys: {
        id: id
      },
      name: id,
      fields: [
        { id: 'internal-title-id', apiName: 'title' },
        { id: 'internal-slug-id', apiName: 'slug' },
        { id: 'internal-im-an-empty-string', apiName: 'empty' },
        { id: 'internal-undefined', apiName: 'undefined' }
      ]
    };
  }

  describe('#getAll', () => {
    it('resolves preview environments', async function() {
      const environments = await this.contentPreview.getAll();
      expect(environments.foo).toEqual(makeEnv('foo'));
      expect(environments.foo2).toEqual(makeEnv('foo2'));
    });

    it('fetches all content preview environments', function() {
      this.contentPreview.getAll();
      const payload = this.space.payload.args[0][0];
      expect(payload.limit).toBe(100);
    });

    it('only calls GET endpoint once', async function() {
      await this.contentPreview.getAll();
      await this.contentPreview.getAll();
      sinon.assert.calledOnce(this.space.get);
    });
  });

  describe('#get', () => {
    it('resolves preview environment', async function() {
      const env = await this.contentPreview.get('foo');
      expect(env).toEqual(makeEnv('foo'));
    });

    it('rejects promise if the requested environment does not exist', async function() {
      try {
        await this.contentPreview.get('bar');

        // should not end up here
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBe('Preview environment could not be found');
      }
    });
  });

  describe('#getForContentType', () => {
    it('returns all of the preview environments for the provided content type', async function() {
      const envs = await this.contentPreview.getForContentType('ct-1');
      expect(envs.length).toBe(2);
    });
  });

  describe('#canCreate', () => {
    it('resolves to true when limit is not reached', function() {
      this.contentPreview.canCreate().then(allowed => {
        expect(allowed).toBe(true);
      });
    });

    it('resolves to false when limit is reached', async function() {
      // Create 100 preview environments
      const createPromises = times(100, idx => {
        const internal = this.contentPreview.toInternal(makeEnv('foo' + idx), [makeCt('ct-1')]);
        this.space.post.resolves(makeEnv('foo' + idx));
        return this.contentPreview.create(internal);
      });

      await Promise.all(createPromises);

      const canCreate = await this.contentPreview.canCreate();

      expect(canCreate).toBe(false);
    });
  });

  describe('#create', () => {
    beforeEach(async function() {
      const internal = this.contentPreview.toInternal(makeEnv('foo'), [makeCt('ct-1')]);
      this.env = await this.contentPreview.create(internal);
    });

    it('returns environment object', function() {
      expect(this.env).toEqual(makeEnv('foo'));
    });

    it('calls POST method', function() {
      sinon.assert.calledOnce(this.space.post);
    });

    it('sends environment in payload', function() {
      const payload = this.space.payload.args[0][0];
      expect(payload.name).toBe('PE - foo');
      expect(payload.configurations.length).toBe(1);
    });
  });

  describe('#update', () => {
    beforeEach(async function() {
      this.space.put.resolves(makeEnv('foo'));

      const env = await this.contentPreview.create(
        this.contentPreview.toInternal(makeEnv('bar'), [makeCt('ct-1')])
      );
      this.id = env.sys.id;

      const payload = this.contentPreview.toInternal(makeEnv('foo'), [
        makeCt('ct-1'),
        makeCt('ct-2')
      ]);

      await this.contentPreview.update(merge(payload, { version: 0 }));

      this.env = await this.contentPreview.update(merge(payload, { version: 1 }));
    });

    it('returns environment object', function() {
      expect(this.env).toEqual(makeEnv('foo'));
    });

    it('calls correct endpoint', function() {
      sinon.assert.calledWith(this.space.endpoint, 'preview_environments', this.id);
    });

    it('calls PUT method', function() {
      sinon.assert.calledTwice(this.space.put);
    });

    it('sends environment in payload', function() {
      const payload = this.space.payload.args[2][0];
      expect(payload.name).toBe('PE - foo');
      expect(payload.configurations.length).toBe(2);
    });

    it('sends correct version number in header', function() {
      const headers = { 'X-Contentful-Version': 1 };
      sinon.assert.calledWith(this.space.headers, headers);
    });
  });

  describe('#remove', () => {
    beforeEach(async function() {
      this.space.delete.resolves();

      const internal = this.contentPreview.toInternal(makeEnv('foo'), [makeCt('ct-1')]);
      const env = await this.contentPreview.create(internal);
      this.id = env.sys.id;

      await this.contentPreview.remove(internal);
    });

    it('calls correct endpoint', function() {
      sinon.assert.calledWith(this.space.endpoint, 'preview_environments', this.id);
    });

    it('calls DELETE method', function() {
      sinon.assert.calledOnce(this.space.delete);
    });
  });

  describe('#replaceVariablesInUrl', () => {
    it('replaces variables in URL with the legacy content preview token', async function() {
      this.compiledUrl = await this.contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[0].url,
        makeEntry('entry-1').data,
        'en'
      );
      expect(this.compiledUrl).toBe('https://www.test.com/entry-1/Title/my-slug');
    });

    it('replaces variables in URL with the new content preview token', async function() {
      this.compiledUrl = await this.contentPreview.replaceVariablesInUrl(
        'https://www.test.com/{entry.sys.id}/{entry.fields.title}/{entry.fields.slug}',
        makeEntry('entry-1').data,
        'en'
      );
      expect(this.compiledUrl).toBe('https://www.test.com/entry-1/Title/my-slug');
    });

    it('replaces undefined fileds with "_NOT_FOUND"', async function() {
      this.compiledUrl = await this.contentPreview.replaceVariablesInUrl(
        'https://www.test.com/{entry.sys.id}/{entry.fields.random_field}/{entry.fields.slug}',
        makeEntry('entry-1').data,
        'en'
      );
      expect(this.compiledUrl).toBe(
        'https://www.test.com/entry-1/fields.random_field_ NOT_FOUND/my-slug'
      );
    });

    it('does not replace invalid field tokens', async function() {
      this.compiledUrl = await this.contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[1].url,
        makeEntry('entry-1').data,
        'en'
      );
      expect(this.compiledUrl).toBe('https://www.test.com/{entry_field.invalid}');
    });

    /**
     * we do it to avoid pasting {entry_field.something}
     * in case value is just an empty string, but exists.
     */
    it('does replace with empty value', async function() {
      this.compiledUrl = await this.contentPreview.replaceVariablesInUrl(
        'http://test-domain.com/{entry_id}/{entry_field.empty}',
        makeEntry('entry-1').data,
        'en'
      );
      expect(this.compiledUrl).toBe('http://test-domain.com/entry-1/');
    });

    it('does replace with undefined value', async function() {
      this.compiledUrl = await this.contentPreview.replaceVariablesInUrl(
        'http://test-domain.com/{entry_id}/{entry_field.undefined}',
        makeEntry('entry-1').data,
        'en'
      );
      expect(this.compiledUrl).toBe('http://test-domain.com/entry-1/');
    });

    it('does not replace invalid field tokens', async function() {
      this.compiledUrl = await this.contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[1].url,
        makeEntry('entry-1').data,
        'en'
      );
      expect(this.compiledUrl).toBe('https://www.test.com/{entry_field.invalid}');
    });

    it('calls for entries with linked current entry', async function() {
      await this.contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[2].url,
        makeEntry('entry-3').data,
        'en'
      );

      expect(this.getEntriesStub.calledWith({ links_to_entry: 'entry-3' })).toBe(true);
    });

    it('replaces referenced value in URL', async function() {
      this.getEntriesStub.resolves({
        items: [
          {
            sys: { id: 'some' }
          }
        ]
      });

      this.compiledUrl = await this.contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[2].url,
        makeEntry('entry-3').data,
        'en'
      );

      expect(this.compiledUrl).toBe('https://www.test.com/some');
    });

    it('replaces referenced value in URL with fields path', async function() {
      this.getEntriesStub.resolves({
        items: [
          {
            sys: { id: 'some' },
            fields: { slug: { en: 'new-value' } }
          }
        ]
      });

      this.compiledUrl = await this.contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[3].url,
        makeEntry('entry-4').data,
        'en'
      );

      expect(this.compiledUrl).toBe('https://www.test.com/new-value');
    });

    it('replaces several referenced values in URL', async function() {
      this.getEntriesStub
        .withArgs({
          links_to_entry: 'entry-5'
        })
        .returns(
          Promise.resolve({
            items: [
              {
                sys: { id: 'second_reference_id' },
                fields: { slug: { en: 'second_reference_value' } }
              }
            ]
          })
        );

      this.getEntriesStub
        .withArgs({
          links_to_entry: 'second_reference_id'
        })
        .returns(
          Promise.resolve({
            items: [
              {
                sys: { id: 'first_reference_id' },
                fields: { name: { en: 'first_reference_value' } }
              }
            ]
          })
        );

      this.compiledUrl = await this.contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[4].url,
        makeEntry('entry-5').data,
        'en'
      );

      expect(this.compiledUrl).toBe(
        'https://www.test.com/first_reference_value/some/second_reference_value'
      );
    });

    it('returns baseURL in case some reference does not exist', async function() {
      this.compiledUrl = await this.contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[2].url,
        makeEntry('entry-3').data,
        'en'
      );

      expect(this.compiledUrl).toBe('https://www.test.com/');
    });
  });

  describe('#getSelected', () => {
    function clean() {
      const store = getStore();
      store.remove('selectedPreviewEnvsForSpace.space01');
      store.remove('selectedPreviewEnvsForSpace.space02');
    }

    beforeEach(clean);
    afterEach(clean);

    it('returns stored environment id', function() {
      getStore().set('selectedPreviewEnvsForSpace.space01', 'someenv');
      expect(this.contentPreview.getSelected()).toBe('someenv');
    });

    it('returns null if not stored yet', function() {
      const contentPreview = createContentPreview({
        space: {
          ...cloneDeep(this.space),
          // use a different space
          data: { sys: { id: 'space02' } }
        },
        cma: { getEntries: this.getEntriesStub }
      });

      expect(contentPreview.getSelected()).toBe(null);
    });
  });

  describe('#setSelected', () => {
    it('updates store value', function() {
      this.contentPreview.setSelected({ envId: 'newenv' });

      expect(this.contentPreview.getSelected()).toBe('newenv');
    });
  });
});
