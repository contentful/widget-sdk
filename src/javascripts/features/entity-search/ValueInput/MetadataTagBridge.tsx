import React from 'react';
import type { CustomInputRenderers } from '@contentful/entity-search';
import { MetadataTagWrapper } from './MetadataTag';
import { MetadataTags } from 'features/content-tags';

type BridgeProps = Parameters<NonNullable<CustomInputRenderers['metadataTagRenderer']>>[0];

export function MetadataTagBridge(bridgeProps: BridgeProps) {
  const { testId, value, setIsRemovable, isFocused, onChange, onKeyDown } = bridgeProps;
  const props = {
    // this is fine as empty state is handled in entity-search
    operator: '',
    value: value || '',
    testId,
    setIsRemovable,
    isFocused,
    onChange,
    onKeyDown,
  };

  return (
    <MetadataTags>
      <MetadataTagWrapper {...props} />
    </MetadataTags>
  );
}
