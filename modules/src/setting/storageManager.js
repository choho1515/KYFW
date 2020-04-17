module.exports = {
    structure: function (myid) {
        const date = new Date()
        return {
            user: {
                '_id': '',
                'registered': false,
                'authorized': false,
                'uid': [], //!default
                'tag': '', //!default
                'joinDate': 0, //!default
                'nickname': [],
                'profileImage': [],
                'notifyQueue': [],
                'notifyDone': [],
                'chatCount': 0,
                'reportQueue': 0,
                'reportPoint': 0,
            },
            room: {
                '_id': '',
                'name': '', //!default
                'command': {},
                'dailyCounter': {
                    chat: 0,
                    user: 0,
                    date: date.getDate()
                },
                'misc': {
                    dailyStat: false
                }
            },
            roomuser: {
                '_id': '',
                'roomid': '', //!default
                'userid': '', //!default
                'permission': 'guest',
                'nickname': [],
                'profileImage': [],
                'point': 0,
                'dailyPoint': 0,
            },
            connect: {
                '_id': '',
                'target': '',
                'type': '',
                'time': 0
            }
        }
    }
}