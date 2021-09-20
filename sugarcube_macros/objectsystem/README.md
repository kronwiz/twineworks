# Object system

This is an extension for the [Twine](http://twinery.org/) [SugarCube](https://www.motoslave.net/sugarcube/2/) story format. Its goal is to provide the story authors with a simple way to define objects in the story, that is "things" which the main character can interact with, by examining them, picking them up in the inventory, opening them, and so on. Stated in another way, its goals are:

- to avoid to create loads of global variables to store the object properties to remember the state of all the objects created in the story: with this system the properties of an object are stored in the objects itself;
- to be able to move an object from a passage to the main character inventory and back to any passage again. The system remembers where the object is and the story author can use this information.

Some common actions are already defined for all objects: examine, pickup, drop, open and close. Functions are provided so that the author can develop macros to implement new actions.

This system has been inspired by the old adventures that were strongly based on the interaction of the main character with the objects in the scenes.

For the developers out there: this is not a fully featured object oriented programming system, and it's not meant to be. Its goals are simpler and are described above.

# Documentation

## Concepts

The things (hereafter "entities") that the system gives to the author are: objects, the main character inventory and the passages inventories.

In a passage the author creates all the objects that are present in that passage and the system adds these objects to the passage inventory. This way the system remembers where the objects are.

While creating an object the author defines all its properties by choosing a name and setting a value for each property. Property values can then be modified any time during the development of the story.

To help the author's work some standard actions that can be performed on the objects are already defined: examine, pickup, drop, open and close. Each one is triggered by a macro that the author puts in the story and each one prints a default message that can be customized.

Moreover, pickup moves the object from the passage to the character's inventory and drop moves the object from the character's inventory to the passage where the character is positioned when the action is performed. The system remembers in which passage the object has been dropped, which can of course be different from the passage in which it was created. It's like the character freely moving things around in the story, and the author doesn't need to develop anything complex to allow this.

Then there are functions to ask if an object is in the character's inventory or is present in the current passage or which is the value of an object property and there's a macro to display the character's inventory content.

All the details are below.


### Objects

An object is the main entity of this system: it represents an object in the story. It's a kind of box containing its properties (e.g.: colour, height, if it's open, etc.) and on which the character can act.

An object must be given a **unique name**: in a story there can't be two objects with the same name because macros and functions use the name to refer to an object.

To define an object you use the `<<obj-define>>` macro; this macro takes as parameter the name of the object, then:

- it creates the object in the system;
- adds the object to the current passage inventory;
- executes the macros that are contained between its open and close tags.

Before going on let's look at an example:

    <<silently>>
    <<obj-define "book">>
    <<obj-property-set "book" "examine-message">>It's a very old book
    <</obj-property-set>>
    <</obj-define>>
    <</silently>>

Usually the `<<obj-define>>` group contains macros to define the starting values of the object properties. This is done to leverage a peculiarity of the macro:

**The `<<obj-define>>` macro is never executed twice for the same object. In other words: if the object is already defined then the object is not redefined and the macro's contents are not executed.**

This is an important feature because macros are executed every time the character enters a passage and redefining an already defined object will result in an error. In this way the error is avoided and enclosing the inizialization of the properties in the `<<obj-define>>` macro ensures that this initialization won't take place every time the character enters the passage, maybe accidentally overwriting any property value that has changed in the meantime.

**The `<<obj-define>>` macros must be put at the beginning of a passage code** because objects must be defined before they can be used in other macros in the same passage. Anyway, **once defined an object can be accessed through macros and functions in any passage of the story**: it's up to the author to decide what to do.

Moreover, as you see in the example, it's a good habit to enclose the `<<obj-define>>` macros in a `<<silently>>` group to avoid unwanted output.


#### Writing and reading properties

name unique in the object, not globally

the value can be any type, even a piece of wiki text

define property when an object is defined is not repeated, so it's useful not to reset a property inadvertently

#### Default properties

"open", default messages

### Inventory

#### Default properties

row-output-format, default messages

### Passages inventories

### Picking up and dropping objects

The "memory" of the system.

### The default printer

The "messagebox" selector.

## Macros

### \<\<obj-define>>

### \<\<obj-property-set>>

### \<\<examine>>

### \<\<pickup>>

### \<\<drop>>

### \<\<open>>

### \<\<close>>

### \<\<obj-allow>>

### \<\<inventory-property-set>>

### \<\<inventory>>

### \<\<inventory-foreach>>


## Functions 

### _psg_objects.has

### _psg_objects.list

### _psg_objects.length

### _inventory.has

### _inventory.list

### _inventory.length

### _object.name.property


# LICENSE

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details http://www.gnu.org/licenses/.
