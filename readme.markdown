# attractor

magnetic declarative attributes

Snap together frontend and backend modules with html attributes.

## 2-way binding example

Everybody has 2-way binding examples, so here it is. Skip to the next example if
you want to see something new.

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
var scope = { yourName: function (txt) { console.log(txt) } };
var attr = attractor({ 'binder': require('attr-bind') }, scope);
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

This example is a work in progress. It will only get smaller as more modules are
written.

First render some items server-side:

``` js
var http = require('http');
var fs = require('fs');
var ecstatic = require('ecstatic')(__dirname + '/static');
var hyperstream = require('hyperstream');

var feed = require('multilevel-feed');
var level = require('level');
var db = level('/tmp/lists.db', { encoding: 'json' });

var render = require('./render.js');

var server = http.createServer(function (req, res) {
    var m = /\/(\w+)*(\?|$)/.exec(req.url);
    if (!m) return ecstatic(req, res);
    
    var name = m[1] || 'default';
    var items = db.createReadStream({ start: 'item!', end: 'item!\uffff' });
    
    fs.createReadStream(__dirname + '/html/index.html').pipe(hyperstream({
        '#name': name,
        '#list': {
            _html: items.pipe(render()),
            'data-start': items._options.start,
            'data-end': items._options.end
        }
    })).pipe(res);
});
server.listen(5000);

var shoe = require('shoe');
var sock = shoe(function (stream) { stream.pipe(feed(db)).pipe(stream) });
sock.install(server, '/sock');
```

In our html, we'll add some attributes for the browser code to hook on to,
declaratively:

``` html
<html>
  <head>
    <link rel="stylesheet" href="/style.css">
  </head>
  <body>
    <h1 id="name"></h1>
    <div id="list" x-range="range"></div>
    <h2 class="hide">
      <span id="active" x-bind="active"></span>
      <button x-click="vote">vote</button>
    </h2>
    
    <form x-submit="addItem">
      <input name="title" type="text">
      <input type="submit" value="create">
    </form>
    
    <script src="bundle.js"></script>
  </body>
</html>
```

Here is the browser code:

```
var attractor = require('attractor');
var observe = require('observable');
var render = require('./render.js');

window.db = require('multilevel-feed')();
var sock = require('shoe')('/sock');
sock.pipe(db.createRpcStream()).pipe(sock);
 
function SortedList () {
    this.active = observe('');
    this.active(function (txt) {
        if (!txt) return;
        document.querySelector('h2').classList.remove('hide');
    });
}

SortedList.prototype.range = function (xr) {
    var r = db.livefeed(xr.range).pipe(render());
    r.on('element', function (elem) { attr.scan(elem) });
    r.sortTo(xr.element, '.score');
};

SortedList.prototype.select = function (elem) {
    this.active(elem.querySelector('.title').textContent);
};

SortedList.prototype.addItem = function (form, fields) {
    db.put('item!' + fields.title, { score: 0, title: fields.title });
    form.reset();
};

SortedList.prototype.vote = function (ev) {
    var key = 'item!' + this.active();
    db.get(key, function (err, value) {
        value.score += 5;
        db.put(key, value);
    });
};

var attr = attractor({
    'x-chooser': [ require('attr-chooser'), 'active' ],
    'x-bind': require('attr-bind'),
    'x-range': [ require('attr-range'), 'data-start', 'data-end' ],
    'x-submit': require('attr-submit'),
    'x-click': [ require('attr-ev'), 'click' ]
}, new SortedList);
attr.scan(document);
```

The shared `render.js` rendering code is:

``` js
var hyperspace = require('hyperspace');
var fs = require('fs');
var html = fs.readFileSync(__dirname + '/html/item.html', 'utf8');

module.exports = function () {
    return hyperspace(html, { key: 'data-key' }, function (row) {
        return {
            '.title': row.value.title,
            '.score': row.value.score
        };
    });
};
```

and the html for the item.html is:

``` html
<div class="item" x-chooser="select">
  <div class="title"></div>
  <div class="score"></div>
</div>
```

We just made a live-updating application with shared browser and server
rendering backed to leveldb in just 77 lines of javascript!

That is still too many lines, but it's getting there.

# methods

``` js
var attractor = require('attractor')
```

## var attr = attractor(bindings, scope)

Return a new attractor instance `attr`.

`bindings` should map
[brace-expansion](https://npmjs.org/package/brace-expansion) attribute names
onto attribute handlers. Each binding will be added with `.add()`.

Many attribute handlers are just modules with a function signature of:

```
module.exports = function (cb) {
    return function (elem) { /* ... call cb() somewhere in here... */ }
}
```

If you give an array instead of a function for the binding value, the first
element will be taken as the function and the other elements will be bound as
arguments to the function.

Modules that require extra arguments aside from `cb` should take their arguments
before the `cb`. The `cb` goes last.

The `scope` is used to resolve the attribute values to functions. For example,
for the html:

``` html
<div x-beep="boop"></div>
```

and an attractor binding on `x-beep`:

``` js
attribute({ 'x-beep': beeper }, scope)
```

When the `<div>` with `x-beep` is encountered, `scope.boop()` will fire with the
arguments given to the callback inside the `beeper` module.

## attr.add(attrName, fn)

Add an attribute from the
[brace-expansion](https://npmjs.org/package/brace-expansion)
of the string `attrName`.
All of the attributes in the brace expansion must be present for the `fn` to
apply.

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

## find modules

Browse npm packages that have been
[tagged with the attractor keyword](https://npmjs.org/browse/keyword/attractor).

## write an attractor module

To create a frontend attractor module, just provide a function that is
compatible with the `cb` in `attr.add(key, cb)`. It's usually advisable to wrap
your function in an outside function to capture arguments from the user.

Here's a basic template you can use:

``` js
module.exports = function (cb) {
    return function (elem) {
        // call cb()` somewhere in here
    };
};
```

Inside your inner function, `this` will be set to the attractor instance `attr`.
You should only rely on `attr` if your module actually needs access to the
attribute instance. Otherwise, your module can enjoy a wider audience of people
who aren't using attractor if you stick to the basic signature. However, some
modules will need the `attr` instance such as modules that need to invoke the
`scan()` to analyze new content.

Make *sure* to add a keyword in your package.json for `"attractor"` so that
[people will know how to find your module](https://npmjs.org/browse/keyword/attractor).

If you also name your frontend module starting with `attr-` then people can
assume that it was built for attractor compatibility and they will have an
easier time finding it, but this isn't strictly necessary.

For an example of a frontend attractor module, look at the
[attr-bind](https://npmjs.org/package/attr-bind) module.

# install

With [npm](https://npmjs.org) do:

```
npm install attractor
```

# license

MIT
