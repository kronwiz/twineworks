# setcontent macro

This macro was written for Twine [SugarCube](http://www.motoslave.net/sugarcube/2/) story format.

This macro is similar to SugarCube `<<set>>` with the difference that what is stored into the variable is not and expression but the content that is comprised between the opening `<<setcontent>>` and the closing `<</setcontent>>` tag.

You can see a [live demo here](https://kronwiz.github.io/twineworks/site/sugarcube_macros/setcontent_demo.html).

## Documentation

### Syntax

`<<setcontent variableName>>...<</setcontent>>`

Arguments:

* `variableName`: name of the variable to set. This must be compliant with SugarCube requirements on variable names: it must start with the "$" or the "_" character.

Note that the `variableName` parameter **must be passed enclosed in quotes**, unlike the `<<set>>` macro which is able to read it also if it's not enclosed.

### Example

This macro can be useful when you have to store a long multiline content into a variable, which is awkward to do with the `<<set>>` macro in a single line expression.

In this case the value to be passed as the second parameter of the `<<messageText>>` widget is a block of markup extending for six lines.

```
<<widget "examineBook">>
<<set _title to "Examine book">>
<<setcontent "_description">>\
<<if $open is false>>The book looks very old. On the cover appears the title "Village chronicles".\
<<else>>The first page shows a dense and elegant handwriting.<</if>>
<<link "open">><<openBook>><</link>>
<<link "get">><<getBook>><</link>>\
<</setcontent>>
<<messageText _title _description>>
<</widget>>
```

## LICENSE

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details http://www.gnu.org/licenses/.
