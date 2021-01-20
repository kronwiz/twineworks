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

function getObjectID( name ) {
	// to avoid conflicts the object ID is <passage ID> + "_" + <obj name with spaces replaced>
	return Story.get( State.passage() ).domId + "_" + name.replace( / /, "_" );
}


Macro.add( 'object', {
	tags     : [],
	handler  : function () {
		var name = this.args[ 0 ];

		var objid = getObjectID( name );
		var objstore = temporary().objects;

		if ( !(name in objstore) ) {  // TODO: controllare anche che non sia nell'inventario
			objstore[ name ] = { "id": objid, "name": name };
			// TODO: aggiungerlo alla lista di oggetti nella stanza se non c'e' gia'
		}


	}



Macro.add( 'setObjectProperty', {
	tags     : [],
	handler  : function () {
		var name = this.args[ 0 ];
		var property = this.args[ 1 ];

		var objid = getObjectID( name );
		var objstore = temporary().objects;
		var obj = null;

		if ( objid in objstore )
			obj = objstore[ objid ];
		//else if ( objid in <inventario> ) ...   TODO: recuperare l'oggetto dall'inventario

		obj[ property ] = this.payload[ 0 ].contents;

}

