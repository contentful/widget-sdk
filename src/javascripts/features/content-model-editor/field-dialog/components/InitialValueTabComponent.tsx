import React, { Fragment, useMemo } from 'react';
import { Flex, Grid, GridItem } from '@contentful/forma-36-react-components';
import { BooleanEditor } from '@contentful/field-editor-boolean';

import TheLocaleStore from 'services/localeStore';
import { EntityFieldControl } from 'app/entity_editor/EntityField/EntityFieldControl';
import type { Widget } from 'app/entity_editor/EntityField/types';
import { useFieldDialogContext } from './FieldDialogContext';
import noop from 'lodash/noop';

export const SUPPORTED_FIELD_TYPES = [
  // 'Array',
  'Boolean'
  // 'Date',
  // 'Integer',
  // 'Number',
  // 'Symbol',
  // 'Text',
];

export interface InitialValueTabComponentProps {
  ctField: { localized: boolean; type: string };
  availableWidgets: Widget[];
}

const createFakeFieldAPI = ({ field, settings, locale }: any) => {

  return {
    field: {
      ...field,
      locale,
      getValue: () => Promise.resolve(false),
      removeValue: () => {
      },
      setValue: async (value: any) => {
        console.log(value);
        // contentType.fields['blabla'].initialValue['en-US'] = value
      },
      onSchemaErrorsChanged: noop,
      onIsDisabledChanged: noop,
      onValueChanged: noop,
      isEqualValues: noop
    },
    parameters: {
      installation: {},
      instance: settings
    }
  };
};

const FieldWithSdk = ({ locale }: any) => {
  const fieldContext = useFieldDialogContext();
  const { field, parameters } = createFakeFieldAPI({ ...fieldContext, locale });

  return <BooleanEditor field={field} isInitiallyDisabled={false} parameters={parameters}/>;
};

const LocalisedField = ({ locale }: any) => {

  return (
    <>
      <div>{locale}</div>
      <FieldWithSdk locale={locale}/>
    </>
  );
};

const InitialValueTabComponent = ({ ctField, availableWidgets }: InitialValueTabComponentProps) => {
  const { fieldSdk, fieldParameters } = useFieldDialogContext();
  const isFieldTypeSupported = SUPPORTED_FIELD_TYPES.includes(ctField.type);

  if (!isFieldTypeSupported) {
    return (
      <Fragment>
        Initial values are still a work in progress. The type of field you are working with is not
        supported yet.
      </Fragment>
    );
  }

  if (!ctField.localized) {
    return <FieldWithSdk locale={TheLocaleStore.getDefaultLocale()}/>;
  }

  const locales = TheLocaleStore.getPrivateLocales(); //.map((locale) => locale.name);
  const widgets = availableWidgets;

  return (
    <>
      {locales.map((locale) => <LocalisedField locale={locale.code}/>)}
    </>
  );


  // return (
  //   <Fragment>
  //     {locales.map((locale) => {
  //       return (
  //         <EntityFieldControl
  //           hasInitialFocus={false}
  //           doc
  //           editorData
  //           fieldLocale
  //           fieldLocaleListeners
  //           loadEvents={undefined}
  //           locale={locale}
  //           localeData
  //           onBlur={() => {
  //           }}
  //           onFocus={() => {
  //           }}
  //           preferences={{}}
  //           setInvalid={() => {
  //           }}
  //           widget={widgets[0]}
  //         />
  //       );
  //     })}
  //   </Fragment>
  // );
};

// InitialValueTabComponent.propTypes = {
//   editorInterface: PropTypes.object.isRequired,
//   contentType: PropTypes.object.isRequired,
//   widgetSettings: PropTypes.shape({
//     namespace: PropTypes.string.isRequired,
//     id: PropTypes.string.isRequired,
//     params: PropTypes.object,
//   }).isRequired,
//   setWidgetSettings: PropTypes.func.isRequired,
// };

export { InitialValueTabComponent };
