# Features

All artifacts that are used only in the feature should be placed inside the corresponding feature folder.

- routes
- components
- utils
- styles
- images, svg files
- unit tests (as .spec.js files next to the files they test)
- services
- etc.

Features can encapsulate other features. So, the following structure is allowed:

```
features
--entry-editor
----entry-editor-sidebar
----entry-editor-widgets
----
```

### Decoupling and isolation.

We should avoid hard circular dependencies between features.

> Hard dependency from B to A: When feature A is based on feature B and B will not work without A.

> Soft dependency from A to B: When feature A uses some artifacts from B to provide new capabilities, but without B, A still works by simple removal of related code.

To control coupling we can introduce the following rule:

Features can use other features only through their **public API**.

```js
// not ok
import { someModule } from 'features/my-feature/some/internal/module';

// ok
// it means someModule is a part of public API of `my-feature`
import { someModule } from 'features/my-feature';
```

Features can use any technologies inside if they not intended to be used outside of the feature:

- Typescript or Javascript. It allows adopting Typescript gradually, feature by feature.
- Different state management solutions if needed. For example, requirements in `entry-editor` feature can be really different from `org-management` views
- Isolated proof of concepts and alpha versions

When you write your code, always optimize for ease of removal - it helps to avoid creating hard dependencies.
