const chalk = require("chalk");
const {Command} = require("discord.js-light-commando");
const {MessageEmbed} = require("discord.js-light");
const axios = require("axios");
const {checkMsg} = require("../functions/checkMsg.js");
const percentage = require("percentagebar");
const config = require("../../config.json");
const {
  findLegendByID,
  checkStatus,
  getColor,
  findRank,
  getBPLevel,
  trackerTitle,
  trackerValue,
  getPercent,
} = require("../functions/stats.js");

module.exports = class MapCommand extends Command {
  constructor(client) {
    super(client, {
      name: "stats",
      group: "info",
      memberName: "stats",
      description: "Shows stats about a user.",
      examples: ["stats pc sdcore", "stats x1 djb2spirit,"],
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
      if (
        platform == "PSN" ||
        platform == "PS5" ||
        platform == "PS" ||
        platform == "PS4" ||
        platform == "PLAYSTATION"
      )
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
          var isOnline = response.userData.online;
          var isInGame = response.userData.ingame;

          // Banner info
          var legend = response.accountInfo.active.legend;
          var level = response.accountInfo.level;

          function bpLevel() {
            if (response.accountInfo.battlepass.history === null) return 0;

            return response.accountInfo.battlepass.history.season9;
          }

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

          // Trackers
          var tracker = response.accountInfo.active;
          var tOne = tracker.trackers[0];
          var tTwo = tracker.trackers[1];
          var tThree = tracker.trackers[2];

          const embed = new MessageEmbed()
            .setTitle(`Stats for ${username} on ${platform} playing ${findLegendByID(legend)}`)
            .setDescription(checkStatus(isOnline, isInGame))
            .setColor(getColor(legend))
            .addField(
              "<:AccountLevel:824571962420101122> Account",
              `Level ${level.toLocaleString()}/500\n${percentage(
                500,
                level,
                10,
                "▓",
                "░",
                "[",
                "]",
                false
              )} ${getPercent(
                level,
                500,
                false
              )}%\n\n**<:Season_9:847250004087144458> Season 9 BattlePass**\nLevel ${getBPLevel(
                bpLevel()
              )}/110\n${percentage(
                110,
                getBPLevel(bpLevel()),
                10,
                "▓",
                "░",
                "[",
                "]",
                false
              )} ${getPercent(bpLevel(), 110, false)}%`,
              true
            )
            .addField(
              "Battle Royale Ranked",
              `${findRank(
                BR_RankName,
                BR_RankPos,
                BR_RankDiv
              )}\n<:Season_0:802049756254830632> ${BR_RankScore.toLocaleString()} RP\n\n**Arenas Ranked**\nComing Season 10!`,
              true
            )
            .addField("\u200b", "\u200b", true)
            .addField("Battle Royale Kills", response.data.Total_BR_Kills.toLocaleString(), true)
            .addField("Arenas Kills", response.data.Total_Arenas_Kills.toLocaleString(), true)
            .addField("Total Kills", response.data.Total_Kills.toLocaleString(), true)
            .addField("\u200b", "**Currently Equipped Trackers**")
            .addField(
              trackerTitle(tOne.id, findLegendByID(legend)),
              trackerValue(tOne.id, tOne.value),
              true
            )
            .addField(
              trackerTitle(tTwo.id, findLegendByID(legend)),
              trackerValue(tTwo.id, tTwo.value),
              true
            )
            .addField(
              trackerTitle(tThree.id, findLegendByID(legend)),
              trackerValue(tThree.id, tThree.value),
              true
            )
            .setImage(`https://cdn.apexstats.dev/LegendBanners/${findLegendByID(legend)}.png`)
            .setFooter(
              "Weird tracker name? Let SDCore#1234 know!\nBattlePass level not correct? Equip the badge in-game!\nTotal kills may not be up-to-date. Type >>killhelp for info."
            );

          msg.delete();
          msg.say(embed);

          msg.channel.stopTyping();
        })
        .catch((error) => {
          console.log("-- ERROR OUTPUT --");

          if (config.debug == true) {
            console.log(error);
          }

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

          if (error.request) {
            console.log(
              chalk`{red Error: Request error, possible rate limit reached. Please try again.}`
            );
            return msg.say(`**Error**\nThere was an error with that request, please try again.`);
          }

          msg.channel.stopTyping();
        });
    });
  }
};
