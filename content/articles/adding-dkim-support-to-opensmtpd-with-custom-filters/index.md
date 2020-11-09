---
title: "Adding DKIM support to OpenSMTPD with custom filters"
date: 2020-11-09T12:45:53+01:00
description: "I implemented custom filters to add DKIM support to OpenSMTPD. For most part, it was really straightforward."
categories:
- opensmtpd
- email
- security
---

If you, like me, are running your own mail server, you might have looked at [OpenSMTPD](https://www.opensmtpd.org/). There are very compelling reasons for that, most important being the configuration simplicity. The following is a working base configuration handling both mail delivery on port 25 as well as mail submissions on port 587:

{{< highlight scheme >}}
pki default cert "/etc/mail/default.pem"
pki default key "/etc/mail/default.key"

table local_domains {"example.com", "example.org"}

listen on eth0 tls pki default
listen on eth0 port 587 tls-require pki default auth

action "local" maildir
action "outbound" relay

match from any for domain <local_domains> action "local"
match for local action "local"
match auth from any for any action "outbound"
match from local for any action "outbound"
{{< /highlight >}}

You might want to add virtual user lists, aliases, SRS support, but it really doesn’t get much more complicated than this. The best practices are all there: no authentication over unencrypted connections, no relaying of mails by unauthorized parties, all of that being very obvious in the configuration. Compare that to Postfix configuration with its multitude of complicated configuration files where I was very much afraid of making a configuration mistake and inadvertently turning my mail server into an open relay.

There is no DKIM support out of the box however, you have to add filters for that. The documentation suggests using `opensmtpd-filter-dkimsign` that most platforms don’t have prebuilt packages for. So you have to get the source code from some Dutch web server, presumably run by the OpenBSD developer Martijn van Duren. And what you get is a very simplistic DKIM signer, not even capable of supporting multiple domains.

The documentation suggests `opensmtpd-filter-rspamd` as an alternative which can indeed both sign and verify DKIM signatures. It relies on rspamd however, an anti-spam solution introducing a fair deal of complexity and clearly overdimensioned in my case.

So I went for writing custom filters. With [dkimpy](https://launchpad.net/dkimpy/) implementing all the necessary functionality in Python, how hard could it be?

{{< toc >}}

## Getting the code

You can see the complete code along with installation instructions [here](https://gist.github.com/palant/c6ad869a1dd2cd79506898e4e8401438). It consists of two filters: `dkimsign.py` should be applied to outgoing mail and will add a DKIM signature, `dkimverify.py` should be applied to incoming mail and will add an `Authentication-Results` header indicating whether DKIM and SPF checks were successful. SPF checks are optional and will only be performed if the `pyspf` module is installed. Both filters rely on the `opensmtpd.py` module providing a generic filter server implementation.

I have no time to maintain this code beyond what I need myself. This means in particular that I will not test it with any OpenSMTPD versions but the one I run myself (currently 6.6.4). So while it *should* work with OpenSMTPD 6.7.1, I haven’t actually tested it. Anybody willing to maintain this code is welcome to do so, and I will happily link to their repository.

## Why support DKIM?

The DKIM mechanism allows recipients to verify that the email was really sent from the domain listed in the From field, thus helping combat spam and phishing mails. The goals are similar to [Sender Policy Framework (SPF)](https://en.wikipedia.org/wiki/Sender_Policy_Framework), and it’s indeed recommended to use both mechanisms. A positive side-effect: implementing these mechanisms should reduce the likelihood of mails from your server being falsely categorized as spam.

DKIM stands for DomainKeys Identified Mail and relies on public-key cryptography. The domain owner generates a signing key and stores its public part in a special DNS entry for the domain. The private part of the key is then used to sign the body and a subset of headers for each email. The resulting signature is added as `DKIM-Signature:` header to the email before it is sent out. The receiving mail server can look up the DNS entry and validate the signature.

## The OpenSMTPD filter protocol

The protocol used by OpenSMTPD to communicate with its filters is described in the [smtpd-filters(7) man page](https://man7.org/linux/man-pages/man7/smtpd-filters.7.html). It is text-based and fairly straightforward: report events and filter requests come in on stdin, filter responses go out on stdout.

So my `FilterServer` class will read the initial messages from stdin (OpenSMTPD configuration) when it is created. Then the `register_handler()` method should be called any number of times, which sends out a registration request for a report event or a filter request. And the `serve_forever()` method will tell OpenSMTD that the filter is ready, read anything coming in on stdin and call the previously registered handlers.

So far very simple, if it weren’t for a tiny complication: when I tried this initially, mail delivery would hang up. Eventually I realized that OpenSMTD didn’t recognize the filter’s response, so it kept waiting for one. Debugging output wasn’t helpful, so it took me a while to figure this one out. A filter response is supposed to contain a session identifier and some opaque token for OpenSMTPD to match it to the correct request. According to documentation, session identifier goes first, but guess what: my slightly older OpenSMTPD version expects the token to go first.

The documentation doesn’t bother mentioning things that used to be different in previous versions of the protocol, a practice that OpenSMTPD developers will [hopefully reconsider](https://github.com/OpenSMTPD/OpenSMTPD/issues/1096). And OpenSMTPD doesn’t bother logging filter responses with what it considers an unknown session identifier, as there are apparently legitimate scenarios where a session is removed before the corresponding filter response comes in.

This isn’t the only case where OpenSMTPD flipped parameter order recently. The parameters of the `tx-mail` report event are listed as `message-id result address`, yet the order was `message-id address result` in previous versions apparently. Sadly, not having documentation for the protocol history makes it impossible to tell whether your filter will work correctly with any OpenSMTPD version but the one you tested it with.

## Making things more comfortable with session contexts

If one wants to look at the message body, the way to go is registering a handler for the `data-line` filter. This one will be called for every individual line however. So the handler would have to store previously received lines somewhere until it receives a single dot indicating the end of the message. Complication: this single dot might never come, e.g. if the other side disconnects without finishing the transfer. How does one avoid leaking memory in this case? The previously stored lines have to be removed somehow.

The answer is listening to the `link-disconnect` report event and clearing out any data associated with the session when it is received. And since all my handlers needed this logic, I added it to the `FilterServer` class implementation. Calling `track_context()` during registration phase will register `link-connect` and `link-disconnect` handlers, managing session context objects for all handlers. Instead of merely receiving a session identifier, the handlers will receive a context object that they can add more data to as needed.

## Allowing higher level message filters

This doesn’t change the fact that `data-line` filters will typically keep collecting lines until they have a complete message. So I added a `register_message_filter()` method to `FilterServer` that will encapsulate this logic. The handler registered here will always be called with a complete list of lines for the message. This method also makes sure that errors during processing won’t prevent the filter from generating a response, the message is rather properly rejected in this case.

Altogether this means that the DKIM signer now looks like this (logic slightly modified here for clarity):

{{< highlight python >}}
def sign(context, lines):
    message = email.message_from_string('\n'.join(lines))
    domain = extract_sender_domain(message)
    if domain in config:
        signature = dkim_sign(
            '\n'.join(lines).encode('utf-8'),
            config[domain]['selector'],
            domain,
            config[domain]['keydata']
        )
        add_signature(message, signature)
        lines = message.as_string().splitlines(False)
    return lines

server = FilterServer()
server.register_message_filter(sign)
server.serve_forever()
{{< /highlight >}}

The DKIM verifier is just as simple if you omit the SPF validation logic:

{{< highlight python >}}
def verify(context, lines):
    dkim_result = 'unknown'
    if 'dkim-signature' in message:
        if dkim_verify('\n'.join(lines).encode('utf-8')):
            dkim_result = 'pass'
        else:
            dkim_result = 'fail'

    message = email.message_from_string('\n'.join(lines))
    if 'authentication-results' in message:
        del message['authentication-results']
    message['Authentication-Results'] = 'localhost; dkim=' + dkim_result
    return message.as_string().splitlines(False)

server = FilterServer()
server.register_message_filter(verify)
server.serve_forever()
{{< /highlight >}}

## Drawbacks

This solution isn’t meant for high-volume servers. It has at least one significant issue: all processing happens sequentially. So while DKIM/SPF checks are being performed (25 seconds for DNS requests in the worst-case scenario) no other mails will be processed. This could be solved by running message filters on a separate thread, but the added complexity simply wasn’t worth the effort for my scenario.
