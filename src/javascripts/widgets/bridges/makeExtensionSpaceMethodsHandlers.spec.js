import makeExtensionSpaceMethodsHandlers from './makeExtensionSpaceMethodsHandlers';

let tagsRepoMock;
jest.mock('features/content-tags/core/state/TagsRepo', () => ({
  create() {
    tagsRepoMock = {
      createTag: jest.fn(),
      deleteTag: jest.fn(),
      updateTag: jest.fn(),
      readTags: jest.fn(),
    };

    return tagsRepoMock;
  },
}));

describe('makeExtensionAccessHandlers', () => {
  let extensionSpaceMethodsHandlers;

  beforeEach(() => {
    extensionSpaceMethodsHandlers = makeExtensionSpaceMethodsHandlers({
      spaceContext: { getEnvironmentId: jest.fn() },
    });
  });

  describe('when calling a tag method', () => {
    it('calls methods on Tags Repo if method is tag related', async () => {
      const methods = ['createTag', 'deleteTag', 'updateTag', 'readTags'];

      for (const method of methods) {
        await extensionSpaceMethodsHandlers(method);

        expect(tagsRepoMock[method]).toHaveBeenCalled();
      }
    });
  });
});
