# Use React components as Angular directives

React components can be used with the `react-component` directive.
~~~js
    template:
      '<react-component class="optional-css-class" name="path/to/Component.es6" props="props"/>',
    controller: function($scope) {
      $scope.props = {
        prop1: value1,
        prop2: value2
      };
    }
~~~

Additionally, the `react-component` directive adds a service provider to the [React context](https://reactjs.org/docs/context.html).
That can by used with `ServicesConsumer` to inject any Angular service.
~~~js
const ServicesConsumer = require('../../reactServiceContext').default;

export default ServicesConsumer(
  'AngularServiceThatCanBeImportedByName',
  {
    from: 'path/to/service',
    as: 'NameForInjectedServiceInProps'
  }
)(class Example extends React.Component {
  
  render() {
    const { $services: { NameForInjectedServiceInProps } } = this.props;
    
    if (NameForInjectedServiceInProps.blah()) {
      return <Foo />;
    } else {
      return <Bar />;
    }
  }
})
~~~

## Caveat

If you change a component to use `ServicesConsumer`, you *have* to make sure it is only used as a child of the `react-component` directive.
Component that use `ServicesConsumer` will *not* work everywhere in the application.
