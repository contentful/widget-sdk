import React from 'react';
import Enzyme from 'enzyme';
import UserFetcher from './index.es6';
import flushPromises from '../../../../../test/helpers/flushPromises';
import * as spaceContextMock from 'ng/spaceContext';

describe('UserFetcher', () => {
  const user = {};

  beforeEach(() => {
    spaceContextMock.users.get.mockResolvedValue(user);
  });

  it('passes user and fetching state to the render prop', async () => {
    const userId = '2';
    let actualArgs;

    Enzyme.mount(
      <UserFetcher userId={userId}>
        {args => {
          actualArgs = args;
          return null;
        }}
      </UserFetcher>
    );

    // used .toMatchObject() because UserFetcher also passes `fetch`
    // function from createFetcherComponent(). But we don't really care.
    expect(actualArgs).toMatchObject({ data: null, isLoading: true, isLoaded: false, error: null });
    await flushPromises();

    expect(spaceContextMock.users.get).toHaveBeenCalledWith(userId);
    expect(actualArgs).toMatchObject({ data: user, isLoading: false, isLoaded: true, error: null });
  });
});
