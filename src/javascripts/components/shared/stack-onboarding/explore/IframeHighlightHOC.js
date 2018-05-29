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

        if (order) {
          this.interval = setInterval(() => {
            const { active } = this.state;

            const currentIndex = order.findIndex(value => value === active);
            const nextIndex = (currentIndex + 1) % order.length;

            this.highlight(order[nextIndex]);
          }, 2000);
        }
      },
      componentWillUnmount () {
        this.removeHighlight();
        this.clearAnimation();
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
        this.setState({ active: null });
        this.removeHighlight();
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
