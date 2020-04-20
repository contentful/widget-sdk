import { times, merge, cloneDeep } from 'lodash';
import { createContentPreview } from './createContentPreview';
import { contentPreviewToInternal } from './contentPreviewToInternal';
import { getStore } from 'browserStorage';

describe('features/content-preview/createContentPreview', () => {
  function initialize() {
    const space = {
      data: {
        sys: { id: 'space01' },
      },
      endpoint: jest.fn().mockImplementation(() => {
        return space;
      }),
      payload: jest.fn().mockImplementation(() => {
        return space;
      }),
      headers: jest.fn().mockImplementation(() => {
        return space;
      }),
      post: jest.fn().mockResolvedValue(makeEnv('foo')),
      get: jest.fn().mockResolvedValue({ items: [makeEnv('foo'), makeEnv('foo2')] }),
      put: jest.fn(),
      delete: jest.fn(),
    };

    const stubs = {
      getEntries: jest.fn().mockResolvedValue(),
    };

    return {
      stubs,
      space,
      contentPreview: createContentPreview({
        space,
        cma: { getEntries: stubs.getEntries },
      }),
    };
  }

  function makeEnv(id) {
    return {
      name: `PE - ${id}`,
      sys: { id: id },
      configurations: [
        {
          url: 'https://www.test.com/{entry_id}/{entry_field.title}/{entry_field.slug}',
          contentType: 'ct-1',
          enabled: true,
        },
        {
          url: 'https://www.test.com/{entry_field.invalid}',
          contentType: 'ct-2',
          enabled: true,
        },
        // for testing references:
        {
          url: 'https://www.test.com/{entry.linkedBy.sys.id}',
          contentType: 'ct-3',
          enabled: true,
        },
        {
          url: 'https://www.test.com/{entry.linkedBy.fields.slug}',
          contentType: 'ct-4',
          enabled: true,
        },
        {
          url:
            'https://www.test.com/{entry.linkedBy.linkedBy.fields.name}/some/{entry.linkedBy.fields.slug}',
          contentType: 'ct-5',
          enabled: true,
        },
      ],
    };
  }

  function makeEntry(id) {
    return {
      getId: () => id,
      data: {
        sys: { id, environment: { sys: { id: 'master' } } },
        fields: {
          title: { en: 'Title' },
          slug: { en: 'my-slug' },
          empty: { en: '' },
          undefined: {},
        },
      },
    };
  }

  function makeCt(id) {
    return {
      sys: {
        id: id,
      },
      name: id,
      fields: [
        { id: 'internal-title-id', apiName: 'title' },
        { id: 'internal-slug-id', apiName: 'slug' },
        { id: 'internal-im-an-empty-string', apiName: 'empty' },
        { id: 'internal-undefined', apiName: 'undefined' },
      ],
    };
  }

  describe('#getAll', () => {
    it('resolves preview environments', async function () {
      const { contentPreview } = initialize();
      const environments = await contentPreview.getAll();
      expect(environments.foo).toEqual(makeEnv('foo'));
      expect(environments.foo2).toEqual(makeEnv('foo2'));
    });

    it('only calls GET endpoint once', async function () {
      const { contentPreview, space } = initialize();
      await contentPreview.getAll();
      await contentPreview.getAll();
      expect(space.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('#get', () => {
    it('resolves preview environment', async function () {
      const { contentPreview } = initialize();
      const env = await contentPreview.get('foo');
      expect(env).toEqual(makeEnv('foo'));
    });

    it('rejects promise if the requested environment does not exist', async function () {
      const { contentPreview } = initialize();
      try {
        await contentPreview.get('bar');

        // should not end up here
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBe('Preview environment could not be found');
      }
    });
  });

  describe('#getForContentType', () => {
    it('returns all of the preview environments for the provided content type', async function () {
      const { contentPreview } = initialize();
      const envs = await contentPreview.getForContentType('ct-1');
      expect(envs).toHaveLength(2);
    });
  });

  describe('#create', () => {
    async function prepare() {
      const { contentPreview, ...rest } = initialize();
      const internal = contentPreviewToInternal(makeEnv('foo'), [makeCt('ct-1')]);
      const env = await contentPreview.create(internal);
      return {
        ...rest,
        contentPreview,
        env,
      };
    }

    it('returns environment object', async function () {
      const { env } = await prepare();
      expect(env).toEqual(makeEnv('foo'));
    });

    it('calls POST method', async function () {
      const { space } = await prepare();
      expect(space.post).toHaveBeenCalledTimes(1);

      const payload = space.payload.mock.calls[1][0];
      expect(payload.name).toBe('PE - foo');
      expect(payload.configurations).toHaveLength(1);
    });

    it('fails when limit is reached', async function () {
      const { space, contentPreview } = await prepare();
      // Start with no previews
      space.get.mockResolvedValue({ items: [] });
      contentPreview.clearCache();

      const create = (idx) => {
        const internal = contentPreviewToInternal(makeEnv('foo' + idx), [makeCt('ct-1')]);
        space.post.mockResolvedValue(makeEnv('foo' + idx));
        return contentPreview.create(internal);
      };

      // Create 100 preview environments (indexes are 0...99)
      await times(100).reduce(async (acc, idx) => {
        await acc;
        return create(idx);
      }, Promise.resolve());

      // Create preview number 101 (index is 100)
      try {
        await create(100);

        // Should never reach this
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBe('Cannot create more than 100 previews.');
      }
    });
  });

  describe('#update', () => {
    async function prepare() {
      const { contentPreview, space, ...rest } = initialize();
      space.put.mockResolvedValue(makeEnv('foo'));

      let env = await contentPreview.create(
        contentPreviewToInternal(makeEnv('bar'), [makeCt('ct-1')])
      );

      const id = env.sys.id;

      const payload = contentPreviewToInternal(makeEnv('foo'), [makeCt('ct-1'), makeCt('ct-2')]);

      await contentPreview.update(merge(payload, { version: 0 }));

      env = await contentPreview.update(merge(payload, { version: 1 }));
      return {
        ...rest,
        space,
        id,
        contentPreview,
        env,
      };
    }

    it('returns environment object', async function () {
      const { env } = await prepare();
      expect(env).toEqual(makeEnv('foo'));
    });

    it('calls correct endpoint', async function () {
      const { space, id } = await prepare();
      expect(space.endpoint).toHaveBeenCalledWith('preview_environments', id);
    });

    it('calls PUT method', async function () {
      const { space } = await prepare();
      expect(space.put).toHaveBeenCalledTimes(2);
    });

    it('sends environment in payload', async function () {
      const { space } = await prepare();
      const payload = space.payload.mock.calls[2][0];
      expect(payload.name).toBe('PE - foo');
      expect(payload.configurations).toHaveLength(2);
    });

    it('sends correct version number in header', async function () {
      const { space } = await prepare();
      const headers = { 'X-Contentful-Version': 1 };
      expect(space.headers).toHaveBeenCalledWith(headers);
    });
  });

  describe('#remove', () => {
    async function prepare() {
      const { space, contentPreview, ...rest } = initialize();
      space.delete.mockResolvedValue();

      const internal = contentPreviewToInternal(makeEnv('foo'), [makeCt('ct-1')]);
      const env = await contentPreview.create(internal);
      const id = env.sys.id;

      await contentPreview.remove(internal);
      return {
        ...rest,
        contentPreview,
        space,
        id,
      };
    }

    it('calls correct endpoint', async function () {
      const { space, id } = await prepare();
      expect(space.endpoint).toHaveBeenCalledWith('preview_environments', id);
    });

    it('calls DELETE method', async function () {
      const { space } = await prepare();
      expect(space.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('#replaceVariablesInUrl', () => {
    it('replaces variables in URL with the legacy content preview token', async function () {
      const { contentPreview } = initialize();
      const compiledUrl = await contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[0].url,
        makeEntry('entry-1').data,
        'en'
      );
      expect(compiledUrl).toBe('https://www.test.com/entry-1/Title/my-slug');
    });

    it('replaces variables in URL with the new content preview token', async function () {
      const { contentPreview } = initialize();
      const compiledUrl = await contentPreview.replaceVariablesInUrl(
        'https://www.test.com/{entry.sys.id}/{entry.fields.title}/{entry.fields.slug}',
        makeEntry('entry-1').data,
        'en'
      );
      expect(compiledUrl).toBe('https://www.test.com/entry-1/Title/my-slug');
    });

    it('replaces undefined fileds with "_NOT_FOUND"', async function () {
      const { contentPreview } = initialize();
      const compiledUrl = await contentPreview.replaceVariablesInUrl(
        'https://www.test.com/{entry.sys.id}/{entry.fields.random_field}/{entry.fields.slug}',
        makeEntry('entry-1').data,
        'en'
      );
      expect(compiledUrl).toBe(
        'https://www.test.com/entry-1/fields.random_field_ NOT_FOUND/my-slug'
      );
    });

    it('does not replace invalid field tokens', async function () {
      const { contentPreview } = initialize();
      const compiledUrl = await contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[1].url,
        makeEntry('entry-1').data,
        'en'
      );
      expect(compiledUrl).toBe('https://www.test.com/{entry_field.invalid}');
    });

    /**
     * we do it to avoid pasting {entry_field.something}
     * in case value is just an empty string, but exists.
     */
    it('does replace with empty value', async function () {
      const { contentPreview } = initialize();
      const compiledUrl = await contentPreview.replaceVariablesInUrl(
        'http://test-domain.com/{entry_id}/{entry_field.empty}',
        makeEntry('entry-1').data,
        'en'
      );
      expect(compiledUrl).toBe('http://test-domain.com/entry-1/');
    });

    it('does replace with undefined value', async function () {
      const { contentPreview } = initialize();
      const compiledUrl = await contentPreview.replaceVariablesInUrl(
        'http://test-domain.com/{entry_id}/{entry_field.undefined}',
        makeEntry('entry-1').data,
        'en'
      );
      expect(compiledUrl).toBe('http://test-domain.com/entry-1/');
    });

    it('calls for entries with linked current entry', async function () {
      const { contentPreview, stubs } = initialize();
      await contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[2].url,
        makeEntry('entry-3').data,
        'en'
      );

      expect(stubs.getEntries).toHaveBeenCalledWith({ links_to_entry: 'entry-3' });
    });

    it('replaces referenced value in URL', async function () {
      const { contentPreview, stubs } = initialize();
      stubs.getEntries.mockResolvedValue({
        items: [
          {
            sys: { id: 'some' },
          },
        ],
      });

      const compiledUrl = await contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[2].url,
        makeEntry('entry-3').data,
        'en'
      );

      expect(compiledUrl).toBe('https://www.test.com/some');
    });

    it('replaces referenced value in URL with fields path', async function () {
      const { contentPreview, stubs } = initialize();
      stubs.getEntries.mockResolvedValue({
        items: [
          {
            sys: { id: 'some' },
            fields: { slug: { en: 'new-value' } },
          },
        ],
      });

      const compiledUrl = await contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[3].url,
        makeEntry('entry-4').data,
        'en'
      );

      expect(compiledUrl).toBe('https://www.test.com/new-value');
    });

    it('replaces several referenced values in URL', async function () {
      const { contentPreview, stubs } = initialize();
      stubs.getEntries.mockImplementation(({ links_to_entry }) => {
        if (links_to_entry === 'entry-5') {
          return Promise.resolve({
            items: [
              {
                sys: { id: 'second_reference_id' },
                fields: { slug: { en: 'second_reference_value' } },
              },
            ],
          });
        }
        if (links_to_entry == 'second_reference_id') {
          return Promise.resolve({
            items: [
              {
                sys: { id: 'first_reference_id' },
                fields: { name: { en: 'first_reference_value' } },
              },
            ],
          });
        }
      });

      const compiledUrl = await contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[4].url,
        makeEntry('entry-5').data,
        'en'
      );

      expect(compiledUrl).toBe(
        'https://www.test.com/first_reference_value/some/second_reference_value'
      );
    });

    it('returns baseURL in case some reference does not exist', async function () {
      const { contentPreview } = initialize();
      const compiledUrl = await contentPreview.replaceVariablesInUrl(
        makeEnv('foo').configurations[2].url,
        makeEntry('entry-3').data,
        'en'
      );

      expect(compiledUrl).toBe('https://www.test.com/');
    });

    it('inserts an env_id into the url', async function () {
      const { contentPreview } = initialize();
      const compiledUrl = await contentPreview.replaceVariablesInUrl(
        'http://test-domain.com/{env_id}/test',
        makeEntry('entry-1').data,
        'en'
      );
      expect(compiledUrl).toBe('http://test-domain.com/master/test');
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

    it('returns stored environment id', function () {
      const { contentPreview } = initialize();
      getStore().set('selectedPreviewEnvsForSpace.space01', 'someenv');
      expect(contentPreview.getSelected()).toBe('someenv');
    });

    it('returns null if not stored yet', function () {
      const { space, stubs } = initialize();
      const contentPreview = createContentPreview({
        space: {
          ...cloneDeep(space),
          // use a different space
          data: { sys: { id: 'space02' } },
        },
        cma: { getEntries: stubs.getEntries },
      });

      expect(contentPreview.getSelected()).toBeNull();
    });
  });

  describe('#setSelected', () => {
    it('updates store value', function () {
      const { contentPreview } = initialize();
      contentPreview.setSelected({ envId: 'newenv' });

      expect(contentPreview.getSelected()).toBe('newenv');
    });
  });
});
