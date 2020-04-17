exports.makeRandom = function (type, obj) {
    const char = {
        a: 'abcdefghijklmnopqrstuvwxyz0123456789',
        e: 'abcdefghijklmnopqrstuvwxyz',
        n: '0123456789'
    }
    let text
    while (true) {
        text = '';
        for (let i = 0; i < type.length; ++i) {
            let c = char[type[i]]
            text += c[Math.random() * c.length | 0];
        }
        if (!obj || !obj[String(text)]) break;
    }
    return text;
}

exports.pullFromArray = function (array, foo, type, len) {
    len = len || 10;
    const index = array.indexOf(foo);
    if (index !== -1) array.splice(index, 1);
    array.unshift(foo);
    array.length = Math.min(array.length, len);
    if (type) return index != -1 ? false : true;
    return array;
}