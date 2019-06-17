import React from 'react';
import 'jest-dom/extend-expect';
import { render, cleanup } from '@testing-library/react';
import createFetcherComponent, { FetcherLoading } from './createFetcherComponent';

describe('createFetcherComponent', () => {
  afterEach(cleanup);

  it('should create fetcher component and renders LoadingComponent', () => {
    const promiseStub = jest.fn().mockResolvedValue({});

    const Component = createFetcherComponent(({ param1, param2 }) => {
      return promiseStub(param1, param2);
    });

    render(
      <Component param1="1" param2="2">
        {({ isLoading }) => {
          if (isLoading) {
            return <FetcherLoading message="Loading test component..." />;
          }
          return null;
        }}
      </Component>
    );

    expect(promiseStub).toHaveBeenCalledWith('1', '2');
  });
});
