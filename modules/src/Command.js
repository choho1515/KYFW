exports.Command = function () {
    function Command() {
        this.command = {}
    }
    Command.prototype.add = function (prop) {
        this.command[prop.id] = prop
    }
    Command.prototype.get = function (id) {
        return new CommandItem(this.command[id])
    }
    return MainThread
}

const CommandItem = (function () {
    function CommandItem(prop) {
        this.data = prop
    }
    CommandItem.prototype.check = function (msg) {
        this.markdown(msg, this.data.markdown)
    }
    CommandItem.prototype.markdown = function (a, b) {
        var ret = {}
        var msg_l = a.split('\n')
        var $msg_l = b.split('\n')
        for (var i in $msg_l) {
            var msg_w = msg_l[i].split(' ')
            var $msg_w = $msg_l[i].split(' ')
            for (var j in $msg_w) {
                if (!msg_w[j]) return false;
                if ($msg_w[j].startsWith('$')) {
                    var arg = JSON.parse($msg_w[j].substr(1))
                    if (j == $msg_w.length - 1) {
                        if (arg[1] == 'mc') {
                            ret[arg[0]] = msg_w.slice(j, msg_w.length).join(' ')
                            break;
                        } else if (msg_w.length != $msg_w.length) return false;
                    } else if (i == $msg_l.length - 1) {
                        if (arg[1] == 'ml') {
                            ret[arg[0]] = msg_l.slice(i, msg_l.length).join('\n')
                            return ret;
                        } else if (msg_l.length != $msg_l.length) return false;
                    } else if (arg[1]) {
    
                    } else ret[arg[0]] = msg_w[j]
                } else {
                    if (msg_w[j] != $msg_w[j]) return false
                }
            }
        }
        return ret
    }
    CommandItem.prototype.execute = function (i) {}
    return CommandItem
}())

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


