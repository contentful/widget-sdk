import React from 'react';
import Enzyme from 'enzyme';
import FetchAndFormatUserName from './FetchAndFormatUserName.es6';
import flushPromises from '../../../../../test/helpers/flushPromises';
import * as spaceContextMock from 'ng/spaceContext';

jest.mock('./index.es6', () => jest.fn(), { virtual: true });

describe('FetchAndFormatUserName', () => {
  const user = { sys: { id: '2' } };

  beforeEach(() => {
    spaceContextMock.users.get.mockResolvedValue(user);
  });

  it('fetches the user with the given id and renders its name', async () => {
    const userId = '2';

    jest.requireMock('./index.es6').mockReturnValue('Me');

    const wrapper = Enzyme.mount(<FetchAndFormatUserName userId={userId} />);

    expect(wrapper.text()).toBe('Loading user data');
    await flushPromises();

    expect(wrapper.text()).toBe('Me');
  });
});
