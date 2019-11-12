import React from 'react';
import { render, cleanup } from '@testing-library/react';
import FetchAndFormatUserName from './FetchAndFormatUserName';

import * as spaceContextMock from 'ng/spaceContext';

jest.mock('.', () => jest.fn().mockReturnValue('Me'), { virtual: true });

describe('FetchAndFormatUserName', () => {
  afterEach(cleanup);

  let getStub;
  const user = { sys: { id: '2' } };

  beforeEach(() => {
    getStub = jest.fn().mockResolvedValue(user);
    spaceContextMock.users.get = getStub;
  });

  it('fetches the user with the given id and renders its name', async () => {
    const userId = '2';

    const { container } = render(<FetchAndFormatUserName userId={userId} />);

    expect(container.textContent).toBe('Loading user data');
    await getStub;

    expect(container.textContent).toBe('Me');
  });
});
