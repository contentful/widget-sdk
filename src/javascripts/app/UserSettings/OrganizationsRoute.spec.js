import React from 'react';
import { render, screen, wait } from '@testing-library/react';

import OrganizationsRoute from './OrganizationsRoute';
import { getOrganizations } from 'services/TokenStore';
import * as fake from 'testHelpers/fakeFactory';

const onReady = jest.fn();
const TITLE = 'Organizations Test';
const ONE_ORGANIZATION = [fake.Organization()];
const TWO_ORGANIZATIONS = [fake.Organization(), fake.Organization()];

jest.mock('services/TokenStore', () => ({
  getOrganizations: jest.fn()
}));

jest.mock('./OrganizationRow', () => () => <div data-test-id="organization-row"></div>);

const buildWithoutWaiting = props => {
  return render(
    <OrganizationsRoute
      {...{
        onReady: onReady,
        title: TITLE,
        ...props
      }}
    />
  );
};

const build = (props = {}) => {
  buildWithoutWaiting(props);

  return wait();
};

describe('OrganizationsRoute', () => {
  beforeEach(() => {
    const noOrganiztions = [];
    getOrganizations.mockResolvedValue(noOrganiztions);
  });

  it('should call onReady immediately, but only once', async () => {
    await build({ onReady });

    expect(onReady).toHaveBeenCalled();

    await wait();

    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('should render a loading state while the data is loading', async () => {
    const { queryByTestId } = buildWithoutWaiting();

    expect(queryByTestId('cf-ui-loading-state')).toBeVisible();

    await wait();

    expect(queryByTestId('cf-ui-loading-state')).toBeNull();
  });

  it('should render an error if the data fails to load', async () => {
    getOrganizations.mockReset().mockRejectedValue(new Error());

    const { queryByTestId } = buildWithoutWaiting();

    await wait();

    expect(queryByTestId('cf-ui-error-state')).toBeVisible();
  });

  it('should fetch user data when the component renders', async () => {
    build();

    expect(getOrganizations).toHaveBeenCalled();
  });

  describe('it renders correctly', () => {
    describe('the workbench header', () => {
      it('should render the title', async () => {
        build();

        expect(screen.getByTestId('organizations-list.title')).toHaveTextContent(TITLE);
      });

      it('should render the "New Organization" button', async () => {
        build();

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
