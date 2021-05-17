const { readdirSync } = require('fs');
const Codeowners = require('codeowners');

const DIRECTORIES_REQUIRING_OWNERSHIP = ['src/javascripts/features'];

function hasOwner(path, codeownersRepos) {
  const owners = codeownersRepos.getOwner(path);

  return owners.length > 0;
}

function getSubdirectories(path) {
  return readdirSync(path, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => `${path}/${dirent.name}/`);
}

async function check() {
  const codeownersRepos = new Codeowners();

  const subDirectoriesWithoutOwners = DIRECTORIES_REQUIRING_OWNERSHIP.flatMap(
    getSubdirectories
  ).filter((subDir) => !hasOwner(subDir, codeownersRepos));

  const codeownerDefinitionsWithoutTrailingSlash = codeownersRepos.ownerEntries
    .filter((item) => !item.path.endsWith('/'))
    .map((item) => item.path);

  if (codeownerDefinitionsWithoutTrailingSlash.length > 0) {
    console.error("WARNING: Some code owner rules don't end with trailing slash:\n");

    codeownerDefinitionsWithoutTrailingSlash.forEach((dir) => console.log(`• ${dir}`));

    console.error(
      '\nPlease add trailing slashes to make sure code review assignment works properly.\n'
    );

    process.exit(1);
  }

  if (subDirectoriesWithoutOwners.length > 0) {
    console.error("WARNING: Some code directories don't have declared owners:\n");

    subDirectoriesWithoutOwners.forEach((dir) => console.log(`• ${dir}`));

    console.error(
      '\nPlease declare owners for these directories, by adding them to `/.github/CODEOWNERS`.\nVisit https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/about-code-owners#codeowners-syntax for more information.\n\n'
    );

    process.exit(1);
  } else {
    console.log(
      'All specified code directories are covered by the CODEOWNERS file, which declares their respective owners.'
    );
    process.exit(0);
  }
}

check();
