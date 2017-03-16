# Code review guidelines

When and why to review
----------------------

All changes must go through code review by at least one person, no matter what was changed and how minor is the change. This is not just for better code quality, but to share knowledge and ownership - being in different teams and working on different features, our goal is to be aware of each other's work and not to have exclusive ownership of features.


Communication guidelines
------------------------

[Here][communication-guidelines] are some great tips for effective code review communication.

*TODO: adapt it and ask everyone's opinion!*

How to make a PR
----------------

Ready for review checklist:

- [ ] Description contains link to a TP ticket, or if there is no ticket, sufficient description of what was done and why
- [ ] Link to pull request in TP comments
- [ ] All functionality from the ticket is implemented
- [ ] All publicly exposed methods and properties are documented (we use [JSDoc][jsdoc])
- [ ] Unit tests are in place (and passing)
- [ ] Lint is passing
- [ ] Code meets our [coding guidelines][coding-guidelines], best practices and is generally understandable
- [ ] Al UI elements have appropriate [ARIA attributes][aria-doc]
- [ ] CI checks are green
- [ ] No conflicts with master

Run unit tests: `npm run test` or `xvfb-run ./node_modules/.bin/karma start --browsers SlimerJS`

Run lint: `bin/lint-all` or `bin/lint-file <filename>`

When PR is ready for review, add `Please review` tag in github. Assign 1 person from the Frontend chapter randomly on small (< 500 lines of code) PR, and 2 people on bigger ones.


How to review
-------------

Before starting review, make sure the aim of the PR (in TP ticket or description) is clear.

Use [Github code review tool][github-cr-docs] to review and discuss, eventually approving the PR or requesting some changes.

It's ok to ask for quick clarifications on slack or in person, but try to keep all meaningful communication in github. Reason: if you don't understand why this piece of code is needed or what it does, it's worth adding a comment in the code, if your proposal was considered and rejected, keep history for other reviewers.

Checklist for approval:

- [ ] *All points from ['ready for review'](#how-to-make-a-pr) checklist*
- [ ] You understand what the code is doing
- [ ] You have run the code on your machine and checked the happy path

You don't need to review codestyle conventions like spaces and brackets style - that stuff is handled automatically by a linter.


Responding to changes requests and next steps
---------------------------------------------

When changes are requested, remove 'please review' tag, push your changes in a commit with 'fixup' message, and add 'please review' tag again. *Don't rewrite history until PR is approved!*

After PR is approved by all reviewers, all checks are passing, and there are no conflicts with master, rebase the branch on master, squashing the fixup commits (use `rebase -i master`). After that, send it to manual QA by marking the related TP ticket as ready for testing (see [release process][release-process]).

If there are some bugs found, you can push bugfix commits without a code review for a small fix. If the fix requires major work, create new `bugfix` PR on your branch, and request a code review on it.

When QA approves, the author of the PR grooms the branch, squashing the commits when necessary, and merges it to master.


Handling 'big issues'
---------------------

It happens that some features grow too big or require a major refactoring, and a pull request would stay open for too long and become hard to maintain. To handle or avoid this situation:

**As an author:** try to keep your pull requests atomic and put a clear description of what was done, why, and what are the next steps. Use [Launch darkly][launch-darkly] for feature flags - if your feature is too big, you should try to split it into testable or usable (as in *testable, usable, lovable*) subtasks with separate PRs, and hide it behind a feature flag until it is ready to launch.

**As a reviewer:** feel free to go beyond immediate feature scope and suggest improvements even if the code was not written by the author of the PR and is not directly related to the feature. By doing so we all reduce the technical debt and take ownership of the whole product. But try to stick with the 80/20 rule: 80% of effort should be put directly into the feature, and 20% into refactoring of the existing code. If improvements that you have in mind are out of the feature scope and would take more than 20% of effort, you should discuss it and put into Frontend maintenance backlog.


[communication-guidelines]: https://github.com/thoughtbot/guides/tree/master/code-review
[jsdoc]: http://usejsdoc.org/
[github-cr-docs]: https://help.github.com/articles/reviewing-proposed-changes-in-a-pull-request/
[coding-guidelines]: https://github.com/contentful/coding-guidelines
[aria-doc]: https://contentful.atlassian.net/wiki/display/ENG/Semantic+Markup+in+the+UI
[release-process]: /docs/guides/code-submission
[launch-darkly]: /docs/guides/a_b_testing
