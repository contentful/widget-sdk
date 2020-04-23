import React from 'react';
import PropTypes from 'prop-types';
import { ConnectedRichTextEditor } from '@contentful/field-editor-rich-text';
import richTextWidgetApiDecorator from './widgetApiDecorator';

export default class ReadOnlyRichTextEditor extends React.Component {
  static propTypes = {
    value: PropTypes.object.isRequired,
    widgetApi: PropTypes.object.isRequired,
  };

  render() {
    const { value, widgetApi } = this.props;
    const richTextWidgetAPI = richTextWidgetApiDecorator(widgetApi, null);
    return (
      <ConnectedRichTextEditor
        value={value}
        sdk={richTextWidgetAPI}
        isToolbarHidden
        actionsDisabled
        readOnly
        isDisabled
      />
    );
  }
}
