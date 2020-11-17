import { render, fireEvent, waitForElementToBeRemoved, waitFor } from '@testing-library/react';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';
import React from 'react';
import { SigningSecret } from './SigningSecret';
import { ManagementApiClient } from '../ManagementApiClient';
import { getAppDefinitionLoader } from 'features/apps-core';

jest.mock('../ManagementApiClient', () => {
  return {
    ManagementApiClient: {
      addAppSigningSecret: jest.fn(),
    },
  };
});

jest.mock('@contentful/forma-36-react-components/dist/alpha', () => {
  return {
    ModalLauncher: {
      open: jest.fn(),
    },
  };
});
jest.mock('features/apps-core', () => {
  return {
    getAppDefinitionLoader: jest.fn().mockReturnValue({
      getAppSigningSecret: jest.fn(),
    }),
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
    const textInput = getByTestId('secret-input');

    expect(ManagementApiClient.addAppSigningSecret).toHaveBeenCalled();
    expect((textInput as HTMLInputElement).value.length).toEqual(64);
  });

  it('renders existing truncated secret and opens modal on update', async () => {
    const truncatedSecret = 'test';
    getAppDefinitionLoader().getAppSigningSecret.mockReturnValue(truncatedSecret);

    const { getByTestId } = render(<SigningSecret definition={mockAppDefinition} />);
    await waitForElementToBeRemoved(getByTestId('loading'));

    const textInput = getByTestId('secret-input');
    expect((textInput as HTMLInputElement).value).toEqual(truncatedSecret.padStart(16, '*'));

    fireEvent.click(getByTestId('update-secret-btn'));
    expect(ModalLauncher.open).toHaveBeenCalled();
  });
});
