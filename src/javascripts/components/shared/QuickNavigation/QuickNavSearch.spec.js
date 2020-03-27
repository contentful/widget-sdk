import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import QuickNavSearch from './QuickNavSearch';
import spaceContext from 'ng/spaceContext';

jest.mock('services/localeStore', () => ({
  getDefaultLocale: () => ({
    code: 'en-US',
  }),
  toInternalCode: () => 'en-US',
}));

jest.mock('browserStorage', () => ({
  getStore: jest.fn(),
}));

jest.mock('states/Navigator', () => ({
  href: jest.fn(),
  getCurrentStateName: jest.fn(),
}));

jest.mock('app/entity_editor/entityHelpers', () => ({
  newForLocale: () => ({ entityTitle: () => 'title' }),
}));

jest.mock(
  'ng/spaceContext',
  () => ({
    cma: {
      getEntries: jest.fn().mockReturnValue(Promise.resolve({ items: [] })),
      getAssets: jest.fn().mockReturnValue(Promise.resolve({ items: [] })),
    },
    publishedCTs: {
      getAllBare: jest.fn().mockReturnValue([]),
    },
  }),
  { virtual: true }
);

jest.mock('access_control/AccessChecker', () => ({
  getSectionVisibility: jest.fn().mockReturnValue({ entry: true, asset: true, contentType: true }),
}));

let wrapper;

beforeEach(() => {
  jest.useFakeTimers();
  spaceContext.cma.getEntries.mockClear();
  spaceContext.cma.getAssets.mockClear();
  spaceContext.publishedCTs.getAllBare.mockClear();
  wrapper = render(<QuickNavSearch />);
});

describe('shared/QuickNavSearch', () => {
  it('should send request if query length is more than one character', () => {
    fireEvent.change(wrapper.getByTestId('quick-nav-search-input'), {
      target: { value: 'abc' },
    });

    jest.runOnlyPendingTimers();
    expect(spaceContext.cma.getEntries).toHaveBeenCalledTimes(1);
    expect(spaceContext.cma.getAssets).toHaveBeenCalledTimes(1);
    expect(spaceContext.publishedCTs.getAllBare).toHaveBeenCalledTimes(1);
  });

  it('should not send request if query length is less than one character', () => {
    fireEvent.change(wrapper.getByTestId('quick-nav-search-input'), {
      target: { value: 'a' },
    });

    jest.runOnlyPendingTimers();
    expect(spaceContext.cma.getEntries).toHaveBeenCalledTimes(0);
    expect(spaceContext.cma.getAssets).toHaveBeenCalledTimes(0);
    expect(spaceContext.publishedCTs.getAllBare).toHaveBeenCalledTimes(0);
  });
});
