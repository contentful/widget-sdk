import React from 'react';
import PropTypes from 'prop-types';

import { flatten } from 'lodash';
import { getRichTextEntityLinks } from '@contentful/rich-text-links';

function withPublicationWarning(WrappedComponent) {
  return class extends React.Component {
    static propTypes = {
      widgetAPI: PropTypes.object.isRequired,
      field: PropTypes.shape({
        registerUnpublishedReferencesWarning: PropTypes.func.isRequired
      }).isRequired
    };
    componentDidMount() {
      this.unregister = this.props.field.registerUnpublishedReferencesWarning({
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
      const referenceMap = getRichTextEntityLinks(this.props.field.getValue());

      const entryIds = referenceMap.Entry.map(e => e.id);
      const assetIds = referenceMap.Asset.map(e => e.id);

      const entities = await Promise.all([this.getEntries(entryIds), this.getAssets(assetIds)]);
      const unpublishedEntities = flatten(entities).filter(e => !e.sys.publishedVersion);

      return {
        field: this.props.field,
        references: unpublishedEntities
      };
    };

    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
}

export default withPublicationWarning;
