import { Emitter, Property, Stream } from 'kefir';

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

export interface Link<T extends string> {
  sys: {
    id: string;
    type: 'Link';
    linkType: T;
  };
}

export interface Entity {
  sys: EntitySys;
  fields: {
    [fieldName: string]: { [locale: string]: any };
  };
  metadata?: {
    tags: Link<'Tag'>[];
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
