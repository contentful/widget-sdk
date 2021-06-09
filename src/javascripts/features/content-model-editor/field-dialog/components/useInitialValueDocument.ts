import { ContentType, ContentTypeField, Locale } from 'core/typings';
import { useEffect, useMemo } from 'react';
import { Entity, Validator, Document } from '@contentful/editorial-primitives';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import set from 'lodash/set';
import { combinePropertiesObject, createStreamBus, StreamBus } from 'core/utils/kefir';

const isAffecting = (changePath: string[], valuePath: string[]) => {
  const m = Math.min(changePath.length, valuePath.length);
  return isEqual(changePath.slice(0, m), valuePath.slice(0, m));
};

const valuePropertyAt = (document: Pick<Document, 'changes' | 'getValueAt'>, path: string[]) => {
  return document.changes
    .filter((changePath) => isAffecting(changePath, path))
    .toProperty(() => undefined)
    .map(() => document.getValueAt(path));
};

const createInitialValueDoc = (initialEntity: any) => {
  const entity = cloneDeep(initialEntity);
  const changesBus: StreamBus<string[]> = createStreamBus();
  const data$ = combinePropertiesObject<Entity>({
    fields: valuePropertyAt({ changes: changesBus.stream, getValueAt }, ['fields']),
  });

  function getValueAt(path: string[]) {
    // Use normalized entity to get the data.
    return path.length === 0 ? entity : get(entity, path);
  }

  function setValueAt(path: string[], value: any) {
    set(entity, path, value);
    changesBus.emit(path);
  }

  // TODO we need to change signature of Validator to express which parts it needs from CmaDocument so things fail if the validator changes
  return {
    changes: changesBus.stream,
    data$,
    setValueAt,
  } as Document;
};

export function useInitialValueDocument(
  ctField: ContentTypeField,
  fields: any,
  contentType: ContentType,
  locales: Locale[]
) {
  const doc = useMemo(() => {
    const { id } = ctField;
    return createInitialValueDoc({
      fields: {
        [id]: fields.initialValue?.value ?? {},
      },
    });
  }, [ctField, contentType, locales]);
  const validator = useMemo(
    () =>
      Validator.createForEntry({
        contentType,
        locales,
        doc,
        getContentType: () => contentType,
      }),
    []
  );

  useEffect(() => {
    const handleValueChanges = () => validator.run();
    doc.changes.onValue(handleValueChanges);
    handleValueChanges();

    return () => void doc.changes.offValue(handleValueChanges);
  }, [doc]);

  return { doc, validator };
}
