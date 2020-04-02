const setting = {
    watchdog: {
        maxLength: 100,
        interval: 250
    }
}

const MainThread = (function () {
    const setting = setting.watchdog
    function MainThread() {
        this.looper = this.index = null;
        return this;
    }
    MainThread.prototype.start = function () {
        const [watchdog, DBF] = [this.watchdog, this.DBF];
        this.index = Number(DBF.index());
        this.looper = new Timer();
        this.looper.scheduleAtFixedRate(new TimerTask({
            run: function () {
                try {
                    watchdog(DBF)
                } catch (e) {
                    Log.e('error in MainThread!\nlineNo: ' + e.lineNumber + '\nmsg: ' + e.message);
                }
            }
        }), 0, setting.interval);
        return this;
    }
    MainThread.prototype.stop = function () {
        this.looper.cancel();
        this.looper = null;
        return this;
    }
    MainThread.prototype.watchdog = function (DBF) {
        let [start, end] = [Number(setting.index), this.index];
        if (start > end + 10) this.index = start + 1;
        if (start > end) return;
        if (end - start > setting.maxLength) start = end - setting.maxLength;
        for (let i = start; i <= end; ++i) {
            if (chat.data._id % 1000 == 0) Log.d(chat.data._id)
            DBHandler.init(i)
        }
        this.index = end + 1;
    }
    return MainThread
}())