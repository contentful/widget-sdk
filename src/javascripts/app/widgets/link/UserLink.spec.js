import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import UserLink from './UserLink';

describe('UserLink', () => {
  it('should render the user data', () => {
    const props = {
      user: {
        email: 'test@gmail.com',
        avatarUrl: 'https://cat.ico',
        firstName: 'Vincent',
        lastName: 'Dunston',
        confirmed: true,
        activated: true,
      },
    };
    const { container, getByTestId } = render(<UserLink {...props} />);
    expect(container.querySelector('img').getAttribute('src')).toBe(props.user.avatarUrl);
    expect(getByTestId('user-details').textContent).toBe(
      `${props.user.firstName} ${props.user.lastName}`
    );
    expect(getByTestId('user-details-extra').textContent).toBe(props.user.email);
  });

  it('should render a note that user email is unconfirmed', () => {
    const props = {
      user: {
        email: 'test@gmail.com',
        avatarUrl: 'https://cat.ico',
        firstName: 'Vincent',
        lastName: 'Dunston',
        confirmed: false,
        activated: true,
      },
    };
    const { container, getByTestId } = render(<UserLink {...props} />);
    expect(container.querySelector('img').getAttribute('src')).toBe(props.user.avatarUrl);
    expect(getByTestId('user-details').textContent).toMatch(/\(not confirmed\)$/);
    const tooltipTrigger = getByTestId('user-details-tooltip-trigger');
    fireEvent.mouseOver(tooltipTrigger);
    expect(getByTestId('user-details-tooltip').textContent).toBe(
      'This user hasn’t confirmed their email address yet. Therefore  we can’t guarantee the identity of the user'
    );
  });

  it('should render a note that user was not activated', () => {
    const props = {
      user: {
        email: 'test@gmail.com',
        avatarUrl: 'https://cat.ico',
        firstName: 'Vincent',
        lastName: 'Dunston',
        confirmed: false,
        activated: false,
      },
    };
    const { container, getByTestId } = render(<UserLink {...props} />);
    expect(container.querySelector('img').getAttribute('src')).toBe(props.user.avatarUrl);
    expect(getByTestId('user-details').textContent).toMatch(/\(hasn’t accepted invitation\)$/);
    const tooltipTrigger = getByTestId('user-details-tooltip-trigger');
    fireEvent.mouseOver(tooltipTrigger);
    expect(getByTestId('user-details-tooltip').textContent).toBe(
      'This user hasn’t accepted the invitation to your organization yet.'
    );
  });

  it('should render a note if the user was not confirmed, doesnt have first name and last name', () => {
    const props = {
      user: {
        email: 'test@gmail.com',
        avatarUrl: 'https://cat.ico',
        firstName: undefined,
        lastName: undefined,
        confirmed: false,
        activated: false,
      },
    };
    const { container, getByTestId } = render(<UserLink {...props} />);
    expect(container.querySelector('img').getAttribute('src')).toBe(props.user.avatarUrl);
    const tooltipTrigger = getByTestId('user-details-tooltip-trigger');
    fireEvent.mouseOver(tooltipTrigger);
    expect(getByTestId('user-details-tooltip').textContent).toBe(
      'This user hasn’t accepted the invitation to your organization yet.'
    );
  });
});
