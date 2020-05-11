import React from 'react';

import { render } from '@testing-library/react';

import { TeamDetails } from './TeamDetails';

const activeOrgId = 'testOrgId';
const teamId = 'testTeamId';
describe('TeamDetails', () => {
  const renderComponent = (props) => {
    return render(<TeamDetails orgId={activeOrgId} teamId={teamId} {...props} />);
  };

  it('renders the page', () => {
    const { getByTestId } = renderComponent();
    const header = getByTestId('"organization-team-page"');
    expect(header).toBeInTheDOM();
  });
});
