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

	app.debug = function () {
		if (pending.length > 0) {
			var waiting_list = [];
			for (var i = 0; i < pending.length; ++i) {
				var entry = pending[i];
				for (var j = 0; j < entry.deps.length; ++j) {
					var dependency = entry.deps[j];
					if (waiting_list.indexOf(dependency) == -1) {
						waiting_list.push(dependency);
					}
				}
			}
			console.log(pending.length + (pending.length != 1 ? ' modules are' : ' module is') + ' still waiting for dependencies.')
			console.log('All missing dependencies:');
			for (var i = 0; i < waiting_list.length; ++i) {
				console.log(' - ' + waiting_list[i]);
			}
		}
		else { // pending.length == 0
			console.log('No detectable issues found.');
			console.log('All modules and tasks have resolved.');
		}
		// pretty print
		return null;
	};

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

			var parts = name.split('.');
			if (parts.length > 1) {
				var root = namespace;
				for (var i = 0; i < parts.length - 1; ++i) {
					var part = parts[i];
					if ( ! (part in root)) {
						root[part] = {};
					}
					root = root[part];
				}
				root[parts[parts.length - 1]] = func(namespace);
			}
			else { // parts.length == 1
				namespace[name] = func(namespace);
			}

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
