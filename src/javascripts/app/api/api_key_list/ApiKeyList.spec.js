import React from 'react';
import { render, cleanup } from 'react-testing-library';
import 'jest-dom/extend-expect';

import ApiKeyList from './ApiKeyList.es6';

const mockKeyData = [
  {
    name: 'My Api Key',
    description: 'This is some description',
    sys: {
      id: '51h8tYBHHbMmt9btNNC5kR'
    }
  }
];

describe('ApiKeyList', () => {
  afterEach(cleanup);

  it('renders the placeholder view when no keys are passed', () => {
    const { getAllByTestId } = render(<ApiKeyList />);
    const children = getAllByTestId('api-link');
    expect(children[0]).toHaveTextContent('Website key');
    expect(children[1]).toHaveTextContent('iOS key');
    expect(children[2]).toHaveTextContent('Android key');

    expect(children).toHaveLength(3);
  });

  it('should render real api key data when passed correct data', () => {
    const { getAllByTestId } = render(<ApiKeyList apiKeys={mockKeyData} />);
    const apiLinks = getAllByTestId('api-link');
    const firstLink = apiLinks[0];

    expect(apiLinks).toHaveLength(1);

    expect(firstLink.href).toEqual('http://localhost/^.detail?apiKeyId=51h8tYBHHbMmt9btNNC5kR');
    expect(firstLink).toHaveTextContent('My Api KeyThis is some description');
  });
});
