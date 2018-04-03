const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const winston = require('winston');
const fs = require('fs');

module.exports = class ActivityCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'activity',
            group: 'mod',
            memberName: 'activity',
            description: 'Change bot activity',
            details: 'Set bots activity to given string',
            examples: [`${client.commandPrefix}activity Hello world!`],
            guildOnly: true,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
            args: [
                {
                    key: 'activity',
                    prompt: 'What is my activity?',
                    type: 'string'
                }
            ]
        });
    }

    hasPermission(msg) {
        return this.client.isOwner(msg.author);
    }

    run(msg, { activity }) {
        const resultEmbed = new MessageEmbed();

        msg.client.user.setActivity(activity);
        let config = require('../../config.json');
        config.ACTIVITY = activity;
        fs.writeFile('./config.json', JSON.stringify(config, null, 2), function(error) {
            if (error) {
                resultEmbed
                    .setColor('#ff0000')
                    .setTitle('Failure')
                    .setDescription('Failed to change my activity. Error logged to console.');
                msg.channel.send(resultEmbed);
                return winston.error(error);
            }

            resultEmbed
                .setColor('#00ff00')
                .setTitle('Success')
                .setDescription(`Changed my activity to **${activity}**`);
            msg.channel.send(resultEmbed);
        });
    }
}