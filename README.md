#DNS Golden Standard

Return all possible IPs returned by a service in TXT records.

## Using

```bash
dig @dgs-server TXT twitter.com +tcp
```

## Running

```bash
npm install dgs
node index.js
```

## FAQ

### I set this as my DNS Server, why doesn't it work?

DGS is not a DNS server in the classic sense, we just use the
same delivery mechanism, since it is meant to be used in tandem
with a standard DNS client. DGS allows clients to verify that
an IP they have received for a service is actually correct, by
providing the netblock spaces that are owned by domains.
See: What is this for?

### Why do I need to use TCP?

DGS will make several queries on your behalf to determine
correct IPs for the services you query. As such, TCP is used
to discourage apmplification attacks being used against the service.

### What is this for?

When trying to figure out if the IP address you have been given
for a service is correct, there hasn't been a great baseline or
golden standard that can be used for that comparison. This attempts
to rectify that situation by providing the known scopes that services
use for their resolutions.
