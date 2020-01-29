import React from 'react';
import { shallow } from 'enzyme';
import 'jest-enzyme';

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

  it('passes down className', () => {
    const output = shallow(
      <FileIcon
        file={{
          contentType: 'image/png'
        }}
        className="my-example-class"
      />
    );

    expect(output).toMatchInlineSnapshot(`
      <Illustration
        className="my-example-class"
        illustration="Image"
        testId="cf-ui-illustration"
      />
    `);
  });
});
