import React from 'react';
import { shallow } from 'enzyme';
import Comment from './Comment.es6';

const unknownAuthor = { sys: { id: 'abc' } };
const author = { firstName: 'John', lastName: 'Doe', avatarUrl: '0.jpeg', sys: { id: 'abc' } };
const date = '2019-01-01T10:00:00.000Z';
const withAuthor = {
  body: 'Foo',
  sys: {
    createdAt: new Date(date).toISOString(),
    createdBy: author,
    id: 'xyz'
  }
};
const withoutAuthor = {
  body: 'Boo',
  sys: {
    createdAt: new Date(date).toISOString(),
    createdBy: unknownAuthor,
    id: 'xyz'
  }
};

describe('Comment', () => {
  const render = comment => shallow(<Comment comment={comment} />);
  const now = new Date(date).valueOf();

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterAll(() => {
    Date.now.mockRestore();
  });

  it('renders a comment with the author info', () => {
    const component = render(withAuthor);
    expect(component).toMatchSnapshot();
  });

  it('renders a comment without the author info', () => {
    const component = render(withoutAuthor);
    expect(component).toMatchSnapshot();
  });
});
