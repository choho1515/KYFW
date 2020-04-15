
    DBHandler.prototype.execute = function (args) {
        const [DBF, SM, LDB, _chat, _user, _room, chat, user, room, _U, _R, _RU, U, R, RU] = args

        //chat.message = chat.message.trim()

        function reply(msg) {
            try {
                Api.replyRoom(room.name, msg.replace(/\u202E/g, ''))
            } catch (e) {
                Api.replyRoom(room.name, msg)
            }
        }

        function Moim() {
            this.id
        }
        Moim.prototype.post = function (str, notice) {
            notice = notice ? notice : 'false'
            let res
            for (let i = 0; i < 2; ++i) {
                res = JSON.parse(org.jsoup.Jsoup.connect('https://open.kakao.com/moim/chats/' + room.id + '/posts?link_id=' + R._id).header('Authorization', Authorization).header('A', A).data('content', '[{"text":"' + str.replace(/\n/g, '\\n') + '","type":"text"}]', 'object_type', 'TEXT', 'notice', notice).ignoreContentType(true).post().text())
                if (res.status != -500) {
                    break
                } else Authorization = getDecryptedAuth()
            }
            if (res.status != 0) return res.status
            this.id = res.id
            return res.id
        }
        Moim.prototype.put = function (text, id) {
            id = id ? id : this.id
            let res
            for (let i = 0; i < 2; ++i) {
                res = JSON.parse(org.jsoup.Jsoup.connect('https://open.kakao.com/moim/posts/' + id).header('Authorization', Authorization).data('content', '[{"text":"' + ("\u202D" + text.replace(/\n/g, '\\n')) + '","type":"text"}]', 'object_type', 'TEXT', 'notice', 'true', 'link_id', R._id).ignoreContentType(true).method(org.jsoup.Connection.Method.PUT).execute().parse().text())
                if (res.status != -500) {
                    break
                } else Authorization = getDecryptedAuth()
            }
            if (res.status != 0) return res.status
            return true
        }
        Moim.prototype.share = function (id) {
            let res
            for (let i = 0; i < 2; ++i) {
                res = JSON.parse(org.jsoup.Jsoup.connect('https://open.kakao.com/moim/posts/' + id + '/share?link_id=' + R._id).header('Authorization', Authorization).ignoreContentType(true).method(org.jsoup.Connection.Method.POST).execute().text())
                if (res.status != -500) {
                    break
                } else Authorization = getDecryptedAuth()
            }
            if (res.status != 0) return res.status
            return true
        }
        Moim.prototype.get = function (id) {
            id = id ? id : this.id
            let res
            for (let i = 0; i < 2; ++i) {
                res = JSON.parse(org.jsoup.Jsoup.connect('https://open.kakao.com/moim/posts/' + id + '?link_id=' + R._id).header('Authorization', Authorization).ignoreContentType(true).get().text())
                if (res.status != -500) {
                    break
                } else Authorization = getDecryptedAuth()
            }
            if (res.status == -500) return res.status
            return res
        }

        function slideBanner(text, speed, count) {
            speed = speed ? speed : 500
            text = (text.trim() + (count ? '' : '   ')).split('')
            let post = new Moim()
            post.post("\u202D" + text.join(''), 'true')
            java.lang.Thread.sleep(speed)
            for (let j = 0; j < (count || 1); ++j) {
                for (let i = 0; i < text.length; ++i) {
                    text.push(text.shift())
                    post.put("\u202D" + text.join(''))
                    java.lang.Thread.sleep(speed)
                }
            }
        }

        // /^(?!0.)\d+$/.test(str);
        // /^[A-Za-z0-9]*$/.test(str);

        const msg = chat.message
        const _msg = typeof (msg) == 'string' ? msg.split(' ') : null
        const $msg = typeof (msg) == 'string' ? _msg[0] : null
        const sender = user.name
        const date = new Date()

        if (chat.type == 0) try { chat.message = JSON.parse(chat.message) } catch (e) {}

        function commandExec(localCommand) {
            let pindex = PERMISSION.indexOf(RU.permission)
            let ret = []
            let localCommandTemp = {}

            function chk() {
                if (!this.enabled) return false
                if (pindex > PERMISSION.indexOf(this.permission)) return false
                return true
            }

            function vrf() {
                //타입체크
                if (typeof this != 'object' && !$msg) return false

                if (this === true) return true
                let ret = {}
                if (typeof this == 'function') return this()
                if (typeof this == 'object') {
                    if (!this.type && !$msg) return false

                    if (this.type) {
                        if (this.type.indexOf(+chat.type) == -1) return false
                    }
                    if (this.key) {
                        const header = $msg.split('!', 1)[0]
                        if (header == '') {
                            ret.mode = 'default'
                        } else if (header == 'd') {
                            ret.mode = 'debug'
                        } else return false
                        const key = $msg.substring(header.length + 1)
                        if (this.key.indexOf(key) == -1) return false
                        ret.key = key
                        ret.keyIndex = this.key.indexOf(key)
                    }
                    if (this.length) {
                        let pass = true
                        if (this.length[0].length == 1) {
                            if (_msg.length != this.length[0][0]) pass = false
                        } else if (!(_msg.length >= this.length[0][0] && _msg.length <= this.length[0][1])) pass = false
                        if (!pass) {
                            if (this.length.length == 2) this.length[1] === true ? reply('잘못된 입력 형식입니다.') : reply(this.length[1])
                            return false
                        }
                    }
                    if (this.format) {
                        let pass = true
                        for (let i in this.format[0]) {
                            if (_msg[+i + 1] && this.format[0][i] && !this.format[0][i].test(_msg[+i + 1])) pass = false
                        }
                        if (!pass) {
                            if (this.format.length == 2) this.format[1] === true ? reply('잘못된 입력 형식입니다.') : reply(this.format[1])
                            return false
                        }
                    }
                    //pass arg to check()
                    if (this.check && !this.check(ret)) return false
                    return ret
                }
            }

            function checker(lcmd, lcmdtemp) {
                this.forEach((e) => {
                    lcmd[e.id] = lcmd[e.id] || {}
                    lcmdtemp[e.id] = {}
                    for (let c in e.setting) {
                        lcmdtemp[e.id][c] = typeof lcmd[e.id][c] === 'undefined' ? e.setting[c] : lcmd[e.id][c]
                        lcmdtemp[e.id].name = e.name
                    }
                    if (e.cate == 'group') {
                        if (chk.call(lcmd[e.id])) {
                            checker.call(e.main, lcmd, lcmdtemp);
                        }
                    } else if (e.cate == 'command') {
                        if (chk.call(lcmd[e.id])) {
                            let verified = vrf.call(e.main.verify)
                            if (verified) {
                                ret.push([e.main.execute, verified])
                            }
                        }
                    }
                });
            }
            checker.call(this, localCommand, localCommandTemp)
            return [localCommandTemp, ret]
        }

        function commandListFormat(localCommand, args) {
            let pindex = PERMISSION.indexOf(RU.permission)
            let ret = []

            function chk() {
                if (!this.enabled) return false
                if (pindex > PERMISSION.indexOf(this.permission)) return false
                return true
            }

            function checker(lcmd) {
                this.forEach((e) => {
                    lcmd[e.id] = lcmd[e.id] || e.setting
                    if (e.cate == 'group') {
                        args == 'printAll' && ret.push('\n분류: ' + e.name + ' (' + lcmd[e.id].permission + '/' + (lcmd[e.id].enabled ? 'enabled' : 'disabled') + ')\n| ' + e.description)
                        if (chk.call(lcmd[e.id]) && !e.hide) {
                            args == 'print' && ret.push('\n분류: ' + e.name + ' (' + lcmd[e.id].permission + ')\n| ' + e.description)
                            checker.call(e.main, lcmd);
                        }
                    } else if (e.cate == 'command') {
                        args == 'printAll' && ret.push('   》' + e.name + ' (' + lcmd[e.id].permission + '/' + (lcmd[e.id].enabled ? 'enabled' : 'disabled') + ')\n    | ' + e.description)
                        if (chk.call(lcmd[e.id])) {
                            args == 'print' && ret.push('   》' + e.name + ' (' + lcmd[e.id].permission + ')\n    | ' + e.description)
                        }
                    }
                });
            }
            checker.call(this, localCommand);
            (args == 'printAll' || args == 'print') && reply('[[ 명령어 ]]$1$2'.format(blank, ret.join('\n')))
        }

        const commandList = [{
            cate: 'group',
            id: 1,
            name: '비활성',
            description: 'for test purpose',
            setting: {
                enabled: true,
                permission: 'guest'
            },
            main: [{
                    cate: 'command',
                    id: 2,
                    name: '테스트2',
                    description: '!테스트',
                    setting: {
                        enabled: true,
                        permission: 'guest'
                    },
                    main: {
                        verify: {
                            key: ['테스트'],
                            length: [
                                [1]
                            ],
                            //format: [[/^(?!0.)\d+$/, /^(?!0.)\d+$/], '아!'],
                        },
                        execute: function () {
                            reply('asdf')
                        }
                    }
                },
                {
                    cate: 'command',
                    id: 8,
                    name: '포인트추가',
                    description: '채팅시 +1',
                    setting: {
                        enabled: true,
                        permission: 'guest'
                    },
                    main: {
                        verify: true,
                        execute: function () {
                            RU.point++
                            RU.dailyPoint++
                            R.dailyCounter.chat++
                            //R.counter.user++
                        }
                    }
                },
                {
                    cate: 'command',
                    id: 3,
                    name: '포인트',
                    description: '!포인트 = 님 포인트 출력',
                    setting: {
                        enabled: true,
                        permission: 'guest'
                    },
                    main: {
                        verify: {
                            key: ['포인트'],
                            length: [
                                [1]
                            ],
                        },
                        execute: function () {
                            let c = SM.DB.rawQuery('select p1.*, ( select count(*) from roomuser as p2 where roomid = "' + R._id + '" and p2.point > p1.point ) as rank from roomuser as p1 where p1._id = "' + RU._id + '"', null)
                            c.moveToNext()
                            let pRank = Number(c.getInt(c.getColumnCount()-1)+1)
                            c.close()
                            c = SM.DB.rawQuery('select p1.*, ( select count(*) from roomuser as p2 where roomid = "' + R._id + '" and p2.dailyPoint > p1.dailyPoint ) as rank from roomuser as p1 where p1._id = "' + RU._id + '"', null)
                            c.moveToNext()
                            let dpRank = Number(c.getInt(c.getColumnCount()-1)+1)
                            c.close()
                            c = SM.DB.rawQuery('select * from roomuser where roomid = "' + R._id + '"', null)
                            let mCount = Number(c.count)
                            c.close()
                            c = SM.DB.rawQuery('select * from roomuser where roomid = "' + R._id + '" and dailyPoint != 0', null)
                            let dmCount = Number(c.count)
                            c.close()
                            reply([
                                'TOTAL: $1cp ($2/$3: $4%)'.format(RU.point, pRank, mCount, Math.round(pRank/mCount*1000)/10),
                                'TODAY: $1cp ($2/$3: $4%)'.format(RU.dailyPoint, dpRank, dmCount, Math.round(dpRank/dmCount*1000)/10)
                            ].join('\n'))
                        }
                    }
                },
                {
                    cate: 'command',
                    id: 4,
                    name: '권한 변경',
                    description: '관리자 전용',
                    setting: {
                        enabled: true,
                        permission: 'guest'
                    },
                    main: {
                        verify: {
                            key: ['cmd'],
                            length: [
                                [4]
                            ],
                            check: function () {
                                if (room.name == '■캬옹봇 디버깅' || user.name == 'rgb') {
                                    if (_msg[2] == 'enabled' && (_msg[3] == 'true' || _msg[3] == 'false')) {
                                        _msg[3] = JSON.parse(_msg[3])
                                        return true
                                    }
                                    if (_msg[2] == 'permission' && PERMISSION.indexOf(_msg[3]) != -1) return true
                                }
                            }
                        },
                        execute: function () {
                            try {
                                Object.keys(R.command).map(v => [v, R.command[v]]).find(cmd => cmd[1].name == _msg[1])[1][_msg[2]] = _msg[3]
                                reply('OK')
                            } catch (e) {
                                reply('존재하지 않는 명령어입니다.')
                            }
                        }
                    }
                },
                {
                    cate: 'command',
                    id: 7,
                    name: '명령어',
                    description: '!명령어',
                    setting: {
                        enabled: true,
                        permission: 'guest'
                    },
                    main: {
                        verify: {
                            key: ['명령어', '!명령어'],
                            length: [
                                [1]
                            ],
                        },
                        execute: function (args) {
                            if (args.keyIndex == 0) commandListFormat.call(commandList, R.command, 'print')
                            if (args.keyIndex == 1) commandListFormat.call(commandList, R.command, 'printAll')
                        }
                    }
                },
                {
                    cate: 'command',
                    id: 5,
                    name: '삭메',
                    description: '!삭메 or !삭메{  = 삭제메세지 복구',
                    setting: {
                        enabled: true,
                        permission: 'guest'
                    },
                    main: {
                        verify: {
                            key: ['삭메', '삭메{'],
                            length: [
                                [2], 'ㅇ?'
                            ],
                            format: [
                                [/^(?!0.)\d+$/], 'ㅇ?'
                            ],
                        },
                        execute: function (args) {
                            const ttt = new Date().getTime()
                            const range = Number(_msg[1]) > 100 ? 100 : Number(_msg[1])
                            const list = DBF.get('chat_logs', null, {
                                query: 'SELECT * FROM chat_logs WHERE type >= 16384 AND chat_id = $1 ORDER BY _id'.format(room.id),
                                range: [range, true]
                            })
                            const ret = []
                            for (let i in list) {
                                let cc = list[i].decrypt().data
                                try {
                                    if (args.keyIndex != 1 && cc.message.length > 500) cc.message = '{500}: ' + cc.message.slice(0, 500)
                                } catch (e) {}
                                let uu
                                try {
                                    uu = DBF.get('friends', cc.user_id).decrypt().data
                                } catch (e) {}
                                ret.push([
                                    '⸻⸻⸻⸻⸻⸻⸻⸻',
                                    '[ $1 | $2 ]'.format(uu ? uu.name : '_error_', moment.unix(cc.created_at).format('YYYY-MM-DD HH:mm')),
                                    cc.type == 16385 ? cc.message : '》 $1$2'.format(cc.message, args.keyIndex == 1 ? '\n' + strfy(cc.attachment) : ''),
                                ].join('\n'))
                            }
                            const header = [
                                '[KyBot inteliLog]'.format(args.keyIndex == 1 ? 'unfold' : 'fold'),
                                '| mode: $1'.format(args.keyIndex == 1 ? 'unfold' : 'fold'),
                                '| count: $1'.format(list.length),
                                '| elapsed: $1ms'.format(new Date().getTime() - ttt)
                            ].join('\n')
                            reply('[[삭제 메세지 로그]]$1$2\n\n$3\n'.format(blank, header, ret.join('\n')))
                        }
                    }
                },
                {
                    cate: 'command',
                    id: 6,
                    name: '인사',
                    description: '입장감지 인사',
                    setting: {
                        enabled: false,
                        permission: 'guest'
                    },
                    main: {
                        verify: {
                            type: [0]
                        },
                        execute: function () {
                            if (chat.v.origin == 'NEWMEM') {
                                reply('[ ' + user.name + ' ] 님 어서오세요.\n먼저 인사 후, 모바일 메뉴열고 우측상단, PC 채팅창 맨위 방제 아랫줄 하트버튼을 눌러주세요.')
                                //if (userDB.chatCount <= 1) {
                                //reply('[ ' + sender + ' ] 님 어서오세요.\n먼저 인사 후, 모바일 메뉴열고 우측상단, PC 채팅창 맨위 방제 아랫줄 하트버튼을 눌러주세요.')
                                //} else {
                                //if (!userDB.registered) reply('[ ' + sender + ' ] 님 다시 만나서 반가워요.\n하트는 누르셨죠?')
                                //if (userDB.registered) reply('[ ' + sender + ' ] 님 다시 만나서 반가워요.\n봇 계정이 자동으로 인증되었습니다.\n하트는 누르셨죠?')
                                //}
                            } else if (chat.v.origin == 'DELMEM') {
                                if (chat.message.feedType == 2) {
                                    reply('[ ' + user.name + ' ] 님이 나갔습니다.')
                                } else reply('[ ' + user.name + ' ] 님이 [ ' + chat.message.member.nickName + ' ] 님을 강퇴했습니다.')
                            }
                        }
                    }
                },
            ]
        }]

        //if (room.name != '■캬옹봇 디버깅') return
 
        //let tttt = new Date().getTime()

        let executed = commandExec.call(commandList, R.command)
        R.command = executed[0]
        for (let cmd in executed[1]) {
            executed[1][cmd][0](executed[1][cmd][1])
        }
        //Log.d(new Date().getTime()-tttt)


        if (room.name == '■테스트') {
            tester = tester || {}
            tester.push(chat.message)
            if (tester.length >= 25) {
                let time = new Date().getTime()
                reply(tester[24] + '\n' + Number(time - timetime) + 'ms')
                tester = []
                timetime = time
            }
        }



        if ((room.name == '■캬옹봇 디버깅' || user.name == 'rgb') && typeof (chat.message) == 'string' && chat.message.split(' ')[0] == ',') {
            try {
                reply(eval(chat.message.substr(chat.message.split(' ', 1)[0].length + 1)));
            } catch (e) {
                reply('error!\nlineNumber: ' + e.lineNumber + '\nmessage : ' + e.message)
            }
        }

        if (_msg && _msg[0] == '!apitest') {
            try {
                reply(
                    strfy(JSON.parse(
                        org.jsoup.Jsoup.connect('http://sc-talk.kakao.com/android/scrap/preview.json')
                        .header('A', 'android/9.9.9/ko')
                        .header('Content-Type', 'application/json')
                        .requestBody('{"url":"' + chat.message.substring(9) + '"}')
                        .ignoreContentType(true).post().text()
                    ))
                )
            } catch (e) {
                reply('error!\nlineNumber: ' + e.lineNumber + '\nmessage : ' + e.message)
            }
        }
    }
    DBHandler.prototype.exit = function (args) {
        //Log.d(args)
        return
    }
    return DBHandler
}