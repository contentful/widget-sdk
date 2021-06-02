import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { SpacesListForMembers } from './SpacesListForMembers';
import * as fake from 'test/helpers/fakeFactory';
import * as FORMA_CONSTANTS from 'test/helpers/Forma36Constants';
import { MemoryRouter, router } from 'core/react-routing';

const createdAt = '07/05/2020';
const DEFAULT_CREATED_AT_STRING = '2020-05-07T10:48:53Z';
const fakeSpace1 = fake.Space({ sys: fake.sys({ createdAt: DEFAULT_CREATED_AT_STRING }) });
const fakeSpace2 = fake.Space({ sys: fake.sys({ createdAt: DEFAULT_CREATED_AT_STRING }) });
const mockSpaces = [fakeSpace1, fakeSpace2];

jest.mock('core/react-routing', () => ({
  // @ts-expect-error mute in tests
  ...jest.requireActual('core/react-routing'),
  useSearchParams: jest.fn().mockReturnValue([new URLSearchParams()]),
  router: {
    navigate: jest.fn(),
  },
}));

const build = (spaces: any) => {
  render(
    <MemoryRouter>
      <SpacesListForMembers spaces={spaces} />
    </MemoryRouter>
  );
};

describe('SpacesListForMembers', () => {
  it('should not render if no spaces are given', () => {
    build([]);

    expect(screen.queryByTestId('subscription-page-trial-members.heading')).toHaveTextContent(
      'Spaces'
    );
    expect(screen.queryByTestId('subscription-page-trial-members.table')).not.toBeInTheDocument();
    expect(
      screen.getByTestId('subscription-page-trial-members.no-spaces-placeholder')
    ).toBeInTheDocument();
  });

  it('should render the heading and table', () => {
    build(mockSpaces);

    expect(screen.queryByTestId('subscription-page-trial-members.heading')).toHaveTextContent(
      'Spaces'
    );
    expect(screen.queryByTestId('subscription-page-trial-members.table')).toBeInTheDocument();
    expect(
      screen.queryByTestId('subscription-page-trial-members.no-spaces-placeholder')
    ).not.toBeInTheDocument();
  });

  it('should render the correct table headers', () => {
    build(mockSpaces);

    expect(
      screen.getByTestId('subscription-page-trial-members.table-header.name')
    ).toHaveTextContent('Name');
    expect(
      screen.getByTestId('subscription-page-trial-members.table-header.created-on')
    ).toHaveTextContent('Created on');
  });

  it('should render two rows', () => {
    build(mockSpaces);

    const rows = screen.queryAllByTestId('subscription-page-trial-members.table-row');
    expect(rows).toHaveLength(2);

    const firstRow = rows[0];
    expect(
      within(firstRow).queryByTestId('subscription-page-trial-members.table-row.name')
    ).toHaveTextContent(fakeSpace1.name);
    expect(
      within(firstRow).queryByTestId('subscription-page-trial-members.table-row.created-on')
    ).toHaveTextContent(createdAt);
    expect(
      within(firstRow).queryByTestId('subscription-page-trial-members.dropdown-menu.trigger')
    ).toBeVisible();
  });

  it('should navigate to space home', async () => {
    build(mockSpaces);

    const actionIcons = screen.queryAllByTestId(
      'subscription-page-trial-members.dropdown-menu.trigger'
    );
    fireEvent.click(actionIcons[0]); // open the action dropdown of the first row

    const goToSpaceContainer = screen.getByTestId(
      'subscription-page-trial-members.dropdown-menu-item.space-link'
    );
    expect(goToSpaceContainer).toHaveTextContent('Go to space');

    fireEvent.click(
      within(goToSpaceContainer).getByTestId(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID)
    ); // click on the "Go to space" btn

    expect(router.navigate).toHaveBeenCalledWith(
      {
        path: 'spaces.detail.home',
        spaceId: fakeSpace1.sys.id,
      },
      { reload: true }
    );
  });
});
