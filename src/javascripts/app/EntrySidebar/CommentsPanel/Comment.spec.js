import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render, cleanup } from '@testing-library/react';
import Comment from './Comment';
import * as TokenStore from 'services/TokenStore';
import * as spaceContextMocked from 'ng/spaceContext';

const mockAuthor = { firstName: 'John', lastName: 'Doe', avatarUrl: '0.jpeg', sys: { id: 'abc' } };
// In these tests, unknownAuthor serves both as an author who's no
// longer available and a user who's not the current user
const unknownAuthor = { sys: { id: 'cba' } };
const date = '2019-01-01T10:00:00.000Z';
const withAuthor = {
  body: 'Foo',
  sys: {
    createdAt: new Date(date).toISOString(),
    createdBy: mockAuthor,
    id: 'xyz'
  }
};
const withUnknownAuthor = {
  body: 'Boo',
  sys: {
    createdAt: new Date(date).toISOString(),
    createdBy: unknownAuthor,
    id: 'xyz'
  }
};
jest.mock('services/TokenStore', () => ({
  getSpace: jest.fn(),
  getUserSync: jest.fn()
}));

const setAdmin = isAdmin => {
  spaceContextMocked.getData.mockReturnValue(isAdmin);
};

const setAsCommentAuthor = isAuthor => {
  TokenStore.getUserSync.mockReturnValue(isAuthor ? mockAuthor : unknownAuthor);
};

describe('Comment', () => {
  const mount = (comment, hasReplies) => {
    const props = {
      comment,
      hasReplies,
      endpoint: jest.fn(),
      onRemoved: jest.fn()
    };
    return render(<Comment {...props} />);
  };
  const now = new Date(date).valueOf();

  beforeEach(() => {
    setAdmin(false);
    setAsCommentAuthor(false);
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(cleanup);

  afterAll(() => {
    Date.now.mockRestore();
  });

  it('renders a comment with the author info', () => {
    const { getByTestId } = mount(withAuthor);
    expect(getByTestId('comment.user').textContent).toBe('John Doe');
  });

  it('renders a comment without the author info', () => {
    const { getByTestId } = mount(withUnknownAuthor);
    expect(getByTestId('comment.user').textContent).toBe('(Deactivated user)');
  });

  it('renders the body of the comment', () => {
    const { getByTestId } = mount(withAuthor);
    expect(getByTestId('comment.body').textContent).toBe('Foo');
  });

  it('renders the menu if the comment has no replies and the author if the current user', () => {
    setAsCommentAuthor(true);
    const { getByTestId } = mount(withAuthor);
    expect(getByTestId('comment.menu')).toBeVisible();
  });

  it('renders the menu if the user is space admin', () => {
    setAdmin(true);
    const { getByTestId } = mount(withUnknownAuthor);
    expect(getByTestId('comment.menu')).toBeVisible();
  });

  it('does not render the menu if the current user is not the author', () => {
    setAsCommentAuthor(false);
    const { queryByTestId } = mount(withAuthor);
    expect(queryByTestId('comment.menu')).toBeNull();
  });

  it('does not render the menu if the comment has replies', () => {
    setAdmin(true);
    setAsCommentAuthor(true);
    const { queryByTestId } = mount(withAuthor, true);
    expect(queryByTestId('comment.menu')).toBeNull();
  });
});
