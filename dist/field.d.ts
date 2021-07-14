import { Channel } from './channel'
import FieldLocale from './field-locale'
import { EntryFieldAPI, EntryFieldInfo, Items } from './types'
export default class Field implements EntryFieldAPI {
  private _defaultLocale
  private _fieldLocales
  id: string
  locales: string[]
  type: string
  required: boolean
  validations: Object[]
  items?: Items
  constructor(channel: Channel, info: EntryFieldInfo, defaultLocale: string)
  getValue(locale?: string): any
  setValue(value: any, locale?: string): any
  removeValue(locale?: string): any
  onValueChanged(
    locale: string | ((value: any) => void),
    handler?: (value: any) => void
  ): () => boolean
  onIsDisabledChanged(
    locale: string | ((isDisabled: boolean) => void),
    handler?: (isDisabled: boolean) => void
  ): () => boolean
  private _getFieldLocale
  getForLocale(locale: string): FieldLocale
  assertHasLocale(locale: string): void
}
