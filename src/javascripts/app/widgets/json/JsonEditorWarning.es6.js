import React from 'react';
import EditorWarning from '../EditorWarning.es6';
import { Paragraph } from '@contentful/forma-36-react-components';

export default function JsonEditorWarning() {
  return (
    <EditorWarning>
      <Paragraph>The widget failed to initialize.</Paragraph>
    </EditorWarning>
  );
}
