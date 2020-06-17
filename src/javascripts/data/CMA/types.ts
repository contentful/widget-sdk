import { Entity } from 'app/entity_editor/Document/types';

export type SpaceEndpoint = {
  (body: object, headers: object): Promise<Entity>;
  envId: string;
};
