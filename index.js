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

const Command = new(modules.src.Command())
Command.add({
    id: 'test',
    markdown: '!테스트 $["a"]',
    verify: {
        key: ['테스트']
    },
    execute() {
        Log.d(this.execute)
        Log.d(chat)
        //reply('OK')
    }
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

        let cmd = Command.get(chat.message)
        if (cmd) Broadcast.send('onCmd', [cmd, chat, user, room])

    } catch (e) {
        Log.d('error!\nlineNumber: ' + e.lineNumber + '\nmessage : ' + e.message)
    }
})

Broadcast.register('onCmd', function (args) {
    const [cmd] = args;
    const exec = cmd.command.execute
    cmd.execute(args, exec)
})


Broadcast.register('onEvent', function (event, args) {
    Event.init().execute(event, args);
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