import React from 'react';
import { TextLink } from '@contentful/forma-36-react-components';

export default function ExternalTextLink(props) {
  return <TextLink target="_blank" rel="noopener noreferrer" {...props} />;
}
