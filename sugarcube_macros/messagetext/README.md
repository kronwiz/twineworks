# messageText macro

**Development in progress**

This macro was written for Twine [SugarCube](http://www.motoslave.net/sugarcube/2/) story format.

This macro is actually composed by three standard SugarCube `<<widget>>` with some help from Javascript. Its purpose is to provide a way to define a template that you can add to the passage text; you can specify the position where the text is added by putting a particular selector in the passage text.

It can be useful, for instance, when you have the need to add often a different text with the same formatting. You define the formatting once in the macro and then you can pass the actual text to be printed in the parameters. The [setcontent](../setcontent) macro can help in passing large chunks of text and markup in a parameter.

This macro is different from the standard SugarCube templates because you can pass parameters to it. It's kind of a mix between templates and widgets.

You can see a [live demo here](https://kronwiz.github.io/twineworks/site/sugarcube_macros/messagetext_demo.html).


## Documentation

**Warning**: this is not a "ready to use" macro. What I provide here is a full working example that you have to customize to achieve what you need.

To install the `<<widget>>`s you have to copy the contents of the *.widget file in this repository to a passage with the `widget` tag, starting from under the comments marked with `/* */`.

There are three widgets:
* `messageText`: is the main widget, the one that you have to customize with the formatting that you need;
* `messageTextSetDefaults`: this must be called before using the `messageText` widget to se some default parameters;
* `printRoomDescription`: this is optional if you don't call it from `messageText`. It retrieves some text from the passage (identified by a specified selector) and adds it again to the passage in the place you specify.

The Javascript in the macros is used to scroll the browser window to the point where the text is added.

### Syntax

#### messageTextSetDefaults

To avoid passing always the same constant parameter to `messageText` you have to set it with this macro, otherwise it will be set to a standard value.

`<<messageTextSetDefaults message_dest_selector>>`

Arguments:
* `message_dest_selector` (default is `#messagetext`): is the selector you put in the passage text that identifies where `messageText` is going to append the text you pass to it. It's like SugarCube `<<append>>` macro.

This macro can be extended to set other default parameters. For instance, if you look at the source code, I use it also to set the defaults for two other parameters that are useful for the `<<printRoomDescription>>` macro.

#### messageText

This is the main macro: your "template" goes here. It goes between the end of the `<<script>>` and the end of the `<<append>>` tags:

```
<</script>>\
''<<link R>><<printRoomDescription $messagetext_roomdescription_prompt>><</link>> > $args[0]''
$args[1]
<</append>>
```

In the previous code my template prints a link followed by the ">" character and the content of the first parameter of the macro, and in the row below it prints the content of the second parameter. The outcome is something like:

**R > foo**

bla bla bla

where "foo" is the content of `$args[0]` and "bla bla bla" is the content of `$args[1]`.

This way I don't have to repeat the formatting every time I want to print this kind of text, but I simply have to call the macro passing different parameters.

### Example


## LICENSE

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details http://www.gnu.org/licenses/.
