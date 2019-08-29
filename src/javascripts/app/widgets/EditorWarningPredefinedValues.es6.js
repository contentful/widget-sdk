import React from 'react';
import { Paragraph } from '@contentful/forma-36-react-components';
import EditorWarning from './EditorWarning.es6';

export default function EditorWarningPredefinedValues(props) {
  return (
    <EditorWarning {...props}>
      <Paragraph>
        The widget failed to initialize. You can fix the problem by providing predefined values
        under the validations tab in the field settings.
      </Paragraph>
    </EditorWarning>
  );
}
