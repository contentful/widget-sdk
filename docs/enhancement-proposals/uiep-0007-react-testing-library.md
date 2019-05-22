> id: UIEP-0007
> title: Replace Enzyme with React Testing Library
> champions: Gui Barbosa (@guilebarbosa)
> endDate: May 24, 2019
> status: Open

# [UIEP-0007] Replace Enzyme with React Testing Library

## Introduction
We’ve been moving fast on the adoption of Hooks, but Enzyme is falling behind on adapting the library to support the new features of React. Currently, we can’t easily test components using hooks and I’m afraid that Enzyme will continue to be slower than others due to its complexity. The same happened when React introduced Fragments

## Motivation
• Add the ability to test components with Hooks
• Potentially improve the quality of our component tests

### How can shallow renders be bad?
* It may force you to test some implementation details of your component by selecting child components by their constructors
* It allows you to test other implementation details such as the internal state of the component or private methods via the  `instance()` method
* It doesn’t run lifecycle methods
* Because of the reasons above, tests are more prone to fail even after a 100% backwards compatible refactor simply because method names or state variables  were changed

### How can snapshot tests be bad?
• Snapshots are generally cumbersome and be hard to read, specially in big components
• They might fail after 100% retro compatible refactoring, for instance, when class names change
• It’s very easy to mistakenly update snapshots and make the tests pass, introducing false positives
• Snapshots will fail if a component in Forma36 is updated, even if this update did not change the way your component works
•
## Risks
* No shallow rendering. All child components are rendered
* It’s not possible to access props or the internal state (implementation details)
* Because of the two above, it gets a bit harder to trigger a callback from a child component:
```
const callback () => alert('can you test me?')

return (
	<Child onSomethingHappened={callback} />
)
```
In the exemple above, the only way to test that `callback` is called is by going in the rendered DOM of Child and do whatever is necessary to trigger `onSomethingHappened`. This is especially problematic when you have an action in a child component that requires a confirmation modal.  You would have to know how to trigger and how to confirm the modal. In cases like that it might be worth skipping the test.
* We risk having yet another migration that may distract us from our main goal: kill Angular.

## Migration
We have a couple of options:

### A) Keep Enzyme and slowly migrate to RTL
In this option we avoid having to migrate everything at once. The problem that, as mentioned in the Risks section, we would have yet another migration happening in our code base.
Another problem with this option is that enzyme-matchers and jest-dom are not compatible, so we would not be able to use all of the js-dom matchers in RTL tests.

### B) Just migrate everything
Currently we have 110 components being tested with Enzyme. We could form a group of people interested in migrating everything, in a separate branch with sub-branches, and maybe try to pull this off in a sprint.

### C) Ideas?