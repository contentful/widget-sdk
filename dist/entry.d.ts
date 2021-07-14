import { Channel } from './channel'
import { EntryAPI, EntryFieldInfo } from './types'
export default function createEntry(
  channel: Channel,
  entryData: any,
  fieldInfo: EntryFieldInfo[],
  createEntryField: Function
): EntryAPI
