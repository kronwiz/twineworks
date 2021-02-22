/*
    Copyright Kronwiz.
    This file is part of https://github.com/kronwiz/twineworks repository.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/


// Global inventory object used throughout the game
State.variables.obj_inventory = {};

// Default values for common properties
State.variables.obj_default_properties = {
	"examine-message": "@@color:red;Object description not provided@@",
	"examine-prompt": "Examine",
	"get-message": "You got the object",
	"get-prompt": "Get",
	"have-message": "The object is already in your inventory",
	"have-prompt": "Get",
	"drop-message": "You dropped the object",
	"drop-prompt": "Drop",
	"not-have-message": "You don't have the object in your inventory",
	"not-have-prompt": "Drop",
	// ...

	// if the requested property is not defined we use this to display an error message
	"obj-property-undefined-message": '@@color:red;No property "__property__" defined for object "__object__"@@',
	"obj-property-undefined-prompt": "@@color:red;!!Missing prompt!!@@"
};


// This is executed before the rendering of the incoming passage
$( document ).one( ':passagestart', function ( _ev ) {
	// create the temporary objects store
	var objstore = State.temporary.obj_objects;

	if ( !objstore ) {
		objstore = {};
		State.temporary.obj_objects = objstore;
	}
});


function generateUUID () {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};


/* unused
function getObjectID ( name ) {
	// to avoid conflicts the object ID is <passage ID> + "_" + <obj name with spaces replaced>
	return Story.get( State.passage ).domId + "_" + name.trim().replace( / /, "_" );
}

function getPropertyID ( name ) {
	return name.trim().replace( / /, "_" );
}
*/


function getObject ( name ) {
	var objstore = temporary().obj_objects;
	var inventory = variables().obj_inventory;
	var obj = null;

	if ( name in objstore )
		obj = objstore[ name ];
	else if ( name in inventory )
		obj = inventory[ name ];

	return obj;
}


Macro.add( 'obj-define', {
	tags     : [],
	handler  : function () {
		var name = this.args[ 0 ];

		if ( !name ) return this.error( 'obj-define: missing object name' );

		var objstore = State.temporary.obj_objects;
		var obj = getObject( name );

		/* Note that with this check two objects with the same name cannot exist,
		   and an object cannot be redefined, so when you come back to a passage the
		   "obj-define" instructions aren't reexecuted because the objects already exist */
		if ( !obj ) {
			obj = new ObjSysObject( name );
			objstore[ obj.name ] = obj;

			// This executes all the obj-property-set that might be in the obj-define content
			for ( var i = 0, len = this.payload.length; i < len; i++ ) {
				$( this.output ).wiki( this.payload[ i ].contents );
			}
			// TODO: aggiungerlo alla lista di oggetti nella stanza se non c'e' gia'
		}
	}
})


Macro.add( 'obj-property-set', {
	tags     : [],
	handler  : function () {
		var name = this.args[ 0 ];
		var propertyName = this.args[ 1 ];

		if ( !name ) return this.error( 'obj-property-set: missing object name' );
		if ( !propertyName ) return this.error( 'obj-property-set: missing property name' );

		var obj = getObject( name );

		if ( obj ) obj.setProperty( propertyName, this.payload[ 0 ].contents );
		else console.warn( `obj-property-set: object "${name}" is undefined` );
	}
})


Macro.add( 'obj-execute', {
	tags     : [],
	handler  : function () {
		var name = this.args[ 0 ];
		var actionName = this.args[ 1 ];
		var linktext = this.payload[ 0 ].contents;

		if ( !name ) return this.error( 'obj-execute: missing object name' );
		if ( !actionName ) return this.error( 'obj-execute: missing action name' );

		var $link = $( document.createElement( "a" ) );
		$link.addClass( "link-internal macro-link-anchor" );
		$link.wiki( linktext );
		$link.ariaClick( function ( _ev ) {
			var obj = getObject( name );

			if ( obj ) {
				var func = obj.getAction( actionName );
				if ( func ) func();
				else console.warn( `No action ${actionName} defined for object "${name}"` );
			}
			else console.warn( `Object "${name}" is undefined` );
		});
		$link.appendTo( this.output );
	}
})

/** @function  obj-default-property-set
 *  Sets the default value for a property. The property content is taken from the macro payload.
 *  @param {string} propertyName - Name of the property to set.
 *  @throws Returns an error if the property name is missing.
*/
Macro.add( 'obj-default-property-set', {
	tags     : [],
	handler  : function () {
		var propertyName = this.args[ 0 ];

		if ( !propertyName ) return this.error( 'obj-default-property-set: missing property name' );

		State.variables.obj_default_properties[ propertyName ] = this.payload[ 0 ].contents;
	}
})


