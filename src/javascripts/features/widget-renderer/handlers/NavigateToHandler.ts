import {WidgetRendererProps} from "../WidgetRenderer";

interface NavigateToBulkEditorOptions {
  entryId: string,
  fieldId: string,
  locale: string,
  index: number
}

export function makeNavigateToBulkEditorHandler(navigatorApi: WidgetRendererProps['apis']['navigator']) {
  return async function({ entryId, fieldId, locale, index }: NavigateToBulkEditorOptions) {
    navigatorApi.openBulkEditor(entryId, { fieldId, locale, index })
  }
}
