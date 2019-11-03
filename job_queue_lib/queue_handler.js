const JOB_LIMIT = 10;
const { displayTime } = require('../time');
const Queue = require('bull');

const options = {
  redis: {
    port: 6379,
    host: '127.0.0.1'
  }
};

module.exports = {
  createQueue: function (qTemplate) {
    try {
      qTemplate.options.redis = options.redis;
      let queue = new Queue(qTemplate.name, qTemplate.options); // Specify Redis connection using object
      attachEvents(queue);
      return queue;
    } catch (error) {
      console.log("ERROR while creating queue '" + qTemplate.name + "'.");
      // console.log(error);
      return undefined;
    }
  },

  registerJob: function (queue, jobTemplate) {
    try {
      if (queue == undefined) {
        throw new Error("Queue is not defined for the job '" + jobTemplate.name + "'.");
      }

      jobTemplate.queue = queue;

      queue.process(jobTemplate.name, function (job, done) {
        console.log("\nProcessing of Job " + job.data.id + " started with data: " + JSON.stringify(job.data));

        job.successHandler = jobTemplate.successHandler;
        job.failureHandler = jobTemplate.failureHandler;

        jobTemplate.definition(job, done);
      });
    } catch (error) {
      console.log(error);
    }
  },

  isQueueFull: async function (queue) {
    try {
      let totalJobCount = await getFullJobCounts(queue);
      console.log("Total Jobs in queue = " + totalJobCount);

      if (totalJobCount == -1) {
        throw new Error("Failed to fetch job count in queue.");
      }

      if (totalJobCount > JOB_LIMIT) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.log(error);
    }
  },

  addJob: async function (jobTemplate, jobData) {
    let self = this;
    try {
      if (jobTemplate.queue == undefined) {
        throw new Error("Queue is not defined for the job '" + jobTemplate.name + "'.");
      }

      if (await self.isQueueFull(jobTemplate.queue)) {
        throw new Error("Job not added to queue. Queue is full.");
      }

      jobTemplate.options.jobId = jobData.id;

      let queue = jobTemplate.queue;
      queue
        .getJobs()
        .then(jobs => {
          let jobCheck = isDuplicate(jobs, jobData.id);

          if (jobCheck.isDuplicate) {
            jobCheck.job.update(jobData);
            throw new Error("Duplicate job.");
          } else {
            return queue.add(jobTemplate.name, jobData, jobTemplate.options);
          }
        })
        .then(job => {
          console.log("Job " + job.id + " added to queue successfully.");
        })
        .catch(error => {
          console.log("Failed to add job to queue.");
          console.log(error.message);
        });
    } catch (error) {
      console.log(error.message);
    }
  }
}

function isDuplicate(jobs, jobId) {
  let duplicateJob = jobs.filter(function (job) {
    return job.opts.repeat.jobId == jobId;
  }).pop();

  if (duplicateJob != undefined) {
    return duplicateJob
  } else {
    return false
  }
}


async function getFullJobCounts(queue) {
  try {
    let jobCount = await queue.getJobCounts();
    let totalJobCount = 0;
    totalJobCount += jobCount.active;
    totalJobCount += jobCount.completed;
    totalJobCount += jobCount.delayed;
    totalJobCount += jobCount.failed;
    totalJobCount += jobCount.paused;
    totalJobCount += jobCount.waiting;
    return totalJobCount;
  } catch (error) {
    console.log(error);
    return -1;
  }
}

function attachEvents(queue) {
  queue.on('error', function (error) {
    // An error occured.
    console.log("Job failed with below error...");
    console.log(error);
  });

  queue.on('waiting', function (jobId) {
    // A Job is waiting to be processed as soon as a worker is idling.
    // console.log("Job " + jobId + " is waiting... ");
  });

  queue.on('active', function (job, jobPromise) {
    // A job has started. You can use `jobPromise.cancel()`` to abort it.
    console.log("Job " + job.data.id + " is active...");
    displayTime(job.jobTime);
  });

  queue.on('stalled', function (job) {
    // A job has been marked as stalled. This is useful for debugging job
    // workers that crash or pause the event loop.
    console.log("Job " + job.data.id + " is stalled...");
  });

  queue.on('progress', function (job, progress) {
    // A job's progress was updated!
    console.log("Job " + job.data.id + " in progress...");
    // console.log("Progress " + progress);
  });

  queue.on('completed', function (job, result) {
    // A job successfully completed with a `result`.
    console.log("Job " + job.data.id + " is completed...");

    job.successHandler(job, result);

    if (job.opts.repeat && job.opts.stopRepeatOnSuccess) {
      queue.removeRepeatable(job.name, job.opts.repeat);
    }
  });

  queue.on('failed', function (job, error) {
    // A job failed with reason `err`!
    console.log("Job " + job.data.id + " failed...");
    job.failureHandler(job, error);
  });

  queue.on('paused', function () {
    // The queue has been paused.
    console.log("Queue is paused...");
  });

  queue.on('resumed', function (job) {
    // The queue has been resumed.
    console.log("Job " + job.data.id + " is resumed...");
  });

  queue.on('cleaned', function (jobs, type) {
    // Old jobs have been cleaned from the queue. `jobs` is an array of cleaned
    // jobs, and `type` is the type of jobs cleaned.
    console.log("Job type " + type);
    for (let i = 0; i < jobs.length; i++) {
      console.log("Job " + jobs[i].id + " is cleaned...");
    }
  });

  queue.on('drained', function () {
    // Emitted every time the queue has processed all the waiting jobs (even if there can be some delayed jobs not yet processed)
    console.log("Queue is drained...");
  });

  queue.on('removed', function (job) {
    // A job successfully removed.
    console.log("Job " + job.data.id + " is removed...");
  });
}