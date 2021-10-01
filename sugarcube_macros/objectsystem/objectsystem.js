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


(function () {

window.ObjectSystem = {};  // namespace isolation

/** Class handling the localization of the messages */
ObjectSystem.ObjSysLocale = class ObjSysLocale {
	constructor () {
		/** @var {dictionary} m Container for the messages: constant identifying the message -> message string. The name is short to be practical. */
		this.m = {
			/* printer default messages */
			"examine-message": "@@color:red;Object description not provided@@",
			"examine-prompt": "Examine",
			"pickup-message": "You got the object",
			"pickup-prompt": "Get",
			"in-inventory-message": "The object is already in your inventory",
			"in-inventory-prompt": "Get",
			"drop-message": "You dropped the object",
			"drop-prompt": "Drop",
			"not-in-inventory-message": "You don't have the object in your inventory",
			"not-in-inventory-prompt": "Drop",
			"is-open-message": "The object is already open",
			"is-open-prompt": "Open",
			"open-message": "You opened the object",
			"open-prompt": "Open",
			"is-closed-message": "The object is already closed",
			"is-closed-prompt": "Close",
			"close-message": "You closed the object",
			"close-prompt": "Close",
			"pickup-not-allowed-message": "The object can't be picked up",
			"pickup-not-allowed-prompt": "Get",
			"open-not-allowed-message": "The object can't be opened",
			"open-not-allowed-prompt": "Open",

			/* hints appearing when hovering over the prompt action images */
			"prompt-pickup-image-title": "Pickup",
			"prompt-drop-image-title": "Drop",
			"prompt-open-image-title": "Open",
			"prompt-close-image-title": "Close",
			"prompt-examine-image-title": "Examine",
		}
	}
}

// instance of the above
ObjectSystem.objSysLoc = new ObjectSystem.ObjSysLocale();

// very short name for the localization object to be used in this source code
var l = ObjectSystem.objSysLoc;

/* **
The definitions of the global variables are at the bottom, after the definitions
of the classes.
** */


// This is executed before the rendering of the incoming passage
$( document ).on( ':passagestart', function ( ev ) {
	console.log( ">> PASSAGESTART: " + (new Date()) );
	objstore = obj_passage_inventories[ ev.passage.domId ];
	if ( !objstore ) {
		objstore = new ObjectSystem.ObjSysInventory( ev.passage.domId );
		obj_passage_inventories[ ev.passage.domId ] = objstore;
	}
	// store the passage inventory in a temporary variable for easy access from the story
	State.temporary.psg_objects = objstore;
	// store the object inventory in a temporary variable for easy access from the story
	State.temporary.inventory = obj_inventory;
	// store the object function contatiner in a temporary variable for easy access from the story
	State.temporary.object = ObjectSystem.ObjSysObjectFunctionsContainer;

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
			obj = new ObjectSystem.ObjSysObject( name );
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

		ObjectSystem.ObjSysPrinter.print( obj, "examine" );
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
				ObjectSystem.ObjSysPrinter.print( obj,"pickup-not-allowed" );
				return;
			}
		}
		else {
			console.warn( `pickup: object ${name} not defined` );
			return;
		}

		if ( obj_inventory.hasObject( name ) ) {
			ObjectSystem.ObjSysPrinter.print( obj, "in-inventory" );
			return;
		}

		if ( obj_inventory.transferObjectFrom( name, objstore ) ) {
			delete obj_object_to_passage[ name ];  // the object is no more in any passage
			ObjectSystem.ObjSysPrinter.print( obj, "pickup" );
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
			ObjectSystem.ObjSysPrinter.print( obj, "not-in-inventory" );
			return;
		}

		if ( objstore.transferObjectFrom( name, obj_inventory ) ) {
			obj_object_to_passage[ name ] = objstore.passage_id;  // the object is in the new passage
			ObjectSystem.ObjSysPrinter.print( obj, "drop" );
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
				ObjectSystem.ObjSysPrinter.print( obj, "open-not-allowed" );
				return;
			}
		} else {
			console.warn( `open: object ${name} not defined` );
			return;
		}

		if ( obj.getProperty( "open" ) == true ) {
			ObjectSystem.ObjSysPrinter.print( obj, "is-open" );
			return;
		}

		obj.setProperty( "open", true );
		ObjectSystem.ObjSysPrinter.print( obj, "open" );
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
			ObjectSystem.ObjSysPrinter.print( obj, "is-closed" );
			return;
		}

		obj.setProperty( "open", false );
		ObjectSystem.ObjSysPrinter.print( obj, "close" );
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

