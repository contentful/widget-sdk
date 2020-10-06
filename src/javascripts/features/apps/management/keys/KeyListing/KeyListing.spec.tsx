import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';

import { KeyListing } from './KeyListing';
import React from 'react';
import { Key } from './utils';
import * as ManagementApiClient from '../../ManagementApiClient';

let mockKeys: Key[] = [];

jest.mock('../../ManagementApiClient');
jest.mock('./utils', () => {
  return {
    fetchKeys: () => mockKeys,
    generateKey: jest.fn(),
  };
});

jest.mock('@contentful/forma-36-react-components/dist/alpha', () => {
  return {
    ModalLauncher: {
      open: jest.fn(),
    },
  };
});

jest.mock('detect-browser', () => ({
  detect: jest.fn().mockReturnValue({ name: 'not-ie' }),
}));
jest.mock('services/PubSubService', () => ({
  createPubSubClientForSpace: jest.fn().mockReturnValue({
    on: jest.fn(),
    off: jest.fn(),
  }),
}));

const mockDefinition = {
  sys: {
    id: 'definitionId',
    organization: {
      sys: {
        id: 'organizationId',
      },
    },
  },
};

const makeMockKey = (name: string = 'key'): Key => {
  return {
    createdAt: '',
    createdBy: '',
    fingerprint: `${name}-fp`,
    fingerprintLines: [`${name}-fp1`, `${name}-fp2`],
    lastUsedAt: '',
  };
};

describe('KeyListing', () => {
  beforeEach(() => {
    mockKeys = [];
  });
  it('disable ctas when limit is reached', async () => {
    mockKeys = [makeMockKey('1'), makeMockKey('2'), makeMockKey('3')];
    const wrapper = render(<KeyListing definition={mockDefinition} />);

    await waitForElementToBeRemoved(() => screen.getAllByTestId('cf-ui-skeleton-form'));

    const generateButton = await wrapper.findByTestId('app-generate-keys');
    const addButton = await wrapper.findByTestId('app-add-public-key');

    expect(generateButton.attributes.getNamedItem('disabled')).not.toBeUndefined();
    expect(addButton.attributes.getNamedItem('disabled')).not.toBeUndefined();
  });
  it('allows generating the key pair', async () => {
    const wrapper = render(<KeyListing definition={mockDefinition} />);

    await waitForElementToBeRemoved(() => screen.getAllByTestId('cf-ui-skeleton-form'));

    const generateButton = await wrapper.findByTestId('app-generate-keys');
    generateButton.click();
    expect(ManagementApiClient.generateKey).toHaveBeenCalled();
  });
  it('allows uploading the key', async () => {
    const wrapper = render(<KeyListing definition={mockDefinition} />);

    await waitForElementToBeRemoved(() => screen.getAllByTestId('cf-ui-skeleton-form'));

    const addButton = await wrapper.findByTestId('app-add-public-key');
    addButton.click();
    expect(ModalLauncher.open).toHaveBeenCalled();
  });
});
