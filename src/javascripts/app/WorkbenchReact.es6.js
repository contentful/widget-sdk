import {createElement as h} from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import Icon from 'ui/Components/Icon';

const Workbench = createReactClass({
  propTypes: {
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
    content: PropTypes.element.isRequired,
    sidebar: PropTypes.element,
    icon: PropTypes.string
  },
  render () {
    const {title, content, sidebar, icon} = this.props;


    return h('div', {
      className: 'workbench'
    },
      h('div', {
        className: 'workbench-header__wrapper'
      },
        h('header', {
          className: 'workbench-header'
        },
          icon && h('div', {className: 'workbench-header__icon'}, h(Icon, {name: icon})),
          h('h1', {
            className: 'workbench-header__title'
          }, title)
        )
      ),
      h('div', {
        className: 'workbench-main'
      },
        h('div', {
          className: 'workbench-main__content'
        }, content),
        sidebar && h('div', {
          className: 'workbench-main__sidebar'
        }, sidebar)
      )
    );
  }
});

export default Workbench;
