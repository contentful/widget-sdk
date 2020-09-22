const SORT_BY = {
  DESC: (tag1, tag2) => tag1.sys.createdAt > tag2.sys.createdAt,
  ASC: (tag1, tag2) => tag1.sys.createdAt < tag2.sys.createdAt,
  nameDESC: (tag1, tag2) => tag1.name > tag2.name,
  nameASC: (tag1, tag2) => tag1.name < tag2.name,
  idDESC: (tag1, tag2) => tag1.sys.id > tag2.sys.id,
  idASC: (tag1, tag2) => tag1.sys.id < tag2.sys.id,
};

const tagsSorter = (tags, sortType) => {
  return tags.sort(SORT_BY[sortType]);
};

export { SORT_BY, tagsSorter };
