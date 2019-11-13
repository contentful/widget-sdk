const LocalesUsageStatus = {
  NO_MULTIPLE_LOCALES: 'NO_MULTIPLE_LOCALES',
  ONE_LOCALE_USED: 'ONE_LOCALE_USED',
  MORE_THAN_ONE_LOCALE_USED: 'MORE_THAN_ONE_LOCALE_USED',
  LOCALES_LIMIT_REACHED: 'LOCALES_LIMIT_REACHED',
  UNKNOWN: 'UNKNOWN'
};

export function getLocalesUsageStatus({ canCreateMultipleLocales, locales, localeResource }) {
  const len = locales.length;
  if (!canCreateMultipleLocales) {
    return LocalesUsageStatus.NO_MULTIPLE_LOCALES;
  }
  const reachedLimit = localeResource.usage >= localeResource.limits.maximum;
  if (!reachedLimit && len <= 1) {
    return LocalesUsageStatus.ONE_LOCALE_USED;
  } else if (!reachedLimit && len > 1) {
    return LocalesUsageStatus.MORE_THAN_ONE_LOCALE_USED;
  } else if (reachedLimit) {
    return LocalesUsageStatus.LOCALES_LIMIT_REACHED;
  } else {
    return LocalesUsageStatus.UNKNOWN;
  }
}

export default LocalesUsageStatus;
