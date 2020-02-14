import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { UserDisplayName } from './UserDisplayName';

describe('UserNameFormatter', () => {
  const mount = (user, currentUser) =>
    render(<UserDisplayName user={user} currentUser={currentUser} />);

  const exampleUser = {
    sys: {
      id: 'user1'
    },
    firstName: 'Testy',
    lastName: 'McTesterson'
  };
  const formattedName = 'Testy McTesterson';

  it('renders full name of the user if it differs from the logged-in user', () => {
    const user = exampleUser;
    const currentUser = { ...exampleUser, sys: { id: 'not-user1' } };

    const wrapper = mount(user, currentUser);

    expect(wrapper.queryByText(formattedName)).toMatchInlineSnapshot(`
      <span
        title="${formattedName}"
      >
        ${formattedName}
      </span>
    `);
  });

  it('renders Me if passed user is the logged-in user', () => {
    const user = exampleUser;
    const currentUser = { ...exampleUser };

    const wrapper = mount(user, currentUser);

    expect(wrapper.queryByText('Me')).toBeInTheDocument();
  });

  it('always renders the formattedName if currentUser is not passed', () => {
    const wrapper = mount(exampleUser, null);

    expect(wrapper.queryByText(formattedName)).toBeInTheDocument();
  });
});
