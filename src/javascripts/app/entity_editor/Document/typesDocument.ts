import { Property, Stream } from 'kefir';
import { ResourceStateManager } from 'data/document/ResourceStateManager';
import { Entity, EntitySys } from './types';

type Path = string[];

export interface Document {
  sysProperty: Property<EntitySys, any>;
  data$: Property<Entity, any>;
  state: {
    /**
     * True while the Document is persisting pending field changes.
     * Does not emit when persisting status updates (see `resourceState.inProgress$`
     * for this purpose instead)
     */
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

  resourceState: ResourceStateManager;
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
