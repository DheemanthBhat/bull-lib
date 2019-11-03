const JOB_TIME = 5; // seconds
const cronExp = "*/" + JOB_TIME + " * * * * *";

module.exports = {
  name: "Write To PLC",

  options: {
    delay: 0.0,
    repeat: {
      cron: cronExp,
      limit: 3
    },
    removeOnComplete: true,
    removeOnFail: true,
    stopRepeatOnSuccess: true
  },

  definition: function (job, done) {
    job.jobTime = JOB_TIME;

    setTimeout(function () {
      if (job.data.id % 2 == 0) {
        done(false, { status: false });
      } else {
        done(true, { status: true });
      }
    }, job.jobTime * 1000);
  },

  successHandler: function (job, result) {
    console.log("Success handler...");
  },

  failureHandler: function (job, error) {
    console.log("Failure handler...");
  }
}