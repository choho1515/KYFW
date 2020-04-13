importClass(android.database.sqlite.SQLiteDatabase)
importClass(android.database.DatabaseUtils)
importClass(org.jsoup.Jsoup)

importClass(java.util.Timer)
importClass(java.util.TimerTask)

importClass(org.json.JSONObject)

//require('./modules/decrypter.js')

var modules = require('index')
const KakaoDB = new modules.src.KakaoDB.Fetcher()


const BLANK = " " + "\u200B".repeat(500) + '\n\n\n';


const SETTING = {
    watchdog: {
        maxLength: 100,
        interval: 250
    }
}

String.prototype.format = function () {
    return this.replace(/\$(\d)/gi, (a, b) => Array.from(arguments)[b - 1]);
}

function response(room, msg, sender, isGroupChat, replier, imageDB, packageName, threadId) {
    if (msg.startsWith('., ')) {
        try {
            replier.reply(eval(msg.substr(msg.split(' ', 1)[0].length + 1)));
        } catch (e) {
            replier.reply('error!\nlineNumber: ' + e.lineNumber + '\nmessage : ' + e.message)
        }
    }
}

/*

const MainThread = (function () {
    const setting = SETTING.watchdog

    function MainThread() {
        this.looper = this.index = null;
        return this;
    }
    MainThread.prototype.start = function () {
        const [watchdog] = [this.watchdog];
        this.index = Number(DBF.index());
        this.looper = new Timer();
        this.looper.scheduleAtFixedRate(new TimerTask({
            run: function () {
                try {
                    watchdog.call(DBF)
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
    MainThread.prototype.watchdog = function () {
        let [start, end] = [this.index, DBF.index()];
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
*/