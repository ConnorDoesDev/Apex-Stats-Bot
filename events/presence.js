const {client} = require("../ApexStats.js");
const chalk = require("chalk");
const {DateTime} = require("luxon");
const axios = require("axios");

client.once("ready", () => {
  function setPresence() {
    axios.get("https://fn.alphaleagues.com/v1/apex/map/").then((result) => {
      var map = result.data;

      client.user.setPresence({
        activity: {
          name: ` on ${map.map} · Serving ${client.guilds.cache.size.toLocaleString()} guilds`,
          type: "PLAYING",
        },
        status: "online",
      });

      console.log(
        chalk`{blueBright [${DateTime.local().toFormat("hh:mm:ss")}] Updated presence, set map to ${
          map.map
        }}`
      );
    });
  }

  setPresence();

  setInterval(function () {
    var date = new Date();

    if (date.getMinutes() % 10 == 0) {
      setPresence();
      console.log(
        chalk`{blueBright [${DateTime.local().toFormat("hh:mm:ss")}] Updated presence for ${
          client.user.tag
        }}`
      );
    }
  }, Math.max(1, 1 || 1) * 60 * 1000);
});
