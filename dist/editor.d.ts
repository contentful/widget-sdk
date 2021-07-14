import { EditorInterface, SharedEditorSDK } from './types'
import { Channel } from './channel'
export default function createEditor(
  channel: Channel,
  editorInterface: EditorInterface
): SharedEditorSDK['editor']
