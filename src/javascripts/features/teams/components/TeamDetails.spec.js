import React from 'react';

import { render, waitFor, screen } from '@testing-library/react';

import * as fake from 'test/helpers/fakeFactory';
import { TeamDetails } from './TeamDetails';
import { getUser } from 'access_control/OrganizationMembershipRepository';

const activeOrgId = 'testOrgId';

jest.mock('access_control/OrganizationMembershipRepository', () => ({
  getUser: jest.fn(),
}));

describe('TeamDetails', () => {
  const renderComponent = (props) => {
    const createdBy = fake.User();
    const team = fake.Team();
    team.sys.createdBy = createdBy;
    render(<TeamDetails orgId={activeOrgId} team={team} readOnlyPermission={false} {...props} />);
    return waitFor(() => expect(getUser).toHaveBeenCalled());
  };

  it('renders the page', async () => {
    await renderComponent();
    const header = screen.getByTestId('organization-team-page');
    expect(header).toBeInTheDocument();
  });
});
