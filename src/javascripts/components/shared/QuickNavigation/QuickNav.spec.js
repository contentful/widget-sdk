import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import 'jest-dom/extend-expect';
import QuickNav from './QuickNav.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';

let wrapper;

beforeEach(() => {
  wrapper = render(<QuickNav />);
  ModalLauncher.open = jest.fn();
});

afterEach(() => {
  cleanup();
});

describe('shared/QuickNav.es6', () => {
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
