const SQLiteDatabase = android.database.sqlite.SQLiteDatabase
const DatabaseUtils = android.database.DatabaseUtils
const Jsoup = org.jsoup.Jsoup.connect

const _Array = java.lang.reflect.Array
const _Byte = java.lang.Byte
const _Integer = java.lang.Integer
const _String = java.lang.String
const Timer = java.util.Timer
const TimerTask = java.util.TimerTask

const JSONObject = org.json.JSONObject

const blank = " " + "\u200B".repeat(500) + '\n\n\n';


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

function DBF_structure(myid) {
    return {
        'chat_logs': {
            loc: 'DB1',
            index: '_id',
            salt: ['user_id', ['v', 'enc']],
            execute: {
                _id: {
                    parse: true
                },
                type: {
                    parse: true
                },
                message: {
                    decrypt: true
                },
                attachment: {
                    decrypt: true,
                    bigParse: true
                },
                created_at: {
                    parse: true
                },
                deleted_at: {
                    parse: true
                },
                client_message_id: {
                    parse: true
                },
                supplement: {
                    parse: true
                },
                v: {
                    parse: true
                }
            }
        },
        'friends': {
            loc: 'DB2',
            index: 'id',
            salt: [myid, 'enc'],
            execute: {
                name: {
                    decrypt: true
                },
                profile_image_url: {
                    decrypt: true
                },
                full_profile_image_url: {
                    decrypt: true
                },
                original_profile_image_url: {
                    decrypt: true
                },
                v: {
                    decrypt:true,
                    parse: true
                }
            },
        },
        'chat_rooms': {
            loc: 'DB1',
            index: 'id',
            salt: ['user_id', ['v', 'enc']],
            execute: {
                members: {
                    bigParse: true
                },
                active_member_ids: {
                    bigParse: true
                },
                last_message: {
                    decrypt: true
                },
                watermarks: {
                    bigParse: true
                },
                v: {
                    decrypt:true,
                    parse: true
                },
                meta: {
                    bigParse: true
                },
                private_meta: {
                    parse: true
                },
                moim_meta: {
                    bigParse: true
                },
            },
        },
        'open_link': {
            loc: 'DB2',
            index: 'id',
            salt: [],
            decrypt: [],
            parse: ['v']
        },
    }
}
const typeException = ['1']

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

const decrypter = (function () {
    let iv = toByteArray([15, 8, 1, 0, 25, 71, 37, -36, 21, -11, 23, -32, -31, 21, 12, 53])
    let password = toCharArray([22, 8, 9, 111, 2, 23, 43, 8, 33, 33, 10, 16, 3, 3, 7, 6])
    let prefixes = ["", "", "12", "24", "18", "30", "36", "12", "48", "7", "35", "40", "17", "23", "29", "isabel", "kale", "sulli", "van", "merry", "kyle", "james", "maddux", "tony", "hayden", "paul", "elijah", "dorothy", "sally", "bran"]
    let ivParameterSpec = new javax.crypto.spec.IvParameterSpec(iv)
    let cipher = javax.crypto.Cipher.getInstance("AES/CBC/PKCS5Padding")
    let cache = {}

    function toByteArray(bytes) {
        let res = _Array.newInstance(_Byte.TYPE, bytes.length)
        for (let i = 0; i < bytes.length; i++) {
            res[i] = new _Integer(bytes[i]).byteValue()
        }
        return res
    }

    function toCharArray(chars) {
        return new _String(chars.map((e) => String.fromCharCode(e)).join("")).toCharArray()
    }

    function keygen(key, enc) {
        let index = cache['$1_$2'.format(key, enc)]
        if (!index) {
            let salt = new _String((prefixes[enc] + key).slice(0, 16).padEnd(16, "\0")).getBytes("UTF-8")
            let secretKeySpec = new javax.crypto.spec.SecretKeySpec(javax.crypto.SecretKeyFactory.getInstance("PBEWITHSHAAND256BITAES-CBC-BC").generateSecret(new javax.crypto.spec.PBEKeySpec(password, salt, 2, 256)).getEncoded(), "AES")
            cache['$1_$2'.format(key, enc)] = secretKeySpec
            return secretKeySpec
        } else return index
    }
    return {
        derive: function (key, enc) {
            return keygen(key, enc)
        },
        execute: function (key, enc, context) {
            try {
                cipher.init(2, keygen(key, enc), ivParameterSpec)
                return String(new _String(cipher.doFinal(android.util.Base64.decode(context, 0)), "UTF-8"))
            } catch (e) {
                return null
            }
        }
    }
})()

