module.exports = function (Command) {

    Command.add({
        id: 'test',
        regex: /^!(\S+) (\S+)$/,
        verify: {
            key: ['테스트']
        },
        execute() {
            this.reply(this.cmd.props.content)
        }
    })

    return Command
}