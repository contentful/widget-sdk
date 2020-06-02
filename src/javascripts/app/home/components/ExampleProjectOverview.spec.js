import React from 'react';
import { render, screen, wait } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExampleProjectOverview from './ExampleProjectOverview';
import * as FakeFactory from 'test/helpers/fakeFactory';
import { go } from 'states/Navigator';
import { openDeleteSpaceDialog } from 'features/space-settings';
import * as TokenStore from 'services/TokenStore';
import { trackClickCTA } from '../tracking';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';

import * as spaceContextMocked from 'ng/spaceContext';

const mockSpace = FakeFactory.Space();

jest.mock('app/home/tracking', () => ({
  trackClickCTA: jest.fn(),
}));

jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn(),
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

jest.mock('features/space-settings', () => ({
  openDeleteSpaceDialog: jest.fn(),
}));

jest.mock('services/TokenStore', () => ({
  getSpace: jest.fn(),
}));

const build = () => {
  return render(<ExampleProjectOverview cdaToken={'tokenString123'} cpaToken={'tokenString789'} />);
};

describe('ExampleProjectOverview', () => {
  const courses = {
    items: [
      {
        fields: {
          slug: { 'en-US': 'hello-contentful' },
          title: { 'en-US': 'hello-contentful' },
        },
        sys: { id: '123' },
      },
    ],
  };
  const getEntries = jest.fn().mockResolvedValue(courses);

  spaceContextMocked.cma.getEntries = getEntries;
  spaceContextMocked.space.getId.mockReturnValue('spaceId123');

  TokenStore.getSpace.mockResolvedValue(mockSpace);

  isOwnerOrAdmin.mockReturnValue(true);

  it('should render without any errors', async () => {
    build();

    expect(screen.getByTestId('example-project-card')).toHaveTextContent(
      'Explore the example project, and education course catalog app'
    );
    expect(screen.queryByTestId('delete-space-section')).toBeInTheDocument();
  });

  it('should not render the delete button if the user is not an admin or owner', async () => {
    isOwnerOrAdmin.mockReturnValue(false);
    build();

    expect(screen.queryByTestId('delete-space-section')).not.toBeInTheDocument();

    // reset to expected value for testing
    isOwnerOrAdmin.mockReturnValue(true);
  });

  it('should display a loading-spinner while determining which entry to navigate to', async () => {
    // Setup the loading promises
    //
    // In the mocked implementation of `getEntries`, we want to be able to
    // control when it finishes procedurally. To do this, we set a promise's `resolve`
    // to something we can call at a later point. When testings and can then assert the
    // loading state, and then resolve the promise and assert the loaded state.
    let resolvePromise;
    const waitForTesting = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    getEntries.mockImplementation(async () => {
      await waitForTesting;

      return courses;
    });

    build();

    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();

    userEvent.click(screen.getByTestId('example-project-card.edit-an-entry-button'));

    expect(screen.queryByTestId('loading-spinner')).toBeInTheDocument();

    resolvePromise();

    await wait();
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });

  it('should find the entry to edit and navigate to that entry detail page', async () => {
    build();

    userEvent.click(screen.getByTestId('example-project-card.edit-an-entry-button'));
    expect(getEntries).toBeCalledWith({
      content_type: 'course',
    });

    await wait();

    expect(go).toBeCalledWith({
      path: ['spaces', 'detail', 'entries', 'detail'],
      params: {
        entryId: '123',
      },
    });
  });

  it('should navigate to entries list page if it cannot find the default entry to edit', async () => {
    getEntries.mockResolvedValue({ items: [] });

    build();

    userEvent.click(screen.getByTestId('example-project-card.edit-an-entry-button'));
    expect(getEntries).toBeCalledWith({
      content_type: 'course',
    });

    await wait();

    expect(go).toBeCalledWith({
      path: ['spaces', 'detail', 'entries', 'list'],
    });
  });

  it('should track when the user clicks the Edit Entry button', async () => {
    build();

    userEvent.click(screen.getByTestId('example-project-card.edit-an-entry-button'));

    await wait();

    expect(trackClickCTA).toBeCalledWith('create_an_entry_button');
  });

  it('should open the delete modal when clicking on the delete space CTA', async () => {
    build();

    userEvent.click(screen.getByTestId('delete-space-cta'));

    await wait();

    expect(openDeleteSpaceDialog).toBeCalledWith({
      space: mockSpace,
      onSuccess: expect.any(Function),
    });
  });

  it('should track the delete space CTA click event', async () => {
    build();

    userEvent.click(screen.getByTestId('delete-space-cta'));

    await wait();

    expect(trackClickCTA).toBeCalledWith('example_app:delete_space');
  });
});
