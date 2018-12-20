import React from 'react';
import PropTypes from 'prop-types';
import { registerFactory } from 'NgRegistry.es6';

/**
 * This factory returns a react component, which allows you
 * to render angular directives from react components, so you don't have
 * to refactor huge chunks of angular code at once
 */
registerFactory('AngularComponent', [
  '$rootScope',
  '$compile',
  ($rootScope, $compile) => {
    return class AngularComponent extends React.Component {
      static displayName = 'AngularComponent';
      static propTypes = {
        template: PropTypes.string,
        tag: PropTypes.string,
        scope: PropTypes.object
      };
      componentDidMount() {
        // we create isolated scope
        this.scope = $rootScope.$new(true);
        this.enrichScope(this.props.scope);
        $compile(this.container)(this.scope);
      }
      UNSAFE_componentWillReceiveProps(props) {
        this.enrichScope(props.scope);
      }
      componentWillUnmount() {
        this.scope.$destroy();
      }
      shouldComponentUpdate() {
        // never re-render component – Angular takes care of it
        return false;
      }
      enrichScope = scope => {
        if (scope) {
          Object.keys(scope).forEach(key => {
            const value = scope[key];
            this.scope[key] = value;
          });
        }
      };
      createHTML = () => {
        const { template, tag } = this.props;
        if (template) {
          return template;
        }
        return `<${tag}></${tag}>`;
      };
      render() {
        return (
          <div
            ref={c => {
              this.container = c;
            }}
            dangerouslySetInnerHTML={{ __html: this.createHTML() }}
          />
        );
      }
    };
  }
]);
