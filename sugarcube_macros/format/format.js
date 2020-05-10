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

(function () {  // namespace

/* this is where the defined templates are stored */
var format_templates = {};

function replace_placeholders (template, payloads) {
	let contents = {};

	function replacer (match, pname, offset, string) {
		let res = contents[pname];
		if (! res) res = "placeholder {{{<<" + pname + ">>}}} not specified";
		return res;
	}

	/* remove from each payload content its closing tag (if any)
	   and build a dictionary {name: content} for easier lookup */
	payloads.forEach(element => {
		let r = new RegExp("<</" + element.name + ">>");
		contents[element.name] = element.contents.replace(r, "");
	});
	// replace each placeholder with its content
	let matcher = /#(ph[0-9])#/g;
	return template.replace(matcher, replacer);
}

Macro.add('format', {
	tags     : ["ph0", "ph1", "ph2", "ph3", "ph4", "ph5", "ph6", "ph7", "ph8", "ph9"],
	handler  : function () {

		if (this.args.length < 2) return this.error("need at least two arguments: command formatName");
		var command = this.args[0];

		switch ( command ) {
			case "set":
				var format_name = this.args[1];
				format_templates[format_name] = this.payload[0].contents;
				break;

			case "print":
				if (this.args.length < 3) return this.error("the print command takes 2 parameters: linkText, formatName");
				var link_text = this.args[1];
				var format_name = this.args[2];
				/*this.payload.forEach(element => {
					console.log(element.name + '=> "' + element.contents + '"');
				});*/

				var template = format_templates[format_name];
				if (! template) return this.error("unknown format name: " + format_name);
				var content = replace_placeholders(template, this.payload);

				var $link = $(document.createElement("a"));
				$link.addClass(["link-internal", "macro-link"]);
				$link.wiki(link_text);
				$link.ariaClick(function (e) {
					jQuery.wiki(content);  // this executes the template contents
				});

				$link.appendTo(this.output);
				break;

			default:
				return this.error("unknown command: " + command);
		}
	}
});

}());  // namespace