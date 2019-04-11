import React from 'react';
import * as hooks from './hooks';
import { getAll } from 'data/CMA/CommentsRepo.es6';
import { shallow } from 'enzyme';

// These should go to a separate test helpers file. Where would that be?
function HookWrapper(props) {
  const hook = props.hook ? props.hook() : undefined;
  return <div hook={hook} />;
}

jest.mock('data/CMA/CommentsRepo.es6', () => ({
  getAll: jest.fn()
}));

jest.mock(
  'data/EndpointFactory.es6',
  () => ({
    createSpaceEndpoint: jest.fn()
  }),
  { virtual: true }
);

describe('Comments hooks', () => {
  it('gets initialized', () => {
    const component = shallow(<HookWrapper hook={() => hooks.useCommentsFetcher('foo', 'bar')} />);
    const { hook } = component.find('div').props();
    const [state] = hook;
    expect(state).toEqual({
      isLoading: false,
      isError: false
    });
  });

  describe('calling fetch', () => {
    const component = shallow(<HookWrapper hook={() => hooks.useCommentsFetcher('foo', 'bar')} />);
    let { hook } = component.find('div').props();
    let [state, doFetch] = hook;
    doFetch();
    ({ hook } = component.find('div').props());
    [state, doFetch] = hook;

    it('gets to the loading state', () => {
      expect(state).toEqual({
        isLoading: true,
        isError: false
      });
    });
  });
});
