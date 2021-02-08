import _ from 'lodash';
import { syncControls } from 'widgets/EditorInterfaceTransformer';

export const initActionsReducer = ({ isNew, editorInterface, contentTypeData }) => {
  return {
    editorInterface,
    contentType: { data: contentTypeData },
    contextState: { isNew, dirty: false },
  };
};
export const reducerActions = {
  UPDATE_FIELDS: 'UPDATE_FIELDS',
  SET_CONTEXT_STATE_DIRTY: 'SET_CONTEXT_DIRTY',
  SET_CONTENT_TYPE: 'SET_CONTENT_TYPE',
  UPDATE_EDITOR_INTERFACE: 'UPDATE_EDITOR_INTERFACE',
  SET_FIELD_AS_TITLE: 'SET_FIELD_AS_TITLE',
  ADD_FIELD: 'ADD_FIELD',
  REMOVE_FIELD: 'REMOVE_FIELD',
  UPDATE_CT_METADATA: 'UPDATE_CT_METADATA',
};

const updateFields = (state, { fields }) => {
  const clonedState = _.cloneDeep(state);
  clonedState.contentType.data = { ...clonedState.contentType.data, fields };
  clonedState.contextState.dirty = true;
  return clonedState;
};

const setContextStateDirty = (state, { dirty }) => {
  const clonedState = _.cloneDeep(state);
  clonedState.contextState.dirty = dirty;
  return clonedState;
};

const setContentType = (state, { contentType }) => {
  const clonedState = _.cloneDeep(state);
  clonedState.contentType = contentType;
  return clonedState;
};

const updateEditorInterface = (state, { editorInterface }) => {
  const clonedState = _.cloneDeep(state);
  clonedState.editorInterface = editorInterface;
  return clonedState;
};

const setFieldAsTitle = (state, { field }) => {
  const clonedState = _.cloneDeep(state);
  clonedState.contentType.displayField = field.id;
  clonedState.contextState.dirty = true;
  return clonedState;
};

const addField = (state, { field }) => {
  const clonedState = _.cloneDeep(state);
  clonedState.contentType.data.fields = [...clonedState.contentType.data.fields, field];
  clonedState.editorInterface.controls = syncControls(
    clonedState.contentType.data,
    clonedState.editorInterface.controls
  );
  clonedState.contextState.dirty = true;
  return clonedState;
};

const removeField = (state, { id }) => {
  const clonedState = _.cloneDeep(state);
  const fields = clonedState.contentType.data.fields;
  _.remove(fields, { id: id });
  clonedState.contentType.data.fields = fields;
  clonedState.editorInterface.controls = syncControls(
    clonedState.contentType.data,
    clonedState.editorInterface.controls
  );
  clonedState.contextState.dirty = true;
  return clonedState;
};

const updateCTMetadata = (state, { name, description }) => {
  const clonedState = _.cloneDeep(state);
  clonedState.contentType.data.name = name;
  clonedState.contentType.data.description = description;
  clonedState.contextState.dirty = true;
  return clonedState;
};

export function reducer(state, action) {
  switch (action.type) {
    case reducerActions.UPDATE_FIELDS:
      return updateFields(state, action.payload);
    case reducerActions.SET_CONTEXT_STATE_DIRTY:
      return setContextStateDirty(state, action.payload);
    case reducerActions.SET_CONTENT_TYPE:
      return setContentType(state, action.payload);
    case reducerActions.UPDATE_EDITOR_INTERFACE:
      return updateEditorInterface(state, action.payload);
    case reducerActions.SET_FIELD_AS_TITLE:
      return setFieldAsTitle(state, action.payload);
    case reducerActions.ADD_FIELD:
      return addField(state, action.payload);
    case reducerActions.REMOVE_FIELD:
      return removeField(state, action.payload);
    case reducerActions.UPDATE_CT_METADATA:
      return updateCTMetadata(state, action.payload);
    default:
      throw new Error({ message: 'Unknown action', action });
  }
}
