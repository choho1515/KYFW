const SETTING = require('./setting/storageManager');
const Utils = require('../Utils')

String.prototype.format = function () {
    return this.replace(/\$(\d)/gi, (a, b) => Array.from(arguments)[b - 1]);
}


exports.StorageManager = function () {
    function StorageManager() {
        this.keep = 10000 //10s
        this.storage = {}

        this.column = SETTING.structure();
        this.DB = android.database.sqlite.SQLiteDatabase.openOrCreateDatabase("/sdcard/katalkbot/kybot.db", null, null);
        let tableList = Object.keys(this.column);

        for (let i in tableList) {
            let tableName = tableList[i],
                table = this.column[tableName],
                columnKeyList = Object.keys(this.column[tableName])
            Log.d('>> TABLE ' + tableName + ' <<')
            this.DB.execSQL("CREATE TABLE IF NOT EXISTS $1 (_id PRIMARY KEY) WITHOUT ROWID;".format(tableName));
            let col = JSON.parse(String(org.json.JSONArray(this.DB.query(tableName, null, null, null, null, null, null).getColumnNames())));

            if (col.length <= 1) {
                //새로 생성한 경우
                Log.d('#INIT NEW DB')
                for (let j in columnKeyList) {
                    let columnKey = columnKeyList[j],
                        columnValue = typeof table[columnKey] != 'object' ?
                        JSON.stringify(table[columnKey]) :
                        "'" + JSON.stringify(table[columnKey]) + "'"
                    try {
                        this.DB.execSQL("ALTER TABLE $1 ADD COLUMN $2".format(tableName, columnKey));
                    } catch (e) {}
                }
            } else if (col.join(',') != columnKeyList.join(',')) {
                //구조 변경 경우
                Log.d('#OVERRIDE EXISTING DB')
                Log.d('>>ORIGINAL: ' + col.join(','))
                Log.d('>>NEW: ' + columnKeyList.join(','))
                let arr = [],
                    arr2 = []
                for (let j in columnKeyList) {
                    let columnKey = columnKeyList[j]
                    if (col.indexOf(columnKey) != -1) {
                        arr.push(columnKey)
                    } else {
                        arr.push('NULL')
                        arr2.push(columnKey)
                    }
                }
                Log.d('>>OVERRIDE: ' + arr.join(','))
                this.DB.execSQL('DROP TABLE IF EXISTS $1_backup'.format(tableName));
                this.DB.execSQL('DROP TABLE IF EXISTS $1_temp'.format(tableName));
                this.DB.execSQL('CREATE TABLE $1_temp($2)'.format(tableName, columnKeyList.join(',')))
                this.DB.execSQL('INSERT INTO $1_temp SELECT $2 FROM $1'.format(tableName, arr.join(',')))
                for (let k in arr2) {
                    this.DB.execSQL("UPDATE $1_temp SET $2 = ?".format(tableName, arr2[k]), [
                        JSON.stringify(table[arr2[k]])
                    ])
                }
                this.DB.execSQL('ALTER TABLE $1 RENAME TO $1_backup'.format(tableName))
                this.DB.execSQL('ALTER TABLE $1_temp RENAME TO $1'.format(tableName))
            } else {
                //기존과 동일한 경우 아무 변경 X
                Log.d('#NO DB STRUCTURE CHANGES')
            }
        }
        return this
    }

    StorageManager.prototype.acquire = function (table, _id) {
        if (table == 'user') return new User(this, _id);
        if (table == 'room') return new Room(this, _id);
        if (table == 'roomuser') return new RoomUser(this, _id);
        return null;
    }

    //데이터 불러오기
    StorageManager.prototype.get = function (table, _id, args) {
        //if [_id]: try auto connect
        //args: readonly(bool), safemode(bool), query(string), id(string), range(arr[int, bool])
        if (!args) args = {}

        let temp, type = 'default'

        if (Array.isArray(_id)) {
            for (var i in _id) {
                if (!_id[i]) continue;
                temp = this.fetch('connect', _id[i], {
                    safemode: true
                });
                if (temp) {
                    _id = temp.content.target;
                    type = type;
                    break;
                }
            }
            if (!temp) {
                if (args.$id) {
                    _id = args.$id
                } else return null;
            }
        }

        if (this.storage[table] && this.storage[table][_id]) {
            let item = this.storage[table][_id];
            item.access++;
            item.expire = new Date().getTime();
            return {
                SM: this,
                content: item.content,
                isNew: false,
                isMount: true,
                type: 'default'
            }
        }

        let final = this.fetch(table, _id, args)
        return {
            SM: this,
            content: final.content,
            isNew: final.isNew,
            isMount: false,
            type: type
        }
    }
    //데이터 가져오기
    StorageManager.prototype.fetch = function (table, _id, args) {
        if (!args) args = {}

        let content = null
        try {
            content = this.query(table, _id, args)
        } catch (e) {}

        //default: content(cold data) ? return with mount : return with mount new
        //safemode: content ? return with mount : null
        //readonly: content ? return without mount : null
        return content ? (() => {
            if (args.readonly) return content
            return {
                content: this.mount(table, _id, content),
                isNew: false
            }
        })() : (() => {
            if (args.safemode || args.readonly) return null
            let o = {},
                col = Object.keys(this.column[table]);
            for (let v in col)
                o[col[v]] = JSON.parse(JSON.stringify(this.column[table][col[v]]))
            o._id = _id
            return {
                content: this.mount(table, _id, o),
                isNew: true
            }
        })()
    }
    //데이터 mount
    StorageManager.prototype.mount = function (table, _id, content) {
        this.storage[table] = this.storage[table] || {}

        let time = new Date().getTime()
        this.storage[table][_id] = {
            table: table,
            _id: _id,
            access: 1,
            expire: time,
            content: content
        }

        return content
    }
    //데이터 unmount
    StorageManager.prototype.unmount = function (table, _id) {
        if (!(this.storage[table] && this.storage[table][_id] && --this.storage[table][_id].access == 0)) return false

        try {
            this.DB.execSQL("DELETE FROM $1 WHERE _id = ?".format(table), [_id])
        } catch (e) {
            Log.e('SQL DELETE ERROR:\n' + e)
        }
        let col = Object.keys(this.column[table])
        let query
        try {
            query = Array(col.length).fill(null).map((_, i) =>
                (() => {
                    try {
                        let foo = this.storage[table][_id].content[col[i]]
                        if (typeof foo != 'object') return foo
                        return JSON.stringify(foo)
                    } catch (e) {
                        return null
                    }
                })()
            )
            this.DB.execSQL('INSERT INTO $1 VALUES ($2)'.format(table, Array(col.length).fill('?').join(',')), query)
        } catch (e) {
            Log.e('SQL WRITE ERROR:\n$1\n'.format(query) + e)
        }
        delete this.storage[table][_id]
        return true
    }
    StorageManager.prototype.addConnection = function (_id, target, type) {
        if (!_id) return this;
        let temp = this.fetch('connect', _id).content;
        if (temp) {
            temp.target = target;
            temp.time = new Date().getTime();
            temp.type = type;
        };
        this.unmount('connect', _id);
        return this;
    }
    StorageManager.prototype.check = function () {
        //시간 가져오기
        let time = new Date().getTime()
        //큐의 앞에서부터
        for (let j in this.storage) {
            for (let i in this.storage[j]) {
                let foo = this.storage[j][i]
                //최초 mount 만료기간이 현재 시간보다 적은 경우에만 체크
                if (foo.expire + this.keep < time) {
                    this.unmount(foo.table, foo._id)
                }
            }
        }
    }
    StorageManager.prototype.query = function (table, _id, args) {
        if (!args) args = {} // query(string), id(string), range(arr[int, bool])

        function fetcher(cursor, col) {
            let ret = {}
            for (let idx in col) {
                let foo = this.column[table][col[idx]]
                ret[col[idx]] = typeof foo == 'string' ? String(cursor.getString(Number(idx))) : typeof foo == 'number' ? Number(cursor.getInt(Number(idx))) : JSON.parse(String(cursor.getString(Number(idx))))
            }
            return ret
        }

        let cursor = !args.query ?
            this.DB.rawQuery("SELECT * FROM $1 WHERE _id = ?".format(table), [_id]) :
            this.DB.rawQuery(args.query, null)
        let col = Object.keys(this.column[table])
        if (!args.range) {
            cursor.moveToNext()
            let ret = fetcher.call(this, cursor, col)
            cursor.close()
            return ret
        }
        let ret = [];
        !args.range[1] ? cursor.moveToNext() : cursor.moveToLast()
        try {
            for (let i = 0; i < args.range[0]; ++i) {
                ret.push(fetcher.call(this, cursor, col))
                args.range[1] ? cursor.moveToPrevious() : cursor.moveToNext()
            }
        } catch (e) {}
        cursor.close()
        return ret
    }
    return StorageManager
}

