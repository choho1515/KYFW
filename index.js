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
            let ret = new DBitem(this.col[table]).get(cursor)
            cursor.close()
            return ret
        }
        let ret = [];
        !args.range[1] ? cursor.moveToNext() : cursor.moveToLast()
        try {
            for (let i = 0; i < args.range[0]; ++i) {
                ret.push(new DBitem(this.col[table]).get(cursor))
                args.range[1] ? cursor.moveToPrevious() : cursor.moveToNext()
            }
        } catch (e) {}
        cursor.close()
        return ret
    }
    return DBfetcher
}())

const DBitem = (function () {
    function DBitem(prop) {
        this.prop = prop
        this.data = {}
    }
    DBitem.prototype.get = function (cursor) {
        const {
            decrypt,
            parse,
            column
        } = this.prop
        for (let i in column) {
            let [key, value] = [column[i], String(cursor.getString(i))]
            if (parse.indexOf(key) != -1 && decrypt.indexOf(key) == -1) {
                try {
                    value = JSONbig.parse(value)
                } catch (e) {}
            }
            this.data[key] = value
        }
        return this
    }
    DBitem.prototype.decrypt = function () {
        const {
            salt,
            decrypt,
            parse,
        } = this.prop
        if (salt.length != 2) return
        for (let i in decrypt) {
            let key = decrypt[i]
            let salty = Array(2)
            for (let j in salt) {
                let saalt = typeof (salt[j]) == 'number' ? salt[j] : salt[j].split('.')
                salty[j] = typeof (salt[j]) == 'number' ? salt[j] : saalt.length > 1 ? this.data[saalt[0]][saalt[1]] : this.data[salt[j]]
            }
            this.data[key] = decrypter.execute(salty[0], salty[1], this.data[key])
            if (parse.indexOf(key) != -1) {
                try {
                    this.data[key] = JSONbig.parse(this.data[key])
                } catch (e) {}
            }
        }
        return this
    }
    return DBitem
}())