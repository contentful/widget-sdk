> id: UIEP-0011
>
> title: Github PR workflow
>
> champions: Marco Link
>
> endDate:
>
> status: Open, Approved, Rejected

# [UIEP-0011] Github PR Workflow

<!--
  The sections below are a starting point, but add or remove sections as you see fit. These are the most important sections, but if you are attempting to introduce a new library you may want to discuss different solutions to the problem as well, for example.
  -->

## Introduction

Use githubs own CODEOWNERS feature for better and automated reviewers assignement.

## Motivation

*This proposal references the `user_interface` project but can be applied to any project.* 

A new pull request representing a fix/feature/changes has been created. In a next step the creator has to assign reviewers. These reviewers will be mostly picked by personal preferences of the creator. Who was involved in the process? Who knows about the code that has been changed? who has worked on the code before? who owns it? 

Some of the questions can be hardly answered by all developers. Either ownership and knowledge has changed over team, or the creator is just too new to the game to know the history of a specific feature/piece of code. Maybe he touched different parts of the code that are owned by different teams (over time). 

The resulting set of reviewers is mostly defined by the creators knowledge about the history of the code as well as his teams and the companys structure. Something that starters can hardly know.

In case of a proposal or any other pr/issue that needs chapter/company wide input, we're limited by githubs 15 reviewers limitation.

## Description

Github teams is a great feature to organize responsibility and ownership. 
Especially in combination with automation.

with a `CODEOWNERS` file, we can define ownership for each part of the project. A code owner can be a team, a user handle, or an email address.

ownership can be defined at any level using glob pattern.

Once a new pull request is created, github will automatically assign the closest matching owners of the matching code as reviewers and inform all members of a pending review request. 

### Examples
Changes done by a developer from team A, also touching code from team B will add both teams as reviewers. 

Another scenario could be a change to a specific file type: All changes to typescript files will automatically add a dedicated typescript team (which is a collection of devs interested in the topic) as reviewer. This can help to improve review quality on non-feature specific topics. 

For our public repositories, `CODEOWNERS` can help to make public pull requests more visible. once created, all devs in charge will be notified.

### Defining codeowners
Codeowners should be defined as specific as possible to avoid overloading the review process. 

- A general frontend team is defined on root level of the project to have a base set of reviewers (tbd)
- Every feature under `/features` should have at least one team assigned. 
- Deeper nesting is possible. 
- General topics like testing, build, typescript can also be addressed by owners (defined by paths or glob).

The owner closest to the affected code will be assigned.

One thing worth mentioning: if you don't agree with the auto-selected set of reviewers, you can always manually remove and change the list to your prefeences.

## Risks

I assume the amount of requested reviews per user will rise in the beginning. This is something we have to iterate on over time.  

## Migration

### Teams
A set of github teams representing every product developement team with sufficient rights on all relevant repositories. For better understand of a teams scope, a description should be mandatory.

### Clear user names
It's hard to find the related user on slack or in the contentful cosmos in general  if the github user is not providing a clear name.


## Outcome

<!-- Describe your UIEP outcome briefly, stating if it was approved or rejected, a short summary of the discussions, and any actions or follow up that need to be taken. -->

TBD

---

**Footnotes**

1: This is a clarifying footnote that tells you, really, don't be afraid of using footnotes.
