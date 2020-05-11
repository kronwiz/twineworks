/* setmultiline */

Macro.add('setcontent', {
	tags     : [],
	handler  : function () {
			if (this.args.length < 1) return this.error("missing variableName parameter");
			var var_name = this.args[0];

			if (var_name === undefined) return this.error('probably the quotes around "' + this.args.raw + '" are missing');

			if (var_name.match(/^\$/)) {
				variables()[var_name.replace(/^\$/, "")] = this.payload[0].contents;
			}
			else if (var_name.match(/^_/)) {
				temporary()[var_name.replace(/^_/,"")] = this.payload[0].contents;
			} else {
				return this.error("the variableName parameter must start with '$' or '_'");
			}

			console.log(variables());
			console.log(temporary());
	}
})
