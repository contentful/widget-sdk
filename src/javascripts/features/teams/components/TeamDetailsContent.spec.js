import React from 'react';

import { render, waitForElementToBeRemoved, screen, fireEvent } from '@testing-library/react';

import * as fake from 'test/helpers/fakeFactory';
import { TeamDetailsContent } from './TeamDetailsContent';

const activeOrgId = 'testOrgId';

describe('TeamDetailsContent', () => {
  const renderComponent = (props) => {
    const team = fake.Team();
    render(
      <TeamDetailsContent orgId={activeOrgId} team={team} readOnlyPermission={false} {...props} />
    );
    return waitForElementToBeRemoved(() => screen.getByTestId('content-loader'));
  };

  it('can view both team members list and space list by switching tabs', async () => {
    await renderComponent();
    const tabs = screen.getByTestId('cf-ui-tabs');
    expect(tabs).toBeInTheDocument();
    //by default we are on team members list - empty paceholder with cta
    expect(screen.getByText('Add a team member')).toBeInTheDocument();
    await fireEvent.click(screen.getByTestId('tab-spaceMemberships'));
    //by default we are on team members list - empty paceholder with cta
    expect(screen.getByText('Add to space')).toBeInTheDocument();
  });
});
