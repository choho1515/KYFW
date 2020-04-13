importClass(java.util.Timer)
importClass(java.util.TimerTask)

const SETTING = require('./setting/index').mainThread;

exports.MainThread = function () {
    function MainThread() {
        this.looper = null;
        this.index = 0;
        return this;
    }
    MainThread.prototype.start = function () {
        this.looper = new Timer();
        this.looper.scheduleAtFixedRate(new TimerTask({
            run: function () {
                Broadcast.send('onInterval')
            }
        }), 0, SETTING.interval);
        return this;
    }
    MainThread.prototype.stop = function () {
        Broadcast.send('onLooperStop')
        this.looper.cancel();
        this.looper = null;
        return this
    }
    return MainThread
}