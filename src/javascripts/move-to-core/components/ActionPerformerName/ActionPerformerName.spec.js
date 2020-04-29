import React from 'react';
import { getModule } from 'core/NgRegistry';
import { render } from '@testing-library/react';
import { ActionPerformerName } from './ActionPerformerName';
import { mockUser } from './__mocks__/mockUser';

jest.mock('core/NgRegistry', () => ({ getModule: jest.fn() }));

getModule.mockReturnValue({
  users: {
    get: () => Promise.resolve(mockUser),
  },
  user: mockUser,
});

describe('ActionPerformerName', () => {
  const link = {
    sys: {
      type: 'Link',
      linkType: 'User',
      id: mockUser.sys.id,
    },
  };

  it('should render the loading component initially', async () => {
    const { container } = render(<ActionPerformerName link={link} />);
    expect(container).toMatchSnapshot();
  });

  it('should render the basic variant with required props after loading', async () => {
    const { findByText } = render(<ActionPerformerName link={link} />);
    expect(await findByText('Me')).toMatchSnapshot();
  });

  it('should render a formatted variant of the name', async () => {
    const { findByText } = render(
      <ActionPerformerName
        link={link}
        formatName={(name) => `Published by ${name.toLowerCase()}`}
      />
    );
    expect(await findByText('Published by me')).toMatchSnapshot();
  });
});
