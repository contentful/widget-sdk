export function ssoName(errorStatus = null) {
  if (errorStatus) {
    if (errorStatus === 422) {
      return 'This sign-in name is taken';
    } else {
      return 'Could not update field. Try again.';
    }
  } else {
    return 'Sign-in name format is not correct. Letters, numbers, periods, hyphens, and underscores are allowed.';
  }
}

export function idpCert(errorStatus = null) {
  if (errorStatus) {
    return 'Could not update field. Try again.';
  } else {
    return 'X.509 certificate format is not correct';
  }
}

export function idpSsoTargetUrl(errorStatus = null) {
  if (errorStatus) {
    return 'Could not update field. Try again.';
  } else {
    return 'URL is not valid';
  }
}
