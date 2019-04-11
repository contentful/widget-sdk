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

    getEntities = async (getResources, ids) => {
      if (ids.length > 0) {
        const { items } = await getResources({
          'sys.id[in]': ids.join(',')
        });

        return items;
      }
      return Promise.resolve([]);
    };

    getEntries = ids =>
      this.getEntities(query => this.props.widgetAPI.space.getEntries(query), ids);
    getAssets = ids => this.getEntities(query => this.props.widgetAPI.space.getAssets(query), ids);

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
