import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import AssetFileSizeValidation from './AssetFileSizeValidation';

import '@testing-library/jest-dom/extend-expect';

describe('AssetFileSizeValidation', () => {
  it('renders min and max values correctly with bytes units', () => {
    const props = {
      validation: {
        validator: () => {},
        value: {
          enabled: true,
          type: 'assetFileSize',
          name: 'name',
          helpText: 'helpText',
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
      },
      onChange: () => {},
      onBlur: () => {},
    };
    const { getByTestId } = render(<AssetFileSizeValidation {...props} />);
    expect(getByTestId('min-size-input').value).toBe('7');
    expect(getByTestId('max-size-input').value).toBe('10');
    expect(getByTestId('select-min-size-unit').value).toBe('1');
    expect(getByTestId('select-max-size-unit').value).toBe('1');
  });

  it('renders min and max values correctly with KB units', () => {
    const props = {
      validation: {
        validator: () => {},
        value: {
          enabled: true,
          type: 'assetFileSize',
          name: 'name',
          helpText: 'helpText',
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
      },
      onChange: () => {},
      onBlur: () => {},
    };
    const { getByTestId } = render(<AssetFileSizeValidation {...props} />);
    expect(getByTestId('min-size-input').value).toBe('7');
    expect(getByTestId('max-size-input').value).toBe('10');
    expect(getByTestId('select-min-size-unit').value).toBe('1024');
    expect(getByTestId('select-max-size-unit').value).toBe('1024');
  });
  it('renders min and max values correctly with MB units', () => {
    const props = {
      validation: {
        validator: () => {},
        value: {
          enabled: true,
          type: 'assetFileSize',
          name: 'name',
          helpText: 'helpText',
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
      },
      onChange: () => {},
      onBlur: () => {},
    };
    const { getByTestId } = render(<AssetFileSizeValidation {...props} />);
    expect(getByTestId('min-size-input').value).toBe('1');
    expect(getByTestId('max-size-input').value).toBe('3');
    expect(getByTestId('select-min-size-unit').value).toBe('1048576');
    expect(getByTestId('select-max-size-unit').value).toBe('1048576');
  });

  it('updates min value on change of unit', () => {
    const onChangeMock = jest.fn();
    const props = {
      validation: {
        validator: () => {},
        value: {
          enabled: true,
          type: 'assetFileSize',
          name: 'name',
          helpText: 'helpText',
          message: null,
          settings: {
            min: 1,
          },
          views: [
            { name: 'min-max', label: 'Between' },
            { name: 'min', label: 'At least' },
            { name: 'max', label: 'Not more than' },
          ],
          currentView: 'min',
        },
      },
      onChange: onChangeMock,
      onBlur: () => {},
    };
    const { getByTestId } = render(<AssetFileSizeValidation {...props} />);
    fireEvent.change(getByTestId('select-min-size-unit'), { target: { value: 1048576 } });
    expect(onChangeMock).toBeCalledWith('assetFileSize', {
      currentView: 'min',
      enabled: true,
      helpText: 'helpText',
      message: null,
      name: 'name',
      settings: { min: 1048576 },
      type: 'assetFileSize',
      views: [
        { label: 'Between', name: 'min-max' },
        { label: 'At least', name: 'min' },
        { label: 'Not more than', name: 'max' },
      ],
    });
  });
});
