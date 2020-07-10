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
