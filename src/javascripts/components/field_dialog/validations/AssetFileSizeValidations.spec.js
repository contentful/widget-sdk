import React from 'react';
import { render } from '@testing-library/react';
import AssetFileSizeValidation from './AssetFileSizeValidation';

import '@testing-library/jest-dom/extend-expect';

describe('AssetFileSizeValidation', () => {
  it('renders min and max values correctly with bytes units', () => {
    const props = {
      errorMessages: [],
      validation: {
        message: null,
        settings: {
          min: 7,
          max: 10,
        },
        views: [
          { name: 'min-max', label: 'Between' },
          { name: 'min', label: 'At least' },
          { name: 'max', label: 'Not more than' },
        ],
        currentView: 'min-max',
      },
      updateValidationSettingsValue: () => {},
      updateValidationCurrentView: () => {},
      updateValidationMessageValue: () => {},
    };
    const { getByTestId } = render(<AssetFileSizeValidation {...props} />);
    expect(getByTestId('min-size-input').value).toBe('7');
    expect(getByTestId('max-size-input').value).toBe('10');
    expect(getByTestId('select-min-size-unit').value).toBe('1');
    expect(getByTestId('select-max-size-unit').value).toBe('1');
  });
  it('renders min and max values correctly with KB units', () => {
    const props = {
      errorMessages: [],
      validation: {
        message: null,
        settings: {
          min: 7168,
          max: 10240,
        },
        views: [
          { name: 'min-max', label: 'Between' },
          { name: 'min', label: 'At least' },
          { name: 'max', label: 'Not more than' },
        ],
        currentView: 'min-max',
      },
      updateValidationSettingsValue: () => {},
      updateValidationCurrentView: () => {},
      updateValidationMessageValue: () => {},
    };
    const { getByTestId } = render(<AssetFileSizeValidation {...props} />);
    expect(getByTestId('min-size-input').value).toBe('7');
    expect(getByTestId('max-size-input').value).toBe('10');
    expect(getByTestId('select-min-size-unit').value).toBe('1024');
    expect(getByTestId('select-max-size-unit').value).toBe('1024');
  });
  it('renders min and max values correctly with MB units', () => {
    const props = {
      errorMessages: [],
      validation: {
        message: null,
        settings: {
          min: 1048576,
          max: 3145728,
        },
        views: [
          { name: 'min-max', label: 'Between' },
          { name: 'min', label: 'At least' },
          { name: 'max', label: 'Not more than' },
        ],
        currentView: 'min-max',
      },
      updateValidationSettingsValue: () => {},
      updateValidationCurrentView: () => {},
      updateValidationMessageValue: () => {},
    };
    const { getByTestId } = render(<AssetFileSizeValidation {...props} />);
    expect(getByTestId('min-size-input').value).toBe('1');
    expect(getByTestId('max-size-input').value).toBe('3');
    expect(getByTestId('select-min-size-unit').value).toBe('1048576');
    expect(getByTestId('select-max-size-unit').value).toBe('1048576');
  });
});
