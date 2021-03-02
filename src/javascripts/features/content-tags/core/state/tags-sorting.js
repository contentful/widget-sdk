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
  [ORDER_TAG.nameDESC]: [['nameCI'], ['desc']],
  [ORDER_TAG.nameASC]: [['nameCI'], ['asc']],
  [ORDER_TAG.idDESC]: [['idCI'], ['desc']],
  [ORDER_TAG.idASC]: [['idCI'], ['asc']],
};

const tagsSorter = (tags, sortType) => {
  // This is not pretty, but lodash's ordering is case sensitive
  return orderBy(
    tags.map((tag) => ({
      ...tag,
      nameCI: tag.name.toLowerCase(),
      idCI: tag.sys.id.toLowerCase(),
    })),
    ...SORT_BY[sortType]
  ).map(({ nameCI: _nameCI, idCI: _idCI, ...tag }) => tag);
};

export { ORDER_TAG, tagsSorter };
