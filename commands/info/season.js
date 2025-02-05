const chalk = require("chalk");
const {Command} = require("discord.js-light-commando");
const {MessageEmbed} = require("discord.js-light");
const {checkMsg} = require("../functions/checkMsg.js");
const config = require("../../config.json");

let mysql = require("mysql");
const {DateTime} = require("luxon");
let connection = mysql.createPool({
  host: config.SQL.host,
  user: config.SQL.username,
  password: config.SQL.password,
  database: config.SQL.database,
});

module.exports = class MapCommand extends Command {
  constructor(client) {
    super(client, {
      name: "season",
      group: "info",
      memberName: "season",
      description: "Shows information about current and previous seasons.",
      examples: ["season"],
      args: [
        {
          key: "season",
          prompt: "Which season would you like to look up information for?",
          type: "string",
          default: "",
        },
      ],
    });
  }
  onError(error) {
    console.log(chalk`{red Error: ${error}}`);
  }
  run(msg, {season}) {
    if (checkMsg(msg) == 1) return;

    msg.channel.startTyping();

    if (!season) {
      // no args
      var query = `SELECT * FROM ${config.SQL.seasonTable} ORDER BY \`id\` DESC LIMIT 1`;
    } else {
      // arg, find corrusponding season and display info or display
      // error if there is no season found
      var season = season.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

      // List of current supported legends
      var seasons = ["Pre-season", "Preseason", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

      if (seasons.indexOf(season) == -1)
        return message.channel.send("Seems that season isn't in our database yet.");

      if (season == "Pre-season" || season == "Preseason") {
        season = "0";
      }

      var query = `SELECT * FROM ${config.SQL.seasonTable} WHERE \`id\` = '${season}' ORDER BY \`id\` DESC LIMIT 1`;
    }

    connection.getConnection(function (err, connection) {
      if (err) {
        console.log(err);
        return message.channel.send(
          "There was an error connecting to the database. Please try again later."
        );
      }

      connection.query(query, function (err, results) {
        if (err) {
          connection.release();
          console.log(err);
          return message.channel.send(
            "There was a problem with the SQL syntax. Please try again later."
          );
        }

        var result = results[0];
        var currentTimestamp = DateTime.local().toFormat("ooo") * 2;
        var startDate = DateTime.fromISO(result.startDate);
        var startFormat = DateTime.fromISO(startDate).toFormat("cccc, LLLL d, y");
        var endDate = DateTime.fromISO(result.endDate);
        var endFormat = DateTime.fromISO(result.endDate).toFormat("cccc, LLLL d, y");

        const lengthFull = endDate.diff(startDate, ["months", "weeks", "days", "hours"]);
        const length = lengthFull.toObject();

        const pluralize = (count, noun, suffix = "s") =>
          `${count} ${noun}${count !== 1 ? suffix : ""}`;

        function isWhiteSpace(text) {
          return " \t\n".includes(text);
        }

        function isPunct(text) {
          return ";:.,?!-'\"(){}".includes(text);
        }

        function compress(string) {
          return string
            .split("")
            .filter((char) => !isWhiteSpace(char) && !isPunct(char))
            .join("");
        }

        const seasonEmbed = new MessageEmbed()
          .setAuthor(`Apex Legends Season ${result.id} - ${result.name}`, null, result.link)
          .setThumbnail(
            `https://cdn.apexstats.dev/SeasonIcons/Season_${result.id}.png?q=${currentTimestamp}`
          )
          .setDescription(result.description)
          .addField(
            "Length",
            `**Start:** ${startFormat}\n**End:** ${endFormat}\n**Season Length:** ${pluralize(
              length.months,
              "month"
            )}, ${pluralize(length.weeks, "week")}, ${pluralize(length.days, "day")}`
          )
          .addField("Featured Map", result.map, true)
          .addField("Legend Debut", result.legend, true)
          .addField("Weapon Debut", result.weapon, true)
          .setImage(
            `https://cdn.apexstats.dev/Maps/SeasonList/${compress(
              result.map
            )}.png?q=${currentTimestamp}`
          )
          .addField(
            "Season Trailers",
            `${result.SFTO}\n${result.launchTrailer}\n${result.gameplayTrailer}\n${result.characterTrailer}\n${result.battlepassTrailer}`
          );

        connection.release();

        msg.channel.stopTyping();

        return msg.say(seasonEmbed);
      });

      msg.channel.stopTyping();
    });
  }
};
