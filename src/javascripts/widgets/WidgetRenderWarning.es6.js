import React from 'react';
import PropTypes from 'prop-types';
import Icon from 'ui/Components/Icon.es6';
import * as accessChecker from 'access_control/AccessChecker/index.es6';

export default class WidgetRenderWarning extends React.Component {
  static propTypes = {
    message: PropTypes.string.isRequired
  };

  render() {
    const { message } = this.props;
    const canUpdateContentTypes = !accessChecker.shouldHide('update', 'contentType');

    return (
      <div className="editor-control-warning">
        <Icon name="plug" />
        <div>
          {message === 'incompatible' && <p>The selected widget cannot be used with this field.</p>}
          {message === 'missing' && <p>The selected widget does not exist anymore.</p>}
          {canUpdateContentTypes && (
            <p>Please select a valid widget in the Content Model section.</p>
          )}
          {!canUpdateContentTypes && (
            <p>
              Please contact your Contenful administrator to update the settings in the Content
              Model section.
            </p>
          )}
        </div>
      </div>
    );
  }
}
