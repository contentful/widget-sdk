import React from 'react';
import { Note, TextLink, Paragraph } from '@contentful/forma-36-react-components';
import * as accessChecker from 'access_control/AccessChecker';

interface WidgetRenderWarningProps {
  message: string;
  setRenderFallback: (val: boolean) => void;
}

export default function WidgetRenderWarning(props: WidgetRenderWarningProps) {
  const { message } = props;
  const canUpdateContentTypes = !accessChecker.shouldHide('update', 'contentType');

  let title = '';

  if (message === 'incompatible') {
    title = 'The selected widget cannot be used with this field.';
  } else if (message === 'missing') {
    title = 'The selected widget does not exist anymore.';
  } else if (message === 'internal_error') {
    title = 'App failed to load';
  }

  let noteBody = '';

  if (message === 'internal_error') {
    noteBody =
      'the app could not be loaded. Refresh this page to try again or use the default field editor to make immediate changes.';
  } else if (canUpdateContentTypes) {
    noteBody = 'Please select a valid widget in the Content Model section.';
  } else {
    noteBody =
      'Please contact your Contenful administrator to update the settings in the Content Model section.';
  }

  return (
    <Note noteType="warning" title={title}>
      <Paragraph data-test-id="widget-renderer-warning">{noteBody}</Paragraph>
      {message === 'internal_error' && (
        <TextLink onClick={() => props.setRenderFallback(true)}>
          Use default field editor this time
        </TextLink>
      )}
    </Note>
  );
}
