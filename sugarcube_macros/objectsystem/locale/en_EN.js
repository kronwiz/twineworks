(function () {
	var l = ObjectSystem.objSysLoc; // shorter name

	/* printer default messages */
	l.m[ "examine-message" ]            = "@@color:red;Object description not provided@@";  // note the red color
	l.m[ "examine-prompt" ]             = "Examine";
	l.m[ "pickup-message" ]             = "You got the object";
	l.m[ "pickup-prompt" ]              = "Get";
	l.m[ "in-inventory-message" ]       = "The object is already in your inventory";
	l.m[ "in-inventory-prompt" ]        = "Get";
	l.m[ "drop-message" ]               = "You dropped the object";
	l.m[ "drop-prompt" ]                = "Drop"; 
	l.m[ "not-in-inventory-message" ]   = "You don't have the object in your inventory";
	l.m[ "not-in-inventory-prompt" ]    = "Drop"; 
	l.m[ "is-open-message" ]            = "The object is already open";
	l.m[ "is-open-prompt" ]             = "Open"; 
	l.m[ "open-message" ]               = "You opened the object";
	l.m[ "open-prompt" ]                = "Open"; 
	l.m[ "is-closed-message" ]          = "The object is already closed";
	l.m[ "is-closed-prompt" ]           = "Close";
	l.m[ "close-message" ]              = "You closed the object";
	l.m[ "close-prompt" ]               = "Close";
	l.m[ "pickup-not-allowed-message" ] = "The object can't be picked up";
	l.m[ "pickup-not-allowed-prompt" ]  = "Get";
	l.m[ "open-not-allowed-message" ]   = "The object can't be opened";
	l.m[ "open-not-allowed-prompt" ]    = "Open"; 

	/* hints appearing when hovering over the prompt action images */
	l.m[ "prompt-pickup-image-title" ]  = "Pickup";
	l.m[ "prompt-drop-image-title" ]    = "Drop";
	l.m[ "prompt-open-image-title" ]    = "Open";
	l.m[ "prompt-close-image-title" ]   = "Close";
	l.m[ "prompt-examine-image-title" ] = "Examine";
}());

