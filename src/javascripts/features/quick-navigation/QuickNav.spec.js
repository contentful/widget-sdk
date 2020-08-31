import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import { QuickNavigation } from './QuickNav';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';

let wrapper;

beforeEach(() => {
  wrapper = render(<QuickNavigation />);
  jest.spyOn(ModalLauncher, 'open').mockImplementation(() => Promise.resolve(true));
});

describe('shared/QuickNav', () => {
  it('renders the CTA', () => {
    expect(wrapper.getByTestId('quick-nav-search-button')).toBeVisible();
  });

  it('opens modal on CTA click', () => {
    fireEvent.click(wrapper.getByTestId('quick-nav-search-button'));
    expect(ModalLauncher.open).toHaveBeenCalled();
  });

  it('opens modal on keyboard shortcut', () => {
    fireEvent.keyDown(document.body, { key: 'q', code: 81, keyCode: 81 });
    expect(ModalLauncher.open).toHaveBeenCalled();
  });
});
