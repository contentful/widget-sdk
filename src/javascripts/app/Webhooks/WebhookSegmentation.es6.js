import React from 'react'
import PropTypes from 'prop-types';
import WebhookSegmentationTable from './WebhookSegmentationTable'
import { createMap } from './WebhookSegmentationState'

export default class WebhookSegmentation extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      selectAllEvents: true
    }
  }

  onChange(value) {
    this.setState({
      selectAllEvents: value
    })

    if (value) {
      this.props.onChange(createMap(true))
    }
  }

  render() {
    return (
      <div className="webhook-segmentation">
        {this.renderOption("All Events", true)}
        {this.renderOption("Only Selected Events", false)}
        { this.state.selectAllEvents ? null : <WebhookSegmentationTable values={this.props.values} onChange={this.props.onChange} /> }
      </div>
    )
  }

  renderOption(caption, value) {
    return (
      <div className="webhook-segmentation__option">
        <label>
          <input type="radio" checked={value === this.state.selectAllEvents ? "checked" : ""} onClick={() => this.onChange(value)} />
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
