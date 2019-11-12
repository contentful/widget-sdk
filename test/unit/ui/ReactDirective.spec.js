// we don't want to use prop types in this tiny module
/* eslint-disable react/prop-types */

import React from 'react';
import { $initialize, $inject, $compile, $apply } from 'test/utils/ng';

describe('ReactDirective', () => {
  beforeEach(async function() {
    this.component = {
      default: null
    };

    this.system.set('ui/Components/Icon', this.component);

    await $initialize(this.system);

    this.$rootScope = $inject('$rootScope');

    this.compile = ({ template, scopeProperties, component }) => {
      this.component.default = component;
      const $el = $compile(template, scopeProperties);

      return {
        $el,
        scope: $el.scope()
      };
    };
  });

  it('renders react component inside angular template', function() {
    const template = `
      <div>
        <react-component name="ui/Components/Icon"></react-component>
      </div>
    `;
    const component = class X extends React.Component {
      render() {
        return React.createElement('div', { className: 'test-class' }, 'hello!');
      }
    };
    const { $el } = this.compile({ template, component });

    expect($el.find('.test-class').text()).toBe('hello!');
  });

  it('should throw if react component name is incorrect', function() {
    const template = `
      <div>
        <react-component name="react/non-existent-component"></react-component>
      </div>
    `;

    expect(() => this.compile({ template, component: {} })).toThrowError(
      'Cannot find react component "react/non-existent-component"'
    );
  });

  it('should pass props to react component', function() {
    const template = `
      <div>
        <react-component name="ui/Components/Icon" props="props"></react-component>
      </div>
    `;
    const component = class X extends React.Component {
      render() {
        return React.createElement('div', { className: 'test-class' }, this.props.value);
      }
    };
    const { $el } = this.compile({
      template,
      scopeProperties: {
        props: {
          value: 'value from scope'
        }
      },
      component
    });

    expect($el.find('.test-class').text()).toBe('value from scope');
  });

  it('should update react component if props changed', function() {
    const template = `
      <div>
        <react-component name="ui/Components/Icon" props="props"></react-component>
      </div>
    `;
    const component = class X extends React.Component {
      render() {
        return React.createElement('div', { className: 'test-class' }, this.props.value);
      }
    };
    const { $el, scope } = this.compile({
      template,
      scopeProperties: {
        props: {
          value: 'value from scope'
        }
      },
      component
    });

    scope.props.value = 'updated value from scope';
    $apply();

    expect($el.find('.test-class').text()).toBe('updated value from scope');
  });

  it('should be able to pass functions as props to react component', function() {
    const template = `
      <div>
        <react-component name="ui/Components/Icon" props="props"></react-component>
      </div>
    `;
    const component = class X extends React.Component {
      render() {
        return React.createElement('div', { className: 'test-class' }, this.props.fn());
      }
    };
    const { $el } = this.compile({
      template,
      scopeProperties: {
        props: {
          fn: () => 'value from function'
        }
      },
      component
    });

    expect($el.find('.test-class').text()).toBe('value from function');
  });

  it('should update react component if props property replaced using reference watch', function() {
    const template = `
    <div>
      <react-component name="ui/Components/Icon" props="props" watch-depth="reference"></react-component>
    </div>
    `;
    const component = class X extends React.Component {
      render() {
        return React.createElement('div', { className: 'test-class' }, this.props.value);
      }
    };
    const { $el, scope } = this.compile({
      template,
      scopeProperties: {
        props: {
          value: 'initial value'
        }
      },
      component
    });

    scope.props = { value: 'updated value from scope' };
    $apply();

    expect($el.find('.test-class').text()).toBe('updated value from scope');
  });

  it('should NOT update react component if props property updated using reference watch', function() {
    const template = `
    <div>
      <react-component name="ui/Components/Icon" props="props" watch-depth="reference"></react-component>
    </div>
    `;
    const component = class X extends React.Component {
      render() {
        return React.createElement('div', { className: 'test-class' }, this.props.value);
      }
    };
    const { $el, scope } = this.compile({
      template,
      scopeProperties: {
        props: {
          value: 'initial value'
        }
      },
      component
    });

    scope.props.value = 'updated value from scope';
    $apply();

    expect($el.find('.test-class').text()).toBe('initial value');
  });
});
