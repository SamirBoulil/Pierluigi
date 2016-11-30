var utils = {

    // args takes a JSON stringify'd string and returns an object,
    // fails silently returning an empty object
    unmarshall: (str) => {
      try {
        return JSON.parse(str)
      } catch (ex) {
        console.error(`Error unmarshalling ${str}`, ex)
        return {}
      }
    },

    marshall: JSON.stringify
}

module.exports = utils;
