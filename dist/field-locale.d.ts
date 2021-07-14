import { Channel } from './channel'
import { FieldAPI, FieldInfo, Items } from './types'
export default class FieldLocale implements FieldAPI {
  id: string
  locale: string
  type: string
  required: boolean
  validations: any[]
  items?: Items
  private _value
  private _valueSignal
  private _isDisabledSignal
  private _schemaErrorsChangedSignal
  private _channel
  constructor(channel: Channel, info: FieldInfo)
  getValue(): any
  setValue(value: any): any
  removeValue(): any
  setInvalid(isInvalid: boolean): any
  onValueChanged(handler: (value: any) => any): () => boolean
  onIsDisabledChanged(handler: (isDisabled: boolean) => any): () => boolean
  onSchemaErrorsChanged(handler: Function): () => boolean
}
