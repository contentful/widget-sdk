import { render, fireEvent, waitForElementToBeRemoved } from '@testing-library/react';
import { ModalLauncher } from '@contentful/forma-36-react-components';
import React from 'react';
import { SigningSecret } from './SigningSecret';
import { ManagementApiClient } from '../ManagementApiClient';

jest.mock('../ManagementApiClient', () => {
  return {
    ManagementApiClient: {
      addAppSigningSecret: jest.fn().mockResolvedValue({}),
      getAppSigningSecret: jest.fn(),
    },
  };
});

jest.mock('@contentful/forma-36-react-components', () => {
  const actual = jest.requireActual('@contentful/forma-36-react-components');
  return {
    ...actual,
    ModalLauncher: {
      open: jest.fn(),
    },
  };
});

const mockAppDefinition = {
  sys: {
    id: 'definitionId',
    organization: {
      sys: {
        type: 'Link',
        id: 'organizationId',
        linkType: 'Organization',
      },
    },
  },
};

describe('AppSigningSecret', () => {
  it('generates secret on clicking activate button', async () => {
    const { getByTestId } = render(<SigningSecret definition={mockAppDefinition} />);
    await waitForElementToBeRemoved(getByTestId('loading'));

    const activateBtn = getByTestId('activate-btn');

    fireEvent.click(activateBtn);
    await waitForElementToBeRemoved(getByTestId('activate-btn'));
    const textInput = getByTestId('secret-input');

    expect(ManagementApiClient.addAppSigningSecret).toHaveBeenCalled();
    expect((textInput as HTMLInputElement).value).toHaveLength(64);
  });

  it('renders existing truncated secret and opens modal on update', async () => {
    const truncatedSecret = 'test';
    (ManagementApiClient.getAppSigningSecret as jest.Mock).mockReturnValue(truncatedSecret);

    const { getByTestId } = render(<SigningSecret definition={mockAppDefinition} />);
    await waitForElementToBeRemoved(getByTestId('loading'));

    const textInput = getByTestId('secret-input');
    expect((textInput as HTMLInputElement).value).toEqual(truncatedSecret.padStart(16, '*'));

    fireEvent.click(getByTestId('update-secret-btn'));
    expect(ModalLauncher.open).toHaveBeenCalled();
  });
});
