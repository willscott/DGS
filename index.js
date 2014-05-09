var dns = require('native-dns'),
    q = require('q'),
    server = dns.createTCPServer(),
    getRecords = require('./getRecords');

var argv = require('yargs')
  .usage('Usage: $0 [-a host] [host:]port')
  .example('$0 127.0.0.1:53', 'bind to localhost:53')
  .example('$0 -a 192.168.0.1', 'Unintentional A record lookups redirected')
  .describe('a', 'return a records for host')
  .string(1)
  .demand(1)
  .argv;


server.on('request', function (request, response) {
  //Assertions about well-formed queries:
  if (request.header.qr == 0 &&
      request.header.opcode == 0) {
    var resps = [];
    request.question.forEach(function(question) {
      if ((question.type == 1 || question.type == 16 || question.type == 255) &&
          (question.class == 1 || question.class == 255)) {
        resps.push(getRecords(question.name).then(function(name, answer) {
          return answer.map(function(rcrd) {
            return dns.TXT({
              name: name,
              data: rcrd,
              ttl: 16000
            });
          });
        }.bind({}, question.name)));
        if (argv.a && question.type != 16) {
          resps.push(q.resolve([dns.A({
            name: question.name,
            address: argv.a,
            ttl: 16000
          })]));
        }
      }
    });

    q.all(resps).then(function(response, answers) {
      var count = 0;
      answers.forEach(function (answer) {
        if (answer) {
          answer.forEach(function(rcrd) {
            response.answer.push(rcrd);
            count++;
          });
        }
      });
      if (count) {
        response.send();
      }
    }.bind({}, response));
  } else {
    // Ignore bad requests.
  }
});

server.on('error', function (err, buff, req, res) {
  console.log(err.stack);
});

var bindHost = undefined,
    bindPort = 53;
if (argv._[0]) {
  if (typeof argv._[0] == 'string' && argv._[0].indexOf(':')) {
    var parts = argv._[0].split(':');
    bindHost = parts[0];
    bindPort = parseInt(parts[1]);
  } else {
    bindPort = parseInt(argv._[0]);
  }
}

server.serve(bindPort, bindHost);