const Data = (function () {
    function Data(SM, _id) {
        this.SM = SM;
        this._id = _id;
        this.time = new Date().getTime();
    }
    Data.prototype.init = function (data) {
        this.data = data;

        this.getId();

        this.props = this.SM.get(this.type, this._id, {$id: this.$id});
        this.content = this.props.content;
        this.$id = this.content._id;

        if (this.props.isNew) this.generate();
        this.update();
        return this;
    }
    Data.prototype.unmount = function () {
        this.SM.unmount(this.type, this.content._id);
        return true;
    }
    return Data;
})()


const User = (function () {
    function User(props) {
        this.type = 'user';
        Data.apply(this, arguments)
    }
    User.prototype = Object.create(Data.prototype);
    User.prototype.constructor = User;
    User.prototype.getId = function () {
        this.$id = Utils.makeRandom('eeeeee')
    }
    User.prototype.generate = function () {
        const pcode = this.$id;
        const tag = Utils.makeRandom('nnnne');

        this.SM.addConnection(pcode, pcode, '_id')
            .addConnection(this.data.chat.user_id, pcode, 'uid')
            .addConnection(tag, pcode, 'tag')
        if (this.data.user.original_profile_image_url) this.SM.addConnection(this.data.user.original_profile_image_url, pcode, 'img')

        this.content.uid = [String(this.data.chat.user_id)]
        this.content.tag = tag
        this.content.joinDate = this.time

        Log.d("USER: GENERATE " + pcode)
    }
    User.prototype.update = function () {
        if (!Utils.pullFromArray(this.content.uid, this.data.chat.user_id, true)) {
            this.SM.addConnection(this.data.chat.user_id, this.content._id, 'uid');
        }
        if (this.data.user.original_profile_image_url && !Utils.pullFromArray(this.content.profileImage, this.data.user.original_profile_image_url, true)) {
            this.SM.addConnection(this.data.user.original_profile_image_url, this.content._id, 'img')
        }
        Utils.pullFromArray(this.content.nickname, this.data.user.name)
    }
    return User
}())

