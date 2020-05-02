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

Macro.add('linkdropdown', {
	tags     : null,
	handler  : function () {
		var content = this.payload[0].contents;

		if (this.args.length < 1) {
			return this.error('need at least one argument: the link text');
		}
		var linktext = this.args[0];

		var $container = $(document.createElement("span"));
		var $dropdown = $(document.createElement("div"));
		var $link = $(document.createElement("a"));

		$container.css("position", "relative");
		$container.addClass("linkdropdown");

		$link.addClass("linkdropdown-anchor");
		$link.wiki(linktext);
		$link.ariaClick(function (e) {
			var offset = $link.outerHeight();

			// toggle dropdown visibility status
			if ( $dropdown.css("display") != "block" ) {
				$link.addClass("open");
				$dropdown.css({"top": offset + "px", "display": "block"});
			}
			else {
				$dropdown.css("display", "none");
				$link.removeClass("open");
			}
		});

		$dropdown.css({"position": "absolute", "top": "0px", "left": "0px", "display": "none", "z-index": 3});
		$dropdown.addClass("linkdropdown-dropdown");
		$dropdown.wiki(content);

		$container.append($link).append($dropdown);
		$container.appendTo(this.output);
	}
});
