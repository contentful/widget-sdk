import React from 'react';
import moment from 'moment';
import { render, screen } from '@testing-library/react';
import { UserInvitation } from './UserInvitation';
import * as Fake from 'test/helpers/fakeFactory';
import userEvent from '@testing-library/user-event';
import { mockEndpoint } from '__mocks__/data/EndpointFactory';

const invitation = {
  organizationName: 'Pizza Org',
  role: 'Admin',
  inviterName: 'John Doe',
  sys: {
    id: '123',
    expiresAt: moment().subtract(1, 'day').toISOString(),
  },
};

const user = Fake.User();

function build(expired, errored) {
  render(
    <UserInvitation invitation={invitation} expired={expired} errored={errored} user={user} />
  );
}

describe('UserInvitation', () => {
  it('displays the invitation expired message', () => {
    build(true, false);
    expect(screen.getByTestId('invitation.expired')).toBeInTheDocument();
    expect(screen.queryByTestId('invitation.accept')).not.toBeInTheDocument();
  });

  it('displays the invitation error message', () => {
    build(false, true);
    expect(screen.getByTestId('invitation.error')).toBeInTheDocument();
    expect(screen.queryByTestId('invitation.accept')).not.toBeInTheDocument();
  });

  it('displays the invitation', () => {
    build(false, false);
    const acceptButton = screen.getByTestId('invitation.accept');
    expect(screen.getByTestId('invitation.info')).toBeInTheDocument();
    expect(acceptButton.textContent).toEqual('Join Pizza Org');

    userEvent.click(acceptButton);

    expect(mockEndpoint).toHaveBeenCalledWith({
      method: 'POST',
      path: ['invitations', '123', 'accept'],
    });
  });
});
