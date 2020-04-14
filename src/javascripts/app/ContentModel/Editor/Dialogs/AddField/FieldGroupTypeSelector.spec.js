import React from 'react';
import { render } from '@testing-library/react';
import { FieldGroupTypeSelector } from './FieldGroupTypeSelector';

const props = {
  fieldGroupName: 'text',
  selectNewFieldType: jest.fn(),
  fieldType: { name: 'Symbol' },
  setList: jest.fn(),
  isList: false,
};
const build = (localProps = {}) => {
  return render(<FieldGroupTypeSelector {...{ ...props, ...localProps }} />);
};

const testCases = [
  {
    fieldGroupName: 'text',
    expectation: (result) => expect(result.getByTestId('text_group_options')).toBeVisible(),
  },
  {
    fieldGroupName: 'number',
    expectation: (result) => expect(result.getByTestId('number_group_options')).toBeVisible(),
  },
  {
    fieldGroupName: 'media',
    expectation: (result) => expect(result.getByTestId('media_group_options')).toBeVisible(),
  },
  {
    fieldGroupName: 'reference',
    expectation: (result) => expect(result.getByTestId('reference_group_options')).toBeVisible(),
  },
  {
    fieldGroupName: 'richtext',
    expectation: (result) => expect(result.container.querySelector('*')).toBeNull(),
  },
];

describe('FieldGroupTypeSelector', () => {
  testCases.map(({ fieldGroupName, expectation }) => {
    it(`renders the ${fieldGroupName} configuration`, () => {
      const result = build({ fieldGroupName });
      expectation(result);
    });
  });
});
