/* eslint-disable react/prop-types */
import React from 'react';
import { RichTextEditor } from '@contentful/field-editor-rich-text';
import richTextWidgetApiDecorator from './widgetApiDecorator';
import withTracking from './withTracking';

const RichTextEditorWithTracking = withTracking(RichTextEditor);

/**
 * Renders the RichTextEditor in the context of the web-app set-up with all dependencies.
 *
 * @param {Object} widgetApi
 * @param {Object} loadEvents
 * @returns {React.Element}
 */
export default function renderRichTextEditor({ widgetApi, loadEvents }) {
  // RichTextEditor relies on some non-default widgetApi APIs that are not (yet) open sourced in
  // the ui-extensions-sdk.
  const richTextWidgetAPI = richTextWidgetApiDecorator(widgetApi);
  return (
    <RichTextEditorWithTracking
      sdk={richTextWidgetAPI}
      parameters={widgetApi.parameters}
      loadEvents={loadEvents} // specific to withTracking
    />
  );
}
