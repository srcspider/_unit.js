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

	// definition lookup
	var defined_names = [];

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

	/**
	 * Automatically triggers unit.debug() at provided interval(s). Multiple
	 * values can be provided. If the first interval is triggered and no errors
	 * are detected the next intervals won't be triggered.
	 */
	app.selfdebug = function () {
		var args = arguments;
		var noerrors = false;

		var schedule = function (timeout) {
			setTimeout(function () {
				if ( ! noerrors) {
					console.log('')
					console.log('Scheduled unit.debug @ ' + timeout + 's')
					noerrors = ! app.debug();
				};
			}, timeout * 1000);
		}

		for (var i = 0; i < args.length; ++i) {
			schedule(args[i]);
		}
	};

	/**
	 * Diagnoses potential problems with current state. eg. unresolved modules
	 */
	app.debug = function () {
		if (pending.length > 0) {

			// Calculate unresolved dependencies
			// ---------------------------------

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

			console.log('unitjs >> ' + pending.length + (pending.length != 1 ? ' modules are' : ' module is') + ' still waiting for dependencies.')
			console.log('unitjs >> All unresolved dependencies:');

			for (var i = 0; i < waiting_list.length; ++i) {
				console.log(' - ' + waiting_list[i]);
			}

			// Calculate missing dependencies
			// ------------------------------

			var missing_modules = [];
			for (var i = 0; i < waiting_list.length; ++i) {
				var entry = waiting_list[i];
				if (defined_names.indexOf(entry) == -1) {
					missing_modules.push(entry);
				}
			}

			if (missing_modules.length == 0) {
				console.log('unitjs >> All unresolved dependencies were defined.');
			}
			else { // length > 0
				console.log('unitjs >> ' + missing_modules.length + (missing_modules.length != 1 ? ' modules have' : ' module has') + ' not been defined.');
				console.log('unitjs >> All undefined modules:');
				for (var i = 0; i < missing_modules.length; ++i) {
					console.log(' - ' + missing_modules[i] );
				}
			}

			return true;
		}
		else { // pending.length == 0
			console.log('unitjs >> No detectable issues found.');
			console.log('unitjs >> All modules and tasks have resolved.');
			return false;
		}
	};

	/**
	 * Execute code when dependencies resolve.
	 */
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

	/**
	 * Define module.
	 */
	app.def = function (name, func) {

		// store name for debug purposes
		defined_names.push(name);

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
