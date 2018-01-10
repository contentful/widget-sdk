import {createElement as h} from 'libs/react';
import ReactDOM from 'libs/react-dom';
import createReactClass from 'create-react-class';
import {uniqueId} from 'lodash';

const DevNotifications = createReactClass({
  getInitialState: function () {
    return {
      isCollapsed: false
    };
  },
  toggle: function () {
    const {isCollapsed} = this.state;
    this.setState({
      isCollapsed: !isCollapsed
    });
  },
  render: function () {
    const {notifications} = this.props;
    const {isCollapsed} = this.state;
    if (!notifications.length) {
      return null;
    }
    return h('div', {
      className: (isCollapsed ? 'cf-dev-notifications is-collapsed' : 'cf-dev-notifications')
    }, [
      h('a', {className: 'btn-toggle-collapsed', href: '#', onClick: this.toggle}),
      ...notifications.map(({title, content, id}) => {
        return h('div', {
          className: 'cf-dev-notification',
          key: id
        }, [
          title ? h('h5', null, title) : '',
          h('div', {dangerouslySetInnerHTML: {__html: content}})
        ]);
      })
    ]);
  }
});

let containerElement;
const notifications = [];

/**
 * Adds a notification with title and body. Both can be react elements or plain
 * strings.
 * @param {(ReactElement|string)} title
 * @param {(ReactElement|string)} content
 */
export function addNotification (title, content) {
  if (!containerElement) {
    containerElement = document.getElementsByTagName('body')[0].appendChild(document.createElement('div'));
  }
  notifications.push({title, content, id: uniqueId()});
  ReactDOM.render(h(DevNotifications, {notifications}), containerElement);
}
