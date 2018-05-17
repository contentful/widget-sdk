import React from 'react'
import PropTypes from 'prop-types';
import {
  ACTIONS, ENTITY_TYPES, LABELS, changeAction, isActionChecked
} from './WebhookSegmentationState'

export default class WebhookSegmentationTable extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      values: this.props.values
    }
  }


  isChecked(type, action) {
    return isActionChecked(this.state.values, type, action)
  }

  // This method is passed to child elements. They provide a change object, e.g
  // {
  //   action: "save",
  //   type: "contentType",
  //   checked: true
  // }
  onChange(change) {
    console.log('change ->', change)

    // Get a copy of the values object
    const map = changeAction(this.state.values, change.type, change.action, change.checked)

    this.setState({
      values: map
    })

    this.props.onChange(map)
  }

  render() {
    return (
      <table className="webhook-segmentation__matrix">
        <thead>
          <th></th>
          {ACTIONS.map(action => this.renderActionLabel(action))}
        </thead>
        <tbody>
          {this.renderRows()}
          {this.renderFooter()}
        </tbody>
      </table>
    )
  }

  renderRows() {
    return ENTITY_TYPES.map(t => this.renderRow(t))
  }

  renderRow(entityType) {
    return (
      <tr>
        {['*'].concat(ACTIONS).map(action => <ActionCheckbox action={action}
                                                             type={entityType}
                                                             isChecked={this.isChecked(entityType, action)}
                                                             onChange={change => this.onChange(change)} />)}
      </tr>
    )
  }

  renderActionLabel(action) {
    return (
      <th onClick={() => this.onChange({ type: '*',  action, checked: !this.isChecked('*', action) })}>
        <label>{LABELS[action]}</label>
      </th>
    )
  }

  renderFooter() {
    return (
      <tr className="footer">
        <td></td>
        {ACTIONS.map(action => <ActionCheckbox type="*"
                                               action={action}
                                               isChecked={this.isChecked('*', action)}
                                               onChange={change => this.onChange(change)} />)}
      </tr>
    )
  }
}

class ActionCheckbox extends React.Component {
  shouldComponentUpdate(nextProps) {
    return this.props.isChecked !== nextProps.isChecked
      || this.props.action !== nextProps.action
      || this.props.type !== nextProps.type
  }

  onChange(event) {
    this.props.onChange({
      type: this.props.type,
      action: this.props.action,
      checked: event.target.checked
    })
  }

  toggle() {
    this.props.onChange({
      checked: !this.props.isChecked,
      type: this.props.type,
      action: this.props.action
    })
  }

  render() {
    return (
      <td onClick={() => this.toggle()} className={this.props.action === '*' ? 'entity-label' : 'action-cell'}>
        <input id={this.props.type} type="checkbox" checked={this.props.isChecked} onChange={e => this.onChange(e)} />
        {this.renderLabel()}
      </td>
    )
  }

  renderLabel() {
    if (this.props.action !== '*') return null

    return (
      <label for={this.props.type}>{LABELS[this.props.type]}</label>
    )
  }
}

ActionCheckbox.propTypes = {
  action: PropTypes.string,
  isChecked: PropTypes.bool,
  onChange: PropTypes.func,
  type: PropTypes.string,
}
