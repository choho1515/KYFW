const SETTING = require('./setting/kakaoDB');

const Utils = require('../Utils')

exports.StorageManager = function () {
    function StorageManager() {
        this.keep = 10000 //10s
        this.storage = {}

        this.column = SETTING.structure;
        this.DB = android.database.sqlite.SQLiteDatabase.openOrCreateDatabase("/sdcard/katalkbot/ky.db", null, null);
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
        let data = this.fetch(table, _id);

        if (table == 'user') return new User(data);
        if (table == 'room') return new Room(data);
        if (table == 'roomuser') return new RoomUser(data);
        
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
                temp = this.fetch('connect', _id[i], {
                    safemode: true
                });
                if (temp) {
                    _id = temp.content.target;
                    type = type;
                    break;
                }
            }
            if (!temp) return null;
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
            let col = Object.keys(this.column[table])
            let o = col.map(x => JSON.parse(JSON.stringify(this.column[table][x])))
            o._id = _id
            return {
                content: this.mount(table, _id, o),
                isNew: false
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
        let temp = this.fetch('connect', _id).content
        if (temp) {
            temp.target = target
            temp.time = new Date().getTime()
            temp.type = type
        }
        this.unmount('connect', _id)
        return this
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


const User = (function () {
    function User(props) {
        this.props = props;
        this.content = props.content
        this.SM = props.SM
        this.time = new Date().getTime()
    }
    User.prototype.init = function (data) {
        this.data = data;

        if (this.props.isNew) this.generate();

        if (!this.props.type == 'uid') {
            this.SM.addConnection(chatData.user_id, pcode, 'uid');
            this.data.uid.push(data.chat.user_id);
        }
        if (!this.props.type == 'img') this.SM.addConnection(chatData.user_id, pcode, 'img')
            this.SM.addConnection(data.chat.user_id, this.content._id, 'uid');
            this.data.uid.push(data.chat.user_id)

        this.update();
    }
    User.prototype.generate = function () {
        const pcode = Utils.makeRandom('eeeeee');
        const tag = Utils.makeRandom('nnnne');

        
        SM.addConnection(tag, pcode, 'tag')
        
        let sm = SM.get('user', pcode)

        sm.uid = [String(chatData.user_id)]
        sm.tag = tag
        sm.joinDate = this.time

        this.data = sm

        Log.d("USER: GENERATE " + pcode)
    }
    User.prototype.update = function () {
        let data, target
        try {
            data = this.data.profileImage, target = userData.original_profile_image_url
            data.unshift((_ => _ == -1 ? target : data.splice(_, 1)[0])(data.indexOf(target)))
            data.length = Math.min(data.length, 10)
            target && SM.addConnection(target, this.data._id)
            data = this.data.nickname, target = userData.name
            data.unshift((_ => _ == -1 ? target : data.splice(_, 1)[0])(data.indexOf(target)))
            data.length = Math.min(data.length, 10)
        } catch (e) {
            Log.d(e + '\n' + JSON.stringify(this.data, null, 4) + '\n' + this.data.profileImage + '\n' + this.data.nickname)
        }
    }
    return User
}())

const Room = (function () {
    function Room(SM, args) {
        this.SM = SM
        this.data = null
    }
    Room.prototype.connect = function (roomData, chatData) {
        this.data = SM.get('room', [roomData.id], {
            safemode: true
        })
        if (this.data) {} else {
            this.generate(roomData, chatData)
        }
        this.update(roomData, chatData)

        return this
    }
    Room.prototype.generate = function (roomData, chatData) {

        Log.d("ROOM: GENERATE " + roomData.link_id)
        SM.addConnection(roomData.id, roomData.link_id)
            .addConnection(roomData.name, roomData.link_id)
        let sm = SM.get('room', roomData.link_id)

        sm.name = String(roomData.name)

        this.data = sm
    }
    Room.prototype.update = function (userData, chatData) {

    }
    return Room
}())

const RoomUser = (function () {
    function RoomUser(SM, args) {
        this.SM = SM
        this.data = null
    }
    RoomUser.prototype.connect = function (roomData, userData) {
        //1.연결 가능한지 확인
        //확인해야 하는거: uid, 프사
        //uid의 경우: 단순 연결
        this.data = SM.get('roomuser', [roomData._id + '_' + userData._id], {
            safemode: true
        })
        if (this.data) {
            //Log.d("ROOMUSER: uid CONNECT SUCCESS")
            //uid 연결 성공시 프사, 닉변 감지
        } else if (!this.data) {
            //Log.d("ROOMUSER: uid CONNECT FAIL")
            //2. 실패하면 새로 만들기
            this.generate(roomData, userData)
        }
        this.update(roomData, userData)

        return this
    }
    RoomUser.prototype.generate = function (roomData, userData) {
        Log.d("ROOMUSER: GENERATE " + roomData._id + '_' + userData._id)
        SM.addConnection(roomData._id + '_' + userData._id, roomData._id + '_' + userData._id)
        let sm = SM.get('roomuser', roomData._id + '_' + userData._id)

        sm.roomid = roomData._id
        sm.userid = userData._id

        this.data = sm
    }
    RoomUser.prototype.update = function (roomData, userData) {
        //일반멤버 아닌경우 (방/부방) 권한조정
        /*
        Log.d(JSON.stringify(userData))
        if (userData.v.openlink.mt != 2) {
            
        } else this.data.permission = this.data.permissionDefault
        */
        let data, target
        try {
            data = this.data.profileImage, target = userData.profileImage[0]
            data.unshift((_ => _ == -1 ? target : data.splice(_, 1)[0])(data.indexOf(target)))
            data.length = Math.min(data.length, 10)
            data = this.data.nickname, target = userData.nickname[0]
            data.unshift((_ => _ == -1 ? target : data.splice(_, 1)[0])(data.indexOf(target)))
            data.length = Math.min(data.length, 10)
        } catch (e) {
            Log.d(e + '\n' + JSON.stringify(this.data, null, 4) + '\n' + this.data.profileImage + '\n' + this.data.nickname)
        }
    }
    return RoomUser
}())