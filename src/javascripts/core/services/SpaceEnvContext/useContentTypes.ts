import { useMemo, useState, useEffect } from 'react';
import { ContentType } from './types';
import * as K from 'core/utils/kefir';
import deepEqual from 'fast-deep-equal';

import { getModule } from 'core/NgRegistry';

export function useContentTypes() {
  const angularSpaceContext = useMemo(() => getModule('spaceContext'), []);
  const [contentTypes, setContentTypes] = useState<ContentType[]>(() => getContentTypes());

  function getContentTypes(): ContentType[] {
    if (!angularSpaceContext?.publishedCTs?.items$) return [];

    return K.getValue(angularSpaceContext.publishedCTs.items$);
  }

  useEffect(() => {
    if (!angularSpaceContext?.publishedCTs?.items$) return;

    const deregister = K.onValue(
      angularSpaceContext.publishedCTs.items$.skipDuplicates((a, b) => {
        return deepEqual(a, b);
      }),
      (items) => {
        if (angularSpaceContext.resettingSpace) {
          return;
        }
        setContentTypes(items as ContentType[]);
      }
    );

    return deregister;
  }, []); // eslint-disable-line

  return { currentSpaceContentTypes: contentTypes };
}
