import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import Icon from 'ui/Components/Icon';

const Workbench = createReactClass({
  propTypes: {
    title: PropTypes.node.isRequired,
    icon: PropTypes.string,
    testId: PropTypes.string,
    children: function(props, propName) {
      let children = props[propName];

      if (!Array.isArray(children)) {
        children = [children];
      }

      if (children.length > 2) {
        return new Error(`Workbench must have 1 or 2 children, has ${children.length}`);
      }

      for (const child of children) {
        if (child.type !== Workbench.Content && child.type !== Workbench.Sidebar) {
          return new Error(
            `Workbench should only have Content or Sidebar children. Child was ${
              child.type.displayName
            }`
          );
        }
      }

      const contentChildren = children.filter(child => child.type === Workbench.Content);

      if (contentChildren.length !== 1) {
        return new Error(
          `Workbench should have 1 child with type Workbench.Content, but has ${
            contentChildren.length
          }`
        );
      }
    }
  },
  render() {
    const { title, icon, testId, children } = this.props;
    const content = React.Children.toArray(children).find(
      child => child.type === Workbench.Content
    );
    const sidebar = React.Children.toArray(children).find(
      child => child.type === Workbench.Sidebar
    );

    return (
      <div className="workbench" data-test-id={testId}>
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
        <div className="workbench-main">
          {content}
          {sidebar && sidebar}
        </div>
      </div>
    );
  }
});

Workbench.Content = createReactClass({
  propTypes: {
    children: PropTypes.oneOfType([PropTypes.array, PropTypes.element])
  },
  render() {
    const { children } = this.props;

    return <div className="workbench-main__content">{children}</div>;
  }
});

Workbench.Sidebar = createReactClass({
  propTypes: {
    children: PropTypes.oneOfType([PropTypes.array, PropTypes.element])
  },
  render() {
    const { children } = this.props;

    return <div className="workbench-main__sidebar">{children}</div>;
  }
});

export default Workbench;
