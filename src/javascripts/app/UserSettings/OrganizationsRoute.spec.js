import React from 'react';
import { render, screen, wait } from '@testing-library/react';

import OrganizationsRoute from './OrganizationsRoute';
import { getOrganizations } from 'services/TokenStore';
import * as fake from 'test/helpers/fakeFactory';

// Has the title and the New Organization button in this title div.
const TITLE = 'OrganizationsNew Organization';
const ZERO_ORGANIZATIONS = [];
const ONE_ORGANIZATION = [fake.Organization()];
const TWO_ORGANIZATIONS = [fake.Organization(), fake.Organization()];

jest.mock('services/TokenStore', () => ({
  getOrganizations: jest.fn(),
}));

jest.mock('./OrganizationRow', () => () => <tr data-test-id="organization-row" />);

const build = async (options = { withoutWaiting: false }) => {
  const renderedComponent = render(<OrganizationsRoute />);

  if (!options.withoutWaiting) {
    await wait();
  }

  return renderedComponent;
};

describe('OrganizationsRoute', () => {
  beforeEach(() => {
    getOrganizations.mockResolvedValue(ONE_ORGANIZATION);
  });

  it('should render a loading state while the data is loading', async () => {
    await build({ withoutWaiting: true });

    expect(screen.queryByTestId('cf-ui-loading-state')).toBeVisible();

    await wait();

    expect(screen.queryByTestId('cf-ui-loading-state')).toBeNull();
  });

  it('should render an error if the data fails to load', async () => {
    getOrganizations.mockReset().mockRejectedValue(new Error());

    await build({ withoutWaiting: true });

    await wait();

    expect(screen.queryByTestId('cf-ui-error-state')).toBeVisible();
  });

  it('should fetch user data when the component renders', async () => {
    await build();

    expect(getOrganizations).toHaveBeenCalled();
  });

  describe('it renders correctly', () => {
    describe('the workbench header', () => {
      it('should render the title', async () => {
        await build();

        expect(screen.getByTestId('organizations-list.title')).toHaveTextContent(TITLE);
      });

      it('should render the "New Organization" button', async () => {
        await build();

        expect(screen.getByTestId('organizations-list.new-org-button')).toHaveTextContent(
          'New Organization'
        );
      });
    });

    describe('the organization table', () => {
      it('should render the correct headers', async () => {
        await build();

        expect(screen.getByTestId('organizations-list.name-header')).toHaveTextContent('Name');
        expect(screen.getByTestId('organizations-list.invited-at-header')).toHaveTextContent(
          'Invited at'
        );
        expect(screen.getByTestId('organizations-list.role-header')).toHaveTextContent('Role');
        expect(screen.getByTestId('organizations-list.action-header')).toHaveTextContent('');
      });
    });

    describe('it should render the organizations', () => {
      it('should render the empty state organization if there are no organiztions', async () => {
        getOrganizations.mockReset().mockReturnValue(ZERO_ORGANIZATIONS);

        await build();

        expect(screen.getByTestId('organizations-list-empty-state')).toBeInTheDocument();
      });

      it('should render one organization if there is only one', async () => {
        getOrganizations.mockReset().mockReturnValue(ONE_ORGANIZATION);

        await build();

        expect(screen.queryAllByTestId('organization-row')).toHaveLength(1);
      });

      it('should render two organization if there are two', async () => {
        getOrganizations.mockReset().mockReturnValue(TWO_ORGANIZATIONS);

        await build();

        expect(screen.queryAllByTestId('organization-row')).toHaveLength(2);
      });
    });
  });
});
