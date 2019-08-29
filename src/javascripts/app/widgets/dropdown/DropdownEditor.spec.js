import React from 'react';
import { createFakeFieldAPI } from '@contentful/field-editor-shared';
import DropdownEditor from './DropdownEditor.es6';
import { render, cleanup, fireEvent } from '@testing-library/react';
import 'jest-dom/extend-expect';

jest.mock('lodash-es/throttle', () => ({
  default: _ => _
}));

jest.mock('lodash/throttle', () => ({
  default: _ => _
}));

describe('widgets/DropdownEditor', () => {
  afterEach(cleanup);

  it('renders a warning if no options are present', () => {
    const field = createFakeFieldAPI(mock => {
      return {
        ...mock,
        validations: []
      };
    });

    const { getByTestId, queryByTestId } = render(
      <DropdownEditor field={field} initialDisabled={false} />
    );

    expect(getByTestId('predefined-values-warning')).toBeInTheDocument();
    expect(queryByTestId('dropdown-editor')).not.toBeInTheDocument();
  });

  it('renders option tags for predefined values', () => {
    const predefined = ['banana', 'orange', 'strawberry'];
    const field = createFakeFieldAPI(mock => {
      return {
        ...mock,
        validations: [{ in: predefined }]
      };
    });
    const { container, getByText } = render(
      <DropdownEditor field={field} initialDisabled={false} />
    );

    expect(container.querySelectorAll('option')).toHaveLength(4);
    expect(getByText('Choose a value')).toHaveValue('');
    predefined.forEach(item => {
      expect(getByText(item)).toHaveValue(item);
    });
  });

  it('calls setValue if user select on default option', () => {
    const field = createFakeFieldAPI(field => {
      jest.spyOn(field, 'setValue');
      jest.spyOn(field, 'removeValue');
      return {
        ...field,
        validations: [{ in: ['initial'] }]
      };
    });
    const { getByTestId } = render(<DropdownEditor field={field} initialDisabled={false} />);
    const changeDropdownValue = value =>
      fireEvent.change(getByTestId('dropdown-editor'), { target: { value } });

    expect(getByTestId('dropdown-editor')).toHaveValue('');
    changeDropdownValue('initial');
    expect(field.setValue).toHaveBeenCalledWith('initial');
    expect(field.setValue).toHaveBeenCalledTimes(1);
  });

  it('calls removeValue if user selects default option', () => {
    const field = createFakeFieldAPI(field => {
      jest.spyOn(field, 'removeValue');
      return {
        ...field,
        getValue: () => 'initial',
        validations: [{ in: ['initial'] }]
      };
    });
    const { getByTestId } = render(<DropdownEditor field={field} initialDisabled={false} />);
    const changeDropdownValue = value =>
      fireEvent.change(getByTestId('dropdown-editor'), { target: { value } });
    expect(getByTestId('dropdown-editor')).toHaveValue('initial');
    changeDropdownValue('');
    expect(field.removeValue).toHaveBeenCalledTimes(1);
  });

  it('calls #setValue with number for Number fields', function() {
    const predefined = [1, '2.71', 3];
    const field = createFakeFieldAPI(field => {
      jest.spyOn(field, 'setValue');
      jest.spyOn(field, 'removeValue');
      return {
        ...field,
        type: 'Number',
        validations: [{ in: predefined }]
      };
    });

    const { getByTestId } = render(<DropdownEditor field={field} initialDisabled={false} />);
    const changeDropdownValue = value =>
      fireEvent.change(getByTestId('dropdown-editor'), { target: { value } });

    expect(getByTestId('dropdown-editor')).toHaveValue('');
    changeDropdownValue('2.71');
    expect(field.setValue).toHaveBeenCalledWith(2.71);
    expect(field.setValue).toHaveBeenCalledTimes(1);
  });

  it('calls #setValue with number for Integer fields', function() {
    const predefined = [1, '2', 3];
    const field = createFakeFieldAPI(field => {
      jest.spyOn(field, 'setValue');
      jest.spyOn(field, 'removeValue');
      return {
        ...field,
        type: 'Number',
        validations: [{ in: predefined }]
      };
    });

    const { getByTestId } = render(<DropdownEditor field={field} initialDisabled={false} />);
    const changeDropdownValue = value =>
      fireEvent.change(getByTestId('dropdown-editor'), { target: { value } });

    expect(getByTestId('dropdown-editor')).toHaveValue('');
    changeDropdownValue('1');
    expect(field.setValue).toHaveBeenCalledWith(1);
    expect(field.setValue).toHaveBeenCalledTimes(1);
  });
});
