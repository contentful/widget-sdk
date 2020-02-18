import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import WrappedAssetCard from 'app/widgets/shared/FetchedEntityCard/WrappedAssetCard';
import { getState, stateName } from 'data/CMA/EntityState';

// TODO: Pass onClick from entitySelectorController here as a prop

const AssetLink = ({ asset, entityHelpers }) => {
  const state = asset ? getState(asset.sys) : undefined;
  const entityState = state ? stateName(state) : undefined;
  const [{ title, file }, setEntityInfo] = useState({});
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntityInfo = async () => {
      if (asset) {
        const title = await entityHelpers.entityTitle(asset);
        const file = await entityHelpers.assetFile(asset);
        setEntityInfo({ title, file });
        setLoading(false);
      }
    };

    fetchEntityInfo();
  }, [asset, entityHelpers]);

  const getAssetTitle = () => {
    if (!asset) {
      return 'Asset is missing or inaccessible';
    }
    return title ? title : 'Untitled';
  };

  return asset ? (
    <WrappedAssetCard
      entityFile={file}
      entityTitle={getAssetTitle()}
      entityStatus={entityState}
      isLoading={isLoading}
      readOnly={true}
      size="small"
    />
  ) : null;
};

AssetLink.propTypes = {
  asset: PropTypes.shape({
    fields: PropTypes.object,
    sys: PropTypes.shape({
      type: PropTypes.oneOf(['Asset'])
    })
  }),
  entityHelpers: PropTypes.shape({
    entityTitle: PropTypes.func.isRequired,
    assetFile: PropTypes.func.isRequired
  }).isRequired
};

export default AssetLink;
