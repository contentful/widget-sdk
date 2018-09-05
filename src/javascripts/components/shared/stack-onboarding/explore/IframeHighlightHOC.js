import React from 'react';
import PropTypes from 'prop-types';

export const name = 'onboarding-iframe-highlight-hoc';

angular.module('contentful').factory(name, [
  function() {
    return Component => {
      class IframeHightlightHOC extends React.Component {
        static propTypes = {
          iframe: PropTypes.object
        };

        state = { active: null };

        componentWillUnmount() {
          this.removeHighlight();
        }

        highlight = type => {
          this.removeHighlight();
          const { iframe } = this.props;
          this.setState({ active: type });
          if (type === 'articles') {
            iframe.contentWindow.postMessage(
              { id: 'automate-with-webhooks', message: 'highlight' },
              '*'
            );
            iframe.contentWindow.postMessage({ id: 'hello-world', message: 'highlight' }, '*');
            iframe.contentWindow.postMessage(
              { id: 'static-sites-are-great', message: 'highlight' },
              '*'
            );
          } else {
            iframe.contentWindow.postMessage({ id: type, message: 'highlight' }, '*');
          }
        };

        onHover = type => {
          this.highlight(type);
        };

        onLeave = () => {
          this.removeHighlight();
          this.setState({ active: null });
        };

        removeHighlight = () => {
          const { iframe } = this.props;
          iframe.contentWindow.postMessage(
            { id: 'automate-with-webhooks', message: 'remove' },
            '*'
          );
          iframe.contentWindow.postMessage({ id: 'hello-world', message: 'remove' }, '*');
          iframe.contentWindow.postMessage(
            { id: 'static-sites-are-great', message: 'remove' },
            '*'
          );
          iframe.contentWindow.postMessage({ id: 'person', message: 'remove' }, '*');
          iframe.contentWindow.postMessage({ id: 'all', message: 'remove' }, '*');
        };

        render() {
          const { active } = this.state;
          const props = {
            ...this.props,
            onHover: this.onHover,
            onLeave: this.onLeave,
            active
          };
          return <Component {...props} />;
        }
      }

      return IframeHightlightHOC;
    };
  }
]);
