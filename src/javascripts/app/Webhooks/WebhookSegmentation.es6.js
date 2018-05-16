import React from 'react'
import PropTypes from 'prop-types';
import WebhookSegmentationTable from './WebhookSegmentationTable'

export default class WebhookSegmentation extends React.Component {
  render() {
    return (
      <div className="webhook-segmentation">
        {this.renderOption("All Events")}
        {this.renderOption("Only Selected Events")}
        <WebhookSegmentationTable values={this.props.values} onChange={this.props.onChange} />
      </div>
    )
  }

  renderOption(caption) {
    return (
      <div className="webhook-segmentation__option">
        <label>
          <input type="radio" onChange={() => this.props.onChange()} />
          {caption}
        </label>
      </div>
    )
  }
}

WebhookSegmentation.propTypes = {
  onChange: PropTypes.func,
  values: PropTypes.object,
}
