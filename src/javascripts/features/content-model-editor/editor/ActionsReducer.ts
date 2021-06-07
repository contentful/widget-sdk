import _ from 'lodash';
import { syncControls } from 'widgets/EditorInterfaceTransformer';
import { ContentFields, ContentTypeProps, EditorInterfaceProps } from 'contentful-management/types';

export type ActionsState = {
  contentType: ContentTypeProps;
  contextState: { isNew: boolean; dirty: boolean };
  editorInterface: EditorInterfaceProps;
};

export enum reducerActions {
  UPDATE_FIELDS = 'UPDATE_FIELDS',
  SET_CONTEXT_STATE_DIRTY = 'SET_CONTEXT_DIRTY',
  SET_CONTENT_TYPE = 'SET_CONTENT_TYPE',
  UPDATE_EDITOR_INTERFACE = 'UPDATE_EDITOR_INTERFACE',
  SET_FIELD_AS_TITLE = 'SET_FIELD_AS_TITLE',
  ADD_FIELD = 'ADD_FIELD',
  REMOVE_FIELD = 'REMOVE_FIELD',
  UPDATE_CT_METADATA = 'UPDATE_CT_METADATA',
}

type UpdateFieldsAction = {
  type: reducerActions.UPDATE_FIELDS;
  payload: { fields: ContentTypeProps['fields'] };
};
type SetDirtyAction = { type: reducerActions.SET_CONTEXT_STATE_DIRTY; payload: { dirty: boolean } };
type SetContentTypeAction = {
  type: reducerActions.SET_CONTENT_TYPE;
  payload: { contentType: ContentTypeProps };
};
type UpdateEditorInterfaceAction = {
  type: reducerActions.UPDATE_EDITOR_INTERFACE;
  payload: { editorInterface: EditorInterfaceProps };
};
type SetFieldAsTitleAction = {
  type: reducerActions.SET_FIELD_AS_TITLE;
  payload: { field: ContentFields };
};
type AddFieldAction = { type: reducerActions.ADD_FIELD; payload: { field: ContentFields } };
type RemoveFieldAction = { type: reducerActions.REMOVE_FIELD; payload: { id: string } };
type UpdateCTMetadata = {
  type: reducerActions.UPDATE_CT_METADATA;
  payload: { name: string; description: string };
};
export type ReducerAction =
  | UpdateFieldsAction
  | SetDirtyAction
  | SetContentTypeAction
  | UpdateEditorInterfaceAction
  | SetFieldAsTitleAction
  | AddFieldAction
  | RemoveFieldAction
  | UpdateCTMetadata;

export const initActionsReducer = ({
  isNew,
  editorInterface,
  contentTypeData,
}: {
  isNew: boolean;
  editorInterface: EditorInterfaceProps | Record<string, unknown>;
  contentTypeData: ContentTypeProps | Record<string, unknown>;
}) => {
  return {
    editorInterface: editorInterface as EditorInterfaceProps,
    contentType: contentTypeData as ContentTypeProps,
    contextState: { isNew, dirty: false },
  };
};

const updateFields = (state: ActionsState, { fields }: UpdateFieldsAction['payload']) => {
  const clonedState = _.cloneDeep(state);
  clonedState.contentType = { ...clonedState.contentType, fields };
  clonedState.contextState.dirty = true;
  return clonedState;
};

const setContextStateDirty = (state: ActionsState, { dirty }: SetDirtyAction['payload']) => {
  const clonedState = _.cloneDeep(state);
  clonedState.contextState.dirty = dirty;
  return clonedState;
};

const setContentType = (state: ActionsState, { contentType }: SetContentTypeAction['payload']) => {
  const clonedState = _.cloneDeep(state);
  clonedState.contentType = contentType;
  return clonedState;
};

const updateEditorInterface = (
  state: ActionsState,
  { editorInterface }: UpdateEditorInterfaceAction['payload']
) => {
  const clonedState = _.cloneDeep(state);
  clonedState.editorInterface = editorInterface;
  return clonedState;
};

const setFieldAsTitle = (state: ActionsState, { field }: SetFieldAsTitleAction['payload']) => {
  const clonedState = _.cloneDeep(state);
  clonedState.contentType.displayField = field.id;
  clonedState.contextState.dirty = true;
  return clonedState;
};

const addField = (state: ActionsState, { field }: AddFieldAction['payload']) => {
  const clonedState = _.cloneDeep(state);
  clonedState.contentType.fields = [...clonedState.contentType.fields, field];
  clonedState.editorInterface.controls = syncControls(
    clonedState.contentType,
    clonedState.editorInterface.controls
  );
  clonedState.contextState.dirty = true;
  return clonedState;
};

const removeField = (state: ActionsState, { id }: RemoveFieldAction['payload']) => {
  const clonedState = _.cloneDeep(state);
  const fields = clonedState.contentType.fields;
  _.remove(fields, { id: id });
  clonedState.contentType.fields = fields;
  clonedState.editorInterface.controls = syncControls(
    clonedState.contentType,
    clonedState.editorInterface.controls
  );
  clonedState.contextState.dirty = true;
  return clonedState;
};

const updateCTMetadata = (
  state: ActionsState,
  { name, description }: UpdateCTMetadata['payload']
) => {
  const clonedState = _.cloneDeep(state);
  clonedState.contentType.name = name;
  clonedState.contentType.description = description;
  clonedState.contextState.dirty = true;
  return clonedState;
};

export function reducer(state: ActionsState, action: ReducerAction) {
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
      // @ts-expect-error arg type mismatch
      throw new Error({ message: 'Unknown action', action });
  }
}
