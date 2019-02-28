/*
  name
  description
  spaceIds
  memberIds
  links
  platforms
  sections
 */

const name = value => {
  const regexp = /[\w0-9 '-]+/;

  if (!regexp.exec(value)) {
    return 'Name is not valid';
  }

  return null;
};

module.exports = {
  name
};
