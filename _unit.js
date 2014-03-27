/* Very very simple module definition.
 * No magic file loading, no nodejs mumbo jumbo. Short, simple and sweet.
 * -
 * srcspider <source.spider@gmail.com>
 * source: https://github.com/srcspider/_unit.js
 * BSD-2 license
 */
(function () {

	// global space
	var app = window.unit = {};

	// all symbols are loading into the namespace
	var namespace = app.ns = {};

	// seperate lookup store; to allow for null/undefined as valid units
	var resolved_names = [];

	// incomplete modules
	var pending = [];

	// solve any missing entries
	var attempt_to_resolve = function () {
		var unresolved = [];
		var resolved = 0;
		for (var i = 0; i < pending.length; ++i) {
			var entry = pending[i];
			var resolvable = true;
			for (var j = 0; j < entry.deps.length; ++j) {
				if (resolved_names.indexOf(entry.deps[j]) == -1) {
					resolvable = false;
					break;
				}
			}
			if (resolvable) {
				entry.callback();
				resolved += 1;
			}
			else { // not resolvable
				unresolved.push(entry);
			}
		}

		// update pending powers
		pending = unresolved;

		if (resolved != 0) {
			// repeat process until nothing can be resolved anymore
			attempt_to_resolve();
		}
	};

	// Public namespace functions
	// --------------------------

	app.run = function (func) {
		var resolve = function () {
			func(namespace);
		};

		return {
			after: function (required) {
				// allow for string entires
				var type = typeof required;
				if (type == 'string') {
					required = [required];
				}
				else if ( ! required instanceof Array) {
					throw "Error: Invalid require definition. Expected string or array, got ["+type+"].";
				}
				// save and attempt to resolve
				pending.push({
					deps: required,
					callback: resolve
				});
				attempt_to_resolve();
			}
		};
	};

	app.def = function (name, func) {
		var define = function () {
			if (resolved_names.indexOf(name) != -1) {
				throw "Error: Duplicate module definition for module ["+name+"].";
			}
			namespace[name] = func(namespace);
			resolved_names.push(name);
		};

		return {
			after: function (required) {
				// allow for string entires
				var type = typeof required;
				if (type == 'string') {
					required = [required];
				}
				else if ( ! required instanceof Array) {
					throw "Error: Invalid require definition in module ["+name+"]. Expected string or array, got ["+type+"].";
				}
				// save and attempt to resolve
				pending.push({
					deps: required,
					callback: define
				});
				attempt_to_resolve();
			},
			done: function () {
				define();
				attempt_to_resolve();
			}
		};
	};

})();
