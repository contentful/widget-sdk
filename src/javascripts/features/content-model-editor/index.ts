export { openFieldModalDialog } from './field-dialog/FieldModalDialog';
export { getUpdatedField } from './field-dialog/utils/getUpdatedField';

export { reducer as widgetsConfigReducer } from './editor/WidgetsConfiguration/WidgetsConfigurationReducer';
export { WidgetsConfiguration } from './editor/WidgetsConfiguration';
export { WidgetParametersConfiguration } from './editor/WidgetsConfiguration/WidgetParametersConfiguration';
export { isSameWidget } from './editor/WidgetsConfiguration/utils';
export { useCreateActions } from './editor/Actions';
export { ContentTypePageContainer } from './editor/ContentTypePageContainer';

export type { State } from './editor/WidgetsConfiguration/WidgetsConfigurationReducer';
export type {
  ConfigurationItem,
  DefaultWidget,
  SavedConfigItem,
} from './editor/WidgetsConfiguration/interfaces';
