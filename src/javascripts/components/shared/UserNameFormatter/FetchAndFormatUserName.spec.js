import React from 'react';
import Enzyme from 'enzyme';
import FetchAndFormatUserName from './FetchAndFormatUserName.es6';
import flushPromises from '../../../../../test/helpers/flushPromises';

jest.mock('./index.es6', () => jest.fn(), { virtual: true });

jest.mock('NgRegistry.es6', () => {
  return {
    getModules: jest.fn((...moduleNames) => {
      return moduleNames.map(name => jest.requireMock(name).default);
    })
  };
});

describe('FetchAndFormatUserName', () => {
  it('fetches the user with the given id and renders its name', async () => {
    const user = { sys: { id: '2' } };
    const userId = '2';
    const spaceContextMock = jest.requireMock('spaceContext').default;
    spaceContextMock.users.get = jest.fn().mockResolvedValue(user);

    jest.requireMock('./index.es6').mockReturnValue('Me');

    const wrapper = Enzyme.mount(<FetchAndFormatUserName userId={userId} />);

    expect(wrapper.text()).toBe('Loading user data');
    await flushPromises();

    expect(wrapper.text()).toBe('Me');
  });
});
