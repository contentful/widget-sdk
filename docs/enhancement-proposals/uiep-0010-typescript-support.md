> id: UIEP-0010
>
> title: typescript support
>
> champions: Alex Suevalov, Marco Link 
>
> endDate: 21 April 2020
>
> status: Open

# [UIEP-0010] Typescript Support

<!--
  The sections below are a starting point, but add or remove sections as you see fit. These are the most important sections, but if you are attempting to introduce a new library you may want to discuss different solutions to the problem as well, for example.
  -->

## Introduction

Enable typescript support to take advantage of a typed language/environment. 

## Description

This proposal features an already configured [branch](https://github.com/contentful/user_interface/pull/5680) with 2 major pillars.

#### 1. Usage of [@babel/preset-typescript](https://babeljs.io/docs/en/babel-preset-typescript)
This babel preset is not using typescript nor compiling ts files to js. It just strips out all ts features and renames the module to `.js`.
Compared to `tsc` performance is promised to be much better. Additionally devs not interested in ts wouldn't notice any incompatible type checks.                    

#### 2. script `check-types`
For those using typescript for their development, a new [script](https://github.com/contentful/user_interface/blob/feature/ts-babel-setup/package.json#L287) is introduced to manually check for types by compiling th current state of the app.

## Motivation

Advantages of typescript or a typed languages in general are widely known. 
With the rising demand from colleagues for typescript support we want to find out what it takes to enable typescript for our Frankenstein. 

## Migration

Merging the eventually approved [PR](https://github.com/contentful/user_interface/pull/5680) should be sufficient. 
From then on, every `.js` file can be renamed and handled as `.ts` file if needed.

## Outcome

<!-- Describe your UIEP outcome briefly, stating if it was approved or rejected, a short summary of the discussions, and any actions or follow up that need to be taken. -->

TBD

---

**Footnotes**

1: This is a clarifying footnote that tells you, really, don't be afraid of using footnotes.
