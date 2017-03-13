# Code Submission and Release Process

This guide explains how to get code changes deployed.

1. [Create a release PR from your branch to `master`](#creating-a-release-pr)
1. [Get code reviewed and approved](#code-review)
1. [Get QA approval](#qa-approval)
1. [Merge to master](#merging-a-release-pr)
1. [Deploy `master` to `production`](#deploying-to-production)


Although generally this process should be followed closely you may deviate from
it if there is a good reason to do so. If you would like deviate from the
process you must communicate this to all involved parties.

Topics not yet covered are
* Bundling changes from multiple authors on a single release PR to pool testing
  resources
* Hot fixes that skip parts of the process

Creating a Release PR
---------------------

Make sure the following conditions are satisfied before requesting code and QA
approval.

- [ ] The branch is based on top of `master`
- [ ] The commits follow the required [commit structure](#commit-structure)
- [ ] The PR is labeled with “Release” and “Please review”
- [ ] The PR includes a short description of the change
- [ ] The PR description links to the appropriate Target Process, Zendesk, and
  Bugsnag tickets.
- [ ] The Target Process ticket includes a link to the PR


Code Review
-----------

1. The author makes sure all builds are green
2. The author chooses any frontend developer as a reviewer and notifies them by
   assigning them to the PR on Github and sending them a message on Slack
3. The author adds the “Please review” label to the PR
4. The reviewer adds their review to the PR and removes the “Please review”
   label.
   * If the code has been approved continue,
   * Otherwise the author adds fixup commits on top of the branch head. (The
     commit history must not be rewritten). Then continue with 3.
5. Merge the fixup commits from the review and rebase the branch. Continue with
   QA approval.


QA Approval
-----------

QA approval can either be _explicit_ by involving manual QA or _implicit_ by relying
on the acceptance tests.

### Explicit approval

Make sure the following conditions are satisfied

- [ ] A QA person must be assigned to the Target Process ticket.
  This is either the QA person in your team, the QA person on support, or any
  other member of the QA team that has agreed to handle the ticket.
- [ ] The ticket must include the following notes for QA
  * A list of the components affected by the change
  * Outlines for specific cases that need to be tested
- [ ] The branch must successfully build on travis

Then proceed as follows

1. The developer moves the ticket state to “Ready for testing”
2. QA tests the change by running automated and manual tests
   * If the tests were successful QA will set the state to “Ready to release”.
     Then approval has been obtained.
   * Otherwise QA sets the ticket state to “Ready to develop”. The developer
     adds fixup commits on top of the branch head and has them reviewed.
     Restart.

_TODO_ Explain process if the changes require changes to the acceptance test
suite.


### Implicit approval

Implicit approval is only sufficient under the following conditions

* There are no user facing changes
* There is excellent test coverage for the changed components.

In all other cases explicit approval needs to be obtained from manual QA.
When in doubt, consult with QA.

To obtain implicit approval you need to successfully run the [full acceptance
test suite][full-test-job].

[full-test-job]: https://jenkins.quirely.com/job/Custom%20Settings%20Job/


Merging a Release PR
--------------------

Before merging a release PR to `master` make sure the following conditions are
satisfied.

- [ ] The branch is based on top of `master`
- [ ] The commits follow the required [commit structure](#commit-structure)
- [ ] The code has been approved by at least one developer
- [ ] The Target Process ticket is in state “Ready to Release” or “Ready to
  Deploy” (only if a TP ticket exists)
- [ ] The builds include a full run of the acceptance suite (`ci/jenkins/full`).
- [ ] All builds are green

After merging a PR you continue with the following steps

- [ ] Set the Target Process ticket state to “In staging”. (Only for User Stories.)


Deploying to Production
-----------------------

1. Create a PR from `master` to `production` and add the “Production deploy”
   label.
2. For each release PR included in the deployment PR add the following to the
   description.
   * A link to the release PR
   * A link to the Target Process, Zendesk, and Bugsnag tickets if available
   * A link to a change log entry if provided by the product owner.
3. Wait for successful builds, including `ci/jenkins/staging-full-automatic`
4. Merge the PR
5. Monitor the `#dev-deployment` channel for a message from Estivador:
   “user_interface: production RC added”.
6. Notify `#support` and `#product-releases` of the changes
7. If applicable
   * Set Target Process ticket states to “Done”
   * Notify agents assigned to Zendesk tickets
   * Resolve Bugsnag errors
   * Publish the changelog


Appendix
--------

### Commit structure

Before merging or before requesting code review branches must satisfy the
following conditions:

* The branch must be rebased onto its merge target
* Multiple commits are only allowed if they can be reviewed independently.
  Squash commits if necessary.
* A commit message must include a link to a Target Process ticket, if
  applicable.

Changes during code review and testing must be added on top of the branch head.
No force pushes are allowed. Theses commits must be squashed after the review
and tests have finished.
