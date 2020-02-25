import React from 'react';
import PropTypes from 'prop-types';
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext';
import { ConnectedRichTextEditor } from '@contentful/field-editor-rich-text';
import richTextWidgetApiDecorator from './widgetApiDecorator';
import customRenderers from './customRenderers';

export default class ReadOnlyRichTextEditor extends React.Component {
  static propTypes = {
    value: PropTypes.object.isRequired,
    widgetApi: PropTypes.object.isRequired
  };

  render() {
    const { value, widgetApi } = this.props;
    const richTextWidgetAPI = richTextWidgetApiDecorator(widgetApi);
    return (
      <WidgetAPIContext.Provider value={{ widgetAPI: richTextWidgetAPI }}>
        <ConnectedRichTextEditor
          value={value}
          widgetAPI={richTextWidgetAPI}
          customRenderers={customRenderers}
          isToolbarHidden
          actionsDisabled
          readOnly
          isDisabled
        />
      </WidgetAPIContext.Provider>
    );
  }
}