const DBfetcher = (function () {
    function DBfetcher() {
        this.grant()
        this.DB1 = SQLiteDatabase.openDatabase("/data/data/com.kakao.talk/databases/KakaoTalk.db", null, SQLiteDatabase.CREATE_IF_NECESSARY)
        this.DB2 = SQLiteDatabase.openDatabase("/data/data/com.kakao.talk/databases/KakaoTalk2.db", null, SQLiteDatabase.CREATE_IF_NECESSARY)

        //fetch myid
        let cur = this.DB2.rawQuery("SELECT user_id FROM open_profile", null)
        cur.moveToNext()
        this.myid = Number(cur.getString(0))

        this.col = DBF_structure(this.myid)

        this.init()
        return this
    }
    DBfetcher.prototype.grant = function () {
        java.lang.Runtime.getRuntime().exec([
            "su",
            "mount -o remount rw /data/data/com.kakao.talk/databases",
            "chmod -R 777 /data/data/com.kakao.talk/databases",
        ]).waitFor()
    }
    DBfetcher.prototype.init = function () {
        //fetch myid key
        for (let i = 20; i <= 28; i++) decrypter.derive(this.myid, i)
        //fetch col name
        for (let i in this.col) {
            this.col[i].column = JSON.parse(String(org.json.JSONArray(this[this.col[i].loc].query(i, null, null, null, null, null, null).getColumnNames())))
        }
    }
    DBfetcher.prototype.index = function () {
        const cur = this.DB1.rawQuery("SELECT * FROM sqlite_sequence WHERE name = ?", ['chat_logs'])
        cur.moveToNext()
        const ret = String(cur.getString(1))
        cur.close()
        return ret
    }
    DBfetcher.prototype.get = function (table, index, args) {
        if (!args) args = {} // query(string), id(string), range(arr[int, bool])
        if (Object.keys(this.col).indexOf(table) == -1) return false
        let cursor = !args.query ?
            this[this.col[table].loc].rawQuery("SELECT * FROM $1 WHERE $2 = ?".format(table, args.id ? args.id : this.col[table].index), [index]) :
            this[this.col[table].loc].rawQuery(args.query, null)
        if (!args.range) {
            cursor.moveToNext()
            let ret = new DBitem(table, this.col[table]).get(cursor)
            cursor.close()
            return ret
        }
        let ret = [];
        !args.range[1] ? cursor.moveToNext() : cursor.moveToLast()
        try {
            for (let i = 0; i < args.range[0]; ++i) {
                ret.push(new DBitem(table, this.col[table]).get(cursor))
                args.range[1] ? cursor.moveToPrevious() : cursor.moveToNext()
            }
        } catch (e) {}
        cursor.close()
        return ret
    }
    return DBfetcher
}())


//why use prototype?
const DBitem = (function () {
    function DBitem(table, prop) {
        this.table = table;
        this.prop = prop;
        this.data = {
            __data__: {},
            __primitive__: {},
            __props__: {}
        };
    }
    DBitem.prototype.get = function (cursor) {
        const {
            column,
            salt,
            execute
        } = this.prop;

        for (let i in column) {
            let [key, value] = [column[i], String(cursor.getString(i))];
            this.data.__primitive__[key] = value;
        }

        let salty = Array(2);
        for (let j in salt) {
            if (Array.isArray(salt[j])) {
                this.data.__data__[salt[j][0]] = JSON.parse(this.data.__primitive__[salt[j][0]]);
                salty[j] = this.data.__data__[salt[j][0]][salt[j][1]];
            } else salty[j] = this.data.__primitive__[salt[j]];
        }
        this.data.__props__.salt = salty;

        let foo = this.data;
        for (var data in foo.__primitive__) {
            let method = {};
            execute[data] && Object.assign(method, execute[data]);

            if (this.table === 'chat_logs' && data === 'message' && typeException.indexOf(JSON.parse(foo.__primitive__.type) == -1)) {
                method.parse = true;
            }
            //클로저
            (function (data, method) {
                Object.defineProperty(foo, data, {
                    get() {
                        this.__data__[data] = this.__data__[data] || (() => {
                            const dbkey = new DBkey(this.__primitive__[data]);
                            if (method.decrypt) dbkey.decrypt(this.__props__.salt);
                            if (method.parse) dbkey.parse();
                            if (method.bigParse) dbkey.bigParse();
                            return dbkey.data;
                        })()
                        return this.__data__[data];
                    }
                });
            })(data, method)
        }
        return this.data;
    }
    return DBitem
}())

const DBkey = (function () {
    function DBkey(prop) {
        this.data = prop
    }
    DBkey.prototype.parse = function (i) {
        try {
            this.data = JSON.parse(this.data)
        } catch (e) {}
        return this.data
    }
    DBkey.prototype.bigParse = function (i) {
        try {
            this.data = JSONbig.parse(this.__primitive__[i])
        } catch (e) {}
        return this.data
    }
    DBkey.prototype.decrypt = function (salt) {
        try {
            this.data = decrypter.execute(salt[0], salt[1], this.data)
        } catch (e) {}
        return this.data
    }
    return DBkey
}())