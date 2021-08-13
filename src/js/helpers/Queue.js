const {SequentialTaskQueue} = require('sequential-task-queue');

const Queue = function () {
  this.taskLookup = {};

  this.queue = new SequentialTaskQueue();
};

Queue.prototype.push = function (task, options, key) {
  var res = this.queue.push(task, options);
  if (key) this.taskLookup[key] = res;
  return res;
};

Queue.prototype.cancel = function (key) {
  var item = this.taskLookup[key];
  if (item) {
    delete this.taskLookup[key];
    item.cancel();
  }
};


Queue.prototype.onComplete = function (callback) {
  this.queue.wait().then(() => {
    callback();
  });
};

Queue.prototype.onError = function (callback) {
  queue.on('error', callback);
};

module.exports = Queue;
