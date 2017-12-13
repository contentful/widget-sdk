import createReactClass from 'create-react-class';
import {createElement as h} from 'libs/react';
// import PropTypes from 'libs/prop-types';

import {isOwner, isOwnerOrAdmin} from 'services/OrganizationRoles';
import {getOrganization} from 'services/TokenStore';

export const PlatformUsage = createReactClass({
  getInitialState: function () {
    return {};
  },
  componentDidMount: function () {
    getOrganization(this.props.orgId).then(org => {
      if (!isOwnerOrAdmin(org)) {
        this.props.context.forbidden = true;
      } else {
        this.props.context.ready = true;
      }
    })
  },
  render: function () {
    return h(Workbench, {
      title: 'Usage',
      content: 'Content'
    });
  }
});

export const Workbench = createReactClass({
  // getDefaultProps: function () {
  //   return {
  //     title: PropTypes.string.isRequired,
  //     content: PropTypes.func.isRequired,
  //     sidebar: PropTypes.func
  //   }
  // },

  render: function () {
    const {title, content, sidebar} = this.props;
    return h('div', {
      className: 'workbench'
    },
      h('div', {
        className: 'workbench-header__wrapper'
      },
        h('header', {
          className: 'workbench-header'
        },
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
        h('div', {
          className: 'workbench-main__sidebar'
        }, sidebar)
      )
    )
  }
});