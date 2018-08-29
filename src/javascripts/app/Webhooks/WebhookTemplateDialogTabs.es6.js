import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Tab = ({ isActive, template, ...rest }) => {
  const classes = classNames({
    'webhook-template-item': true,
    'webhook-template-item--active': isActive
  });
  return (
    <div {...rest} className={classes}>
      <div className="webhook-template-item__logo">{template.logo}</div>
      <div className="webhook-template-item__title">
        <strong>{template.title}</strong>
        <small>{template.subtitle}</small>
      </div>
    </div>
  );
};

Tab.propTypes = {
  isActive: PropTypes.bool.isRequired,
  template: PropTypes.object.isRequired
};

export const TabsList = props => (
  <div className="webhook-templates-dialog-tabs__list">
    <div className="webhook-templates-dialog-tabs__list-title">{props.title}</div>
    {props.children}
  </div>
);

TabsList.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired
};

export class TabPane extends React.Component {
  static propTypes = {
    isActive: PropTypes.bool.isRequired,
    children: PropTypes.any
  };

  render() {
    return (
      <div
        style={{ display: this.props.isActive ? 'block' : 'none' }}
        className="webhook-templates-dialog-tabs__pane">
        {this.props.children}
      </div>
    );
  }
}

export default class Tabs extends React.Component {
  static propTypes = {
    initialActive: PropTypes.string.isRequired,
    renderTabs: PropTypes.func.isRequired,
    reposition: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      active: props.initialActive
    };
    this.getTabProps = this.getTabProps.bind(this);
    this.getPaneProps = this.getPaneProps.bind(this);
  }

  componentDidUpdate() {
    this.props.reposition();
  }

  getTabProps(tabId) {
    return {
      onClick: () => this.setState({ active: tabId }),
      isActive: this.state.active === tabId
    };
  }

  getPaneProps(tabId) {
    return {
      isActive: this.state.active === tabId
    };
  }

  render() {
    return (
      <div className="webhook-templates-dialog-tabs">
        <div className="webhook-templates-dialog-tabs__separator" />
        {this.props.renderTabs({
          getTabProps: this.getTabProps,
          getPaneProps: this.getPaneProps
        })}
      </div>
    );
  }
}
