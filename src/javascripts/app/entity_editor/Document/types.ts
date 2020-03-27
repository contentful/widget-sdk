import { Property, Stream } from 'kefir';
import { State } from 'data/CMA/EntityState';

interface EntitySys {
  type: 'Entry' | 'Asset';
  version: number;
  contentType: {
    sys: { id: string };
  };
}

interface Entity {
  sys: EntitySys;
  data: any;
}

type Path = string[];

// eslint-disable-next-line no-unused-vars
interface EntityDocument {
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

  removeValueAt(path: Path): Promise<undefined>;

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
    can(action: string): boolean;
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
