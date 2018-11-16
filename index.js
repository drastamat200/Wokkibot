const Commando = require('discord.js-commando');
const Datastore = require('nedb');
const winston = require('winston');
const path = require('path');
const _ = require('lodash');

/**
 * Load settings
 */
const environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'PRODUCTION';
const { OWNER, TOKEN, PREFIX, ACTIVITY } = require('./config')[environment];

/**
 * Create client
 */
const client = new Commando.Client({
  owner: OWNER,
  commandPrefix: PREFIX,
  unknownCommandResponse: false
});

/**
 * Load configuration to client
 * This way we can use it in commands
 * this.client.config["GLOBAL"].SETTING
 */
client.config = require('./config');

/**
 * Create new Winston logger
 * https://www.npmjs.com/package/winston
 */
client.logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'DD.MM.YYYY HH:mm:ss'
    }),
    winston.format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'wokkibot.log' })
  ]
});

/**
 * Log environment that bot is being ran in
 */
client.logger.info(`Starting Wokkibot in ${environment} environment`);

/**
 * Datastore
 */
client.db = {};
client.db.users = new Datastore({ filename: './users.db', autoload: true });
client.db.guilds = new Datastore({ filename: './guilds.db', autoload: true });
client.db.blacklist = new Datastore({ filename: './blacklist.db', autoload: true });

/**
 * Create client listeners
 */
client
  .on('ready', () => {
    client.logger.info(`Wokkibot is ready!`);
    client.user.setActivity(ACTIVITY.TEXT, { type: ACTIVITY.TYPE })
      .then(presence => client.logger.info(`Activity set to ${presence.activity.type} ${presence.activity}`))
      .catch(client.logger.info);
  })
  .on('error', client.logger.error)
  .on('warn', client.logger.warn)
  .on('disconnect', () => client.logger.warn(`Wokkibot disconnected`))
  .on('reconnect', () => client.logger.warn(`Wokkibot reconnected`))
  .on('commandRun', (cmd, promise, msg, args) => client.logger.info(`${msg.author.tag} (${msg.author.id}) ran command ${cmd.groupID}:${cmd.memberName}`))
  .on('commandError', (cmd, err) => client.logger.error(`Error occurred when running command ${cmd.groupID}:${cmd.memberName}`, err))
  .on('message', msg => {
    if (msg.content.startsWith(client.commandPrefix)) {
      let cc = msg.content.split(client.commandPrefix)[1];

      client.db.guilds.findOne({ gid: msg.guild.id }, (err, data) => {
        if (err) return [client.logger.error(err),msg.channel.send(`An error occurred when trying to run custom command. More information logged to console.`)];
        
        if (data) {
          let cmd = _.find(data.commands, { command: cc });
          if (cmd) return msg.channel.send(cmd.output);
        }
      })
    }
  });

/**
 * Blacklist
 */
client.dispatcher
  .addInhibitor(msg => {
    client.db.blacklist.findOne({ did: msg.author.id }, (err, data) => {
      if (err) return client.logger.error(err);
      if (data) return client.logger.info(`${msg.author.tag} (${msg.author.id}) tried to run command but they are blacklisted`);
    });
  });

/**
 * Register commands
 */
client.registry
  // Registers your custom command groups
  .registerGroups([
    ['general', 'General commands'],
    ['music', 'Music commands'],
    ['mod', 'Moderation commands'],
    ['fun', 'Fun commands']
  ])

  // Registers all built-in groups, commands, and argument types
  .registerDefaults()

  // Registers all of your commands in the ./commands/ directory
  .registerCommandsIn(path.join(__dirname, 'commands'));

/**
 * Login with token
 */
client.login(TOKEN);