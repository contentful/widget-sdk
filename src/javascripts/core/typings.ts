import {
  EntryProps,
  AssetProps,
  ContentTypeProps,
  ContentFields,
  EditorInterfaceProps,
} from 'contentful-management/types';

export type Entry = EntryProps;
export type Asset = AssetProps;
export type Entity = Entry | Asset;
export type ContentType = ContentTypeProps;
export type ContentTypeField = ContentFields;
export type EditorInterface = EditorInterfaceProps;