Macro.add( 'obj-if-in-inventory-set', {
	tags     : [],
	handler  : function () {
		var objname = this.args[ 0 ];
		var varname = this.args[ 1 ];

		var objid = getObjectID( objname );
		var res = ( objid in State.variables.obj_inventory );
		if ( varname.search( /^\$/ ) ) State.variables.varname = res;
		else if ( varname.search( /^_/ ) ) State.temporary.varname = res;
	}
})


function outputProperty ( obj, name, title ) {
	// get property from object
	var property = obj.getProperty( name );
	// if missing get property from defaults
	if ( !property ) property = State.variables.obj_default_properties[ name ];
	// if missing get property undefined message
	if ( !property ) property = State.variables.obj_default_properties[ "obj-property-undefined-message" ].replace( "__property__", name ).replace( "__object__", obj.name );

	var promptText = obj.getProperty( title );
	if ( !promptText ) promptText = State.variables.obj_default_properties[ title ];
	if ( !promptText ) promptText = State.variables.obj_default_properties[ "obj-property-undefined-prompt" ].replace( "__property__", name ).replace( "__object__", obj.name );

	// prompt row with a unique ID
	var $prompt = $( document.createElement( "div" ) );
	var promptid = "objprompt" + generateUUID();
	$prompt.attr( "id", promptid );
	// content of the prompt
	$prompt.wiki( `<<obj-execute "${obj.name}" "examine">>X<</obj-execute>>\
	<<obj-execute "${obj.name}" "get">>G<</obj-execute>>\
	<<obj-execute "${obj.name}" "drop">>D<</obj-execute>>\
	''> ${promptText} ${obj.name}''` );

	// row with the property content
	var $content = $( document.createElement( "div" ) );
	$content.wiki( property + "<p/>" );

	// script element to move the new prompt into view
	var $script = $( document.createElement( "script" ) );
	$script.text( `$( "#${promptid}" )[0].scrollIntoView()` );

	// append everything to the #messagebox element
	$prompt.appendTo( $( "#messagebox" ) );
	$content.appendTo( $( "#messagebox" ) );
	$script.appendTo( $( "#messagebox" ) );
}


class ObjSysObject {
	constructor ( name ) {
		this.name = name;

		this.properties = {};
		this.actions = {};

		this.addNativeActions();
	}

	setProperty ( name, value ) {
		this.properties[ name ] = new ObjSysProperty( name, value );
	}

	getProperty ( name ) {
		var prop = this.properties[ name ];
		if ( prop ) return prop.value;
		else return null;
	}

	setAction ( name, type, value ) {
		this.actions[ name ] = new ObjSysAction( name, type, value );
	}

	getAction ( name ) {
		var action = this.actions[ name ];
		if ( action ) return action.value;  // Note: this works only for native actions
		else return null;
	}

	addNativeActions () {
		this.setAction( "examine", "native", this.examine.bind( this ) );
		this.setAction( "get", "native", this.get.bind( this ) );
		this.setAction( "drop", "native", this.drop.bind( this ) );
	}

	/* Native actions */

	examine () {
		outputProperty( this, "examine-message", "examine-prompt" );
	}

	get () {
		if ( !State.variables.obj_inventory[ this.name ] ) {
			// move the object to the inventory
			State.variables.obj_inventory[ this.name ] = this;
			delete State.temporary.obj_objects[ this.name ];
			outputProperty( this, "get-message", "get-prompt" );
		} else {
			// the object is already in the inventory
			outputProperty( this, "have-message", "have-prompt" );
		}

		//console.log( "inventory: " + JSON.stringify( State.variables.obj_inventory ) );
		//console.log( "temp objects: " + JSON.stringify( State.temporary.obj_objects ) );
	}

	drop () {
		if ( State.variables.obj_inventory[ this.name ] ) {
			// move the object out of the inventory
			State.temporary.obj_objects[ this.name ] = this;
			delete State.variables.obj_inventory[ this.name];
			outputProperty( this, "drop-message", "drop-prompt" );
		} else {
			// the object is not in the inventory
			outputProperty( this, "not-have-message", "not-have-prompt" );
		}
	}
}


class ObjSysProperty {
	constructor ( name, value ) {
		this.name = name;
		this.value = value;
	}
}


class ObjSysAction {
	constructor ( name, type, value ) {
		this.name = name;
		this.type = type;
		this.value = value;
	}
}
