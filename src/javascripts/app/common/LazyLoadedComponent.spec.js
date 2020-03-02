import React from 'react';
import { render, wait } from '@testing-library/react';
import StateRedirect from 'app/common/StateRedirect';

import LazyLoadedComponent from './LazyLoadedComponent';

jest.mock('app/common/StateRedirect', () => jest.fn().mockReturnValue(null));

describe('LazyLoadedComponent', () => {
  const build = custom => {
    const props = Object.assign(
      {
        onReady: jest.fn(),
        importer: jest.fn().mockResolvedValue(() => null)
      },
      custom
    );

    return render(
      <LazyLoadedComponent {...props}>{Component => <Component />}</LazyLoadedComponent>
    );
  };
  it('should immediately call onReady', () => {
    const onReady = jest.fn();

    build({ onReady });

    expect(onReady).toBeCalledTimes(1);
  });

  it('should call the importer immediately', () => {
    const importer = jest.fn().mockResolvedValue(() => null);

    build({ importer });

    expect(importer).toBeCalledTimes(1);
  });

  it('should redirect if the importer throws', async () => {
    const importer = jest.fn().mockRejectedValue(new Error('Not found'));

    build({ importer });

    expect(StateRedirect).toBeCalledTimes(0);

    await wait();

    expect(StateRedirect).toBeCalledTimes(1);
  });

  it('should render the component returned by importer', async () => {
    const importer = jest.fn().mockResolvedValue(() => <div data-test-id="lazy-component"></div>);

    const { queryByTestId } = build({ importer });

    await wait();

    expect(queryByTestId('lazy-component')).toBeVisible();
  });
});
