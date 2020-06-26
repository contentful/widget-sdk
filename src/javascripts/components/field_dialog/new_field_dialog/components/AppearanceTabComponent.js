import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import getDefaultWidgetId from 'widgets/DefaultWidget';
import { NAMESPACE_BUILTIN, NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces';
import FieldDialogAppearanceTab from 'components/field_dialog/appearance/FieldDialogAppearanceTab';

const getDefaultWidget = (ctField, contentType, availableWidgets) => {
  const defaultWidgetId = getDefaultWidgetId(ctField, contentType.data.displayField);
  return availableWidgets.find((w) => {
    return w.namespace === NAMESPACE_BUILTIN && w.id === defaultWidgetId;
  });
};

const AppearanceTabComponent = ({
  ctField,
  spaceContext,
  contentType,
  widgetSettings,
  setWidgetSettings,
  editorInterface,
  availableWidgets,
}) => {
  const defaultWidget = useMemo(() => getDefaultWidget(ctField, contentType, availableWidgets), [
    ctField,
    contentType,
    availableWidgets,
  ]);

  const isAdmin = !!spaceContext.getData('spaceMember.admin', false);
  const hasCustomEditor =
    editorInterface.editor && editorInterface.editor.widgetNamespace === NAMESPACE_EXTENSION;

  const onSelect = ({ id, namespace }) => {
    setWidgetSettings({ ...widgetSettings, id, namespace });
  };

  const onParametersUpdate = (params) => {
    setWidgetSettings({ ...widgetSettings, params });
  };

  return (
    <FieldDialogAppearanceTab
      isAdmin={isAdmin}
      availableWidgets={availableWidgets}
      defaultWidget={defaultWidget}
      widgetSettings={widgetSettings}
      onSelect={onSelect}
      onParametersUpdate={onParametersUpdate}
      hasCustomEditor={hasCustomEditor}
    />
  );
};

AppearanceTabComponent.propTypes = {
  editorInterface: PropTypes.object.isRequired,
  ctField: PropTypes.object.isRequired,
  spaceContext: PropTypes.object.isRequired,
  contentType: PropTypes.object.isRequired,
  widgetSettings: PropTypes.shape({
    namespace: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    params: PropTypes.object,
  }).isRequired,
  setWidgetSettings: PropTypes.func.isRequired,
  availableWidgets: PropTypes.array.isRequired,
};

export default AppearanceTabComponent;
