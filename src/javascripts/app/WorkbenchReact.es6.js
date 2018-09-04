import React from 'react';
import cn from 'classnames';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import Icon from 'ui/Components/Icon.es6';

const Workbench = createReactClass({
  propTypes: {
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
    children: PropTypes.element,
    content: PropTypes.element.isRequired,
    actions: PropTypes.element,
    sidebar: PropTypes.element,
    icon: PropTypes.string,
    testId: PropTypes.string,
    centerContent: PropTypes.bool
  },
  render() {
    const { title, children, content, actions, sidebar, icon, testId, centerContent } = this.props;

    return (
      <div className="workbench" data-test-id={testId}>
        <div className="workbench-header__wrapper">
          <header className="workbench-header">
            {icon && (
              <div className="workbench-header__icon cf-icon">
                <Icon name={icon} scale="0.75" />
              </div>
            )}
            <h1 className="workbench-header__title">{title}</h1>
            {actions && <div className="workbench-header__actions">{actions}</div>}
          </header>
        </div>
        <div
          className={cn('workbench-main', {
            'x--content': centerContent === true
          })}>
          <div className={sidebar ? 'workbench-main__content' : 'workbench-main__middle-content'}>
            {children || content}
          </div>
          {sidebar && <div className="workbench-main__sidebar">{sidebar}</div>}
        </div>
      </div>
    );
  }
});

export default Workbench;
