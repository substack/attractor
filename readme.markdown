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

Here is the browser code. It will shrink drastically with more modules:

```
var render = require('./render.js');
var db = require('multilevel-feed')();
var observe = require('observ');
var active = observe();

active(function (txt) {
    document.querySelector('#active').textContent = txt;
    document.querySelector('#vote').classList.remove('hide');
});

document.querySelector('#vote').addEventListener('click', function (ev) {
    var key = 'item!' + active();
    db.get(key, function (err, value) {
        value.score += 5;
        db.put(key, value);
    });
});

document.querySelector('#new').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var title = this.elements.title.value;
    db.put('item!' + title, { score: 0, title: title });
    this.elements.title.value = '';
});

var live = require('attr-range')(function (rel) {
    var r = db.livefeed(rel.range).pipe(render());
    r.on('element', function (elem) { attr.scan(elem) });
    r.sortTo(rel.element, '.score');
});

var chooser = require('attr-chooser')('active', function (elem, ev, group) {
    active.set(elem.querySelector('.title').textContent);
});

var attractor = require('attractor');
var attr = attractor({
    'data-start': live,
    'chooser': chooser
});
attr.scan(document);

var sock = require('shoe')('/sock');
sock.pipe(db.createRpcStream()).pipe(sock);
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

We just made a live-updating application with shared browser and server
rendering backed to leveldb in just 74 lines of javascript!

That is still too many lines, but getting there.

# methods

``` js
var attractor = require('attractor')
```

## var attr = attractor(bindings)

Return a new attractor instance `attr`.

`bindings` should map
[brace-expansion](https://npmjs.org/package/brace-expansion)

If `bindings` are given, each key will be walked over and `attr.add(key, value)`
will be called on each `key,value` pair.

## attr.add(attrName, fn)

Add an attribute function `fn` for elements that have attributes matching `attrName`.

`attrName` is a string. The attribute value of each element in the
[brace-expansion](https://npmjs.org/package/brace-expansion)
of `attrName` will be sent after the `elem` in `fn(elem, value...)` when a
matching element is found.

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
module.exports = function (opts) {
    return function (elem, value) {
        // ...
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

# todo

* scopes - allow `bindings` to be deeply nested

# install

With [npm](https://npmjs.org) do:

```
npm install attractor
```

# license

MIT
