/**
 * This file outlines React techniques and conventions we want
 * to use in the user_interface repository.
 */

/**
 * 1. TOUCHING POINT
 *
 * For the time being, React code is integrated with Angular
 * with thin wrapper directives; ES5 only so keep it minimal.
 *
 * While we recognize there's a need for wrapping this highly
 * repetitive work with some kind of convenience function,
 * I'd prefer to start with basic, standard building blocks:
 * - ReactDOM for mounting and unmounting components
 * - A reference to a component and a reference to a DOM node
 * - A tool to create VDOM nodes (to be decided: h() vs JSX)
 *
 * This document uses `React.createElement` to eliminate all
 * possible misunderstandings.
 */
angular.directive('cfUsers', ['require', function () {
  var React = require('react');
  var ReactDOM = require('react-dom');
  var Users = require('./Users');

  return {
    link: function (scope, el) {
      // Use `ReactDOM.render` to mount components
      ReactDOM.render(React.createElement(Users, {
        // Pass required scope DATA down
        roles: $scope.roles
      }), el);

      // Remember to unmount
      scope.$on('$destroy', function () {
        ReactDOM.unmountComponentAtNode(el);
      });
    }
  };
}]);

/**
 * 2. TOP-LEVEL COMPONENT
 *
 * Principles for ANY kind of React components:
 * - ES6 modules only
 * - no Angular-specific constructs ($scope, $apply etc)
 *
 * This document assumes the following are imported:
 * - React, ReactDOM, PropTypes
 * - A mock HTTP `client`
 */

// Imports
import {getUserRoles} from '../UserUtils';
import Tooltip from '../ui/Tooltip';

// Module constants
 const DEFAULT_AVATAR_URL = '/user-placeholder-image.png';

// PropTypes are highly encouraged
// Define them before component definitions
const usersPropTypes = {
  roles: PropTypes.arrayOf(PropTypes.shape({
    sys: PropTypes.object.isRequied,
    name: PropTypes.string.isRequired
  })).isRequired
};

 // Use `createReactClass` to create components
 const Users = createReactClass({
   // `getInitialState`, if present, should be the first
   // method declared
   getInitialState () {
     // Current agreement is it's OK to use local state.
     // By "local state" we mean `this.state` modified by
     // `this.setState`. This is subject to change. We
     // should reflect the outcome of the data management
     // discussion.
     //
     // It'll be always OK to use local state for first
     // iterations, prototypes and short-lived features.
     return {users: null};
   },

   // Lifecycle hooks come after `getInitialState`
   // (if present) but before any other methods
   componentWillMount () {
     // Load data with lifecycle methods
     this.req = client.get('/users')
     .then(res => this.setState({users: res.items}));
   },
   componentWillUnmount () {
     this.req.cancel();
   },

   // `render` is declared last.
   render () {
     const {users} = this.state;

     if (!users) {
       return React.createElement('div', {className: 'loader'}, ['Loading...']);
     }

     return React.createElement(List, {users});
   }
 });

// Local functional component for rendering a subtree
function List ({users}) {
  return React.createElement('div', {className: 'user-list'}, [
    React.createElement('div', {className: 'user-list__header'}, [
      React.createElement('h1', ['User list']),
      React.createElement('p', [
        'You can administer your users here. ',
        React.createElement('a', {href: 'some-docs-url'}, ['Learn more'])
      ])
    ]),
    React.createElement('div', {className: 'user-list__items'}, users.map(user => {
      // Pass only needed data down
      return React.createElement(UserDetails, {user, spaceRoles: this.props.roles}));
    })
  ]);
}

function UserDetails ({user, spaceRoles}) {
  const {firstName, lastName, mail, avatarUrl, roles: userRoles} = user;
   const name = `${firstName} ${lastName}`;
   const tooltipText = `${name} (${getRoleNames(userRoles, spaceRoles)})`;

   return React.createElement('div', {className: '.user-details'}, [
     React.createElement(Avatar, {src: avatarUrl, text: tooltipText}),
     React.createElement('h3', [name]),
     React.createElement('a', {href: `mailto:${mail}`}, [mail])
   ]);
 }

function Avatar ({src = DEFAULT_AVATAR_URL, text}) {
  return React.createElement(Tooltip, {text}, [
    React.createElement('div', {className: 'user-avatar'}, [
      React.createElement('img', {src, alt: text})
    ])
  ]);
}

// Exporting the component
Users.propTypes = usersPropTypes;
export default Users;

/**
 * 3. VISUAL COMPONENT USING 3RD PARTY
 *
 * It's easy to integrate with 3rd party when its API
 * is created by us :) To make this excercise harder
 * let's assume we've got a 3rd party tooltip library
 * with interface with this unpleasant interface:
 * - `instance = new ExternalTooltip(domEl, text)`
 * - `instance.destroy()`
 */

import ExternalTooltip from 'external-tooltip';

const tooltipPropTypes = {
  text: PropTypes.string.isRequied,
  children: PropTypes.node.isRequired
};

const Tooltip = createReactClass({
  componentWillUnmount: function () {
    this.destroyTooltip();
  },

  // Custom methods are placed between lifecycle
  // methods and `render`.
  updateTooltip (el) {
    destroyTooltip();
    if (el) {
      this.tooltip = new ExternalTooltip(el, this.props.text);
    }
  },
  destroyTooltip () {
    if (this.tooltip) {
      this.tooltip.destroy();
    }
  },

  render () {
    return React.createElement('div', {
      ref: el => this.updateTooltip(el)
    }, this.props.children);
  }
});

Tooltip.propTypes = tooltipPropTypes;
export default Tooltip;
