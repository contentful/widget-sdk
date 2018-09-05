import React from 'react';
import PropTypes from 'prop-types';

export const name = 'react/browser';

angular.module('contentful').factory(name, [
  function() {
    class BrowserTab extends React.Component {
      static propTypes = {
        children: PropTypes.node.isRequired,
        className: PropTypes.string
      };

      render() {
        const { children, className } = this.props;
        return (
          <div className={`browser-tab ${className || ''}`}>
            <div className={'browser-tab--line'}>
              <div className={'browser-tab--dots'}>
                <div className={'browser-tab--dot browser-tab--dot__red'} />
                <div className={'browser-tab--dot browser-tab--dot__yellow'} />
                <div className={'browser-tab--dot browser-tab--dot__green'} />
              </div>
              <div className={'browser-tab--tab'} />
            </div>
            <div className={'browser-tab--padding'} />
            {children}
          </div>
        );
      }
    }

    return BrowserTab;
  }
]);
