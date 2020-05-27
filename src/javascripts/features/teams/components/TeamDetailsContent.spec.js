import React from 'react';

import { render, wait, screen, fireEvent } from '@testing-library/react';

import * as fake from 'test/helpers/fakeFactory';
import { TeamDetailsContent } from './TeamDetailsContent';

const activeOrgId = 'testOrgId';

describe('TeamDetailsContent', () => {
  const renderComponent = (props) => {
    const team = fake.Team();
    render(
      <TeamDetailsContent orgId={activeOrgId} team={team} readOnlyPermission={false} {...props} />
    );
    return wait();
  };

  it('can view both team members list and space list by switching tabs', async () => {
    await renderComponent();
    const tabs = screen.getByTestId('cf-ui-tabs');
    expect(tabs).toBeInTheDocument();
    //by default we are on team members list
    expect(screen.getByTestId('team-members-table')).toBeInTheDocument();
    //show space list on tab click
    await fireEvent.click(screen.getByTestId('tab-spaceMemberships'));
    expect(screen.getByTestId('team-space-memberships-table')).toBeInTheDocument();
  });
});
