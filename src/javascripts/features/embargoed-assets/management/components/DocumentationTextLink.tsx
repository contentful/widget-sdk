import { TextLink } from '@contentful/forma-36-react-components';
import React from 'react';

export function DocumentationTextLink() {
  return (
    <TextLink
      testId="doc-link"
      href="https://www.contentful.com/developers/docs/tutorials/general/embargoed-assets-getting-started/"
      target="_blank"
      rel="noopener noreferrer">
      Read the documentation
    </TextLink>
  );
}
