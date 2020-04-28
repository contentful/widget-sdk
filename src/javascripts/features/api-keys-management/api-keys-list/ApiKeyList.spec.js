import React from 'react';
import { render } from '@testing-library/react';

import { ApiKeyList } from './ApiKeyList';

const mockKeyData = [
  {
    name: 'My Api Key',
    description: 'This is some description',
    sys: {
      id: '51h8tYBHHbMmt9btNNC5kR',
    },
  },
];

describe('ApiKeyList', () => {
  it('should render real api key data when passed correct data', () => {
    const { getAllByTestId } = render(<ApiKeyList apiKeys={mockKeyData} />);
    const apiLinks = getAllByTestId('api-link');
    const firstLink = apiLinks[0];

    expect(apiLinks).toHaveLength(1);

    expect(firstLink.href).toEqual('http://localhost/^.detail?apiKeyId=51h8tYBHHbMmt9btNNC5kR');
    expect(firstLink).toHaveTextContent('My Api Key');
  });
});
