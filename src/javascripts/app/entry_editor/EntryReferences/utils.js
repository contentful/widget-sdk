export const pluralize = (amount, word) => {
  const plural = {
    was: 'were',
    reference: 'references',
    entry: 'entries',
    asset: 'assets',
    is: 'are',
  };

  return amount === 1 ? word : plural[word];
};

export const doesContainRoot = (selectedEntities, root) =>
  selectedEntities.some((entity) => entity.sys.id === root.sys.id);

export const createSuccessMessage = ({
  selectedEntities,
  root,
  entityTitle,
  action = 'published',
}) => {
  const doesContainRootEntry = doesContainRoot(selectedEntities, root);
  const referencesAmount = selectedEntities.length;
  const onlyRoot = referencesAmount === 1 && doesContainRootEntry;

  if (onlyRoot) {
    return `${entityTitle} was ${action} successfully`;
  }

  if (doesContainRootEntry) {
    return `${entityTitle} and ${referencesAmount - 1} ${pluralize(
      referencesAmount - 1,
      'reference'
    )} ${pluralize(referencesAmount - 1, 'was')} ${action} successfully`;
  }

  return `${referencesAmount} ${pluralize(referencesAmount, 'reference')} ${pluralize(
    referencesAmount,
    'was'
  )} ${action} successfully`;
};

export const createErrorMessage = ({
  selectedEntities,
  root,
  entityTitle,
  action = 'published',
}) => {
  const doesContainRootEntry = doesContainRoot(selectedEntities, root);
  const referencesAmount = selectedEntities.length;
  const onlyRoot = referencesAmount === 1 && doesContainRootEntry;

  if (onlyRoot) {
    return `We were unable to ${action} ${entityTitle}`;
  }

  if (doesContainRootEntry) {
    return `We were unable to ${action} ${entityTitle} and ${referencesAmount - 1} ${pluralize(
      referencesAmount - 1,
      'reference'
    )}`;
  }

  return `We are unable to ${action} ${referencesAmount} selected ${pluralize(
    referencesAmount,
    'reference'
  )}`;
};

export const createCountMessage = ({ selectedEntities, root }) => {
  const doesContainRootEntry = doesContainRoot(selectedEntities, root);
  const referencesAmount = selectedEntities.length;

  if (doesContainRootEntry) {
    return `This entry and ${referencesAmount - 1} ${pluralize(
      referencesAmount - 1,
      'reference'
    )} ${pluralize(referencesAmount - 1, 'is')} selected.`;
  }

  return `${referencesAmount} ${pluralize(referencesAmount, 'reference')} ${pluralize(
    referencesAmount,
    'is'
  )} selected.`;
};
