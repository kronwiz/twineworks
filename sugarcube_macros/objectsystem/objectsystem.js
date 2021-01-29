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
variables().obj_inventory = {};
console.log( "inventory defined: " + JSON.stringify( variables() ) );


// This is executed before the rendering of the incoming passage
$( document ).one( ':passagestart', function ( ev ) {
	// create the temporary objects store
	var objstore = temporary().obj_objects;
	if ( !objstore ) {
		objstore = {};
		temporary().obj_objects = objstore;
	}
});


function getObjectID ( name ) {
	// to avoid conflicts the object ID is <passage ID> + "_" + <obj name with spaces replaced>
	return Story.get( State.passage ).domId + "_" + name.replace( / /, "_" );
}


function getObject ( name ) {
	var objid = getObjectID( name );
	var objstore = temporary().obj_objects;
	var inventory = variables().obj_inventory;
	var obj = null;

	console.log( "variables: " + JSON.stringify( variables() ));
	console.log( "inventory: " + inventory );

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

		var obj = getObject( name );

		if ( !obj ) {
			objstore[ objid ] = { "id": objid, "name": name };
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

		if ( obj )
			obj[ property ] = this.payload[ 0 ].contents;

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
		$link.ariaClick( function (e) {
			var obj = getObject( name );

			if ( obj && obj[ property ] ) {
				var $span = $( document.createElement( "span" ) );
				$span.wiki( obj[ property ] );
				$span.appendTo( $( "#message" ) );
			} else {
				return this.error( 'obj or property is undefined' );
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
