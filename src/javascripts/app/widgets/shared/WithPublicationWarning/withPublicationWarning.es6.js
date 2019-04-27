import React from 'react';
import PropTypes from 'prop-types';

import { flatten } from 'lodash';

export default function withPublicationWarning(WrappedComponent, { getLinkedEntityIds }) {
  return class extends React.Component {
    static propTypes = {
      widgetAPI: PropTypes.object.isRequired
    };
    componentDidMount() {
      this.unregister = this.props.widgetAPI.field.registerUnpublishedReferencesWarning({
        getData: () => this.getReferenceData()
      });
    }

    componentWillUnmount() {
      this.unregister();
    }

    getEntities = async (getResource, ids) => {
      const entities = await Promise.all(ids.map(id => getResource(id).catch(_error => null)));
      return entities.filter(Boolean);
    };

    getEntries = ids => this.getEntities(this.props.widgetAPI.space.getEntry, ids);

    getAssets = ids => this.getEntities(this.props.widgetAPI.space.getAsset, ids);

    getReferenceData = async () => {
      const { field } = this.props.widgetAPI;
      const { entryIds, assetIds } = getLinkedEntityIds(field.getValue());

      const entities = await Promise.all([this.getEntries(entryIds), this.getAssets(assetIds)]);
      const unpublishedEntities = flatten(entities).filter(e => !e.sys.publishedVersion);

      return {
        field,
        references: unpublishedEntities
      };
    };

    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
}
