import { Emitter, Property, Stream } from 'kefir';
import { State } from 'data/CMA/EntityState';

export interface EntitySys {
  type: 'Entry' | 'Asset';
  id: string;
  version: number;
  publishedVersion?: number;
  archivedVersion?: number;
  deletedVersion?: number;
  updatedAt: string;
  updatedBy: { sys: { id: number } };
  contentType: {
    sys: { id: string };
  };
}

export interface Entity {
  sys: EntitySys;
  fields: {
    [fieldName: string]: { [locale: string]: any };
  };
}

interface KefirBus<V> {
  end: Emitter<V, any>['end'];
  error: Emitter<V, any>['error'];
}

export interface StreamBus<V> extends KefirBus<V> {
  stream: Stream<V, any>;
  emit: Emitter<V, any>['emit'];
}

export interface PropertyBus<V> extends KefirBus<V> {
  property: Property<V, any>;
  set: Emitter<V, any>['emit'];
}

type Path = string[];

export interface Document {
  sysProperty: Property<EntitySys, any>;
  data$: Property<Entity, any>;
  state: {
    isSaving$: Property<boolean, any>;
    isConnected$: Property<boolean, any>;
    isDirty$: Property<boolean, any>;
    canEdit$: Property<boolean, any>;
    loaded$: Property<boolean, any>;
    error$: Property<any, any>;
  };
  changes: Stream<Path, any>;

  getVersion(): number;

  getValueAt(path: Path): any;

  setValueAt(path: Path, value: any): Promise<Entity>;

  pushValueAt(path: Path, value: any): Promise<Entity>;

  insertValueAt(path: Path, i: number, value: any): Promise<Entity>;

  removeValueAt(path: Path): Promise<void>;

  destroy(): void;

  resourceState: {
    apply(): Promise<Entity>;
    // @ts-ignore
    stateChange$: Stream<{ from: State; to: State }, any>;
    // @ts-ignore
    state$: Property<State, any>;
    inProgress$: Property<boolean, any>;
  };
  permissions: {
    /**
     * Returns true if the given action can be taken on the document.
     *
     * Supported actions are 'update', 'delete', 'publish',
     * 'unpublish', 'archive', 'unarchive'.
     */
    can(action: string): boolean;
    /**
     * Returns true if the field locale can be edited.
     * Accepts public IDs as parameters.
     *
     * This method is used by the 'FieldLocaleController'.
     */
    canEditFieldLocale(fieldId: string, localeCode: string): boolean;
  };
  presence: {
    collaborators: Property<any[], any>;
    collaboratorsFor(): Property<any[], any>;
    focus(fieldId: string, localeCode: string): void;
    leave(): void;
    destroy(): void;
  };
}
