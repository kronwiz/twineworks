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
