import React from 'react';
import { shallow } from 'enzyme';

import CommentsPanel from './CommentsPanel.es6';
import { useCommentsFetcher } from './hooks.es6';

jest.mock('./hooks.es6', () => ({ useCommentsFetcher: jest.fn() }));
// should not be mocking this, but the TokenStore uses some angular module
jest.mock('services/TokenStore.es6', () => ({
  getSpace: jest.fn(),
  getUser: jest.fn()
}));

describe('CommentsPanel', () => {
  const render = props => {
    return shallow(<CommentsPanel {...props} />);
  };

  describe('initializing', () => {
    useCommentsFetcher.mockReturnValueOnce({ isLoading: false });
    render({ spaceId: 'a', entryId: 'b' });

    it('fetches all comments in the entry', () => {
      expect(useCommentsFetcher).toHaveBeenCalledWith('a', 'b');
    });
  });
  describe('loading', () => {
    useCommentsFetcher.mockReturnValueOnce({ isLoading: true });
    const component = render({ spaceId: 'a', entryId: 'b' });

    it('matches the snapshot', () => {
      expect(component).toMatchSnapshot();
    });
  });

  describe('error', () => {
    useCommentsFetcher.mockReturnValueOnce({ isLoading: false, error: new Error('Bad API') });
    const component = render({ spaceId: 'a', entryId: 'b' });

    it('matches the snapshot', () => {
      expect(component).toMatchSnapshot();
    });
  });
});
