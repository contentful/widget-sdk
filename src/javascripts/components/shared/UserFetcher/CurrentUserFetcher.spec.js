import React from 'react';
import Enzyme from 'enzyme';
import 'jest-enzyme';
import CurrentUserFetcher from './CurrentUserFetcher';

const mockUser = {
  sys: {
    id: 'user1',
  },
  firstName: 'Testy',
  lastName: 'McTesterson',
};
jest.mock('ng/spaceContext', () => ({ user: mockUser }));

describe('CurrentUserFetcher', () => {
  it('passes the currentUser to the children prop', async () => {
    let actualArgs;

    Enzyme.mount(
      <CurrentUserFetcher>
        {(args) => {
          actualArgs = args;
          return null;
        }}
      </CurrentUserFetcher>
    );

    expect(actualArgs).toMatchObject(mockUser);
  });
});
