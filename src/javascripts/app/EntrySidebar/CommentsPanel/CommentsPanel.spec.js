import React from 'react';

import { render, within, fireEvent, screen, wait } from '@testing-library/react';

import CommentsPanel from './CommentsPanel';
import { useCommentsFetcher, useCommentCreator } from './hooks';
import { remove as removeComment } from 'data/CMA/CommentsRepo';

const mockAuthor = { firstName: 'John', lastName: 'Doe', avatarUrl: '0.jpeg', sys: { id: 'abc' } };

jest.mock('services/TokenStore', () => ({
  getSpace: jest.fn(),
  getUserSync: jest.fn().mockReturnValue({ sys: { id: 'abc' } })
}));
jest.mock('./hooks', () => ({
  useCommentsFetcher: jest.fn(),
  useCommentCreator: jest.fn().mockReturnValue([{}, jest.fn()])
}));
jest.mock('data/CMA/CommentsRepo', () => ({
  remove: jest.fn()
}));

const commentMeta = {
  createdBy: mockAuthor,
  space: { sys: { id: '123' } },
  reference: { sys: { id: 'xyz' } }
};

const mockComments = [
  { body: 'foobar1', sys: { id: '1', ...commentMeta } },
  { body: 'foobar2', sys: { id: '2', ...commentMeta } },
  { body: 'foobar3', sys: { id: '3', ...commentMeta } },
  { body: 'foobar4', sys: { id: '4', ...commentMeta } },
  { body: 'foobar5', sys: { id: '5', ...commentMeta } },
  { body: 'foobar6', sys: { id: '6', ...commentMeta } }
];

const mockReply = {
  body: 'foobar7',
  sys: { id: '7', parent: { sys: { id: '1' } }, ...commentMeta }
};

const setComments = (withReply = false) => {
  const comments = withReply ? [...mockComments, mockReply] : mockComments;
  useCommentsFetcher.mockReturnValue({ isLoading: false, error: null, data: comments });
};
const setError = () => {
  useCommentsFetcher.mockReturnValue({ isLoading: false, error: new Error('Oops'), data: null });
};
const setLoading = () => {
  useCommentsFetcher.mockReturnValue({ isLoading: true, error: null, data: null });
};
const setEmpty = () => {
  useCommentsFetcher.mockReturnValue({ isLoading: false, error: null, data: [] });
};

const defaultProps = {
  endpoint: () => {},
  entryId: 'b',
  environmentId: 'c',
  isVisible: true,
  onCommentsCountUpdate: jest.fn()
};

const build = (props = defaultProps) => {
  return render(<CommentsPanel {...props} />);
};

describe('CommentsPanel', () => {
  afterEach(useCommentsFetcher.mockClear);

  describe('with `isVisible: false`', () => {
    const props = {
      ...defaultProps,
      isVisible: false
    };

    it('does not fetch any comments', () => {
      build(props);
      expect(useCommentsFetcher).not.toHaveBeenCalled();
    });
  });

  describe('with `isVisible: true`', () => {
    beforeEach(setLoading);

    it('fetches all comments of entry `props.entryId` via `props.endpoint`', () => {
      build();
      const { endpoint, entryId } = defaultProps;
      expect(useCommentsFetcher).toHaveBeenCalledWith(endpoint, entryId);
    });
  });

  describe('loading', () => {
    beforeEach(setLoading);

    it('renders the loading state', () => {
      build();
      expect(screen.getByTestId('comments.loading')).toBeTruthy();
      expect(screen.queryByTestId('comments.error')).toBeNull();
    });
  });

  describe('empty', () => {
    beforeEach(setEmpty);

    it('renders the empty state', () => {
      build();
      expect(screen.getByTestId('comments.empty')).toBeTruthy();
      expect(screen.queryByTestId('comments.error')).toBeNull();
      expect(screen.queryByTestId('comments.loading')).toBeNull();
    });
  });

  describe('loaded', () => {
    it('renders the comments and calls comments count update callback', () => {
      setComments();
      build();
      expect(screen.queryAllByTestId('comments.thread')).toHaveLength(6);
      expect(defaultProps.onCommentsCountUpdate).toHaveBeenCalledWith(6);
    });

    it('renders threads and calls comments count update callback', () => {
      setComments(true);
      build();
      expect(screen.queryAllByTestId('comments.thread')).toHaveLength(6);
      expect(defaultProps.onCommentsCountUpdate).toHaveBeenCalledWith(7);
    });
  });

  describe('error', () => {
    beforeEach(setError);

    it('renders the error state', () => {
      build();
      expect(screen.getByTestId('comments.error')).toBeTruthy();
      expect(screen.queryByTestId('comments.empty')).toBeNull();
      expect(screen.queryByTestId('comments.loading')).toBeNull();
    });
  });

  // From this point on, tests require knowledge about the child components
  // You can make the case that they are all part of the same thing.
  // For instance, the only way for a user to create a comment is by using the form
  describe('comment added', () => {
    const addComment = container => {
      const comment = {
        body: 'foobar8',
        sys: { id: '8', createdBy: mockAuthor, parentEntity: { sys: { id: 'test' } } }
      };
      const form = within(container).getByTestId('comments.form');
      const textarea = within(form).getByTestId('comments.form.textarea');
      fireEvent.focus(textarea); // focus to show buttons
      const submitBtn = within(form).getByTestId('comments.form.submit');
      fireEvent.change(textarea, { target: { value: 'My new comment' } });
      useCommentCreator.mockReturnValueOnce([
        { isLoading: false, error: null, data: comment },
        jest.fn()
      ]);
      fireEvent.click(submitBtn);
      return wait();
    };

    it('adds a new comment when the list is empty and calls comments count update callback', () => {
      setEmpty();
      const { container } = build();
      expect(screen.queryAllByTestId('comments.thread')).toHaveLength(0);
      addComment(container);
      expect(screen.queryByTestId('comments.empty')).toBeNull();
      expect(screen.queryAllByTestId('comments.thread')).toHaveLength(1);
      expect(defaultProps.onCommentsCountUpdate).toHaveBeenCalledWith(1);
    });

    it('adds a new comment when the list has other comments and calls comments count update callback', () => {
      setComments();
      const { container } = build();
      expect(screen.queryAllByTestId('comments.thread')).toHaveLength(6);
      addComment(container);
      expect(screen.queryAllByTestId('comments.thread')).toHaveLength(7);
      expect(defaultProps.onCommentsCountUpdate).toHaveBeenCalledWith(7);
    });
  });

  describe('comment deleted', () => {
    const deleteComment = container => {
      const removeButton = within(container).getAllByTestId('comment.menu.remove')[0];
      fireEvent.click(removeButton);

      removeComment.mockResolvedValue();

      const confirmButton = screen.getByTestId('cf-ui-modal-confirm-confirm-button');
      fireEvent.click(confirmButton);
      return wait();
    };

    it('deletes a comment when the list has other comments and calls comments count update callback', async () => {
      setComments();
      const { container } = build();
      expect(screen.getAllByTestId('comments.thread')).toHaveLength(6);
      await deleteComment(container);
      expect(screen.getAllByTestId('comments.thread')).toHaveLength(5);
      expect(defaultProps.onCommentsCountUpdate).toHaveBeenCalledWith(5);
    });
  });
});