/** @function inventory-foreach
 * @param {string} text - Link text.
 * @param {string} selector - Element CSS selector name (complete with "#" or other prefix if needed).
 * @param {string} content - Wiki content to be rendered for each object in the inventory. In the content the "--object--" placeholder is replaced with the object name.
 */
Macro.add( 'inventory-foreach', {
	tags     : [],
	handler  : function () {
		var text = this.args[ 0 ];
		var selector = this.args[ 1 ];
		var content = this.payload[ 0 ].contents;

		if ( !text ) return this.error( 'inventory-foreach: missing link text' );
		if ( !selector ) return this.error( 'inventory-foreach: missing selector' );
		if ( !content ) return this.error( 'inventory-foreach: missing content' );

		// create the link that when clicked will go through the inventory object list
		var $link = $( document.createElement( "a" ) );
		$link.addClass( "link-internal macro-link-anchor" );
		$link.wiki( text );
		$link.ariaClick( function ( _ev ) {
			// get the element specified by the selector
			var $el = $( selector );

			// for each object in the inventory
			obj_inventory.list().forEach( ( name ) => {
				// replace the placeholder in the content with the object name (every occurrence)
				var cont_for_obj = content.replace( /--object--/g, name );
				// wikify the content and add it to the specified element
				$el.wiki( cont_for_obj );
			});
		});
		$link.appendTo( this.output );
	}
})


Macro.add( 'inventory-property-set', {
	tags     : [],
	handler  : function () {
		var propertyName = this.args[ 0 ];

		if ( !propertyName ) return this.error( 'inventory-property-set: missing property name' );

		obj_inventory.setProperty( propertyName, this.payload[ 0 ].contents );
	}
})


Macro.add( 'inventory', {
	// no tags: self closing macro element
	handler  : function () {
		if ( obj_inventory.length() > 0 ) {
			var content = obj_inventory.getProperty( "row-output-format" );
			var res = "";

			// for each object in the inventory
			obj_inventory.list().forEach( ( name ) => {
				// replace the placeholder in the content with the object name (every occurrence)
				var cont_for_obj = content.replace( /--object--/g, name );
				// add to the result
				res = res + cont_for_obj;
			});

			obj_inventory.setProperty( "inventory-output-message", res );
			ObjectSystem.ObjSysPrinter.print( obj_inventory, "inventory-output" );
		} else {
			ObjectSystem.ObjSysPrinter.print( obj_inventory, "inventory-empty" );
		}
	}
})


