import React from 'react';
import { getModule } from 'core/NgRegistry';
import { render } from '@testing-library/react';
import { ActionPerformer } from './ActionPerformer';
import { mockUser } from './__mocks__/mockUser';

jest.mock('core/NgRegistry', () => ({ getModule: jest.fn() }));

getModule.mockReturnValue({
  users: {
    get: () => Promise.resolve(mockUser),
  },
  user: mockUser,
});

describe('ActionPerformer', () => {
  const link = {
    sys: {
      type: 'Link',
      linkType: 'User',
      id: mockUser.sys.id,
    },
  };

  it('should render the loading component initially', async () => {
    const { container } = render(
      <ActionPerformer link={link}>
        {({ formattedName }) => <span data-test-id="basic-variant">{formattedName}</span>}
      </ActionPerformer>
    );
    expect(container).toMatchSnapshot();
  });

  it('should render the basic variant with required props after loading', async () => {
    const { findByTestId } = render(
      <ActionPerformer link={link}>
        {({ formattedName }) => <span data-test-id="basic-variant">{formattedName}</span>}
      </ActionPerformer>
    );
    expect(await findByTestId('basic-variant')).toMatchSnapshot();
  });

  it('should format the name when a formatName method is provided', async () => {
    const { findByTestId } = render(
      <ActionPerformer link={link} formatName={(name) => `Published by ${name.toLowerCase()}`}>
        {({ formattedName }) => <span data-test-id="basic-variant">{formattedName}</span>}
      </ActionPerformer>
    );
    expect(await findByTestId('basic-variant')).toMatchSnapshot();
  });
});
