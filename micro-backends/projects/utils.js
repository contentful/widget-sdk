const crypto = require('crypto');
const responses = require('./responses');
const validators = require('./validators');

/*
  Generates a random 12 character ID for a project
 */
function generateId() {
  // Arbitrary alphabet used for replacing
  const alphabet = 'at7ui0vm3xqlp8zr'.split('');

  // Generate a random base64 string that is 16 characters long
  const initialId = crypto.randomBytes(10).toString('base64');

  // Replace all + and / with the value at the offset of the match
  // in `initialId` and truncate to 12 characters
  return initialId
    .replace(/\+|\//gi, (_1, offset) => {
      return alphabet[offset];
    })
    .substr(0, 12);
}

function generateEmptyProject() {
  return {
    name: '',
    description: '',
    spaceIds: [],
    memberIds: [],
    links: [],
    platforms: [],
    sections: [],
    sys: {
      id: generateId()
    }
  };
}

function requireOrgId(cb) {
  return ({ req, kv, dependencies, meta }) => {
    if (!meta) {
      return responses.notFound();
    }

    const { orgId } = meta;

    if (!orgId) {
      return responses.notFound();
    }

    return cb({ req, kv, dependencies, meta });
  };
}

function requireProjectId(cb) {
  return requireOrgId(({ req, kv, dependencies, meta }) => {
    const { projectId } = meta;

    if (!projectId || projectId === '') {
      return responses.notFound();
    }

    return cb({ req, kv, dependencies, meta });
  });
}

function validate(name, value) {
  if (!validators[name]) {
    return null;
  }

  return validators[name](value);
}

module.exports = {
  generateEmptyProject,
  requireOrgId,
  requireProjectId,
  validate
};
