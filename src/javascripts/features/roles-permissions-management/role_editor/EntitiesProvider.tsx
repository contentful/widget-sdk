import * as React from 'react';
import { EntryProps, AssetProps } from 'contentful-management/types';

type EntityProps = EntryProps | AssetProps;

type EntitiesItem<T extends EntityProps> = { entity: { data: T } };

type Entities = {
  Entry: Record<string, EntitiesItem<EntryProps>>;
  Asset: Record<string, EntitiesItem<AssetProps>>;
};

type EntityType = 'asset' | 'entry';

type EntitiesContextValue = {
  entities: Entities;
  fetchEntities: () => Promise<void>;
  fetchEntity: (id: string, type: EntityType) => Promise<void>;
};

export const EntitiesContext = React.createContext<EntitiesContextValue>({
  entities: { Entry: {}, Asset: {} },
  fetchEntities: () => Promise.resolve(),
  fetchEntity: () => Promise.resolve(),
});

type Props = React.PropsWithChildren<{
  getEntities: () => Promise<Entities>;
  getEntity: <T extends EntityProps>(
    id: string,
    type: EntityType
  ) => Promise<{ entity: { data: T } } | void>;
}>;

type Action =
  | {
      type: 'setEntities';
      value: Entities;
    }
  | {
      type: 'addEntry';
      value: EntitiesItem<EntryProps>;
    }
  | {
      type: 'addAsset';
      value: EntitiesItem<AssetProps>;
    };

const reducer = (state: Entities, action: Action): Entities => {
  switch (action.type) {
    case 'setEntities':
      return action.value;
    case 'addEntry':
      return {
        ...state,
        Entry: { ...state.Entry, [action.value.entity.data.sys.id]: action.value },
      };
    case 'addAsset':
      return {
        ...state,
        Asset: { ...state.Asset, [action.value.entity.data.sys.id]: action.value },
      };
    default:
      return state;
  }
};

export const EntitiesProvider: React.FC<Props> = ({ children, getEntities, getEntity }) => {
  const [entities, dispatch] = React.useReducer(reducer, { Entry: {}, Asset: {} });

  const fetchEntities = React.useCallback(async () => {
    const result = await getEntities();
    dispatch({ type: 'setEntities', value: result });
  }, [getEntities, dispatch]);

  const fetchEntity = React.useCallback(
    async (id: string, type: EntityType) => {
      let result;
      switch (type) {
        case 'entry':
          result = await getEntity<EntryProps>(id, type);
          if (result) {
            dispatch({ type: 'addEntry', value: result });
          }
          break;
        case 'asset':
          result = await getEntity<AssetProps>(id, type);
          if (result) {
            dispatch({ type: 'addAsset', value: result });
          }
          break;
      }
    },
    [getEntity, dispatch]
  );

  return (
    <EntitiesContext.Provider value={{ entities, fetchEntities, fetchEntity }}>
      {children}
    </EntitiesContext.Provider>
  );
};
