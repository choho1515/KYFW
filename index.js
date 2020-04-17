/*/* TODO *//*
명령어 할당 이벤트랑 명령어 자체를 분리해서 외부에서 이벤트 실행 가능하게 하기
그러려면 아마 이벤트 인자로 넘기는 cmd 를 다른이름으로 바꾸는게 유니버셜해보일듯
*//* TODO /**/



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

const KakaoDB = new(modules.src.KakaoDB());
const StorageManager = new(modules.src.StorageManager());
const EasyEval = new(modules.src.EasyEval());

const MainThread = new(modules.main.MainThread());
const Checker = new(modules.main.Checker(KakaoDB.index()));

const Command = new(modules.src.Command())
for (let i in modules.main.eventStorage) {
    modules.main.eventStorage[i](Command)
}

Broadcast.register('onInterval', function () {
    StorageManager.check();
    Checker.check(KakaoDB);
})

Broadcast.register('onMsg', function (i) {
    try {

        let chat = KakaoDB.get('chat_logs', i);
        (function checkChat() {
            if (new Date().getTime() / 1000 - chat.created_at > 10) return;
            if (chat.v.isMine) return;
        }).call(this);

        let room = KakaoDB.get('chat_rooms', chat.chat_id);
        (function checkRoom() {
            if (room.type != 'OM') return;
            try {
                room.name = room.private_meta.name
            } catch (e) {}
            if (!room.name || (room.name[0] != '●' && room.name[0] != '■')) return;
        }).call(this);

        let user = KakaoDB.get('friends', chat.user_id);

        (function checkCmd() {
            if (typeof chat.message != 'string') return;
            let cmd = Command.get(chat.message)
            if (cmd) Broadcast.send('onCmd', {
                KakaoDB: KakaoDB,
                cmd: cmd,
                chat: chat,
                user: user,
                room: room
            })
        }).call(this);

    } catch (e) {
        Log.d('error!\nlineNumber: ' + e.lineNumber + '\nmessage : ' + e.message)
    }
})

Broadcast.register('onCmd', function (args) {
    args.R = StorageManager.get('room')
    args.U = StorageManager.get('user')
    args.RU = StorageManager.get('roomuser')
    args.cmd.execute(args)
})

/* to be implemented */
/*
Broadcast.register('onEvent', function (event, args) {
    Event.init().execute(event, args);
})
*/

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