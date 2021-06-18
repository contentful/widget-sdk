import React from 'react';
import { Field, FieldWrapper } from '@contentful/default-field-editors';
import type mitt from 'mitt';
import { css } from 'emotion';

import type { ContentType, ContentTypeField, EditorInterfaceControl, Locale } from 'core/typings';
import { useInitialValueFieldAPI } from './useInitialValueFieldApi';

const styles = {
  fieldWrapper: css({
    marginLeft: 0,
    marginRight: 0,

    '& + &': {
      marginTop: 0,
    },
    // This is hacky component styling. We only want to remove this margin
    // for the first FieldWrapper and only when the usage note is shown
    '&:nth-child(3)': {
      marginTop: 0,
    },
  }),
};

export interface InitialValueFieldProps {
  eventEmitter: mitt.Emitter;
  contentType: ContentType;
  field: ContentTypeField;
  widget: EditorInterfaceControl;
  fields: Record<string, unknown>;
  isLocalized?: boolean;
  locale: Locale;
  locales: Locale[];
  onChange: (fieldName: string, value: unknown) => void;
}

const InitialValueField = ({
  contentType,
  eventEmitter,
  field,
  fields,
  widget,
  isLocalized,
  locale,
  locales,
  onChange,
}: InitialValueFieldProps) => {
  const sdk = useInitialValueFieldAPI({
    eventEmitter,
    contentType,
    field,
    fields,
    locale,
    locales,
    widget,
    onChange,
  });

  const customfield = (
    <Field key={locale.code} sdk={sdk} widgetId={widget?.widgetId || undefined} />
  );

  return isLocalized ? (
    <FieldWrapper className={styles.fieldWrapper} sdk={sdk} name={locale.name}>
      {customfield}
    </FieldWrapper>
  ) : (
    customfield
  );
};

export { InitialValueField };
