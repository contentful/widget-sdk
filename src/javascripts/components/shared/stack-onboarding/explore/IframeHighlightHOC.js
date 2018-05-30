import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

export const name = 'onboarding-iframe-highlight-hoc';

angular.module('contentful')
.factory(name, [function () {
  return (Component) => {
    const IframeHightlightHOC = createReactClass({
      propTypes: {
        iframe: PropTypes.object,
        order: PropTypes.arrayOf(PropTypes.oneOf([
          'person',
          'articles',
          'automate-with-webhooks',
          'hello-world',
          'static-sites-are-great'
        ]))
      },
      getInitialState () {
        return { active: null };
      },
      componentDidMount () {
        const { order } = this.props;
        // give time to iframe to initialize
        // also, user will see some action
        // not just highlighted part from the beginning
        setTimeout(() => {
          if (order && order[0]) {
            this.highlight(order[0]);
          }
        }, 500);
        this.startAnimation();
      },
      componentWillUnmount () {
        this.removeHighlight();
        this.clearAnimation();
      },
      startAnimation () {
        const { order } = this.props;

        if (order) {
          this.interval = setInterval(() => {
            const { active } = this.state;

            const currentIndex = order.findIndex(value => value === active);
            const nextIndex = (currentIndex + 1) % order.length;

            this.highlight(order[nextIndex]);
          }, 2000);
        }
      },
      clearAnimation () {
        clearInterval(this.interval);
      },
      highlight (type) {
        this.removeHighlight();
        const { iframe } = this.props;
        this.setState({ active: type });
        if (type === 'articles') {
          iframe.contentWindow.postMessage({ id: 'automate-with-webhooks', message: 'highlight' }, '*');
          iframe.contentWindow.postMessage({ id: 'hello-world', message: 'highlight' }, '*');
          iframe.contentWindow.postMessage({ id: 'static-sites-are-great', message: 'highlight' }, '*');
        } else {
          iframe.contentWindow.postMessage({ id: type, message: 'highlight' }, '*');
        }
      },
      onHover (type) {
        this.clearAnimation();
        this.highlight(type);
      },
      onLeave () {
        // continue iterate over all types
        this.startAnimation();
      },
      removeHighlight () {
        const { iframe } = this.props;
        iframe.contentWindow.postMessage({ id: 'automate-with-webhooks', message: 'remove' }, '*');
        iframe.contentWindow.postMessage({ id: 'hello-world', message: 'remove' }, '*');
        iframe.contentWindow.postMessage({ id: 'static-sites-are-great', message: 'remove' }, '*');
        iframe.contentWindow.postMessage({ id: 'person', message: 'remove' }, '*');
      },
      render () {
        const { active } = this.state;
        const props = {
          ...this.props,
          onHover: this.onHover,
          onLeave: this.onLeave,
          active
        };
        return <Component {...props} />;
      }
    });

    return IframeHightlightHOC;
  };
}]);
