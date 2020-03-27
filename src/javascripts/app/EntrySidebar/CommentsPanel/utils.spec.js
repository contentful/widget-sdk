import { getUserSync } from 'services/TokenStore';
import * as utils from './utils';
import * as spaceContextMocked from 'ng/spaceContext';

jest.mock('services/TokenStore', () => ({
  getUserSync: jest.fn(),
}));

const mockComment = {
  body: 'foobar',
  sys: {
    id: 'xyz',
    createdBy: {
      sys: { id: 'abc' },
    },
  },
};

describe('Comments utils', () => {
  const setAdmin = (isAdmin) => {
    spaceContextMocked.getData.mockReturnValue(isAdmin);
  };
  const setIsAuthor = (isAuthor) => {
    const id = isAuthor ? mockComment.sys.createdBy.sys.id : 'notthesameid';
    getUserSync.mockReturnValue({ sys: { id } });
  };

  beforeEach(() => {
    spaceContextMocked.getData.mockReset();
    getUserSync.mockReset();
  });

  describe('#isCommentAuthor', () => {
    it('identifies the current user as the comment author', () => {
      setIsAuthor(true);
      const result = utils.isCommentAuthor(mockComment);
      expect(result).toBe(true);
    });

    it('does not identify the current user as the comment author', () => {
      setIsAuthor(false);
      const result = utils.isCommentAuthor(mockComment);
      expect(result).toBe(false);
    });
  });

  describe('#canRemoveComment', () => {
    it('allows removing if user is the author of the comment', () => {
      setIsAuthor(true);
      setAdmin(false);
      const result = utils.canRemoveComment(mockComment);
      expect(result).toBe(true);
    });

    it('does not allow removing if user is not the author of the comment and not space admin', () => {
      setIsAuthor(false);
      setAdmin(false);

      const result = utils.canRemoveComment(mockComment);
      expect(result).toBe(false);
    });

    it('allows removing if user is the space admin', () => {
      setIsAuthor(false);
      setAdmin(true);
      const result = utils.canRemoveComment(mockComment);
      expect(result).toBe(true);
    });
  });
});
