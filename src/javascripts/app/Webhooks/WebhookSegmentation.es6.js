import React from 'react';
import PropTypes from 'prop-types';
import WebhookSegmentationTable from './WebhookSegmentationTable';
import { createMap, areAllEventsChecked } from './WebhookSegmentationState';

export default class WebhookSegmentation extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      allEventsSelected: areAllEventsChecked(this.props.values)
    };
  }

  onSelectionTypeChange (allEventsSelected) {
    this.setState({
      allEventsSelected: allEventsSelected
    });

    if (allEventsSelected) {
      this.props.onChange(createMap(true));
    }
  }

  renderOption (caption, value) {
    return (
      <div className="webhook-segmentation__option">
        <label>
          <input type="radio" checked={value === this.state.allEventsSelected} onClick={() => this.onSelectionTypeChange(value)} />
          {caption}
        </label>
      </div>
    );
  }

  render () {
    return (
      <div className="webhook-segmentation">
        {this.renderOption('All Events', true)}
        {this.renderOption('Only Selected Events', false)}
        { this.state.allEventsSelected ? null : <WebhookSegmentationTable values={this.props.values} onChange={this.props.onChange} /> }
      </div>
    );
  }
}

WebhookSegmentation.propTypes = {
  onChange: PropTypes.func,
  values: PropTypes.object
};
