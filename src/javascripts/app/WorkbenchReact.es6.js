import { createElement as h } from 'react';
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

    return h(
      'div',
      {
        className: 'workbench',
        'data-test-id': testId
      },
      h(
        'div',
        {
          className: 'workbench-header__wrapper'
        },
        h(
          'header',
          {
            className: 'workbench-header'
          },
          icon &&
            h(
              'div',
              {
                className: 'workbench-header__icon cf-icon'
              },
              h(Icon, { name: icon, scale: '0.75' })
            ),
          h(
            'h1',
            {
              className: 'workbench-header__title'
            },
            title
          ),
          actions && h('div', { className: 'workbench-header__actions' }, actions)
        )
      ),
      h(
        'div',
        {
          className: cn('workbench-main', {
            'x--content': centerContent === true
          })
        },
        h(
          'div',
          {
            className: sidebar ? 'workbench-main__content' : 'workbench-main__middle-content'
          },
          children || content
        ),
        sidebar &&
          h(
            'div',
            {
              className: 'workbench-main__sidebar'
            },
            sidebar
          )
      )
    );
  }
});

export default Workbench;
