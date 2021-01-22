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


// This is executed before the rendering of the incoming passage
$( document ).one( ':passagestart', function ( ev ) {
	// create the temporary objects store
	var objstore = temporary().objects;
	if ( !objstore ) {
		objstore = {};
		temporary().objects = objstore;
	}
});


function getObjectID ( name ) {
	// to avoid conflicts the object ID is <passage ID> + "_" + <obj name with spaces replaced>
	return Story.get( State.passage ).domId + "_" + name.replace( / /, "_" );
}


Macro.add( 'obj_define', {
	tags     : [],
	handler  : function () {
		console.log( "obj_define" );
		var name = this.args[ 0 ];

		var objid = getObjectID( name );
		var objstore = temporary().objects;

		if ( !(name in objstore) ) {  // TODO: controllare anche che non sia nell'inventario
			objstore[ objid ] = { "id": objid, "name": name };
			// TODO: aggiungerlo alla lista di oggetti nella stanza se non c'e' gia'
		}


	}
})


Macro.add( 'obj_property_set', {
	tags     : [],
	handler  : function () {
		console.log( "obj_property_set" );
		var name = this.args[ 0 ];
		var property = this.args[ 1 ];

		var objid = getObjectID( name );
		var objstore = temporary().objects;
		var obj = null;

		if ( objid in objstore )
			obj = objstore[ objid ];
		//else if ( objid in <inventario> ) ...   TODO: recuperare l'oggetto dall'inventario

		if ( obj )
			obj[ property ] = this.payload[ 0 ].contents;

	}
})


Macro.add( 'obj_property_do', {
	tags     : [],
	handler  : function () {
		console.log( "obj_property_do" );
		var name = this.args[ 0 ];
		var property = this.args[ 1 ];

		var objid = getObjectID( name );
		var objstore = temporary().objects;
		var obj = null;

		console.log( "objstore = %s", JSON.stringify( objstore ) );
		console.log( "objid in objstore = " + ( objid in objstore ) );

		if ( objid in objstore )
			obj = objstore[ objid ];
		//else if ( objid in <inventario> ) ...   TODO: recuperare l'oggetto dall'inventario

		console.log( "name = " + name + "; obj = " + obj );
		console.log( "property name = " + property + "; obj[ property ] = " + obj[ property ] );
		console.log( "obj && obj[ property ] = " + ( obj && obj[ property ] ) );
		if ( obj && obj[ property ] )
			console.log( "sono qui" );
			var $container = $(document.createElement("span"));
			$container.wiki( obj[ property ] ).appendTo( this.output );
	}
})
