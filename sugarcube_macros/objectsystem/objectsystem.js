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

(function () { // namespace isolation

/*
The definitions of the global variables are at the bottom, after the definitions
of the classes.
*/


// This is executed before the rendering of the incoming passage
$( document ).on( ':passagestart', function ( ev ) {
	console.log( ">> PASSAGESTART: " + (new Date()) );
	objstore = obj_passage_inventories[ ev.passage.domId ];
	if ( !objstore ) {
		objstore = new ObjSysInventory();
		obj_passage_inventories[ ev.passage.domId ] = objstore;
	}
	// store the passage inventory in a temporary variable for easy access from the passage code
	State.temporary.psg_objects = objstore;
	// store the object inventory in a temporary variable for easy access from the passage code
	State.temporary.obj_inventory = obj_inventory;

	console.log( "objstore: " + JSON.stringify( State.temporary.psg_objects ) );
	console.log( "<< PASSAGESTART" );
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


function getObject ( name ) {
	console.log( ">> GETOBJECT: " + (new Date()) );
	console.log( "objstore: " + JSON.stringify( objstore ) + "; type: " + ( objstore instanceof ObjSysInventory ) );

	var obj = null;

	if ( objstore.hasObject( name ) ) obj = objstore.getObject( name );
	else if ( obj_inventory.hasObject( name ) )	obj = obj_inventory.getObject( name );

	console.log( "<< GETOBJECT" );

	return obj;
}


Macro.add( 'obj-define', {
	tags     : [],
	handler  : function () {
		console.log( ">> OBJ-DEFINE: " + (new Date()) );

		var name = this.args[ 0 ];

		if ( !name ) return this.error( 'obj-define: missing object name' );

		console.log( "objstore: " + JSON.stringify( objstore ) );
		
		var obj = getObject( name );

		/* Note that with this check two objects with the same name cannot exist,
		   and an object cannot be redefined, so when you come back to a passage the
		   "obj-define" instructions aren't reexecuted because the objects already exist */
		if ( !obj ) {
			obj = new ObjSysObject( name );
			objstore.addObject( obj );

			// This executes all the obj-property-set that might be in the obj-define content
			for ( var i = 0, len = this.payload.length; i < len; i++ ) {
				$( this.output ).wiki( this.payload[ i ].contents );
			}
		}

		console.log( "<< OBJ-DEFINE" );
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
				var func = obj.getActionValue( actionName );
				if ( func ) func();
				else console.warn( `No action ${actionName} defined for object "${name}"` );
			}
			else console.warn( `Object "${name}" is undefined` );
		});
		$link.appendTo( this.output );
	}
})


Macro.add( 'examine', {
	// no tags: self closing macro element
	handler  : function () {
		var name = this.args[ 0 ];

		if ( !name ) return this.error( 'examine: missing object name' );

		var obj = getObject( name );

		if ( !obj ) {
			console.warn( `examine: object ${name} not defined` );
			return;
		}

		ObjSysPrinter.examine( obj );
		if ( obj.examine ) obj.examine();
	}
})


Macro.add( 'pickup', {
	// no tags: self closing macro element
	handler  : function () {
		var name = this.args[ 0 ];

		if ( !name ) return this.error( 'pickup: missing object name' );

		var obj = getObject( name );

		if ( obj ) {
			// TODO: controllare se l'oggetto permette di essere raccolto
		}
		else {
			console.warn( `pickup: object ${name} not defined` );
			return;
		}

		if ( obj_inventory.hasObject( name ) ) {
			ObjSysPrinter.in_inventory( obj );
			return;
		}

		if ( obj_inventory.transferObjectFrom( name, objstore ) ) {
			ObjSysPrinter.pickup( obj );
			// executes obj hook when the transfer has executed successfully
			if ( obj.pickup ) obj.pickup();
		}
	}
})


Macro.add( 'drop', {
	// no tags: self closing macro element
	handler  : function () {
		var name = this.args[ 0 ];

		if ( !name ) return this.error( 'drop: missing object name' );

		var obj = getObject( name );

		if ( !obj ) {
			console.warn( `drop: object ${name} not defined` );
			return;
		}

		if ( !obj_inventory.hasObject( name ) ) {
			ObjSysPrinter.not_in_inventory( obj );
			return;
		}

		if ( objstore.transferObjectFrom( name, obj_inventory ) ) {
			ObjSysPrinter.drop( obj );
			// executes obj hook when the transfer has executed successfully
			if ( obj.drop ) obj.drop();
		}
	}
})


Macro.add( 'open', {
	// no tags: self closing macro element
	handler  : function () {
		var name = this.args[ 0 ];

		if ( !name ) return this.error( 'open: missing object name' );

		var obj = getObject( name );

		if ( !obj ) {
			console.warn( `open: object ${name} not defined` );
			return;
		}

		if ( obj.getProperty( "open" ) == true ) {
			ObjSysPrinter.is_open( obj );
			return;
		}

		obj.setProperty( "open", true );
		ObjSysPrinter.open( obj );
		// executes obj hook after the object has been opened
		if ( obj.open ) obj.open();
	}
})


/** Class representing an object */
class ObjSysObject {
	/**
	 * Create an object.
	 * @param {string} name - Object name.
	 */
	constructor ( name ) {
		this.name = name;

		this.properties = {};
		this.actions = {};
	}

	/**
	 * Set the value of the specified property, creating it if not present.
	 * @param {string} name - Property name.
	 * @param {string} value - Property value.
	 */
	setProperty ( name, value ) {
		var p = this.properties[ name ];
		if ( p ) p.value = value;
		else this.properties[ name ] = new ObjSysProperty( name, value );
	}

	getProperty ( name ) {
		var prop = this.properties[ name ];
		if ( prop ) return prop.value;
		else return null;
	}

	setAction ( name, type, value ) {
		var a = this.actions[ name ];
		if ( a ) {
			a.type = type;
			a.value = value;
		}
		else this.actions[ name ] = new ObjSysAction( name, type, value );
	}

	getActionValue ( name ) {
		var action = this.actions[ name ];
		if ( action ) return action.value;  // Note: this works only for native actions
		else return null;
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


/** Inventory class */
class ObjSysInventory {
	/**
	 * Create an inventory.
	 */
	constructor () {
		this.objects = {};
	}

	/**
	 * Add an object to the inventory.
	 * @param {ObjSysObject} obj - Object to be added.
	 */
	addObject ( obj ) {
		this.objects[ obj.name ] = obj;
	}

	/**
	 * Return the object with the specified name.
	 * @param {string} name - Name of the object.
	 * @returns {ObjSysObject} The object with the given name or undefined if there's no such object.
	 */
	getObject ( name ) {
		return this.objects[ name ];
	}

	/**
	 * Return a boolean indicating if the inventory contains the object or not.
	 * @param {string} name - Name of the object.
	 * @returns {boolean} true if the object is in the inventory or false otherwise.
	 */
	hasObject ( name ) {
		return ( name in this.objects );
	}

	/**
	 * Remove an object from the inventory.
	 * @param {string or ObjSysObject} obj_or_name - The name of the object or an instance of ObjSysObject to be removed.
	 */
	deleteObject ( obj_or_name ) {
		var name = null;
		if ( typeof( obj_or_name ) === "string" ) name = obj_or_name;
		else name = obj_or_name.name;

		delete this.objects[ name ];
	}

	/**
	 * Moves an object from another inventory to this inventory.
	 * @param {string} name - name of the object to be transferred.
	 * @param {ObjSysInventory} from_inventory - inventory from which the object must be picked up.
	 * @returns {ObjSysObject or null} the transferred object or null if the object couldn't be transferred.
	 */
	transferObjectFrom ( name, from_inventory ) {
		if ( this.hasObject( name ) ) {
			console.log( `This inventory already has object ${name}` );
			return null;
		}

		var obj = from_inventory.getObject( name );
		if ( obj ) {
			this.addObject( obj );
			from_inventory.deleteObject( obj );
			return obj;
		}
		else {
			console.log( `Starting inventory has no object ${name}` );
			return null;
		}
	}
}


class ObjSysPrinter {
	static default_properties = {
		"examine-message": new ObjSysProperty( "examine-message", "@@color:red;Object description not provided@@" ),
		"examine-prompt": new ObjSysProperty( "examine-prompt", "Examine" ),
		"pickup-message": new ObjSysProperty( "pickup-message", "You got the object" ),
		"pickup-prompt": new ObjSysProperty( "pickup-prompt", "Get" ),
		"in-inventory-message": new ObjSysProperty( "in-inventory-message", "The object is already in your inventory" ),
		"in-inventory-prompt": new ObjSysProperty( "in-inventory-prompt", "Get" ),
		"drop-message": new ObjSysProperty( "drop-message", "You dropped the object" ),
		"drop-prompt": new ObjSysProperty( "drop-prompt", "Drop" ),
		"not-in-inventory-message": new ObjSysProperty( "not-in-inventory-message", "You don't have the object in your inventory" ),
		"not-in-inventory-prompt": new ObjSysProperty( "not-in-inventory-prompt", "Drop" ),
		"is-open-message": new ObjSysProperty( "is-open-message", "The object is already open" ),
		"is-open-prompt": new ObjSysProperty( "is-open-prompt", "Open" ),
		"open-message": new ObjSysProperty( "open-message", "You opened the object" ),
		"open-prompt": new ObjSysProperty( "open-prompt", "Open" ),
		// ...
	
		// if the requested property is not defined we use this to display an error message
		"obj-property-undefined-message": new ObjSysProperty( "obj-property-undefined-message", '@@color:red;No property "__property__" defined for object "__object__"@@' ),
		"obj-property-undefined-prompt": new ObjSysProperty( "obj-property-undefined-prompt", "@@color:red;!!Missing prompt!!@@" )
	}

	static drop ( obj ) {
		this.print( obj, "drop-message", "drop-prompt" );
	}

	static not_in_inventory ( obj ) {
		this.print( obj, "not-in-inventory-message", "not-in-inventory-prompt" );
	}

	static pickup ( obj ) {
		this.print( obj, "pickup-message", "pickup-prompt" );
	}

	static in_inventory ( obj ) {
		this.print( obj, "in-inventory-message", "in-inventory-prompt" );
	}

	static examine ( obj ) {
		this.print( obj, "examine-message", "examine-prompt" );
	}

	static is_open ( obj ) {
		this.print( obj, "is-open-message", "is-open-prompt" );
	}

	static open ( obj ) {
		this.print( obj, "open-message", "open-prompt" );
	}

	static print ( obj, name, title ) {
		// get property from object
		var property = obj.getProperty( name );
		// if missing get property from defaults
		if ( !property ) property = this.default_properties[ name ].value;
		// if missing get property undefined message
		if ( !property ) property = this.default_properties[ "obj-property-undefined-message" ].value.replace( "__property__", name ).replace( "__object__", obj.name );

		var promptText = obj.getProperty( title );
		if ( !promptText ) promptText = this.default_properties[ title ].value;
		if ( !promptText ) promptText = this.default_properties[ "obj-property-undefined-prompt" ].value.replace( "__property__", name ).replace( "__object__", obj.name );

		// prompt row with a unique ID
		var $prompt = $( document.createElement( "div" ) );
		var promptid = "objprompt" + generateUUID();
		$prompt.attr( "id", promptid );
		// content of the prompt
		$prompt.wiki( `<<link "X">><<examine "${obj.name}">><</link>>\
		<<link "G">><<pickup "${obj.name}">><</link>>\
		<<link "D">><<drop "${obj.name}">><</link>>\
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

}

// create the global inventory object used throughout the game.
var obj_inventory = new ObjSysInventory();
// create the storage for the passages inventories
var obj_passage_inventories = {};
// define the passage objects store (it's associated to the passage ID)
var objstore = null;


}());  // end of namespace