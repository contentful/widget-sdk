import React from 'react';
import { shallow } from 'enzyme';

import CommentsPanel from './CommentsPanel.es6';
import { useCommentsFetcher } from './hooks.es6';

jest.mock('./hooks.es6', () => ({ useCommentsFetcher: jest.fn() }));

describe('CommentsPanel', () => {
  const render = props => {
    return shallow(<CommentsPanel {...props} />);
  };

  describe('initializing', () => {
    useCommentsFetcher.mockReturnValueOnce({ isLoading: false, isError: false });
    render({ spaceId: 'a', entryId: 'b' });

    it('fetches all comments in the entry', () => {
      expect(useCommentsFetcher).toHaveBeenCalledWith('a', 'b');
    });
  });
  describe('loading', () => {
    useCommentsFetcher.mockReturnValueOnce({ isLoading: true, isError: false });
    const component = render({ spaceId: 'a', entryId: 'b' });

    it('matches the snapshot', () => {
      expect(component).toMatchSnapshot();
    });
  });

  describe('error', () => {
    useCommentsFetcher.mockReturnValueOnce({ isLoading: false, isError: true });
    const component = render({ spaceId: 'a', entryId: 'b' });

    it('matches the snapshot', () => {
      expect(component).toMatchSnapshot();
    });
  });

  describe('data loaded', () => {
    const comment = {
      body: 'Foo foo foo bar bar bar',
      sys: {
        id: '123',
        createdBy: { sys: { id: 'abc' } }
      }
    };
    useCommentsFetcher.mockReturnValueOnce({
      isLoading: false,
      isError: false,
      data: { items: [comment] }
    });
    const component = render({ spaceId: 'a', entryId: 'b' });

    it('matches the snapshot', () => {
      expect(component).toMatchSnapshot();
    });
  });
});
