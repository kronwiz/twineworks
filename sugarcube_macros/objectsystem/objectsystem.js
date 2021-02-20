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
	"examine": { prompt: "Examine", content: "@@color:red;Object description not provided@@" },
	"get": { prompt: "Get", content: "You got the object" },
	"have": { prompt: "Get", content: "The object is already in your inventory" },
	"drop": { prompt: "Drop", content: "You dropped the object" },
	"not-have": { prompt: "Drop", content: "You don't have the object in your inventory" },
	// ...

	// if the requested property is not defined we use this to display an error message
	"obj-property-undefined": { prompt: "@@color:red;!!Missing prompt!!@@", content: '@@color:red;No property "__property__" defined for object "__object__"@@' }
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


function getObjectID ( name ) {
	// to avoid conflicts the object ID is <passage ID> + "_" + <obj name with spaces replaced>
	return Story.get( State.passage ).domId + "_" + name.trim().replace( / /, "_" );
}


function getPropertyID ( name ) {
	return name.trim().replace( / /, "_" );
}


function getObject ( name ) {
	var objid = getObjectID( name );
	var objstore = temporary().obj_objects;
	var inventory = variables().obj_inventory;
	var obj = null;

	if ( objid in objstore )
		obj = objstore[ objid ];
	else if ( objid in inventory )
		obj = inventory[ objid ];

	return obj;
}


Macro.add( 'obj-define', {
	tags     : [],
	handler  : function () {
		var name = this.args[ 0 ];

		if ( !name ) return this.error( 'obj-define: missing object name' );

		var objstore = State.temporary.obj_objects;
		var obj = getObject( name );

		if ( !obj ) {
			var objid = getObjectID( name );
			obj = { "id": objid, "name": name };
			objstore[ objid ] = obj;

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
		var prompt = this.args[ 2 ];

		if ( !name ) return this.error( 'obj-property-set: missing object name' );
		if ( !propertyName ) return this.error( 'obj-property-set: missing property name' );
		// if not specified, the prompt is equal to the property name with the first letter capitalized
		if ( !prompt ) prompt = propertyName.trim().replace( /^\w/, (c) => c.toUpperCase() );

		var obj = getObject( name );

		if ( obj ) {
			var propid = getPropertyID( propertyName );
			obj[ propid ] = { prompt: prompt, content: this.payload[ 0 ].contents };
		}
	}
})


Macro.add( 'obj-execute', {
	tags     : [],
	handler  : function () {
		var name = this.args[ 0 ];
		var propertyName = this.args[ 1 ];
		var linktext = this.payload[ 0 ].contents;

		if ( !name ) return this.error( 'obj-execute: missing object name' );
		if ( !propertyName ) return this.error( 'obj-execute: missing property name' );

		var $link = $( document.createElement( "a" ) );
		$link.addClass( "link-internal macro-link-anchor" );
		$link.wiki( linktext );
		$link.ariaClick( function ( _ev ) {
			var obj = getObject( name );
			var propid = getPropertyID( propertyName );

			if ( obj ) {
				var func = functionStorage.getFunction( propid );
				if ( func ) func( obj );
				else console.warn( `No action defined for property "${propertyName}" of object "${name}"` );
			} else {
				if ( !obj ) console.warn( `Object "${name}" is undefined` );
				else console.warn( `Property "${propertyName}" of object "${name}" is undefined` );
			}
		});
		$link.appendTo( this.output );
	}
})

/** @function  obj-default-property-set
 *  Sets the default value for a property. The property content is taken from the macro payload.
 *  @param {string} propertyName - Name of the property to set.
 *  @param {string} [prompt] - Text appearing as a prompt when the action is executed. If not specified it's equal to the property name with the first letter capitalized.
 *  @throws Returns an error if the property name is missing.
*/
Macro.add( 'obj-default-property-set', {
	tags     : [],
	handler  : function () {
		var propertyName = this.args[ 0 ];
		var prompt = this.args[ 1 ];

		if ( !propertyName ) return this.error( 'obj-default-property-set: missing property name' );
		// if not specified, the prompt is equal to the property name with the first letter capitalized
		if ( !prompt ) prompt = propertyName.trim().replace( /^\w/, (c) => c.toUpperCase() );

		var propid = getPropertyID( propertyName );
		State.variables.obj_default_properties[ propid ] = { prompt: prompt, content: this.payload[ 0 ].contents };
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


function outputProperty ( obj, propid ) {
	var property = obj[ propid ] ? obj[ propid ] : State.variables.obj_default_properties[ propid ];
	if ( !property ) property = State.variables.obj_default_properties[ "obj-property-undefined" ].replace( "__property__", propid ).replace( "__object__", obj.name );

	// prompt row with a unique ID
	var $prompt = $( document.createElement( "div" ) );
	var promptid = "objprompt" + generateUUID();
	$prompt.attr( "id", promptid );
	// content of the prompt
	$prompt.wiki( `<<obj-execute "${obj.name}" "examine">>X<</obj-execute>>\
	<<obj-execute "${obj.name}" "get">>G<</obj-execute>>\
	<<obj-execute "${obj.name}" "drop">>D<</obj-execute>>\
	''> ${property.prompt} ${obj.name}''` );

	// row with the property content
	var $content = $( document.createElement( "div" ) );
	$content.wiki( property.content + "<p/>" );

	// script element to move the new prompt into view
	var $script = $( document.createElement( "script" ) );
	$script.text( `$( "#${promptid}" )[0].scrollIntoView()` );

	// append everything to the #messagebox element
	$prompt.appendTo( $( "#messagebox" ) );
	$content.appendTo( $( "#messagebox" ) );
	$script.appendTo( $( "#messagebox" ) );
}


var functionStorage = {
	getFunction: function ( propid ) {
		if ( this[ propid ] && typeof( this[ propid ] ) === "function" ) {
			return this[ propid ];
		}
		else return null;
	},

	examine: function( obj ) {
		outputProperty( obj, "examine" );
	},

	get: function( obj ) {
		if ( !State.variables.obj_inventory[ obj.id ] ) {
			// move the object to the inventory
			State.variables.obj_inventory[ obj.id ] = obj;
			delete State.temporary.obj_objects[ obj.id ];
			outputProperty( obj, "get" );
		} else {
			// the object is already in the inventory
			outputProperty( obj, "have" );
		}

		//console.log( "inventory: " + JSON.stringify( State.variables.obj_inventory ) );
		//console.log( "temp objects: " + JSON.stringify( State.temporary.obj_objects ) );
	},

	drop: function( obj ) {
		if ( State.variables.obj_inventory[ obj.id ] ) {
			// move the object out of the inventory
			State.temporary.obj_objects[ obj.id ] = obj;
			delete State.variables.obj_inventory[ obj.id ];
			outputProperty( obj, "drop" );
		} else {
			// the object is not in the inventory
			outputProperty( obj, "not-have" );
		}
	}
}
