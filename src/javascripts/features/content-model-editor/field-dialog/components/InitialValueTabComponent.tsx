import React, { Fragment, useMemo } from 'react';
import { Flex, Grid, GridItem } from '@contentful/forma-36-react-components';

import TheLocaleStore from 'services/localeStore';
import { EntityFieldControl } from 'app/entity_editor/EntityField/EntityFieldControl';
import type { Widget } from 'app/entity_editor/EntityField/types';

export const SUPPORTED_FIELD_TYPES = [
  // 'Array',
  'Boolean',
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

const InitialValueTabComponent = ({ ctField, availableWidgets }: InitialValueTabComponentProps) => {
  const isFieldTypeSupported = SUPPORTED_FIELD_TYPES.includes(ctField.type);

  if (!isFieldTypeSupported) {
    return (
      <Fragment>
        Initial values are still a work in progress. The type of field you are working with is not
        supported yet.
      </Fragment>
    );
  }

  const locales = TheLocaleStore.getPrivateLocales(); //.map((locale) => locale.name);
  const widgets = availableWidgets;

  if (ctField.localized) {
    return null;
    // return (
    //   <Grid>
    //     {locales.map((locale) => {
    //       return (
    //         <GridItem key={locale}>
    //           <Flex>{locale}</Flex>
    //         </GridItem>
    //       );
    //     })}
    //   </Grid>
    // );
  }

  return (
    <Fragment>
      {locales.map((locale) => {
        return (
          <EntityFieldControl
            hasInitialFocus={false}
            doc
            editorData
            fieldLocale
            fieldLocaleListeners
            loadEvents={undefined}
            locale={locale}
            localeData
            onBlur={() => {}}
            onFocus={() => {}}
            preferences={{}}
            setInvalid={() => {}}
            widget={widgets[0]}
          />
        );
      })}
    </Fragment>
  );
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
