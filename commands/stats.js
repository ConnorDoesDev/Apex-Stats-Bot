const { client, Discord } = require("../ApexStats.js");
require("dotenv").config();
const config = require("../config.json");
const fs = require("fs");
const moment = require("moment");
const percentagebar = require("percentagebar");

// Require Wrapper Library
const MozambiqueAPI = require("mozambique-api-wrapper");

// Create Client instance by passing in API key
let mozambiqueClient = new MozambiqueAPI(config.APIKey);

module.exports = {
  name: "stats",
  description: "Apex user stats.",
  execute(message, args) {
    let platform = args[0];
    let player = args[1];

    function getPlatform(platform) {
      if (
        platform == "pc" ||
        platform == "pC" ||
        platform == "Pc" ||
        platform == "PC"
      ) {
        return "PC";
      }
    }

    message.channel.send("Fetching stats...").then(async (msg) => {
      mozambiqueClient
        .search({
          platform: getPlatform(platform),
          player: player,
        })
        .then(function (result) {
          const stats = new Discord.MessageEmbed()
            .setTitle(`Apex Stats for ${result.global.name}`)
            .setThumbnail(result.global.avatar)
            .setDescription(
              `Account Level ${result.global.level}/500\n${percentagebar(
                500,
                result.global.level,
                10
              )}\n\nBattlepass Level ${
                result.global.battlepass.level
              }/110\n${percentagebar(110, result.global.battlepass.level, 10)}`
            )
            .setFooter(process.env.CREATOR_NAME, process.env.CREATOR_LOGO);

          msg.delete();
          message.reply(stats);
        })
        .catch(function (e) {
          msg.delete();
          message.reply("Error processing stats. Please try again.");
          console.log(e);
        });
    });
  },
};
