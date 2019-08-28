import React from 'react';
import 'jest-dom/extend-expect';
import { render, within, fireEvent, cleanup } from '@testing-library/react';

import CommentsPanel from './CommentsPanel.es6';
import { useCommentsFetcher, useCommentCreator } from './hooks.es6';

const mockAuthor = { firstName: 'John', lastName: 'Doe', avatarUrl: '0.jpeg', sys: { id: 'abc' } };

jest.mock('ng/$q', () => ({}), { virtual: true });
jest.mock('services/TokenStore.es6', () => ({
  getSpace: jest.fn(),
  getUserSync: jest.fn()
}));
jest.mock('./hooks.es6', () => ({
  useCommentsFetcher: jest.fn(),
  useCommentCreator: jest.fn().mockReturnValue([{}, jest.fn()])
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

const setData = (withReply = false) => {
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
  spaceId: 'a',
  entryId: 'b',
  environmentId: 'c',
  isVisible: true
};

const build = (props = defaultProps) => {
  return render(<CommentsPanel {...props} />);
};

describe('CommentsPanel', () => {
  afterEach(cleanup);
  afterEach(useCommentsFetcher.mockClear);

  describe('with `isVisible: false`', () => {
    const props = {
      ...defaultProps,
      isVisible: false
    };

    it('should not be visible', () => {
      const { getByTestId } = build(props);
      expect(getByTestId('comments')).toHaveStyle('transform: translateX(100%)');
    });

    it('does not fetch any comments', () => {
      build(props);
      expect(useCommentsFetcher).not.toHaveBeenCalled();
    });
  });

  describe('with `isVisible: true`', () => {
    beforeEach(setLoading);

    it('should be made visible', () => {
      const { getByTestId } = build();
      expect(getByTestId('comments')).toHaveStyle('transform: translateX(-1px)');
    });

    it('fetches all comments of entry `props.entryId` in space `props.spaceId`', () => {
      build();
      const { spaceId, entryId } = defaultProps;
      expect(useCommentsFetcher).toHaveBeenCalledWith(spaceId, entryId);
    });
  });

  describe('loading', () => {
    beforeEach(setLoading);

    it('renders the loading state', () => {
      const { getByTestId, queryByTestId } = build();
      expect(getByTestId('comments.loading')).toBeTruthy();
      expect(queryByTestId('comments.error')).toBeNull();
    });
  });

  describe('empty', () => {
    beforeEach(setEmpty);

    it('renders the empty state', () => {
      const { getByTestId, queryByTestId } = build();
      expect(getByTestId('comments.empty')).toBeTruthy();
      expect(queryByTestId('comments.error')).toBeNull();
      expect(queryByTestId('comments.loading')).toBeNull();
    });
  });

  describe('loaded', () => {
    it('renders the comments', () => {
      setData();
      const { queryAllByTestId } = build();
      expect(queryAllByTestId('comments.thread')).toHaveLength(6);
    });

    it('renders threads', () => {
      setData(true);
      const { queryAllByTestId } = build();
      expect(queryAllByTestId('comments.thread')).toHaveLength(6);
    });
  });

  describe('error', () => {
    beforeEach(setError);

    it('renders the error state', () => {
      const { getByTestId, queryByTestId } = build();
      expect(getByTestId('comments.error')).toBeTruthy();
      expect(queryByTestId('comments.empty')).toBeNull();
      expect(queryByTestId('comments.loading')).toBeNull();
    });
  });

  // From this point on, tests require knowledge about the child components
  // You can make the case that they are all part of the same thing.
  // For instance, the only way for a user to create a comment is by using the form
  describe('comment added', () => {
    const addComment = container => {
      const comment = { body: 'foobar8', sys: { id: '8', createdBy: mockAuthor } };
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
    };

    it('adds a new comment when the list is empty', () => {
      setEmpty();
      const { queryAllByTestId, queryByTestId, container } = build();
      expect(queryAllByTestId('comments.thread')).toHaveLength(0);
      addComment(container);
      expect(queryByTestId('comments.empty')).toBeNull();
      expect(queryAllByTestId('comments.thread')).toHaveLength(1);
    });

    it('adds a new new comment when the list has other comments', () => {
      setData();
      const { queryAllByTestId, container } = build();
      expect(queryAllByTestId('comments.thread')).toHaveLength(6);
      addComment(container);
      expect(queryAllByTestId('comments.thread')).toHaveLength(7);
    });
  });
});