/** Class representing an object */
ObjectSystem.ObjSysObject = class ObjSysObject {
	/**
	 * Creates an object.
	 * @param {string} name - Object name.
	 */
	constructor ( name ) {
		this.name = name;

		this.properties = {};  // TODO: convert to a Map
		this.actions = {};
	}

	/**
	 * Creates a clone of this object starting from its serialized representation.
	 * @param {Object} obj - Object revived from SugarCube saved state. See the toJSON method.
	 * @returns {ObjSysObject} A clone of this object.
	 */
	static newFromObj ( obj ) {
		var x = new ObjectSystem.ObjSysObject( obj.name );
		for ( let pname in obj.properties ) x.properties[ pname ] = obj.properties[ pname ];
		return x;
	}

	/**
	 * Sets the value of the specified property, creating it if not present.
	 * @param {string} name - Property name.
	 * @param {any} value - Property value.
	 */
	setProperty ( name, value ) {
		var p = this.properties[ name ];
		if ( p ) p.value = value;
		else this.properties[ name ] = new ObjectSystem.ObjSysProperty( name, value );
	}

	/**
	 * Returns the value of the specified property.
	 * @param {string} name - Property name.
	 * @returns {any} The property value, which can be of any type previously stored.
	 */
	getProperty ( name ) {
		var prop = this.properties[ name ];
		if ( prop ) return prop.value;
		else return null;
	}

	/**
	 * Stores the code of an action that can be executed later. It's kind of a method, but its code comes from a macro provided by the user. If an action with the given name exists then its type and value are updated. THIS IS WORK IN PROGRESS: it's not working yet.
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
	 * Returns the code of the specified action. THIS IS WORK IN PROGRESS: see also setAction.
	 * @param {string} name - Action name.
	 * @returns {string} The string buffer containing the macro code.
	 */
	getAction ( name ) {
		var action = this.actions[ name ];
		if ( action ) return action.value;  // Note: this works only for native actions
		else return null;
	}

	/**
	 * Creates a clone of this object. Needed by SugarCube.
	 * @returns {ObjSysObject} A clone of this object.
	 */
	clone () {
		var x = new ObjectSystem.ObjSysObject( clone( this.name ) );
		// creates a clone for each property in the new object
		for ( let pname in this.properties ) x.properties[ clone( pname ) ] = this.properties[ pname ].clone();
		return x;
	}

	/**
	 * Creates a structure containing, among other things, a serialization of the object. Needed by SugarCube to save state.
	 * @returns {Array} A code string that when evaluated will return a clone of the instance.
	 */
	toJSON () {
		// the following two rows are needed to avoid recursion in the reviveWrapper
		// see: https://www.motoslave.net/sugarcube/2/docs/#methods-json-method-revivewrapper
		var ownData = {};
		Object.keys(this).forEach(function (pn) { ownData[pn] = clone(this[pn]); }, this);
		return JSON.reviveWrapper( 'ObjectSystem.ObjSysObject.newFromObj( $ReviveData$ )', ownData );
	}

	/***  Public API  ***/

	/**
	 * Shorter name for "getProperty" to be used in the story.
	 * @param {string} name - Property name.
	 * @returns {any} The property value, which can be of any type previously stored.
	 */
	property ( name ) {
		return this.getProperty( name );
	}
}


/** Property of an object */
ObjectSystem.ObjSysProperty = class ObjSysProperty {
	/**
	 * Creates a property.
	 * @param {string} name - Property name.
	 * @param {any} value - Property value.
	 */
	constructor ( name, value ) {
		this.name = name;
		this.value = value;
	}

	/**
	 * Creates a clone of this object starting from its serialized representation.
	 * @param {Object} obj - Object revived from SugarCube saved state. See the toJSON method.
	 * @returns {ObjSysProperty} A clone of this object.
	 */
	static newFromObj ( obj ) {
		return new ObjectSystem.ObjSysProperty( obj.name, obj.value );
	}

	/**
	 * Creates a clone of this object. Needed by SugarCube.
	 * @returns {ObjSysProperty} A clone of this object.
	 */
	clone () {
		return new ObjectSystem.ObjSysProperty( clone( this.name ), clone( this.value ) );
	}

	/**
	 * Creates a structure containing, among other things, a serialization of the object. Needed by SugarCube to save state.
	 * @returns {Array} A code string that when evaluated will return a clone of the instance.
	 */
	 toJSON () {
		// the following two rows are needed to avoid recursion in the reviveWrapper
		// see: https://www.motoslave.net/sugarcube/2/docs/#methods-json-method-revivewrapper
		var ownData = {};
		Object.keys(this).forEach(function (pn) { ownData[pn] = clone(this[pn]); }, this);
		return JSON.reviveWrapper( 'ObjectSystem.ObjSysProperty.newFromObj( $ReviveData$ )', ownData );
	}
}


