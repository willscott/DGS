var dns = require('native-dns'),
    q = require('q');

var openServers = [
  '8.8.8.8',        // Google
  '77.88.8.8',      // Yandex
  '208.67.222.222'  // OpenDNS
];

module.exports = function(name) {
  var promises = [];
  var question = dns.Question({
    name: name,
    type: 'A',
  });

  openServers.forEach(function(host) {
    var req = dns.Request({
      question: question,
      server: { address: host, port: 53, type: 'udp' },
      timeout: 1000,
    });
    promises.push(new q.Promise(function(resolve) {
      req.on('timeout', function() {
        resolve();
      });
      req.on('message', function(err, msg) {
        if (err) {resolve();}
        var addrs = [];

        msg.answer.forEach(function (a) {
          addrs.push(a.address);
        });
        resolve(addrs);
      });

      req.send();
    }));
  });

  return q.all(promises).then(function(responses) {
    // Do all Agree?
    var agreement = true;
    var curr = JSON.stringify(responses[0]);
    for (var i = 1; i < responses.length; i++) {
      var next = JSON.stringify(responses[i]);
      if (curr != next) {
        agreement = false;
        break;
      }
      curr = next;
    }

    // If yes...
    if (agreement) {
      return responses[0];
    } else {
      return ['Unknown'];
    }
  });
};
