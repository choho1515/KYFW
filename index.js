let pm = App.getContext().getSystemService(android.content.Context.POWER_SERVICE);
let wakeLock = pm.newWakeLock(android.os.PowerManager.PARTIAL_WAKE_LOCK, "Bot");
wakeLock.acquire();

importClass(android.database.sqlite.SQLiteDatabase);
importClass(android.database.DatabaseUtils);
importClass(org.jsoup.Jsoup);

importClass(java.util.Timer);
importClass(java.util.TimerTask);

importClass(org.json.JSONObject);

var Bot = BotManager.getCurrentBot();
Bot.setCommandPrefix('!');

//Bot.addListener(Event.COMMAND, onCmd)
Bot.addListener(Event.MESSAGE, onMsg);
//Bot.addListener(Event.START_COMPILE, onStartCompile)

function onMsg(msg) {
    if (msg.content.split(' ')[0] == ',,') {
        try {
            msg.reply(eval(msg.content.substr(msg.content.split(' ', 1)[0].length + 1)));
        } catch (e) {
            msg.reply('error!\nlineNumber: ' + e.lineNumber + '\nmessage : ' + e.message);
        }
    }
}

var modules = require('index');

const MainThread = new (modules.main.MainThread());

const KakaoDB = new (modules.src.KakaoDB());

const Checker = new (modules.main.Checker(KakaoDB.index()));
Broadcast.register('onInterval', function () {
    Checker.check(KakaoDB)
})

Broadcast.register('onMsg', function (i) {
    let msg = KakaoDB.get('chat_logs', i)
    Log.d(msg.message)
})

MainThread.start();



const BLANK = " " + "\u200B".repeat(500) + '\n\n\n';



String.prototype.format = function () {
    return this.replace(/\$(\d)/gi, (a, b) => Array.from(arguments)[b - 1]);
}