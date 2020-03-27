export default function checkDependencies(name, dependencies, requiredDependencies) {
  requiredDependencies.forEach((key) => {
    if (!(key in dependencies)) {
      throw new Error(`"${key}" not provided to ${name}.`);
    }
  });

  return dependencies;
}
