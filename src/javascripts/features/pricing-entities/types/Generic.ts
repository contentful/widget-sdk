// TODO(jo-sm): Move these to a more central location
export interface CollectionResponse<T> {
  sys: {
    type: 'Array';
  };
  limit: number;
  skip: number;
  total: number;
  items: T[];
}
