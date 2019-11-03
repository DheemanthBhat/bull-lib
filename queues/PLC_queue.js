module.exports = {
  name: "PLCQueue",

  options: {
    limiter: {
      max: 1, // Maximum number of jobs processed at a time.
      duration: 5000
    }
  }
}