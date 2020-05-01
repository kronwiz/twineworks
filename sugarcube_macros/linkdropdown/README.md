# linkdropdown macro

This macro was written for Twine [SugarCube](http://www.motoslave.net/sugarcube/2/) story format.

The purpose of this macro is to add a dropdown menu to a link. In other words, when you click on a link an overlay opens just below the link: in this area you can add everything you want using SugarCube markup.

I developed it to list all the actions available on an object, like this:

![screenshot](screenshot.png)

Of course you can change colors and spacings with the CSS stylesheet.

You can download the `demo.html` file and open it in a browser to see a working example.

## Documentation

### Syntax

`<<linkdropdown linkText>> ... <</linkdropdown>>`

Arguments:

* `linkText`: the text of the link. May contain markup.

The content of `<<linkdropdown>>` may contain markup.

### Example

In the following example I put in the dropdown a series of three `<<link>>` tags, each one displaying a message in a box that I created at the bottom using a custom style ``@@#message``:

```
The wall on the right is interrupted in the middle by a <<linkdropdown "door">>\
<<link "examine">><<replace "#message">>The door is closed.<</replace>><</link>>
<<link "open">><<replace "#message">>The door is locked. You need a key.<</replace>><</link>>
<<link "close">><<replace "#message">>It's already closed.<</replace>><</link>>\
<</linkdropdown>>.
@@#message;
@@
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
