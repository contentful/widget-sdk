import { orderBy } from 'lodash';

const ORDER_TAG = {
  DESC: 'DESC',
  ASC: 'ASC',
  nameDESC: 'nameDESC',
  nameASC: 'nameASC',
  idDESC: 'idDESC',
  idASC: 'idASC',
};

const SORT_BY = {
  [ORDER_TAG.DESC]: [['sys.createdAt'], ['desc']],
  [ORDER_TAG.ASC]: [['sys.createdAt'], ['asc']],
  [ORDER_TAG.nameDESC]: [['name'], ['desc']],
  [ORDER_TAG.nameASC]: [['name'], ['asc']],
  [ORDER_TAG.idDESC]: [['sys.id'], ['desc']],
  [ORDER_TAG.idASC]: [['sys.id'], ['asc']],
};

const tagsSorter = (tags, sortType) => {
  return orderBy(tags, ...SORT_BY[sortType]);
};

export { ORDER_TAG, tagsSorter };