ObjectSystem.ObjSysAction = class ObjSysAction {
	constructor ( name, type, value ) {
		this.name = name;
		this.type = type;
		this.value = value;
	}
}


/** Inventory class */
ObjectSystem.ObjSysInventory = class ObjSysInventory {
	/**
	 * Creates an inventory.
	 * @param {string} [passage_id=null] - DOM ID of the passage if this is the inventory of the objects of a passage, otherwise you can omit it.
	 */
	constructor ( passage_id = null ) {
		this.name = "inventory" // needed for printer prompt and error messages

		this.passage_id = passage_id;
		this.objects = {};
		this.properties = {};

		// default rendering of an inventory row
		this.setProperty( "row-output-format", '<<link "--object--">><<examine "--object--">><</link>>' );

		// default properties for the printer
		this.setProperty( "inventory-output-prompt", 'List' );
		this.setProperty( "inventory-empty-prompt", 'List' );
		this.setProperty( "inventory-empty-message", 'Your inventory is empty' );
	}

	/**
	 * Adds an object to the inventory.
	 * @param {ObjSysObject} obj - Object to be added.
	 */
	addObject ( obj ) {
		this.objects[ obj.name ] = obj;
	}

	/**
	 * Returns the object with the specified name.
	 * @param {string} name - Name of the object.
	 * @returns {ObjSysObject} The object with the given name or undefined if there's no such object.
	 */
	getObject ( name ) {
		return this.objects[ name ];
	}

	/**
	 * Returns a boolean indicating if the inventory contains the object or not.
	 * @param {string} name - Name of the object.
	 * @returns {boolean} true if the object is in the inventory or false otherwise.
	 */
	hasObject ( name ) {
		return ( name in this.objects );
	}

	/**
	 * Removes an object from the inventory.
	 * @param {(string|ObjSysObject)} obj_or_name - The name of the object or an instance of ObjSysObject to be removed.
	 */
	deleteObject ( obj_or_name ) {
		var name = null;
		if ( typeof( obj_or_name ) === "string" ) name = obj_or_name;
		else name = obj_or_name.name;

		delete this.objects[ name ];
	}

	/**
	 * Moves an object from another inventory to this inventory, deleting it from the source inventory.
	 * @param {string} name - name of the object to be transferred.
	 * @param {ObjSysInventory} from_inventory - inventory from which the object must be picked up.
	 * @returns {(ObjSysObject|null)} the transferred object or null if the object couldn't be transferred.
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

	/**
	 * Sets the value of the specified property, creating it if not present.
	 * @param {string} name - Property name.
	 * @param {any} value - Property value.
	 */
	 setProperty ( name, value ) {
		var p = this.properties[ name ];
		if ( p ) p.value = value;
		else this.properties[ name ] = new ObjectSystem.ObjSysProperty( name, value );
	}
	
	/**
	 * Returns the value of the specified property.
	 * @param {string} name - Property name.
	 * @returns {any} The property value, which can be of any type previously stored.
	 */
	getProperty ( name ) {
		var prop = this.properties[ name ];
		if ( prop ) return prop.value;
		else return null;
	}
	
	/*** Public API ***/

	/**
	 * Shorter name for "hasObject" to be used in the story.
	 * @param {string} name - Name of the object.
	 * @returns {boolean} true if the object is in the inventory or false otherwise.
	 */
	has ( name ) {
		return this.hasObject( name )
	}

	/**
	 * Returns the list of object names contained in the inventory. Useful to be used in the story.
	 * @returns {Array} array of strings that are the objects names contained in the inventory.
	 */
	list () {
		return Object.keys( this.objects );
	}

	/**
	 * Returns the number of objects contained in the inventory.
	 * @returns {Integer} Number of objects in the inventory.
	 */
	length () {
		return Object.keys( this.objects ).length;
	}
}


