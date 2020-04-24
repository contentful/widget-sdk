import React from 'react';
import PropTypes from 'prop-types';
import { ConnectedRichTextEditor } from '@contentful/field-editor-rich-text';
import { rtSdkDecorator } from './rtSdkDecorator';

export default class ReadOnlyRichTextEditor extends React.Component {
  static propTypes = {
    value: PropTypes.object.isRequired,
    sdk: PropTypes.object.isRequired,
  };

  render() {
    const { value, sdk } = this.props;
    const richTextSdk = rtSdkDecorator(sdk, null);
    return (
      <ConnectedRichTextEditor
        value={value}
        sdk={richTextSdk}
        isToolbarHidden
        actionsDisabled
        readOnly
        isDisabled
      />
    );
  }
}
