import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

const moduleName = 'onboarding-iframe-highlight-hoc';

angular.module('contentful')
.factory(moduleName, [function () {
  return (Component) => {
    const IframeHightlightHOC = createReactClass({
      propTypes: {
        iframe: PropTypes.object
      },
      getInitialState () {
        return { active: null };
      },
      onHover (type) {
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

export const name = moduleName;
