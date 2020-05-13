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
        //if (!foo.checkPrefix()) return null;
        if (!foo.checkCommand()) return null;
        let final = foo.checkRegex();
        if (!final) return null;
        let index = foo.verify.key.indexOf(final[0])
        if (index == -1) return null;
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
    CommandItem.prototype.checkRegex = function () {
        return this.command.regex.exec(this.msg)
    }
    CommandItem.prototype.execute = function (args, exec) {
        args.reply = function (msg) {
            Bot.send(args.room.name, msg);
        }
        this.command.execute.call(args)
    }
    return CommandItem
}())