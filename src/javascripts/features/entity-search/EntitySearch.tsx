import React, { useCallback, useMemo, useRef } from 'react';
import type { EntityType, ExternalSearchState } from '@contentful/entity-search/dist/types';
import { upperFirst } from 'lodash';
import { CustomInputRenderers, Search, SearchFeatures } from '@contentful/entity-search';
import { useSearchSdk } from './useSearchSdk';
import { MetadataTagBridge } from './ValueInput/MetadataTagBridge';
import type { ListViewContext, ViewCallback } from './useListView';

type EntitySearchProps = {
  className: string;
  contentTypes: any[];
  entityType: EntityType;
  isLoading?: boolean;
  withMetadata: boolean;
  onUpdate: ViewCallback;
  listViewContext: ListViewContext;
};

type EntitySearchContextProps = {
  onUpdate: ViewCallback;
  listViewContext: ListViewContext;
  features: SearchFeatures;
  customInputRenderers?: CustomInputRenderers;
};

// we want to re-render complete search on external changes
function useEntitySearchKey({ lastAction, view }: { lastAction?: string; view: any }) {
  const externalUpdateKey = useRef(0);
  const key = useMemo(() => {
    const action = lastAction;

    // updating came from the search itself
    if (action === 'assignView') {
      return action;
    }

    // updates here came in through external changes
    externalUpdateKey.current = externalUpdateKey.current + 1;
    return `${action}-${externalUpdateKey.current}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, lastAction]);

  return key;
}

function useEntitySearchContext({
  listViewContext,
  onUpdate,
  features,
  customInputRenderers,
}: EntitySearchContextProps) {
  const searchSdk = useSearchSdk({ features, customInputRenderers });
  const { getView, assignView, lastAction } = listViewContext;
  const view = getView();
  const { searchText = '', searchFilters = [], contentTypeId } = view;
  const initialState = useMemo(
    () => ({ searchText, searchFilters, contentTypeId: contentTypeId || '' }),
    [searchText, searchFilters, contentTypeId]
  );
  const key = useEntitySearchKey({ view, lastAction });
  const onChange = useCallback(
    (searchState: ExternalSearchState) => assignView(searchState, onUpdate),
    [assignView, onUpdate]
  );

  return { key, searchSdk, onChange, initialState };
}

export function EntitySearch(props: EntitySearchProps) {
  const { listViewContext, onUpdate, className, entityType, contentTypes } = props;
  const features = { metadata: props.withMetadata };
  const { initialState, searchSdk, onChange, key } = useEntitySearchContext({
    listViewContext,
    onUpdate,
    features,
    customInputRenderers: {
      metadataTagRenderer: (props) => <MetadataTagBridge {...props} />,
    },
  });

  return (
    <Search
      key={key}
      initialState={initialState}
      className={className}
      entityType={upperFirst(entityType) as EntityType}
      contentTypes={contentTypes}
      features={features}
      onChange={onChange}
      onChangeDebounce={200}
      sdk={searchSdk}
    />
  );
}
