import React, { useCallback } from 'react';
import classNames from 'classnames';
import { Note } from '@contentful/forma-36-react-components';
import { FieldDialogWidgetsList } from './FieldDialogWidgetsList';
import WidgetParametersForm from 'widgets/WidgetParametersForm';
import * as WidgetParametersUtils from 'widgets/WidgetParametersUtils';

import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  container: css({
    position: 'relative',
  }),
  note: css({
    marginBottom: tokens.spacingL,
  }),
  widgetOptions: css({
    position: 'relative',
    padding: `${tokens.spacingL} 0`,
    backgroundColor: tokens.colorWhite,
    borderTop: `1px solid ${tokens.colorElementMid}`,
  }),
};

type FieldDialogAppearanceTabProps = {
  isAdmin: boolean;
  availableWidgets: any[];
  defaultWidget: {
    namespace: string;
    id: string;
  };
  widgetSettings: {
    namespace: string;
    id: string;
    params?: Object;
  };
  onSelect: Function;
  onParametersUpdate: Function;
  hasCustomEditor?: boolean;
};

export function FieldDialogAppearanceTab(props: FieldDialogAppearanceTabProps) {
  const {
    availableWidgets,
    widgetSettings,
    defaultWidget,
    isAdmin,
    hasCustomEditor,
    onParametersUpdate,
    onSelect,
  } = props;
  const widgetsCount = availableWidgets.length;
  const selectedWidget = availableWidgets.find((widget) => {
    return widget.namespace === widgetSettings.namespace && widget.id === widgetSettings.id;
  });
  const getFormProps = useCallback(
    (selectedWidget) => {
      let definitions = selectedWidget.parameters;
      const params = widgetSettings.params;

      const values = WidgetParametersUtils.applyDefaultValues(definitions, params);
      definitions = WidgetParametersUtils.filterDefinitions(definitions, values, selectedWidget);
      definitions = WidgetParametersUtils.unifyEnumOptions(definitions);

      return {
        definitions,
        values,
        missing: WidgetParametersUtils.markMissingValues(definitions, values),
        updateValue: (id, value) => {
          onParametersUpdate({
            ...values,
            [id]: value,
          });
        },
      };
    },
    [widgetSettings, onParametersUpdate]
  );

  return (
    <div>
      {hasCustomEditor && (
        <Note noteType="primary" className={styles.note}>
          You are using a custom entry editor for this content type. Therefore, these settings might
          not affect how fields are displayed in the editor.
        </Note>
      )}
      <div className={styles.container}>
        {widgetsCount === 0 && (
          <Note noteType="primary" className={styles.note}>
            No widgets for this field, please contact support.
          </Note>
        )}
        {widgetsCount > 0 && (
          <React.Fragment>
            <FieldDialogWidgetsList
              widgets={availableWidgets}
              onSelect={onSelect}
              selectedWidget={selectedWidget}
              defaultWidget={defaultWidget}
              isAdmin={isAdmin}
            />
            <div
              className={classNames('modal-dialog__slice', {
                [styles.widgetOptions]: availableWidgets.length > 1,
              })}>
              {selectedWidget && <WidgetParametersForm {...getFormProps(selectedWidget)} />}
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}
