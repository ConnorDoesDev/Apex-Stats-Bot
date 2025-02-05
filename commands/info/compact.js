const chalk = require("chalk");
const {Command} = require("discord.js-light-commando");
const {MessageEmbed} = require("discord.js-light");
const axios = require("axios");
const {checkMsg} = require("../functions/checkMsg.js");
const percentage = require("percentagebar");
const {
  findLegendByID,
  checkStatus,
  getColor,
  findRank,
  getBPLevel,
  trackerTitle,
  trackerValue,
} = require("../functions/stats.js");

module.exports = class MapCommand extends Command {
  constructor(client) {
    super(client, {
      name: "compact",
      group: "info",
      memberName: "compact",
      description: "Shows compact stats about a user.",
      examples: ["compact pc sdcore", "compact x1 djb2spirit,"],
      args: [
        {
          key: "platform",
          prompt: "What platform are you on?",
          type: "string",
          default: "",
        },
        {
          key: "username",
          prompt: "What is your username?",
          type: "string",
          default: "RSPN_Hideouts",
        },
      ],
    });
  }
  onError(error) {
    console.log(chalk`{red Error: ${error}}`);
  }
  run(msg, {platform, username}) {
    if (checkMsg(msg) == 1) return;

    // Set platform to uppercase because the API
    // only accepts uppercase platform variables
    var platform = platform.toUpperCase();

    // Check to see if the platform is a supported
    // platform on the API
    function checkPlatform(platform) {
      if (platform == "PSN" || platform == "PS5" || platform == "PS" || platform == "PS4")
        return "PS4";

      if (platform == "XBOX" || platform == "X1") return "X1";

      if (platform == "PC" || platform == "STEAM" || platform == "ORIGIN") return "PC";

      if (
        platform == "SWITCH" ||
        platform == "NINTENDO" ||
        platform == "NINTENDO SWITCH" ||
        platform == "NS"
      )
        return 1;

      return 0;
    }

    // If the platform isn't one that is supported,
    // return an error
    if (checkPlatform(platform) == 0)
      return msg.say(
        `There was not a valid platform provided.\nFor reference, Use PC for Origin/Steam, X1 for Xbox, or PS4 for PlayStation.`
      );

    // If platform returns 1, return an error saying
    // switch stats aren't supported
    if (checkPlatform(platform) == 1)
      return msg.say(
        "Unfortunately, stats for the Nintendo Switch are not currently supported. Sorry for the inconvenience."
      );

    msg.say("Retrieving user stats...").then(async (msg) => {
      axios
        .get(
          `https://api.apexstats.dev/stats.php?platform=${checkPlatform(
            platform
          )}&player=${encodeURIComponent(username)}`
        )
        .then(function (response) {
          msg.channel.startTyping();

          // Set main response to data object
          console.log("-- Fetching user data --");
          var response = response.data;
          console.log("-- Data fetched, parsing --");

          // Sort data into variables for organization :bop:
          var username = response.userData.username;
          var platform = response.userData.platform;

          // Banner info
          var level = response.accountInfo.level;
          var bpLevel = response.accountInfo.battlepass.level;

          // Battle Royale Ranked
          var BR_RankName = response.accountInfo.Ranked.BR.name;
          var BR_RankPos = response.accountInfo.Ranked.BR.ladderPos;
          var BR_RankDiv = response.accountInfo.Ranked.BR.division;
          var BR_RankScore = response.accountInfo.Ranked.BR.score;

          // Arenas Ranked
          var Arenas_RankName = response.accountInfo.Ranked.Arenas.name;
          var Arenas_RankPos = response.accountInfo.Ranked.Arenas.ladderPos;
          var Arenas_RankDiv = response.accountInfo.Ranked.Arenas.division;
          var Arenas_RankScore = response.accountInfo.Ranked.Arenas.score;

          const embed = new MessageEmbed()
            .setTitle(`Compact Stats for ${username} on ${platform}`)
            .addField(
              "Account",
              `**Account Level:** ${level.toLocaleString()}\n**BattlePass Level:** ${getBPLevel(bpLevel)}`,
              true
            )
            .addField(
              "Ranked",
              `**BR:** ${findRank(
                BR_RankName,
                BR_RankPos,
                BR_RankDiv
              )} (${BR_RankScore.toLocaleString()} RP)\n**Arenas:** Coming Season 10!`,
              true
            )
            .setFooter("BattlePass level not correct? Equip the badge in-game!");

          msg.delete();
          msg.say(embed);

          msg.channel.stopTyping();
        })
        .catch((error) => {
          console.log("-- ERROR OUTPUT --");
          // console.log(error);

          if (
            error.response.data == null ||
            error.response.data == undefined ||
            error.response.data == "undefined"
          ) {
            console.log("-- ERROR WAS NOT DEFINED --");
            return msg.say("There was an error that was not caught. Please try again.");
          }

          var error = error.response.data;

          console.log(chalk`{red Error: ${error.error}}`);

          function checkErrorType(code) {
            if (code == 1)
              return "**Error**\nThere was no platform and/or username specific. This shouldn't happen, so contact SDCore#1234 if you see this.";

            if (code == 2)
              return "**Error**\nThere was not a valid platform provided. Please use PC/X1/PS4.";

            if (code == 3)
              return "**Error**\nThere was an error connecting to an external API. Please try again or contact SDCore#1234 if the problem persists.";

            if (code == 4)
              return `**Error**\nUsername '${username}' on ${platform} not found. Either it is incorrect, or it doesn't exist. Try using the username of your Origin account.`;

            if (code == 5)
              return `**Error**\nUsername '${username}' on ${platform} was found, but that account hasn't played Apex. Try a different username.`;

            return "**Error**\nGeneric, unhandled error. Contact SDCore#1234 if you see this.";
          }

          msg.delete();
          msg.say(checkErrorType(error.errorCode));

          msg.channel.stopTyping();
        });

      msg.channel.stopTyping();
    });
  }
};
