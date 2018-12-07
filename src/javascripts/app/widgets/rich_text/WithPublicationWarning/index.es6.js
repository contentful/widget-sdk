import React from 'react';

function withPublicationWarning(WrappedComponent) {
  return class extends React.Component {
    componentDidMount() {
      this.unregister = this.props.field.registerUnpublishedReferencesWarning({
        shouldShow: async () => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve();
            }, 5000);
          });
        },
        getData: () => this.getReferenceData()
      });
    }

    componentWillUnmount() {
      this.unregister();
    }

    hasUnpublishedReferences() {}

    getReferenceData() {
      return {
        fieldName: 'loool',
        count: 2,
        linked: 'adasd',
        type: '(references.length > 1 ? $scope.typePlural : $scope.type).toLowerCase()'
      };
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
}

export default withPublicationWarning;
