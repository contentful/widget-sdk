import { Preferences } from 'app/widgets/ExtensionSDKs/createEditorApi';
import { EntityType } from 'contentful-ui-extensions-sdk';
import { EditorData } from '../EntityField/types';

export interface BulkEditorParams {
  fieldId: string;
  localeCode: string;
  focusedEntityIndex: number;
}

export type PreviousEntryId = string;

export type SlideInEditorType = 'BulkEditor' | EntityType;

interface SlideBase {
  type: SlideInEditorType;
}

interface SlideEntityEditor extends SlideBase {
  id: string;
  path: never;
}

interface SlideBulkEditor extends SlideBase {
  id: never;
  path: [string, string, string, number];
}

export type Slide = SlideEntityEditor | SlideBulkEditor;

export interface ViewProps {
  editorData: EditorData;
  trackLoadEvent?: Function;
  preferences: Preferences;
}

export interface LoadingError {
  statusCode: number;
  message?: string;
  body?: {
    message: string;
  };
}

export interface SlideState {
  key: string;
  slide: Slide;
  viewProps: ViewProps | null;
  loadingError: LoadingError | null;
}
