Forms
=====

This guide explains the directives of [`cf.forms`][cf.forms] and the
patterns they can be used with.

~~~jade
form(cf-validate="mydata")
  input(ng-model="mydata.x" name="x" cf-validate-model)
  ul(cf-field-errors-for="x")
~~~



[cf.forms]: /docs/api/cf.forms
