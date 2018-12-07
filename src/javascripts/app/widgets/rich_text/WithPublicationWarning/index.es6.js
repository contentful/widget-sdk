import React from 'react';

function withPublicationWarning(WrappedComponent) {
  return class extends React.Component {
    componentDidMount() {
      this.unregister = this.props.field.registerUnpublishedReferencesWarning({
        getData: () => this.getReferenceData()
      });
    }

    componentWillUnmount() {
      this.unregister();
    }

    hasUnpublishedReferences() {}

    getReferenceData() {
      return {
        field: this.props.field,
        references: [1, 2, 3]
      };
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
}

export default withPublicationWarning;
