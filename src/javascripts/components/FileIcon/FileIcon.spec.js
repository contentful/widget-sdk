import React from 'react';
import { shallow } from 'enzyme';
import '@testing-library/jest-dom/extend-expect';
import FileIcon from './FileIcon';

describe('FileIcon', () => {
  it('renders the expected Illustration for images', () => {
    const output = shallow(
      <FileIcon
        file={{
          contentType: 'image/png'
        }}
      />
    );

    expect(output).toMatchInlineSnapshot(`
      <Illustration
        illustration="Image"
        testId="cf-ui-illustration"
      />
    `);
  });

  it('renders an Archive for unknown contentTypes', () => {
    const output = shallow(
      <FileIcon
        file={{
          contentType: 'application/unknown'
        }}
      />
    );

    expect(output).toMatchInlineSnapshot(`
      <Illustration
        illustration="Archive"
        testId="cf-ui-illustration"
      />
    `);
  });

  it('renders an Archive for an undefined file', () => {
    const output = shallow(<FileIcon />);

    expect(output).toMatchInlineSnapshot(`
      <Illustration
        illustration="Archive"
        testId="cf-ui-illustration"
      />
    `);
  });
});
