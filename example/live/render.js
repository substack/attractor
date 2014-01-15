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
