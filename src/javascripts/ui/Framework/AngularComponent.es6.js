import React from 'react';
import PropTypes from 'prop-types';

import { getModule } from 'NgRegistry.es6';

/**
 * Allows to use an Angular directive from within React.
 *
 * Important: Don't overuse this and use very cautious with bigger directives -
 *  especially if they are resource intensive or involve data fetching - as this
 *  is unpredictable black magic and not well optimized or tested.
 *
 * @example
 * <AngularComponent
 *   template={'<cf-thumbnail file="file" size="30" fit="thumb" focus="faces" />'}
 *   scope={{ file }}
 * />
 */
export default class AngularComponent extends React.Component {
  static propTypes = {
    template: PropTypes.string,
    tag: PropTypes.string,
    scope: PropTypes.object
  };
  componentDidMount() {
    const $rootScope = getModule('$rootScope');
    const $compile = getModule('$compile');
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
}
