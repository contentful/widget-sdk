// we don't want to use prop types in this tiny module
/* eslint-disable react/prop-types */

describe('ReactDirective', function () {
  let React, createReactClass;
  beforeEach(function () {
    let provide;
    module('contentful/test', $provide => {
      provide = $provide;
    });

    React = this.$inject('react');
    createReactClass = this.$inject('create-react-class');

    this.$rootScope = this.$inject('$rootScope');

    this.compile = function ({ template, scopeProperties, component }) {
      provide.value('react/hello', component);
      const $el = this.$compile(template, scopeProperties);

      return {
        $el,
        scope: $el.scope()
      };
    };
  });

  afterEach(function () {
    React = createReactClass = null;
  });

  it('renders react component inside angular template', function () {
    const template = `
      <div>
        <react-component name="react/hello"></react-component>
      </div>
    `;
    const component = createReactClass({
      render () {
        return React.createElement('div', {className: 'test-class'}, 'hello!');
      }
    });
    const { $el } = this.compile({ template, component });

    expect($el.find('.test-class').text()).toBe('hello!');
  });

  it('renders react component if its exposes by default key', function () {
    const template = `
      <div>
        <react-component name="react/hello"></react-component>
      </div>
    `;
    const component = createReactClass({
      render () {
        return React.createElement('div', {className: 'test-class'}, 'hello!');
      }
    });
    const { $el } = this.compile({ template, component: { default: component } });

    expect($el.find('.test-class').text()).toBe('hello!');
  });

  it('should throw if react component name is incorrect', function () {
    const template = `
      <div>
        <react-component name="react/non-existent-component"></react-component>
      </div>
    `;

    expect(
      () => this.compile({ template, component: {} })
    ).toThrowError('Cannot find react component "react/non-existent-component"');
  });

  it('should pass props to react component', function () {
    const template = `
      <div>
        <react-component name="react/hello" props="props"></react-component>
      </div>
    `;
    const component = createReactClass({
      render () {
        return React.createElement('div', {className: 'test-class'}, this.props.value);
      }
    });
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

  it('should update react component if props changed', function () {
    const template = `
      <div>
        <react-component name="react/hello" props="props"></react-component>
      </div>
    `;
    const component = createReactClass({
      render () {
        return React.createElement('div', {className: 'test-class'}, this.props.value);
      }
    });
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
    this.$apply();

    expect($el.find('.test-class').text()).toBe('updated value from scope');
  });

  it('should be able to pass functions as props to react component', function () {
    const template = `
      <div>
        <react-component name="react/hello" props="props"></react-component>
      </div>
    `;
    const component = createReactClass({
      render () {
        return React.createElement('div', {className: 'test-class'}, this.props.fn());
      }
    });
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

  it('should update react component if props property replaced using reference watch', function () {
    const template = `
    <div>
      <react-component name="react/hello" props="props" watch-depth="reference"></react-component>
    </div>
    `;
    const component = createReactClass({
      render () {
        return React.createElement('div', {className: 'test-class'}, this.props.value);
      }
    });
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
    this.$apply();

    expect($el.find('.test-class').text()).toBe('updated value from scope');
  });

  it('should NOT update react component if props property updated using reference watch', function () {
    const template = `
    <div>
      <react-component name="react/hello" props="props" watch-depth="reference"></react-component>
    </div>
    `;
    const component = createReactClass({
      render () {
        return React.createElement('div', {className: 'test-class'}, this.props.value);
      }
    });
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
    this.$apply();

    expect($el.find('.test-class').text()).toBe('initial value');
  });
});
