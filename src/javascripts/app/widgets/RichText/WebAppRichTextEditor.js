/* eslint-disable react/prop-types */
import React from 'react';
import { RichTextEditor } from '@contentful/field-editor-rich-text';
import { rtSdkDecorator } from './rtSdkDecorator';
import withTracking from './withTracking';

const RichTextEditorWithTracking = withTracking(RichTextEditor);

/**
 * Renders the RichTextEditor in the context of the web-app set-up with all dependencies.
 *
 * @param {Object} sdk
 * @param {Object} loadEvents
 * @returns {React.Element}
 */
export default function renderRichTextEditor({ sdk, loadEvents }) {
  // RichTextEditor relies on some non-default widgetApi APIs that are not (yet) open sourced in
  // the ui-extensions-sdk.
  const richTextSdk = rtSdkDecorator(sdk);
  return (
    <RichTextEditorWithTracking
      sdk={richTextSdk}
      loadEvents={loadEvents} // specific to withTracking
    />
  );
}
