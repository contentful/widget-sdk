import {set} from "lodash"
import {Control} from "features/widget-renderer/interfaces";

export const getCurrentState = async (spaceContext, appId) => {
  const {items: editorInterfaces} = await spaceContext.cma.getEditorInterfaces();

  const CurrentState = {EditorInterface: {}};

  for (const editorInterface of editorInterfaces) {
    const contentTypeId = editorInterface.sys?.contentType?.sys?.id;

    if (!contentTypeId) {
      continue;
    }

    const controlsUsingApp = getControlsUsingApp(appId, editorInterface);
    const isIncludedInControls = controlsUsingApp.length > 0;

    const positionInSidebar = getPositionInSidebar(appId, editorInterface);
    const isIncludedInSidebar = positionInSidebar > -1;

    if (isIncludedInEditors(appId, editorInterface)) {
      set(CurrentState.EditorInterface, [contentTypeId, 'editor'], true)
    }

    if (isIncludedInControls) {
      const newControls = CurrentState.EditorInterface[contentTypeId]?.controls ?? []
      set(CurrentState.EditorInterface, [contentTypeId, 'controls'], newControls.concat(controlsUsingApp.map((ei) => ({fieldId: ei.fieldId}))))
    }

    if (isIncludedInSidebar) {
      set(CurrentState.EditorInterface, [contentTypeId, 'sidebar'], {position: positionInSidebar});
    }
  }

  return CurrentState;
}

const isIncludedInEditors = (appId, editorInterface): Boolean => {
  if (editorInterface.editor) {
    return appId === editorInterface.editor.widgetId;
  } else if (editorInterface.editors) {
    return editorInterface.editors.some(({widgetId}) => widgetId === appId);
  }

  return false;
};

const getControlsUsingApp = (appId, editorInterface): Array<Control> => {
  if (editorInterface.controls) {
    return editorInterface.controls.filter(({widgetId}) => widgetId === appId);
  }
  return [];
};

const getPositionInSidebar = (appId, editorInterface) => {
  if (editorInterface.sidebar) {
    return editorInterface.sidebar.findIndex(({widgetId}) => widgetId === appId);
  }
  return -1;
};