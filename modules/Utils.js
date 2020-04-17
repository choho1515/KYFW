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