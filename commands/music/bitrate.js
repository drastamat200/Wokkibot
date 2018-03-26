const { Command } = require('discord.js-commando');

module.exports = class BitrateCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'bitrate',
            group: 'music',
            memberName: 'bitrate',
            description: 'Set song bitrate',
            details: 'Set the currently playing songs bitrate to anything between 0-96, as 96 is the maximum bitrate discord accepts',
            examples: [`${client.commandPrefix}bitrate 64`],
            guildOnly: true,
            throttling: {
                usages: 2,
                duration: 3
            },
            args: [
                {
                    key: 'value',
                    prompt: 'Enter bitrate\n',
                    type: 'integer'
                }
            ]
        });
    }

    run(msg, { value }) {
        if (!value) return msg.reply(`You must specify a value`);
        const queue = this.queue.get(msg.guild.id);
        if (!queue) return msg.reply(`There is no song playing`);
        if (!queue.songs[0].dispatcher) return msg.reply(`The song has not yet begun`);
        queue.songs[0].dispatcher.setBitrate(value);

        return msg.reply(`Bitrate set to ${value}`);
    }

    get queue() {
        if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;

        return this._queue;
    }
}