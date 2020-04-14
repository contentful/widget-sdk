> id: UIEP-0009
> title: Project structure guidelines and principles
> champions: Alex Suevalov
> endDate: 9 April 2020
> status: Approved

# [UIEP-0009] Project structure guidelines and principles

# Motivation

Our current project structure clearly lacks a system that everyone is following. There are significant differences in how we organize code in different folders. Because of that, we have the following problems:

The project structure is not welcoming for new people and significantly complicates an onboarding process.
The project structure is really hard to navigate through. A lot of people use grep or full-text search to find a file they need.
There are no clear boundaries between features so usually features have strong cohesion and interconnection and are really hard to remove / to modify.

This proposal tries to define a set of guidelines that should improve project structure over time and solve the problems highlighted above.

# Principles

> Feature is a self-contained user-facing reusable complex building block.

## 1. Feature folders.

All artifacts that are used only in the feature should be placed inside the corresponding feature folder.

* routes
* components
* utils
* styles
* images, svg files
* unit tests (as .spec.js files next to the files they test)
* services
* etc.

Features can encapsulate other features. So, the following structure is allowed:

```
features
--entry-editor
----entry-editor-sidebar
----entry-editor-widgets
----
```

## 2. Decoupling and isolation.

We should avoid hard circular dependencies between features.

> Hard dependency from B to A: When feature A is based on feature B and B will not work without A.

> Soft dependency from A to B: When feature A uses some artifacts from B to provide new capabilities, but without B, A still works by simple removal of related code.

To control coupling we can introduce the following rule:

Features can use other features only through their __public API__.

```js
// not ok
import { someModule } from 'features/my-feature/some/internal/module';

// ok
// it means someModule is a part of public API of `my-feature`
import { someModule } from 'features/my-feature';
```

Features can use any technologies inside if they not intended to be used outside of the feature:

* Typescript or Javascript. It allows adopting Typescript gradually, feature by feature.
* Different state management solutions if needed. For example, requirements in `entry-editor` feature can be really different from `org-management` views
* Isolated proof of concepts and alpha versions

When you write your code, always optimize for ease of removal - it helps to avoid creating hard dependencies.

### Update

We want to introduce two levels of features: privileged and non-privileged. The difference is that privileged features can access both the shared core code and external interface of a different feature, while non-privileged features can only access the shared core code, and cannot access another feature in any way. The default would be non-privileged - a truly indendent module that depends only on `core`.

## 3. Strict core

Of course, there will be code used by all or the majority of the features.

```
core/components
core/services/
core/utils/
core/...
```

* Core modules can be imported by any feature.
* Core modules know nothing about concrete features and can't import any files from feature folders.

Principles to follow when writing the core code:

* Write more tests
* Carefully designed API and avoiding breaking changes
* More diligent code reviews
* Typed language if possible

# Action items

1. Identify and list all the features that we have in the web app.
2. Identify essential modules and move them to the `core` folder.
3. Setup automation to enforce and validate the rules we agree on for `features` and `core` folders.
  * `eslint` and `dependency-cruiser`
4. Come up with a more granular set of rules for feature folders:
  * `routes` folder
  * `components` folder
  * etc
5. Create `features` folder and start moving features one by one.

## Concrete ESLint rules proposed by others

* Use index.js files only for exporting other modules. Discourage writing actual code in index.js files. Brought by @guilebarbosa .

* Limit the number of public React components per file. Discourage writing several exported React components in one file. Brought by @giotiskl
