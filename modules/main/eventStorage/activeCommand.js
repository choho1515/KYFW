module.exports = function (Command) {
    
    Command.add({
        id: 'test',
        markdown: '$ $["content","mc"]',
        verify: {
            key: ['테스트']
        },
        execute() {
            this.reply(this.cmd.props.content)
        }
    })

    return Command
}