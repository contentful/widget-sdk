import React from 'react';
import UserCard from './UserCard';

import { render } from '@testing-library/react';

const user = {
  firstName: 'User',
  lastName: 'Test',
  email: 'user.test@contentful.com',
  avatarUrl: '/testAvatar'
};

describe('UserCard', () => {
  it('status is undefined, no INVITED tag present', () => {
    const { getByTestId, queryByTestId } = render(<UserCard user={user} />);
    const userNameAndStatus = getByTestId('user-name-status');
    expect(userNameAndStatus.textContent).toBe('User Test');
    expect(queryByTestId('invited-status')).toBeNull();
  });

  it('status is active, no INVITED tag present', () => {
    const { getByTestId, queryByTestId } = render(<UserCard user={user} status="active" />);
    const userNameAndStatus = getByTestId('user-name-status');
    expect(userNameAndStatus.textContent).toBe('User Test');
    expect(queryByTestId('invited-status')).toBeNull();
  });

  it('status is pending, first and last name with INVITED tag', () => {
    const { getByTestId } = render(<UserCard user={user} status="pending" />);

    const userNameAndStatus = getByTestId('user-name-status');
    expect(userNameAndStatus.textContent).toBe('User Test');
    expect(getByTestId('invited-status').textContent).toBe('Invited');
  });

  it('first name not defined, INVITED tag displayed only', () => {
    const user = {
      email: 'user.test@contentful.com',
      avatarUrl: '/testAvatar'
    };
    const { getByTestId } = render(<UserCard user={user} />);
    const userNameAndStatus = getByTestId('user-name-status');
    expect(userNameAndStatus.textContent).toBe(' ');
    expect(getByTestId('invited-status').textContent).toBe('Invited');
  });
});
