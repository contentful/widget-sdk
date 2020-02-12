import React from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import Loader from './Loader';

describe('components/ui/Loader', () => {
  afterEach(cleanup);

  it('render the component', () => {
    const { getByTestId } = render(<Loader isShown={true} />);
    const loader = getByTestId('loading-indicator');
    expect(loader).toHaveAttribute('aria-busy', 'true');
    expect(loader).toHaveAttribute('aria-label', 'loader-interstitial');
    expect(loader).toHaveAttribute('role', 'progressbar');
    const loaderMessage = getByTestId('loading-indicator-message');
    expect(loaderMessage.textContent).toBe('Please hold on...');
  });

  it('should not render anything if isShown=false', () => {
    const { getByTestId } = render(<Loader />);
    expect(() => {
      getByTestId('loading-indicator');
    }).toThrow('Unable to find an element by: [data-test-id="loading-indicator"]');
  });
});
