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

  if (subDirectoriesWithoutOwners.length > 0) {
    console.error("WARNING: Some code directories don't have declared owners:\n");

    subDirectoriesWithoutOwners.forEach((dir) => console.log(`• ${dir}`));

    console.error(
      '\nPlease declare owners for these directories, by adding them to `/.github/CODEOWNERS`.\nVisit https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/about-code-owners#codeowners-syntax for more information.\n\n'
    );

    process.exit(0);
  } else {
    console.log(
      'All specified code directories are covered by the CODEOWNERS file, which declares their respective owners.'
    );
    process.exit(0);
  }
}

check();
