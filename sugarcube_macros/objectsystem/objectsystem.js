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
		objstore = new ObjSysInventory( ev.passage.domId );
		obj_passage_inventories[ ev.passage.domId ] = objstore;
	}
	// store the passage inventory in a temporary variable for easy access from the story
	State.temporary.psg_objects = objstore;
	// store the object inventory in a temporary variable for easy access from the story
	State.temporary.inventory = obj_inventory;
	// store the object function contatiner in a temporary variable for easy access from the story
	State.temporary.object = ObjSysObjectFunctionsContainer;

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

/*
function getObject ( name ) {
	console.log( ">> GETOBJECT: " + (new Date()) );
	console.log( "objstore: " + JSON.stringify( objstore ) + "; type: " + ( objstore instanceof ObjSysInventory ) );

	var obj = null;

	if ( objstore.hasObject( name ) ) obj = objstore.getObject( name );
	else if ( obj_inventory.hasObject( name ) )	obj = obj_inventory.getObject( name );

	console.log( "<< GETOBJECT" );

	return obj;
}
*/

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
			// remember in which passage the object is, for faster search
			obj_object_to_passage[ name ] = objstore.passage_id;

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

		var obj = ObjSysObjectFunctionsContainer.name( name );

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
			if ( obj.getProperty( "allow-pickup" ) != true ) {
				ObjSysPrinter.pickup_not_allowed( obj );
				return;
			}
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
			delete obj_object_to_passage[ name ];  // the object is no more in any passage
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
			obj_object_to_passage[ name ] = objstore.passage_id;  // the object is in the new passage
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

		if ( obj ) {
			if ( obj.getProperty( "allow-open" ) != true ) {
				ObjSysPrinter.open_not_allowed( obj );
				return;
			}
		} else {
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


Macro.add( 'close', {
	// no tags: self closing macro element
	handler  : function () {
		var name = this.args[ 0 ];

		if ( !name ) return this.error( 'close: missing object name' );

		var obj = getObject( name );

		if ( !obj ) {
			console.warn( `close: object ${name} not defined` );
			return;
		}

		if ( obj.getProperty( "open" ) != true ) {
			ObjSysPrinter.is_closed( obj );
			return;
		}

		obj.setProperty( "open", false );
		ObjSysPrinter.close( obj );
		// executes obj hook after the object has been opened
		if ( obj.close ) obj.close();
	}
})


Macro.add( 'obj-allow', {
	// no tags: self closing macro element
	handler  : function () {
		var name = this.args[ 0 ];
		var actionName = this.args[ 1 ];
		var flag = this.args[ 2 ];

		if ( !name ) return this.error( 'obj-allow: missing object name' );
		if ( !actionName ) return this.error( `obj-allow for ${name}: missing action name` );
		if ( !flag ) return this.error( `obj-allow for ${name} and action ${actionName}: missing flag` );

		var obj = getObject( name );

		if ( !obj ) {
			console.warn( `obj-allow: object ${name} not defined` );
			return;
		}

		if ( [ "pickup", "open" ].indexOf( actionName ) == -1 ) {
			console.warn( `obj-allow: action name ${actionName} not valid` );
			return;
		}

		obj.setProperty( "allow-" + actionName, flag.toLowerCase() == "true" ? true: false );
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

	/**
	 * Return the value of the specified property.
	 * @param {string} name - Property name.
	 * @returns {any} The property value, which can be of any type previously stored.
	 */
	getProperty ( name ) {
		var prop = this.properties[ name ];
		if ( prop ) return prop.value;
		else return null;
	}

	/**
	 * Store the code of an action that can be executed later. It's kind of a method, but its code comes from a macro provided by the user. If an action with the given name exists then its type and value are updated. THIS IS WORK IN PROGRESS: it's not working yet.
	 * @param {string} name - Action name.
	 * @param {string} type - Action type. TO BE DEFINED
	 * @param {string} value - String buffer containing the macro code.
	 */
	setAction ( name, type, value ) {
		var a = this.actions[ name ];
		if ( a ) {
			a.type = type;
			a.value = value;
		}
		else this.actions[ name ] = new ObjSysAction( name, type, value );
	}

	/**
	 * Return the code of the specified action. THIS IS WORK IN PROGRESS: see also setAction.
	 * @param {string} name - Action name.
	 * @returns {string} The string buffer containing the macro code.
	 */
	getAction ( name ) {
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
	constructor ( passage_id = null ) {
		this.passage_id = passage_id;
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
		"is-closed-message": new ObjSysProperty( "is-closed-message", "The object is already closed" ),
		"is-closed-prompt": new ObjSysProperty( "is-closed-prompt", "Close" ),
		"close-message": new ObjSysProperty( "close-message", "You closed the object" ),
		"close-prompt": new ObjSysProperty( "close-prompt", "Close" ),
		"pickup-not-allowed-message": new ObjSysProperty( "pickup-not-allowed-message", "The object can't be picked up" ),
		"pickup-not-allowed-prompt": new ObjSysProperty( "pickup-not-allowed-prompt", "Get" ),
		"open-not-allowed-message": new ObjSysProperty( "open-not-allowed-message", "The object can't be opened" ),
		"open-not-allowed-prompt": new ObjSysProperty( "open-not-allowed-prompt", "Open" ),
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

	static is_closed ( obj ) {
		this.print( obj, "is-closed-message", "is-closed-prompt" );
	}

	static close ( obj ) {
		this.print( obj, "close-message", "close-prompt" );
	}

	static pickup_not_allowed ( obj ) {
		this.print( obj, "pickup-not-allowed-message", "pickup-not-allowed-prompt" );
	}

	static open_not_allowed ( obj ) {
		this.print( obj, "open-not-allowed-message", "open-not-allowed-prompt" );
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


class ObjSysObjectFunctionsContainer {
	static name ( name ) {
		var obj = null;
		// first search in the inventory
		if ( obj_inventory.hasObject( name ) ) obj = obj_inventory.getObject( name );
		else {
			// then in the passages
			var passage = obj_object_to_passage[ name ];
			if ( passage ) obj = obj_passage_inventories[ passage ].getObject( name );
		}
		return obj;
	}
}

// shorter name to be used in this source code
var getObject = ObjSysObjectFunctionsContainer.name;


// create the global inventory object used throughout the game: object name -> object
var obj_inventory = new ObjSysInventory();
// create the storage for the passages inventories: passage domId -> inventory
var obj_passage_inventories = {};
// inverse index associating objects to passages: object name -> passage domId
var obj_object_to_passage = {};
// temporary variable for the passage objects store (it's associated to the passage ID)
var objstore = null;


}());  // end of namespace