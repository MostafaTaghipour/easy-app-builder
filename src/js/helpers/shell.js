const {exec, execSync, spawn} = require('child_process');
const fs = require('fs');
const kill = require('tree-kill');
const commandExists = require('command-exists');

let proc;

const executeCommand = (cmd, stdout) => {
  return new Promise((resolve, reject) => {
    let cmdarray = cmd.split(' ');

    proc = spawn(cmdarray.shift(), cmdarray, {shell: true});
    proc.stdout.on('data', function (data) {
      if (stdout) stdout(data.toString());
    });
    // proc.stderr.on('data', function (data) {
    //   proc.kill();
    // });
    proc.on('exit', function (code, signal) {
      if (code) {
        reject(code);
      } else if (signal) {
        reject(signal);
      } else {
        resolve();
      }
    });
  });
};

function killCurrentProcess() {
  if (!proc) return;

  kill(proc.pid, 'SIGKILL', function (err) {
    // Do things
  });

  proc = undefined;
}

function dirOpen(path) {
  const isFile = fs.lstatSync(path).isFile();

  let command = '';
  switch (process.platform) {
    case 'darwin':
      command = `open ${isFile ? ' -R' : ''}`;
      break;
    case 'win32':
      command = 'explore';
      break;
    default:
      command = 'xdg-open';
      break;
  }
  console.log('execSync', `${command} "${path}"`);
  return execSync(`${command} "${path}"`);
}

async function commandExist(command) {
  return new Promise((res, rej) => {
    commandExists(command, function (err, commandExists) {
      if (err) rej(err);
      res(commandExists);
    });
  });
}

module.exports = {
  executeCommand,
  dirOpen,
  killCurrentProcess,
  commandExist,
};
