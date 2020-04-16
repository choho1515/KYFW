exports.Command = function () {
    function Command() {
        this.command = []
    }
    Command.prototype.add = function (prop) {
        this.command.push(prop)
        return this
    }
    Command.prototype.get = function (msg) {
        let foo = new CommandItem(this.command, msg)
        if (!foo.checkPrefix()) return null;
        if (!foo.checkCommand()) return null;
        let final = foo.checkMarkdown();
        if (!final) return null;
        return final
    }
    return Command
}

/*
command = {
    id: 'sldkfjlsdafjasdf',
    name: '',
    desc: '',
    setting: {
        enabled: true,
        permission: ''
    },
    markdown: ''
}
*/
const CommandItem = (function () {
    function CommandItem(prop, msg) {
        this.data = prop;
        this.msg = msg;
        this.$msg = msg.split(' ', 1)[0];
        this.command = null;
    }
    CommandItem.prototype.checkPrefix = function () {
        if (this.$msg[0] == '!') return this;
        return null;
    }
    CommandItem.prototype.checkCommand = function () {
        const foo = this.data.find(_ => _.verify.key.indexOf(this.$msg.substr(1)) != -1);
        if (foo) {
            this.command = foo;
            return this;
        }
        return null;
    }
    CommandItem.prototype.checkMarkdown = function () {
        var ret = {}
        var msg_l = this.msg.split('\n');
        var $msg_l = this.command.markdown.split('\n');
        for (var i in $msg_l) {
            var msg_w = msg_l[i].split(' ')
            var $msg_w = $msg_l[i].split(' ')
            for (var j in $msg_w) {
                if (!msg_w[j]) return null;
                if ($msg_w[j].startsWith('$')) {
                    var arg = JSON.parse($msg_w[j].substr(1))
                    if (j == $msg_w.length - 1) {
                        if (arg[1] == 'mc') {
                            ret[arg[0]] = msg_w.slice(j, msg_w.length).join(' ');
                            break;
                        } else {
                            if (msg_w.length != $msg_w.length) return null;
                            ret[arg[0]] = msg_w[j];
                        }
                    }
                    if (i == $msg_l.length - 1) {
                        if (arg[1] == 'ml') {
                            ret[arg[0]] = msg_l.slice(i, msg_l.length).join('\n')
                            return ret;
                        } else {
                            if (msg_l.length != $msg_l.length) return null;
                            ret[arg[0]] = msg_w[j];
                        }
                    }
                    if (arg[1] != 'mc' && arg[1] != 'ml' && arg[1]) {
                        if (!RegExp(arg[1]).test(msg_w[j])) return null;
                    }
                    ret[arg[0]] = msg_w[j];
                } else {
                    if (msg_w[j] != $msg_w[j]) return null;
                }
            }
        }
        this.props = ret;
        return this;
    }
    CommandItem.prototype.execute = function (args, exec) {
        //Log.d(JSON.stringify(args,null,4))
        const [cmd, chat, user, room] = args;
        const reply = function (msg) {
            Bot.send(room.name, msg);
        }
        exec()
        /*
        function() {
            Log.d(chat)
            //reply('OK')
        }*/
        //cmd.command.execute;
    }
    return CommandItem
}())