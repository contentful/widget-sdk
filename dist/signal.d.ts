declare class Signal {
  private _id
  private _listeners
  dispatch(...args: any[]): void
  attach(listener: Function): () => boolean
}
declare const memArgsSymbol = '__private__memoized__arguments__'
declare class MemoizedSignal extends Signal {
  private [memArgsSymbol]
  constructor(...memoizedArgs: any[])
  dispatch(...args: any[]): void
  attach(listener: Function): () => boolean
}
export { Signal, MemoizedSignal }
