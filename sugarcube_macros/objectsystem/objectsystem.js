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
	"examine": "Object description not provided",
	"get": "You got the object",
	"drop": "You dropped the object"
	// ...
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


function getObjectID ( name ) {
	// to avoid conflicts the object ID is <passage ID> + "_" + <obj name with spaces replaced>
	return Story.get( State.passage ).domId + "_" + name.replace( / /, "_" );
}


function getPropertyID ( name ) {
	return name.replace( / /, "_" );
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

		var objstore = temporary().obj_objects;
		var obj = getObject( name );

		if ( !obj ) {
			var objid = getObjectID( name );
			objstore[ objid ] = { "id": objid, "name": name };

			// Set default properties
			// FIXME ----------------- DOESN'T WORK ----------------------
			var defprops = State.variables.obj_default_properties;
			console.log( "defprops: " + JSON.stringify( defprops ) );
			for ( var key in defprops ) {
				var propid = getPropertyID( key );
				obj[ propid ] = defprops[ key ];
				console.log( `obj defprop ${propid}: ${obj[ propid ]}` );
			}

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
		var property = this.args[ 1 ];

		var obj = getObject( name );

		if ( obj ) {
			var propid = getPropertyID( property );
			obj[ propid ] = this.payload[ 0 ].contents;
		}
	}
})


Macro.add( 'obj-execute', {
	tags     : [],
	handler  : function () {
		var name = this.args[ 0 ];
		var property = this.args[ 1 ];
		var linktext = this.payload[ 0 ].contents;

		var $link = $( document.createElement( "a" ) );
		$link.addClass( "link-internal macro-link-anchor" );
		$link.wiki( linktext );
		$link.ariaClick( function ( _ev ) {
			var obj = getObject( name );
			var propid = getPropertyID( property );

			if ( obj && obj[ propid ] ) {
				var func = functionStorage.getFunction( propid );
				if ( func ) func( obj );
				else console.warn( `No action defined for property "${property}" of object "${name}"` );
			} else {
				if ( !obj ) console.warn( `Object "${name}" is undefined` );
				else console.warn( `Property "${property}" is undefined` );
			}
		});
		$link.appendTo( this.output );
	}
})


Macro.add( 'echo', {
	tags     : [],
	handler  : function () {
		console.log( "echo" );
		var msg = this.args[ 0 ];
		$(this.output).wiki( msg );
	}
})


var functionStorage = {
	getFunction: function ( propid ) {
		if ( this[ propid ] && typeof( this[ propid ] ) === "function" ) {
			return this[ propid ];
		}
		else return null;
	},

	examine: function ( obj ) {
		var $span = $( document.createElement( "span" ) );
		$span.wiki( obj[ "examine" ] );
		$span.appendTo( $( "#messagebox" ) );
	}
}
