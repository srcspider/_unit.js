`_unit.js` is a short and sweet module definition utility. It allows you to
define modules in your code so you can combine all your files in any order and
not have to worry about it working.

 - you don't need node
 - you don't need any sophisticated server backend things
 - no sophisticated build system required; just uglify your code into one file
   and it will just work
 - there's no million requests and dynamic script loading

## Syntax

You define a module with requirements using `def(string, func)`
and `after(string|array)`

```javascript
// define a module with one dependency
unit.def('your_module', function (app) {

	// use the dependency
	app.some_dependency.do_something();
	return "hi!"; /* or whatever you want */

}).after('some_dependecy');
```
In the example the code will run after the dependency is resolved. You'll have
access to `some_dependency` via the first paramater, ie. `app.some_dependency`.
There's always only one parameter; no need to worry about parameter order.

When all dependencies for the module are resolvable the function will be
executed and whatever you passed as a name will recieve the return value of the
function. You can return whatever you like.

If you have multiple dependencies just pass it as an array:

```javascript
// define a module with more then one dependency
unit.def('your_module', function (app) {
	// your stuff goes here
}).after(['dependecy_1', 'dependency_2']);
```

Feel free to access loading modules via `unit.ns`, this is what's passed as
your first paramter.

If you just need to define a module with no dependencies use `done()` instead
of `after()`.

```javascript
// define a module with no dependencies
unit.def('your_module', function () {
	// your stuff goes here
}).done();
```

If you need to just run some code with out defining a module use `run(func)`

```javascript
// run a piece of code that relies on certain modules
unit.run(function (app) {

	console.log(app.test1);
	console.log(app.test2);

}).after(['test1', 'test2']);
```

Obviously no need to return anything when just running code.

You shouldn't have problems with `_unit.js` and combining files but if you have
other files with underscores in the name and they require `_unit.js` to work
the please just add another underscore to the name to make sure it's among the
first files when combined; or just get rid of the underscore from the others.

That's all there is to `_unit.js`. If you need something more "complicated"
then feel free to check out [browserify](http://browserify.org/),
[requirejs](http://requirejs.org/) or [yepnope](http://yepnopejs.com/).
