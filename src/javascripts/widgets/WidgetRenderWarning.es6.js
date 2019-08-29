import React from 'react';
import PropTypes from 'prop-types';
import { Paragraph } from '@contentful/forma-36-react-components';
import * as accessChecker from 'access_control/AccessChecker/index.es6';
import EditorWarning from 'app/widgets/EditorWarning.es6';

export default class WidgetRenderWarning extends React.Component {
  static propTypes = {
    message: PropTypes.string.isRequired
  };

  render() {
    const { message } = this.props;
    const canUpdateContentTypes = !accessChecker.shouldHide('update', 'contentType');

    return (
      <EditorWarning>
        {message === 'incompatible' && (
          <Paragraph>The selected widget cannot be used with this field.</Paragraph>
        )}
        {message === 'missing' && (
          <Paragraph>The selected widget does not exist anymore.</Paragraph>
        )}
        {canUpdateContentTypes && (
          <Paragraph>Please select a valid widget in the Content Model section.</Paragraph>
        )}
        {!canUpdateContentTypes && (
          <Paragraph>
            Please contact your Contenful administrator to update the settings in the Content Model
            section.
          </Paragraph>
        )}
      </EditorWarning>
    );
  }
}
