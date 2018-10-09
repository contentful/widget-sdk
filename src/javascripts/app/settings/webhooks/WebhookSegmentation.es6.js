import React from 'react';
import PropTypes from 'prop-types';
import WebhookSegmentationTable from './WebhookSegmentationTable.es6';
import { WILDCARD, createMap } from './WebhookSegmentationState.es6';

export default class WebhookSegmentation extends React.Component {
  static propTypes = {
    values: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
  };

  renderOption(caption, checked, onChange) {
    return (
      <div className="webhook-editor__settings-option">
        <label>
          <input type="radio" checked={checked} onChange={onChange} />
          {` ${caption}`}
        </label>
      </div>
    );
  }

  render() {
    const { values, onChange } = this.props;
    const isWildcarded = values === WILDCARD;

    return (
      <div className="cfnext-form__field" id="webhook-segmentation">
        <p>Specify for what kind of events this webhook should be triggered.</p>
        {this.renderOption('Trigger for all events', isWildcarded, () => onChange(WILDCARD))}
        {this.renderOption('Select specific triggering events', !isWildcarded, () =>
          onChange(createMap(false))
        )}
        {!isWildcarded && <WebhookSegmentationTable values={values} onChange={onChange} />}
      </div>
    );
  }
}
