/* eslint-disable react/prop-types */
import React from 'react';
import { RichTextEditor } from '@contentful/field-editor-rich-text';
import richTextWidgetApiDecorator from './widgetApiDecorator';
import customRenderers from './customRenderers';
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext';
import withTracking from 'app/widgets/rich_text/withTracking';

const RichTextEditorWithTracking = withTracking(RichTextEditor);

/**
 * Renders the RichTextEditor in the context of the web-app set-up with all dependencies.
 *
 * @param {Object} widgetApi
 * @param {Object} loadEvents
 * @returns {React.Element}
 */
export function renderRichTextEditor({ widgetApi, loadEvents }) {
  // RichTextEditor relies on some non-default widgetApi APIs that are not (yet) open sourced in
  // the ui-extensions-sdk.
  const richTextWidgetAPI = richTextWidgetApiDecorator(widgetApi);
  return (
    // TODO: Avoid using `WidgetAPIContext`, currently only necessary for rendering
    //  entity cards.
    <WidgetAPIContext.Provider value={{ widgetAPI: richTextWidgetAPI }}>
      <RichTextEditorWithTracking
        widgetAPI={richTextWidgetAPI}
        parameters={widgetApi.parameters}
        customRenderers={customRenderers}
        loadEvents={loadEvents} // specific to withTracking
      />
    </WidgetAPIContext.Provider>
  );
}
