/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export class Tab extends React.Component {
  static propTypes = {
    isActive: PropTypes.bool.isRequired,
    template: PropTypes.object.isRequired
  };

  componentDidMount() {
    if (this.props.isActive) {
      this.domRef.scrollIntoView();
    }
  }

  render() {
    const { isActive, template, ...rest } = this.props;

    const classes = classNames({
      'webhook-template-item': true,
      'webhook-template-item--active': isActive,
      'webhook-template-item--3-lines': template.aws
    });
    return (
      <div
        {...rest}
        className={classes}
        ref={ref => {
          this.domRef = ref;
        }}>
        <div className="webhook-template-item__logo">{template.logo}</div>
        <div className="webhook-template-item__title">
          <strong>{template.title}</strong>
          <small>{template.subtitle}</small>
          {template.aws && <small>Enterprise plan only</small>}
        </div>
      </div>
    );
  }
}

export const TabsList = props => (
  <div className="webhook-templates-dialog-tabs__list">
    <div className="webhook-templates-dialog-tabs__list-title">{props.title}</div>
    <div className="webhook-templates-dialog-tabs__scroll-container">
      <div className="webhook-templates-dialog-tabs__scroll-container-inner">{props.children}</div>
    </div>
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
    renderTabs: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      active: props.initialActive
    };
  }

  getTabProps = tabId => {
    return {
      onClick: () => this.setState({ active: tabId }),
      isActive: this.state.active === tabId
    };
  };

  getPaneProps = tabId => {
    return {
      isActive: this.state.active === tabId
    };
  };

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
