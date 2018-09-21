import React from 'react';
import PropTypes from 'prop-types';
import Icon from 'ui/Components/Icon.es6';

class Workbench extends React.Component {
  static propTypes = {
    title: PropTypes.node,
    icon: PropTypes.string,
    testId: PropTypes.string,
    children: function(props, propName) {
      let children = props[propName];
      if (!Array.isArray(children)) {
        children = [children];
      }
      const allowedTypes = [Workbench.Content, Workbench.Sidebar, Workbench.Header];
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
    }
  };

  render() {
    const { title, icon, testId, children } = this.props;
    const header = React.Children.toArray(children).find(child => child.type === Workbench.Header);
    const content = React.Children.toArray(children).find(
      child => child.type === Workbench.Content
    );
    const sidebar = React.Children.toArray(children).find(
      child => child.type === Workbench.Sidebar
    );

    return (
      <div className="workbench" data-test-id={testId}>
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
        <div className="workbench-main">
          {content}
          {sidebar && sidebar}
        </div>
      </div>
    );
  }
}

Workbench.Header = class Header extends React.Component {
  static propTypes = {
    children: PropTypes.node
  };

  static displayName = 'Workbench.Header';

  render() {
    return (
      <div className="workbench-header__wrapper">
        <header className="workbench-header">{this.props.children}</header>
      </div>
    );
  }
};

Workbench.Icon = icon => (
  <div className="workbench-header__icon">
    <Icon name={icon} />
  </div>
);

Workbench.Title = class Title extends React.Component {
  static propTypes = {
    children: PropTypes.node
  };

  render() {
    return <h1 className="workbench-header__title">{this.props.children}</h1>;
  }
};

Workbench.Content = class Content extends React.Component {
  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.array, PropTypes.element])
  };

  static displayName = 'Workbench.Content';

  render() {
    const { children } = this.props;

    return <div className="workbench-main__content">{children}</div>;
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
