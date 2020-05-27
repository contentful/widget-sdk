import React from 'react';

import { render, wait, screen } from '@testing-library/react';

import * as fake from 'test/helpers/fakeFactory';
import { TeamDetails } from './TeamDetails';

const activeOrgId = 'testOrgId';

describe('TeamDetails', () => {
  const renderComponent = (props) => {
    const createdBy = fake.User();
    const team = fake.Team();
    team.sys.createdBy = createdBy;
    render(<TeamDetails orgId={activeOrgId} team={team} readOnlyPermission={false} {...props} />);
    return wait();
  };

  it('renders the page', async () => {
    await renderComponent();
    const header = screen.getByTestId('organization-team-page');
    expect(header).toBeInTheDocument();
  });
});
