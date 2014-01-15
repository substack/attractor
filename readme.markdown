# attractor

magnetic declarative attributes

Snap together frontend and backend modules with html attributes.

## 2-way binding example

Write some html and annotate the elements you want to bind with a special
`"binder"` attribute:

``` html
<!doctype html>
<html>
  <body>
    <div>
      <label>Name:</label>
      <input type="text" binder="yourName" placeholder="Enter a name here">
      <hr>
      <h1>Hello <span binder="yourName"></span>!</h1>
    </div>
    <script src="bundle.js"></script>
  </body>
</html>
```

Just use attractor to scan the dom for the `"binder"` attributes, forwarding the
elements into [attr-bind](https://npmjs.org/package/attr-bind):

``` js
var attractor = require('attractor');
var bind = require('attr-bind')();
var attr = attractor({ 'binder': bind });
attr.scan(document);
```

Bundle with [browserify](http://browserify.org) to generate the bundle.js:

```
$ browserify browser.js > bundle.js
```

Now load the html file in a browser and watch the span contents change as you
edit the text box.

## live-updating

Data binding is a rather mundane application of what's possible with a basic
attribute system in place. Let's go crazy and make a web app that renders in
node and in the browser with page content that updates automatically whenever
the database changes and full database access from the client!

COMING SOON

# methods

``` js
var attractor = require('attractor')
```

## var attr = attractor(bindings)

Return a new attractor instance `attr`.

`bindings` should map
[brace-expansion](https://npmjs.org/package/brace-expansion)

If `bindings` are given, 

## attr.scan(element)


## attr.scan(element)

Scan the dom node `element` for nodes matching

# ecosystem

Attractor is not a framework. Instead, think of attractor as a minimal amount of
glue necessary to let an ecosystem or autonomous declarative binding modules
flourish, in the [node.js spirit](https://github.com/rvagg/node-levelup) of
[tiny modules](http://voxeljs.com) that
[do one thing well](http://www.faqs.org/docs/artu/ch01s06.html).

In furtherance of these goals, it's important that attractor modules should be
trivial to reuse outside of attractor itself where possible.

## write an attractor module

To create a frontend attractor module, just provide a function that is
compatible with the `cb` in `attr.add(key, cb)`. It's usually advisable to wrap
your function in an outside function to capture arguments from the user.

Here's a basic template you can use:

``` js
module.exports = function (opts) {
    return function (elem, attrName) {
        // ...
    };
};
```

Inside your inner function, `this` will be set to the attractor instance `attr`.
You should only rely on `this` if your module actually needs access to the
attribute instance. Otherwise, your module can enjoy a wider audience of people
who aren't using attractor if you stick to the basic signature. However, some
modules will need the `attr` instance such as modules that need to invoke the
`scan()` to analyze new content and modules that will need to emit messages for
an attached database layer.

If you name your frontend module starting with `attr-` then people can assume
that it was built for attractor compatibility and they will have an easier time
finding it.

For an example of a frontend attractor module, look at the
[attr-bind](https://npmjs.org/package/attr-bind) module.

# todo

* scopes - allow `bindings` to be deeply nested
* attr-select - make a list selectable
