import React from 'react';
import UserCard from './UserCard';

import { render, screen } from '@testing-library/react';

const user = {
  firstName: 'User',
  lastName: 'Test',
  email: 'user.test@contentful.com',
  avatarUrl: '/testAvatar',
};

describe('UserCard', () => {
  it('status is undefined, no INVITED tag present', () => {
    render(<UserCard user={user} />);
    const userNameAndStatus = screen.getByTestId('user-card.name');
    expect(userNameAndStatus.textContent).toBe('User Test');
    expect(screen.queryByTestId('user-card.status')).toBeNull();
  });

  it('status is active, no INVITED tag present', () => {
    render(<UserCard user={user} status="active" />);
    const userNameAndStatus = screen.getByTestId('user-card.name');
    expect(userNameAndStatus.textContent).toBe('User Test');
    expect(screen.queryByTestId('user-card.status')).toBeNull();
  });

  it('status is pending, first and last name with INVITED tag', () => {
    render(<UserCard user={user} status="pending" />);

    const userNameAndStatus = screen.getByTestId('user-card.name');
    expect(userNameAndStatus.textContent).toBe('User Test');
    expect(screen.getByTestId('user-card.status').textContent).toBe('Invited');
  });

  it('first name not defined, INVITED tag displayed only', () => {
    const user = {
      email: 'user.test@contentful.com',
      avatarUrl: '/testAvatar',
    };
    render(<UserCard user={user} />);
    const userNameAndStatus = screen.getByTestId('user-card.name');
    expect(userNameAndStatus.textContent).toBe(' ');
    expect(screen.getByTestId('user-card.status').textContent).toBe('Invited');
  });

  it('does not display the email', () => {
    render(<UserCard user={user} displayEmail={false} />);
    const userNameAndStatus = screen.queryByTestId('user-card.email');
    expect(userNameAndStatus).not.toBeInTheDocument();
  });

  it('displays a description the email', () => {
    render(<UserCard user={user} displayEmail={false} description="Foo" />);
    const description = screen.getByTestId('user-card.description');
    expect(description).toHaveTextContent('Foo');
  });
});
