module.exports = {
  forbidden: [
    {
      name: 'independent-core',
      severity: 'error',
      comment: `Core modules should not depend on modules outside of the core`,
      from: {
        path: 'src/javascripts/core',
      },
      to: {
        pathNot: 'src/javascripts/core|node_modules',
      },
    },
    {
      name: 'features-only-public-api',
      comment: `Features can use other features only through their public API:
      import {} from 'features/other-feature';`,
      severity: 'error',
      from: { path: '^src/javascripts/features/([^/]+)/.+|^src/javascripts' },
      to: {
        path: '^src/javascripts/features/([^/]+)/.+',
        pathNot: '^src/javascripts/features/$1/.+|^src/javascripts/features/([^/]+)/index',
      },
    },
    {
      name: 'no-dependent-features',
      comment: `Ideally we should avoid dependecies between features.
      Please, reconsider this dependency if possible.`,
      severity: 'warn',
      from: { path: '^src/javascripts/features/([^/]+)/.+' },
      to: {
        path: '^src/javascripts/features/([^/]+)/.+',
        pathNot: '^src/javascripts/features/$1/.+',
      },
    },
    {
      name: 'no-unreachable-from-root',
      severity: 'error',
      comment: `This module is unreachable from an entry point and it's likely not used (anymore?).
        Either use it or remove it. If it's logical this module is not reachable,
      add an exception for it in your dependency-cruiser configuration.`,
      from: {
        path: 'prelude\\.js$',
      },
      to: {
        path: 'src',

        /*
            spec files shouldn't be reachable from regular code anyway, so you
            might typically want to exclude these from reachability rules.
            The same goes for typescript definition files:
           */
        pathNot:
          'unused__|__mocks__|__tests__|__fixtures__|saved-views-migrator|test\\/helpers|\\.spec\\.(js|ts|tsx)$|\\.d\\.ts$',

        /*
            for each file matching path and pathNot, check if it's reachable from the
            modules matching the criteria mentioned in "from"
           */
        reachable: false,
      },
    },
    {
      name: 'no-orphans',
      comment: `This is an orphan module - it's likely not used (anymore?).
        Either use it or remove it. If it's logical this module is an orphan (i.e. it's a config file),
        add an exception for it in your dependency-cruiser configuration.`,
      severity: 'error',
      from: {
        orphan: true,
        pathNot: '__mocks__|\\.d\\.ts$',
      },
      to: {},
    },
    {
      name: 'not-to-spec',
      comment:
        'This module depends on a spec (test) file. The sole responsibility of a spec file is to test code. ' +
        "If there's something in a spec that's of use to other modules, it doesn't have that single " +
        'responsibility anymore. Factor it out into (e.g.) a separate utility/ helper or a mock.',
      severity: 'error',
      from: {
        pathNot: '\\.spec\\.(js|ts|tsx)$',
      },
      to: {
        path: '\\.spec\\.(js|ts|tsx)$',
      },
    },

    {
      name: 'not-to-dev-dep',
      severity: 'error',
      comment: `This module depends on an npm package from the 'devDependencies' section of your
        package.json. It looks like something that ships to production, though. To prevent problems
        with npm packages that aren't there on production declare it (only!) in the 'dependencies'
        section of your package.json. If this module is development only - add it to the
        from.pathNot re of the not-to-dev-dep rule in the dependency-cruiser configuration`,
      from: {
        path: '^(src)',
        pathNot: '__tests__|\\.spec\\.(js|ts|tsx)$',
      },
      to: {
        dependencyTypes: ['npm-dev'],
      },
    },
    {
      name: 'no-circular',
      comment:
        'This dependency is part of a circular relationship. You might want to revise ' +
        'your solution (i.e. use dependency inversion, make sure the modules have a ' +
        'single responsibility) ',
      severity: 'error',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'no-duplicate-dep-types',
      comment:
        "Likley this module depends on an external ('npm') package that occurs more " +
        'than once in your package.json i.e. bot as a devDependencies and in dependencies. ' +
        "This will cause maintenance problems later on. If it's intentional, you can " +
        "disable this rule by adding this override as a rule in the 'forbidden' section " +
        'of your dependency-cruiser configuration: ' +
        '{"name": "no-duplicate-dep-types", "severity": "ignore"}',
      severity: 'warn',
      from: {},
      to: {
        moreThanOneDependencyType: true,
      },
    },
    {
      name: 'optional-deps-used',
      severity: 'info',
      comment:
        'This module depends on an npm package that is declared as an optional dependency ' +
        "in your package.json. As this makes sense in limited situations only, it's flagged here. " +
        "If you're using an optional dependency here by design - add an exception to your" +
        'depdency-cruiser configuration.',
      from: {},
      to: {
        dependencyTypes: ['npm-optional'],
      },
    },
    {
      name: 'peer-deps-used',
      comment:
        'This module depends on an npm package that is declared as a peer dependency ' +
        'in your package.json. This makes sense if your package is e.g. a plugin, but in ' +
        'other cases - maybe not so much. If the use of a peer dependency is intentional ' +
        'add an exception to your dependency-cruiser configuration.',
      severity: 'warn',
      from: {},
      to: {
        dependencyTypes: ['npm-peer'],
      },
    },
  ],
  options: {
    tsPreCompilationDeps: true,
    /* conditions specifying which files not to follow further when encountered:
       - path: a regular expression to match
       - dependencyTypes: see https://github.com/sverweij/dependency-cruiser/blob/master/doc/rules-reference.md#dependencytypes
       for a complete list
    */
    doNotFollow: {
      // path: 'node_modules',
      dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer', 'npm-bundled', 'npm-no-pkg'],
    },

    /* Webpack configuration to use to get resolve options from. */
    webpackConfig: {
      fileName: './tools/dependency-cruise/dependency-cruise-webpack.config.js',
    },
  },
};
