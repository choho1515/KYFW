const Handler = function () {
    function Handler(args) {
        this.KakaoDB = KakaoDB
        this.LocalDB = LocalDB
    }
    Handler.prototype.handle = function (chat, user, room) {
        const {KakaoDB, LocalDB, check} = this

        const _U = new User([SM, LDB]).connect(user, chat)
        const _R = new Room([SM, LDB]).connect(room, chat)
        const _RU = new RoomUser([SM, LDB]).connect(_R.data, _U .data)
        

        new java.lang.Thread({
            run: function () {
                try {
                    check(chat, user, room, U, R, RU)
                    java.lang.Thread.sleep(1000)
                    SM.unmount('user', U._id)
                    SM.unmount('room', R._id)
                    SM.unmount('roomuser', RU._id)
                } catch (e) {
                    Log.e('error in execute!\nlineNumber: ' + e.lineNumber + '\nmessage : ' + e.message);
                }
            }
        }).start();
    }
    Handler.prototype.check = function (chat, user, room, U, R, RU) {
        const {KakaoDB, LocalDB} = this
        const [U, R, RU] = [_U.data, _R.data, _RU.data]

        
    }
    Handler.prototype.cmdChk = function (a, b) {

    }
}