import React from 'react';
import { render } from '@testing-library/react';
import { AssetDimmensionsValidation } from './AssetDimmensionsValidation';

const getValidation = ({ settings, enabled }) => ({
  value: { name: 'name', helpText: 'helpText', type: 'type', message: '', settings, enabled },
  validator: jest.fn(),
});

describe('Asset Dimmensions Validation Field', () => {
  it('renders unchecked validation', () => {
    const { getByLabelText } = render(
      <AssetDimmensionsValidation
        validation={getValidation({ settings: undefined, enabled: false })}
        onChange={jest.fn()}
        onBlur={jest.fn()}
      />
    );
    expect(getByLabelText('name')).not.toBeChecked();
  });
  it('renders checked validation with min and max value', () => {
    const { getByLabelText, getByTestId } = render(
      <AssetDimmensionsValidation
        validation={getValidation({
          settings: { width: { min: 100, max: 1000 }, height: { min: 100, max: 1000 } },
          enabled: true,
        })}
        onChange={jest.fn()}
        onBlur={jest.fn()}
      />
    );
    expect(getByLabelText('name')).toBeChecked();
    expect(getByLabelText('Width')).toBeChecked();
    expect(getByLabelText('Height')).toBeChecked();
    expect(getByTestId('height-min-px-input').value).toMatch('100');
    expect(getByTestId('height-max-px-input').value).toMatch('1000');
    expect(getByTestId('width-min-px-input').value).toMatch('100');
    expect(getByTestId('width-max-px-input').value).toMatch('1000');
  });
  it('renders checked validation with only width value', () => {
    const { getByLabelText, getByTestId } = render(
      <AssetDimmensionsValidation
        validation={getValidation({
          settings: { width: { max: 1000 } },
          enabled: true,
        })}
        onChange={jest.fn()}
        onBlur={jest.fn()}
      />
    );
    expect(getByLabelText('name')).toBeChecked();
    expect(getByLabelText('Width')).toBeChecked();
    expect(getByLabelText('Height')).not.toBeChecked();
    expect(getByTestId('width-max-px-input').value).toMatch('1000');
    expect(getByTestId('height-min-px-input').disabled).toBe(true);
  });
  it('renders checked validation with only height value', () => {
    const { getByLabelText, getByTestId } = render(
      <AssetDimmensionsValidation
        validation={getValidation({
          settings: { height: { min: 100 } },
          enabled: true,
        })}
        onChange={jest.fn()}
        onBlur={jest.fn()}
      />
    );
    expect(getByLabelText('name')).toBeChecked();
    expect(getByLabelText('Width')).not.toBeChecked();
    expect(getByLabelText('Height')).toBeChecked();
    expect(getByTestId('height-min-px-input').value).toMatch('100');
    expect(getByTestId('width-min-px-input').disabled).toBe(true);
  });
});
