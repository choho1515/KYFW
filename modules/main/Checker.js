const SETTING = require('./setting/index').checker;

exports.Checker = function () {
    function Checker(index) {
        this.index = index;
        return this;
    }
    Checker.prototype.check = function (KakaoDB) {
        let [start, end] = [Number(this.index), Number(KakaoDB.index())]
        if (start > end + 10) this.index = start + 1
        if (start > end) return
        if (end - start > SETTING.maxLength) start = end - SETTING.maxLength
        for (let i = start; i <= end; ++i) {
            if (i % 1000 == 0) Log.d(i)
            Broadcast.send('onMsg', i)
        }
        this.index = end + 1
    }
    return Checker
}