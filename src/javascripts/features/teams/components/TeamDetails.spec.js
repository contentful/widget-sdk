import React from 'react';

import { render } from '@testing-library/react';

import * as fake from 'test/helpers/fakeFactory';
import { TeamDetails } from './TeamDetails';

const activeOrgId = 'testOrgId';

describe('TeamDetails', () => {
  const renderComponent = (props) => {
    const team = fake.Team();
    return render(
      <TeamDetails orgId={activeOrgId} team={team} readOnlyPermission={false} {...props} />
    );
  };

  it('renders the page', async () => {
    const { getByTestId } = renderComponent();
    const header = getByTestId('organization-team-page');
    expect(header).toBeInTheDocument();
  });
});