const Room = (function () {
    function Room(props) {
        this.type = 'room';
        Data.apply(this, arguments)
    }
    Room.prototype = Object.create(Data.prototype);
    Room.prototype.constructor = Room;
    Room.prototype.getId = function () {
        this.$id = this.data.room.link_id;
    }
    Room.prototype.generate = function () {
        this.SM.addConnection(this.$id, this.$id, '_id')
            .addConnection(this.data.room.id, this.$id, 'uid')
            .addConnection(this.data.room.name, this.$id, 'name')

        this.content.name = String(this.data.room.name)

        Log.d("ROOM: GENERATE " + this.$id)
    }
    Room.prototype.update = function () {}
    return Room
}())

const RoomUser = (function () {
    function RoomUser(props) {
        this.type = 'roomuser';
        Data.apply(this, arguments)
    }
    RoomUser.prototype = Object.create(Data.prototype);
    RoomUser.prototype.constructor = Room;
    RoomUser.prototype.getId = function () {
        this.$id = this.data.R.content._id + '_' + this.data.U.content._id;
    }
    RoomUser.prototype.generate = function () {
        this.SM.addConnection(this.$id, this.$id, '_id')

        this.content.roomid = this.data.R.content._id
        this.content.userid = this.data.U.content._id

        Log.d("ROOMUSER: GENERATE " + this.$id)
    }
    RoomUser.prototype.update = function () {
        Utils.pullFromArray(this.content.profileImage, this.data.U.content.profileImage[0])
        Utils.pullFromArray(this.content.nickname, this.data.U.content.nickname[0])
    }
    return RoomUser
}())