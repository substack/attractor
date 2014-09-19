var attractor = require('../');
var scope = {
    attach: function (elem) {
        console.log('attach!', elem);
    }
};

var attr = attractor({
    'x-click': [ require('attr-ev'), 'click' ]
}, scope);
attr.scan(document.body);
