/* TODO
명령어 할당 이벤트랑 명령어 자체를 분리해서 외부에서 이벤트 실행 가능하게 하기
*/
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
Bot.setCommandPrefix('&');
Bot.addListener(Event.MESSAGE, onMsg);
Bot.addListener(Event.START_COMPILE, onStartCompile);
Bot.addListener(Event.COMMAND, onCommand);
var modules = require('index');

const KakaoDB = new(modules.src.KakaoDB());
const StorageManager = new(modules.src.StorageManager());

const MainThread = new(modules.main.MainThread());
const Checker = new(modules.main.Checker(KakaoDB.index()));

const Command = new(modules.src.Command());
for (let i in modules.main.eventStorage) {
    modules.main.eventStorage[i](Command);
}
function onMsg(msg) {
  if (msg.content.split(' ')[0] == '!닉네임') { 
     let chat = KakaoDB.get('chat_logs');
      let room = KakaoDB.get('chat_rooms', chat.chat_id);
      let user = KakaoDB.get('friends', chat.user_id);
   // if (room.name == ""){
    try {
      msg.reply(KakaoDB.get('friends', msg.content.substr(msg.content.split(' ', 1)[0].length + 1)).name); 
      } catch (e) { 
        msg.reply('error!\nlineNumber: ' + e.lineNumber + '\nmessage : ' + e.message); 
        }
     //   }
    } //!닉네임 (고유번호)
    if (msg.content == '!번호') {
        let chat = KakaoDB.get('chat_logs');
        let room = KakaoDB.get('chat_rooms', chat.chat_id);
        let user = KakaoDB.get('friends', chat.user_id);
                if (user.v.openlink.mt == "1" || user.v.openlink.mt == "4") {
                        msg.reply(chat.attachment.src_userId);
                } 
        } //답장 이용한 아이디 고유번호 따기
        /*if (msg.content == '!채팅청소') {
        let chat = KakaoDB.get('chat_logs');
        let room = KakaoDB.get('chat_rooms', chat.chat_id);
        let user = KakaoDB.get('friends', chat.user_id);
          if (room.name == "" || !"" || ""){
            if (user.v.openlink.mt == "1" || user.v.openlink.mt == "4") {
              msg.reply(new String("\u1160\u1160\u1160\u1160\u1160\u1160\u1160\u1160\u1160\u1160\u1160\u1160\u1160\u1160\u1160\u1160\u1160\u1160\u200d\u200d"));
              msg.reply(new String("\u1160\u1160\u1160\u1160\u1160\u1160\u1160\u1160\u1160\u1160\u1160\u1160\u1160\u1160\u1160\u1160\u1160\u1160\u200d\u200d"));
            }
          }
        }*/
    /*if (msg.content == '&권한') {
        let chat = KakaoDB.get('chat_logs');
        let room = KakaoDB.get('chat_rooms', chat.chat_id);
        let user = KakaoDB.get('friends', chat.user_id);
        if (room.private_meta.name == "" && ""&&"") {
            try {
                let MyFile = java.io.File("/sdcard/bot/admin/" + user.name + ".json");
                let file = JSON.parse(FileStream.read("/sdcard/bot/admin/" + user.name + ".json"));
                if (user.v.openlink.mt == "1") {
                        if (MyFile.exists() == true) {

                        } else
                            let json = {}
                        json["권한"] = {
                            "닉네임": user.name,
                            "방 이름": room.name,
                            "고유 번호": user.__data__.id,
                            "유저 권한": user.v.openlink.mt
                        };
                        msg.reply("방장 권한 획득, 반갑습니다 " + user.name + "님.");
                        player = JSON.stringify(json, null, 4);
                        FileStream.write("/sdcard/bot/admin/" + user.name + ".json", player);
                }
                if (user.v.openlink.mt == "4") {
                    if (user.name == file.권한.닉네임) {
                        if (MyFile.exists() == true) {
                            
                        } else
                            let json = {}
                        json["권한"] = {
                            "닉네임": user.name,
                            "방 이름": room.private_meta.name,
                            "고유 번호": user.__data__.id,
                            "유저 권한": user.v.openlink.mt
                        };
                        msg.reply("부 방장 권한 획득, 반갑습니다 " + user.name + "님.");
                        player = JSON.stringify(json, null, 4);
                        FileStream.write("/sdcard/bot/admin/" + user.name + ".json", player);
                    }
                }
            } catch (e) {
                return;
            }
        }
    }*/
    if (msg.content.split(' ')[0] == ',,') { 
      let chat = KakaoDB.get('chat_logs');
        let room = KakaoDB.get('chat_rooms', chat.chat_id);
        let user = KakaoDB.get('friends', chat.user_id);
      try { 
  if (user.v.openlink.mt == "1" || user.v.openlink.mt == "4") {
        msg.reply(eval(msg.content.substr(msg.content.split(' ', 1)[0].length + 1)));
        }
         } catch (e) { 
           msg.reply('error!\nlineNumber: ' + e.lineNumber + '\nmessage : ' + e.message); 
           } 
      }
}
Broadcast.register('onInterval', function() {
    StorageManager.check();
    Checker.check(KakaoDB);
})

Broadcast.register('onMsg', function(i) {
    try {
        //result: 50~100ms
        //let time = new Date().getTime()
        let chat = KakaoDB.get('chat_logs', i);
        if (new Date().getTime() / 1000 - chat.created_at > 10) return;
        if (chat.v.isMine) return;

        let room = KakaoDB.get('chat_rooms', chat.chat_id);
        (function checkRoom() {
            if (room.type != 'OM') return;
            try {
                room.name = room.private_meta.name
            } catch (e) {}
            if (!room.name) return;
        }).call(this);

        let user = KakaoDB.get('friends', chat.user_id);

        let args = {
            KakaoDB: KakaoDB,
            chat: chat,
            user: user,
            room: room,
        };

        U = StorageManager.acquire('user', [chat.user_id, chat.full_profile_image_url]).init(args);
        args.U = U;
        R = StorageManager.acquire('room', [room.link_id]).init(args);
        args.R = R;
        RU = StorageManager.acquire('roomuser', [room.link_id + '_' + U._id]).init(args);
        args.RU = RU;

        (function checkMsg() {
            if (typeof chat.message != 'string') return;
            if (chat.message.split(' ')[0] == ',') {
                Broadcast.send('onEvent', args)
            }
        }).call(this);

        (function checkCmd() {
            if (typeof chat.message != 'string') return;
            let cmd = Command.get(chat.message);
            if (!cmd) return;
            args.cmd = cmd[0];
            args.args = cmd[1];
            if (args.args) Broadcast.send('onCmd', args)
        }).call(this);

        //Log.d(new Date().getTime() - time)

        new java.lang.Thread({
            run: function() {
                java.lang.Thread.sleep(1000);
                U.unmount();
                R.unmount();
                RU.unmount();
            }
        }).start();

    } catch (e) {
        Log.d('error!\nlineNumber: ' + e.lineNumber + '\nmessage : ' + e.message)
    }
})

Broadcast.register('onCmd', function(args) {
    args.cmd.execute(args)
})

/*Broadcast.register('onEvent', function(args) {
    let reply = function(msg) {
        Bot.send(args.room.name, msg);
    }
    try {
        reply(eval(args.chat.message.substr(args.chat.message.split(' ', 1)[0].length + 1)));
    } catch (e) {
        reply('error!\nlineNumber: ' + e.lineNumber + '\nmessage : ' + e.message);
    }
});
*/

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

String.prototype.format = function() {
    return this.replace(/\$(\d)/gi, (a, b) => Array.from(arguments)[b - 1]);
}
