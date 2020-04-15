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
Bot.addListener(Event.START_COMPILE, onStartCompile)

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

const MainThread = new(modules.main.MainThread());

const KakaoDB = new(modules.src.KakaoDB());

const Checker = new(modules.main.Checker(KakaoDB.index()));
Broadcast.register('onInterval', function () {
    Checker.check(KakaoDB)
})

Broadcast.register('onMsg', function (i) {
    try {
        let time = new Date().getTime();
        let chat = KakaoDB.get('chat_logs', i);

        let now = (time / 1000);
        if (now - chat.created_at > 3600) {
            return;
        } else if (now - chat.created_at > 10) {
            active = false;
        } else active = true;

        if (chat.v.isMine) return;

        let room = KakaoDB.get('chat_rooms', chat.chat_id);
        if (room.type != 'OM') return;
        try {
            room.name = room.private_meta.name
        } catch (e) {}
        if (!room.name) return;
        if (room.name[0] != '●' && room.name[0] != '■') return;

        let user = KakaoDB.get('friends', chat.user_id);

        if (!active) return

        //Handler.handle(chat, user, room)
        //Log.d(new Date().getTime() - time)
        //Log.d(chat.message)
    } catch (e) {
        Log.d('error!\nlineNumber: ' + e.lineNumber + '\nmessage : ' + e.message)
    }
})

MainThread.start();

function onStartCompile() {
    try {
        MainThread.stop();
    } catch (e) {}
}

const BLANK = " " + "\u200B".repeat(500) + '\n\n\n';

String.prototype.format = function () {
    return this.replace(/\$(\d)/gi, (a, b) => Array.from(arguments)[b - 1]);
}

var msg_o = '!명령어 a b\nc'
var $msg_o = '!명령어 $["a"] $["b"]\n$["c"]'

function chkcmd(a, b) {

}