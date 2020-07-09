import * as TagsRepo from 'features/content-tags/core/state/TagsRepo';
import makeExtensionSpaceMethodsHandlers from './makeExtensionSpaceMethodsHandlers';
jest.mock('features/content-tags/core/state/TagsRepo');

const mockRepo = {
  createTag: jest.fn(),
  deleteTag: jest.fn(),
  updateTag: jest.fn(),
  readTags: jest.fn(),
};

const spaceContext = { getEnvironmentId: jest.fn() };

describe('makeExtensionAccessHandlers', () => {
  beforeAll(() => {
    TagsRepo.create.mockImplementation(() => mockRepo);
  });

  describe('when calling the factory', () => {
    it('creates tags repository', () => {
      makeExtensionSpaceMethodsHandlers({ spaceContext });

      expect(TagsRepo.create).toHaveBeenCalled();
    });
  });

  describe('when using the handlers', () => {
    let extensionSpaceMethodsHandlers;

    beforeEach(() => {
      extensionSpaceMethodsHandlers = makeExtensionSpaceMethodsHandlers({
        spaceContext: { endpoint: jest.fn(), getEnvironmentId: jest.fn() },
      });
    });

    describe('when calling a tag method', () => {
      it('calls methods on Tags Repo if method is tag related', async () => {
        const methods = ['createTag', 'deleteTag', 'updateTag', 'readTags'];

        for (const method of methods) {
          await extensionSpaceMethodsHandlers(method, []);

          expect(mockRepo[method]).toHaveBeenCalled();
        }
      });
    });
  });
});
