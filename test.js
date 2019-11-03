const PLC_QUEUE_ENABLED = true;

const queueHandler = require('./job_queue_lib/queue_handler');
const PLCQueueTemplate = require('./queues/PLC_queue');
const writeToPLCJobTemplate = require('./jobs/write_to_plc_job');

if (PLC_QUEUE_ENABLED) {
  let PLCQueue = queueHandler.createQueue(PLCQueueTemplate);
  queueHandler.registerJob(PLCQueue, writeToPLCJobTemplate);
}

console.log("All odd jobs will fail and even jobs will be successful.\n");

// Asynchronous job registration.
queueHandler.addJob(writeToPLCJobTemplate, { id: 1, name: 'Job 1', data: 10 });

setTimeout(() => {
  queueHandler.addJob(writeToPLCJobTemplate, { id: 2, name: 'Job 2', data: 20 });
}, 1000);


setTimeout(() => {
  queueHandler.addJob(writeToPLCJobTemplate, { id: 3, name: 'Job 3', data: 30 });
}, 2000);
