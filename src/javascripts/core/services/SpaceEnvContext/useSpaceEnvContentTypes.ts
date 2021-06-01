import { useState, useEffect } from 'react';
import deepEqual from 'fast-deep-equal';
import * as K from 'core/utils/kefir';
import { getSpaceContext } from 'classes/spaceContext';
import { ContentType } from './types';

function getContentTypes(): ContentType[] {
  const angularSpaceContext = getSpaceContext();
  if (!angularSpaceContext?.publishedCTs?.items$) return [];
  return K.getValue(angularSpaceContext.publishedCTs.items$) || [];
}

export function useSpaceEnvContentTypes() {
  const [contentTypes, setContentTypes] = useState<ContentType[]>(() => getContentTypes());

  useEffect(() => {
    const angularSpaceContext = getSpaceContext();
    if (!angularSpaceContext?.publishedCTs?.items$) return;

    const deregister = K.onValue(
      angularSpaceContext.publishedCTs.items$.skipDuplicates((a, b) => {
        return deepEqual(a, b);
      }),
      (items) => {
        if (angularSpaceContext.resettingSpace) {
          return;
        }
        setContentTypes((items as ContentType[]) || []);
      }
    );

    return deregister;
  }, []);

  return { currentSpaceContentTypes: contentTypes };
}
