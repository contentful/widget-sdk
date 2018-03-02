# Code review guidelines

This document is specifically focused on code review process, for overall process from committing your code to release see [code submission guide][code-submission].

When and why to review
----------------------

All changes must go through code review by at least one person, no matter what was changed and how minor is the change. This is not just for better code quality, but to share knowledge and ownership - being in different teams and working on different features, our goal is to be aware of each other's work and not to have exclusive ownership of features.


Communication guidelines
------------------------

Code review communication should follow the Frontend chapter values - they are currently a WIP and link will be added soon.

Also check [thoughtbot's guide][communication-guidelines] for some great tips for effective code review communication.


How to make a PR
----------------

Ready for review checklist:

- [ ] Description contains link to a TP ticket, or if there is no ticket, sufficient description of what was done and why
- [ ] Link to pull request in TP comments
- [ ] All functionality from the ticket is implemented when applicable
- [ ] All publicly exposed methods and properties are [documented][documentation]
- [ ] Unit tests are in place
- [ ] Code meets our [coding guidelines][coding-guidelines], best practices and is generally understandable
- [ ] Accessibility is considered
- [ ] CI checks are green
- [ ] No conflicts with master

Run unit tests: `karma start`

Run lint: `npm run hint` or `npm run hint -- --fix`

As an alternative, linting could be done on pre-push stage (via husky .git hooks).

To enable this edit your `~/.zshrc` (.bashrc etc) and set 

`export ENABLE_HUSKY_HOOKS="yes please"`.


When PR is ready for review, add `Please review` tag in github. Assign one person from the Frontend chapter randomly on smaller PR's, and 2 people on bigger ones. Use your judgement to request review from more people, depending on the scope of changes, and try to avoid big PRs[^1] if possible, splitting them into smaller ones.

[^1]: A PR with > 1000 added lines is considered big.

How to review
-------------

Before starting review, make sure the aim of the PR (in TP ticket or description) is clear.

Use [Github code review tool][github-cr-docs] to review and discuss, eventually approving the PR or requesting some changes.

If you are not the requested reviewer you may still approve a PR or add
comments. You should not reject the PR unless you have a compelling reason to.
Leave it to the requested reviewer to make a judgement.

It is OK to approve a PR while still requesting some changes. These request
should be treated as suggestions that the author is free to include.

After you have reviewed the code by either rejecting or accepting the changes
remove the “Please Review” label.

It's ok to ask for quick clarifications on slack or in person, but try to keep all meaningful communication in github. Reason: if you don't understand why this piece of code is needed or what it does, it's worth adding a comment in the code, if your proposal was considered and rejected, keep history for other reviewers.

Checklist for approval:

- [ ] *All points from ['ready for review'](#how-to-make-a-pr) checklist*
- [ ] You understand what the code is doing
- [ ]  (Optionally) you have run the code on your machine and checked the happy path

You don't need to review codestyle conventions like spaces and brackets style - that stuff is handled automatically by a linter.


Service-level agreement
-----------------------

In order to keep review times predictable we have a service-level agreement
between the requester and the reviewer. This SLA lays out the time frame within
which review of a PR should be completed.

When a review for a PR has been requested the reviewer must have a first look at
the code within 24 hours. It is not necessary to complete the review. In that
case the reviewer must add a review comment indicating which part of the diff
has been covered and comments for any code issues.

For PRs with fewer then 150 lines added the first review should be completed
within 24h of requesting the review. For PRs with between 150 and 400 lines
added that time is 48h. For larger PRs the requester and reviewer should agree
on a time frame individually.

There are additional shorter time frames for follow-up reviews that happen after
the author has made changes in response to the initial review. If the follow-up
review is requested before noon the review should happen on the same day. If the
review is requested after noon review should happen before noon the next day.

If your code is not reviewed in a timely manner then kindly remind the
reviewer on Slack or Github using the #sla hash tag.


Responding to changes requests and next steps
---------------------------------------------

When changes are requested, remove 'please review' tag, push your changes in a fixup commit (`git commit --fixup=<parent commit hash>`), and add 'please review' tag again. *Don't rewrite history until PR is approved!*

After PR is approved by all reviewers, all checks are passing, and there are no conflicts with master, clean up the history and squash the fixup commits (`git rebase -i --autosquash origin/master`). If there are user-facing changes, you should then send it to manual QA by marking the related TP ticket as ready for testing (see [release process][code-submission]).

If there are some bugs found, you can push bugfix commits without a code review for a small fix. If the fix requires major work, create new `bugfix` PR on your branch, and request a code review on it.

When QA approves, the author of the PR grooms the branch, squashing the commits when necessary, and merges it to master.


Handling 'big issues'
---------------------

It happens that some features grow too big or require a major refactoring, and a pull request would stay open for too long and become hard to maintain. To handle or avoid this situation:

**As an author:** try to keep your pull requests atomic and put a clear description of what was done, why, and what are the next steps. Use [Launch darkly][launch-darkly] for feature flags - if your feature is too big, you should try to split it into testable or usable (as in *testable, usable, lovable*) subtasks with separate PRs, and hide it behind a feature flag until it is ready to launch.

**As a reviewer:** feel free to go beyond immediate feature scope and suggest improvements even if the code was not written by the author of the PR and is not directly related to the feature. By doing so we all reduce the technical debt and take ownership of the whole product. But try to stick with the 80/20 rule: 80% of effort should be put directly into the feature, and 20% into refactoring of the existing code. If improvements that you have in mind are out of the feature scope and would take more than 20% of effort, you should discuss it and put into Frontend maintenance backlog.


[communication-guidelines]: https://github.com/thoughtbot/guides/tree/master/code-review
[documentation]: docs/guides/documentation.md
[github-cr-docs]: https://help.github.com/articles/reviewing-proposed-changes-in-a-pull-request/
[coding-guidelines]: https://github.com/contentful/coding-guidelines
[code-submission]: /docs/guides/code-submission
[launch-darkly]: /docs/guides/a_b_testing
