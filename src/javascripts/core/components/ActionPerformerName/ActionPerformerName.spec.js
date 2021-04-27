import React from 'react';
import { render, within } from '@testing-library/react';
import { ActionPerformerName } from './ActionPerformerName';
import { mockUser } from './__mocks__/mockUser';
import { mockApp } from './__mocks__/mockApp';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import * as spaceContext from 'classes/spaceContext';

jest.mock('core/NgRegistry', () => ({ getModule: jest.fn() }));
jest.mock('widgets/CustomWidgetLoaderInstance', () => ({ getCustomWidgetLoader: jest.fn() }));

jest.spyOn(spaceContext, 'getSpaceContext').mockImplementation(() => ({
  users: {
    get: () => Promise.resolve(mockUser),
  },
  user: mockUser,
}));

getCustomWidgetLoader.mockReturnValue(
  Promise.resolve({
    getOne: () => Promise.resolve(mockApp),
  })
);

describe('ActionPerformerName', () => {
  const link = {
    sys: {
      type: 'Link',
      linkType: 'User',
      id: mockUser.sys.id,
    },
  };
  const appLink = {
    sys: {
      type: 'Link',
      linkType: 'AppDefinition',
      id: mockApp.id,
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

  it('should try to render a user when there is an invalid linkType', async () => {
    const brokenLink = {
      sys: {
        type: 'Link',
        id: mockUser.sys.id,
      },
    };

    const { findByText } = render(
      <ActionPerformerName
        link={brokenLink}
        formatName={(name) => `Published by ${name.toLowerCase()}`}
      />
    );
    expect(await findByText('Published by me')).toMatchSnapshot();
  });

  it('should render an empty string as a name when a format function is provided', async () => {
    const brokenLink = {
      sys: {},
    };

    jest.spyOn(spaceContext, 'getSpaceContext').mockImplementation(() => ({
      users: {
        get: () => Promise.resolve(null),
      },
      user: mockUser,
    }));

    const { findByTestId } = render(
      <ActionPerformerName
        link={brokenLink}
        formatName={(name) => `Published by ${name.toLowerCase()}`}
      />
    );
    expect(await findByTestId('action-performer-name')).toMatchSnapshot();
  });

  it('should render an empty string when there is a broken sys', async () => {
    const brokenLink = {
      sys: {},
    };

    jest.spyOn(spaceContext, 'getSpaceContext').mockImplementation(() => ({
      users: {
        get: () => Promise.resolve(null),
      },
      user: mockUser,
    }));

    const { findByTestId } = render(<ActionPerformerName link={brokenLink} />);
    expect(await findByTestId('action-performer-name')).toMatchSnapshot();
  });

  it('should render the app name', async () => {
    const { findByTestId } = render(<ActionPerformerName link={appLink} />);
    const container = await findByTestId('action-performer-name');
    expect(container).toHaveAttribute('title', 'App Name');
    expect(within(container).getByText('App Name')).toBeInTheDocument();
  });

  it('should render the formatted app name', async () => {
    const { findByTestId } = render(
      <ActionPerformerName link={appLink} formatName={(name) => name.toLowerCase()} />
    );
    const container = await findByTestId('action-performer-name');
    expect(container).toHaveAttribute('title', 'app name');
    expect(within(container).getByText('app name')).toBeInTheDocument();
  });
});
