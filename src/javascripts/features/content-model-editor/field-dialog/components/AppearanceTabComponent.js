import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import getDefaultWidgetId from 'widgets/DefaultWidget';
import { WidgetNamespace, isCustomWidget } from '@contentful/widget-renderer';
import { FieldDialogAppearanceTab } from './FieldDialogAppearanceTab';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isAdmin } from 'core/services/SpaceEnvContext/utils';

const getDefaultWidget = (ctField, contentType, availableWidgets) => {
  const defaultWidgetId = getDefaultWidgetId(ctField, contentType.displayField);
  return availableWidgets.find((w) => {
    return w.namespace === WidgetNamespace.BUILTIN && w.id === defaultWidgetId;
  });
};

const AppearanceTabComponent = ({
  ctField,
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
  const { currentSpace } = useSpaceEnvContext();
  const hasCustomEditor = (editorInterface.editors || []).some((editor) => {
    return isCustomWidget(editor.widgetNamespace);
  });

  const onSelect = ({ id, namespace }) => {
    setWidgetSettings({ ...widgetSettings, id, namespace });
  };

  const onParametersUpdate = (params) => {
    setWidgetSettings({ ...widgetSettings, params });
  };

  return (
    <FieldDialogAppearanceTab
      isAdmin={isAdmin(currentSpace)}
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
  contentType: PropTypes.object.isRequired,
  widgetSettings: PropTypes.shape({
    namespace: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    params: PropTypes.object,
  }).isRequired,
  setWidgetSettings: PropTypes.func.isRequired,
  availableWidgets: PropTypes.array.isRequired,
};

export { AppearanceTabComponent };
