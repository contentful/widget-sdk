import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Icon from 'ui/Components/Icon.es6';

class Workbench extends React.Component {
  static propTypes = {
    title: PropTypes.node,
    icon: PropTypes.string,
    testId: PropTypes.string,
    className: PropTypes.string,
    children: function(props, propName) {
      let children = props[propName];
      if (!Array.isArray(children)) {
        children = [children];
      }
      const allowedTypes = [Workbench.Content, Workbench.Sidebar, Workbench.Header, Workbench.Nav];
      const typeNames = allowedTypes.map(type => type.displayName);
      const filterByType = type => children.filter(child => child.type === type);
      const validateSingleChildOfType = type => {
        const childrenOfType = filterByType(type);
        if (childrenOfType.length > 1) {
          throw new Error(
            `Workbench should have no more than 1 child with type ${type.displayName}, but it has ${
              childrenOfType.length
            }`
          );
        }
      };

      const contentChildren = filterByType(Workbench.Content);

      if (contentChildren.length !== 1) {
        return new Error(
          `Workbench should have 1 child with type Workbench.Content, but has ${
            contentChildren.length
          }`
        );
      }

      for (const child of children) {
        if (!allowedTypes.includes(child.type)) {
          return new Error(
            `Workbench should only have children of the types ${typeNames.join(', ')}`
          );
        }
      }

      validateSingleChildOfType(Workbench.Header);
      validateSingleChildOfType(Workbench.Sidebar);
      validateSingleChildOfType(Workbench.Nav);
    }
  };

  render() {
    const { title, icon, testId, children, className } = this.props;
    const header = React.Children.toArray(children).find(child => child.type === Workbench.Header);
    const content = React.Children.toArray(children).find(
      child => child.type === Workbench.Content
    );
    const sidebar = React.Children.toArray(children).find(
      child => child.type === Workbench.Sidebar
    );
    const nav = React.Children.toArray(children).find(child => child.type === Workbench.Nav);

    return (
      <div className={classNames('workbench', className)} data-test-id={testId}>
        {header && header}
        {!header && (
          <div className="workbench-header__wrapper">
            <header className="workbench-header">
              {icon && (
                <div className="workbench-header__icon">
                  <Icon name={icon} />
                </div>
              )}
              <h1 className="workbench-header__title">{title}</h1>
            </header>
          </div>
        )}
        {nav && nav}
        <div className="workbench-main">
          {content}
          {sidebar && sidebar}
        </div>
      </div>
    );
  }
}

Workbench.Header = ({ children }) => (
  <div className="workbench-header__wrapper">
    <header className="workbench-header">{children}</header>
  </div>
);
Workbench.Header.displayName = 'Workbench.Header';
Workbench.Header.propTypes = {
  children: PropTypes.node
};

Workbench.Icon = ({ icon }) => (
  <div className="workbench-header__icon">
    <Icon name={icon} scale="0.75" />
  </div>
);
Workbench.Icon.displayName = 'Workbench.Icon';
Workbench.Icon.propTypes = {
  icon: PropTypes.string.isRequired
};

Workbench.Title = ({ children }) => <h1 className="workbench-header__title">{children}</h1>;
Workbench.Title.displayName = 'Workbench.Title';
Workbench.Title.propTypes = {
  children: PropTypes.node
};

Workbench.Header.Left = class HeaderLeft extends React.Component {
  static propTypes = {
    children: PropTypes.node
  };

  render() {
    return <div className="workbench-header__left">{this.props.children}</div>;
  }
};

Workbench.Header.Search = class HeaderSearch extends React.Component {
  static propTypes = {
    children: PropTypes.node
  };

  render() {
    return <div className="workbench-header__search">{this.props.children}</div>;
  }
};

Workbench.Header.Actions = class HeaderActions extends React.Component {
  static propTypes = {
    children: PropTypes.node
  };

  render() {
    return <div className="workbench-header__actions">{this.props.children}</div>;
  }
};

Workbench.Nav = ({ children }) => <div className="workbench-nav">{children}</div>;
Workbench.Nav.displayName = 'Workbench.Nav';
Workbench.Nav.propTypes = {
  children: PropTypes.node
};

Workbench.Content = class Content extends React.Component {
  static propTypes = {
    noSidebar: PropTypes.bool,
    style: PropTypes.object,
    children: PropTypes.oneOfType([PropTypes.array, PropTypes.element])
  };

  static displayName = 'Workbench.Content';

  render() {
    return (
      <div
        style={this.props.style}
        className={
          this.props.noSidebar === true
            ? 'workbench-main__middle-content'
            : 'workbench-main__content'
        }>
        {this.props.children}
      </div>
    );
  }
};

Workbench.Sidebar = class Sidebar extends React.Component {
  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.array, PropTypes.element])
  };

  static displayName = 'Workbench.Sidebar';

  render() {
    const { children } = this.props;

    return (
      <div className="workbench-main__sidebar">
        <div className="entity-sidebar">{children}</div>
      </div>
    );
  }
};

export default Workbench;
