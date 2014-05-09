var dns = require('native-dns'),
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
    var resps = {};
    var answers = 0;
    request.question.forEach(function(question) {
      if ((question.type == 1 || question.type == 16 || question.type == 255) &&
          (question.class == 1 || question.class == 255)) {
        resps[question.name] = getRecords(question.name);
        if (argv.a && question.type != 16) {
          resps.push(dns.A({
            name: question.name,
            address: argv.a,
            ttl: 16000
          }));
          answers++;
        }
      }
    });
    console.log(resps);
    for (var key in resps)  {
      if (resps.hasOwnProperty(key)) {
        resps[key].forEach(function(resp) {
          response.answer.push(dns.TXT({
            name: key,
            data: resp,
            ttl: 16000
          }));
          answers++;
        });
      }
    }
    if (answers) {
      response.send();
    }
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