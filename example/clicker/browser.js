var attractor = require('../../');
var scope = {
    clicker: function (elem) {
        console.log('click!', elem);
    }
};

var attr = attractor({
    'x-click': [ require('attr-ev'), 'click' ]
}, scope);
attr.scan(document.body);
