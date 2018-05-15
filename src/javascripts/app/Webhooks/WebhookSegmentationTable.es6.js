import React from "react"
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

  // This method is passed to child elements. They provide a change object, e.g
  // {
  //   action: "save",
  //   type: "contentType",
  //   checked: true
  // }
  onChange(change) {
    // Get a copy of the values object
    const map = changeAction(this.state.values, change.type, change.action, change.checked)

    this.setState({
      values: map
    })

    this.props.onChange && this.props.onChange(map)
  }

  isChecked(type, action) {
    return isActionChecked(this.state.values, type, action)
  }

  render() {
    return (
      <table className="webhook-segmentation__matrix">
        <thead>
          <th></th>
          {ACTIONS.map(action => this.renderActionLabel(action))}
        </thead>
        <tbody>
          {ENTITY_TYPES.map(entityType => <EntityTypeRow type={entityType} onChange={change => this.onChange(change)} isChecked={(type, action) => this.isChecked(type, action)} />)}
        </tbody>
      </table>
    )
  }

  renderActionLabel(action) {
    return (
      <th onClick={() => this.onChange({ type: '*',  action, checked: !this.isChecked('*', action) })}>
        {LABELS[action]}
      </th>
    )
  }

}

class EntityTypeRow extends React.Component {
  onChange(event) {
    this.props.onChange({
      type: this.props.type,
      action: '*',
      checked: event.target.checked
    })
  }

  render() {
    return (
      <tr>
        {['*'].concat(ACTIONS).map(action => <ActionCheckbox action={action} type={this.props.type} checked={this.props.isChecked(this.props.type, action)} onChange={this.props.onChange} />)}
      </tr>
    )
  }
}

class ActionCheckbox extends React.Component {
  constructor(props) {
    super(props)

    this.setState({
      checked: !!this.props.checked
    })
  }

  shouldComponentUpdate(nextProps) {
    return this.props.checked !== nextProps.checked
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

  render() {
    return (
      <td>
        <input type="checkbox" checked={this.props.checked} onChange={e => this.onChange(e)} />
        {this.renderLabel()}
      </td>
    )
  }

  renderLabel() {
    if (this.props.action !== '*') return null

    return (
      <label>{LABELS[this.props.type]}</label>
    )
  }
}