ObjectSystem.ObjSysPrinter = class ObjSysPrinter {
	static default_properties = {
		// if the requested property is not defined we use this to display an error message
		"obj-property-undefined-message": new ObjectSystem.ObjSysProperty( "obj-property-undefined-message", '@@color:red;No property "__property__" defined for object "__object__"@@' ),
		"obj-property-undefined-prompt": new ObjectSystem.ObjSysProperty( "obj-property-undefined-prompt", "@@color:red;!!Missing prompt!!@@" )
	}


	static getMessageTitleAndText( obj, title, name ) {
		// get property from object
		var property = obj.getProperty( name );
		// if missing get property from defaults
		//if ( !property ) property = this.default_properties[ name ] ? this.default_properties[ name ].value : null;
		if ( !property ) property = l.m[ name ];  // the default value is taken from the locale
		// if missing get property undefined message
		if ( !property ) property = this.default_properties[ "obj-property-undefined-message" ].value.replace( "__property__", name ).replace( "__object__", obj.name );

		var promptText = obj.getProperty( title );
		//if ( !promptText ) promptText = this.default_properties[ title ] ? this.default_properties[ title ].value : null;
		if ( !promptText ) promptText = l.m[ title ];  // the default value is taken from the locale
		if ( !promptText ) promptText = this.default_properties[ "obj-property-undefined-prompt" ].value.replace( "__property__", name ).replace( "__object__", obj.name );

		return [ promptText, property ];
	}


	static print ( obj, what ) {
		var name = what + "-message";
		var title = what + "-prompt";
		var [ promptText, property ] = this.getMessageTitleAndText( obj, title, name );

		// prompt row with a unique ID
		var $prompt = $( document.createElement( "div" ) );
		var promptid = "objprompt" + generateUUID();
		$prompt.attr( "id", promptid );
		// content of the prompt
		$prompt.wiki( `<<link "<image src='images/examine.png' alt='X' title='${l.m["prompt-examine-image-title"]}'/>">><<examine "${obj.name}">><</link>>\
		<<link "<image src='images/pickup.png' alt='P' title='${l.m["prompt-pickup-image-title"]}'/>">><<pickup "${obj.name}">><</link>>\
		<<link "<image src='images/drop.png' alt='D' title='${l.m["prompt-drop-image-title"]}'/>">><<drop "${obj.name}">><</link>>\
		<<link "<image src='images/open.png' alt='O' title='${l.m["prompt-open-image-title"]}'/>">><<open "${obj.name}">><</link>>\
		<<link "<image src='images/close.png' alt='C' title='${l.m["prompt-close-image-title"]}'/>">><<close "${obj.name}">><</link>>\
		| ${obj.name} ''> ${promptText}''` );

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


/** Class used as a container for utility methods that act on objects. The methods are exposed as functions in the story. */
ObjectSystem.ObjSysObjectFunctionsContainer = class ObjSysObjectFunctionsContainer {
	/**
	 * Returns an object given its name, or null if not found. The method searches in the inventory and in all the passages and stops as soon as the object is found.
	 * @param {string} name - Object name.
	 * @returns {(ObjSysObject|null)} The object or null if not found.
	 * @static
	 */
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
var getObject = ObjectSystem.ObjSysObjectFunctionsContainer.name;


// create the global inventory object used throughout the game: object name -> object
var obj_inventory = new ObjectSystem.ObjSysInventory();
// create the storage for the passages inventories: passage domId -> inventory
var obj_passage_inventories = {};
// inverse index associating objects to passages: object name -> passage domId
var obj_object_to_passage = {};
// temporary variable for the passage objects store (it's associated to the passage ID)
var objstore = null;


}());  // end of namespace