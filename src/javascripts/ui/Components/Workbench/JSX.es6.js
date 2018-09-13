import React from 'react';
import PropTypes from 'prop-types';
import Icon from 'ui/Components/Icon.es6';

class Workbench extends React.Component {
  static propTypes = {
    title: PropTypes.node.isRequired,
    icon: PropTypes.string,
    testId: PropTypes.string,
    children: function(props, propName) {
      let children = props[propName];

      if (!Array.isArray(children)) {
        children = [children];
      }

      // if (children.length > 2) {
      //   return new Error(`Workbench must have 1 or 2 children, has ${children.length}`);
      // }

      // for (const child of children) {
      //   if (child.type !== Workbench.Content && child.type !== Workbench.Sidebar) {
      //     return new Error(
      //       `Workbench should only have Content or Sidebar children. Child was ${
      //         child.type.displayName
      //       }`
      //     );
      //   }
      // }

      const contentChildren = children.filter(child => child.type === Workbench.Content);

      if (contentChildren.length !== 1) {
        return new Error(
          `Workbench should have 1 child with type Workbench.Content, but has ${
            contentChildren.length
          }`
        );
      }
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

class Header extends React.Component {
  static propTypes = {
    children: PropTypes.node
  };

  render() {
    return (
      <div className="workbench-header__wrapper">
        <header className="workbench-header">{this.props.children}</header>
      </div>
    );
  }
}
Workbench.Header = Header;

Workbench.Icon = icon => (
  <div className="workbench-header__icon">
    <Icon name={icon} />
  </div>
);

class Title extends React.Component {
  static propTypes = {
    children: PropTypes.node
  };

  render() {
    return <h1 className="workbench-header__title">{this.props.children}</h1>;
  }
}

Workbench.Title = Title;

Workbench.Content = class extends React.Component {
  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.array, PropTypes.element])
  };

  render() {
    const { children } = this.props;

    return <div className="workbench-main__content">{children}</div>;
  }
};

Workbench.Sidebar = class extends React.Component {
  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.array, PropTypes.element])
  };

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
