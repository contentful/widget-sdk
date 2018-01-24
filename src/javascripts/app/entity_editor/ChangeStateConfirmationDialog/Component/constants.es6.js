export const RequestState = {
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error'
};

export const EntityType = {
  ENTRY: 'Entry',
  ASSET: 'Asset'
};

export const NumberOfLinks = {
  ZERO: 0,
  ONE: 1,
  MANY: 2
};

export const getNumberOfLinks = links => {
  if (links.length === 0) {
    return NumberOfLinks.ZERO;
  } else if (links.length === 1) {
    return NumberOfLinks.ONE;
  }
  return NumberOfLinks.MANY;
};
