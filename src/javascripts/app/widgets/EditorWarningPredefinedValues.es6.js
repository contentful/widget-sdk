import React from 'react';
import { Note } from '@contentful/forma-36-react-components';

export default function EditorWarningPredefinedValues(props) {
  return (
    <Note noteType="warning" {...props}>
      The widget failed to initialize. You can fix the problem by providing predefined values under
      the validations tab in the field settings.
    </Note>
  );
}
