---
title: "A look at a P2P camera (LookCam app)"
date: 2025-09-08T13:00:50Z
description: "I’ve got my hands on an internet-connected camera and decided to take a closer look, having already read about security issues with similar cameras. What I found far exceeded my expectations: fake access controls, bogus protocol encryption, completely unprotected cloud uploads and firmware riddled with security flaws. One could even say that these cameras are Murphy’s Law turned solid: everything that could be done wrong has been done wrong here."
categories:
- security
- IoT
---

I’ve got my hands on an internet-connected camera and decided to take a closer look, having already read about security issues with similar cameras. What I found far exceeded my expectations: fake access controls, bogus protocol encryption, completely unprotected cloud uploads and firmware riddled with security flaws. One could even say that these cameras are Murphy’s Law turned solid: everything that could be done wrong has been done wrong here. While there is considerable prior research on these and similar cameras that outlines some of the flaws, I felt that the combination of severe flaws is reason enough to publish an article of my own.

My findings should apply to any camera that can be managed via the LookCam app. This includes cameras meant to be used with less popular apps of the same developer: tcam, CloudWayCam, VDP, AIBoxcam, IP System. Note that the LookCamPro app, while visually very similar, is technically quite different. It also uses the PPPP protocol for low-level communication but otherwise doesn’t seem to be related, and the corresponding devices are unlikely to suffer from the same flaws.

{{< img src="devices.jpg" width="600" alt="A graphic with the LookCam logo in the middle. Around it are arranged five devices with the respective camera locations marked: a radio clock, a power outlet, a light switch, a USB charger, a bulb socket." />}}

There seems to be little chance that things will improve with these cameras. I have no way of contacting either the hardware vendors or the developers behind the LookCam app. In fact, it looks like masking their identity was done on purpose here. But even if I could contact them, the cameras lack an update mechanism for their firmware. So fixing the devices already sold is impossible.

I have no way of knowing how many of these cameras exist. The LookCam app is currently listed with almost 1.5 million downloads on Google Play however. An iPhone and a Windows version of the app are also available but no public statistics exist here.

{{< toc >}}

## The highlights

The camera cannot be easily isolated from unauthorized access. It can either function as a WiFi access point, but setting a WiFi password isn’t possible. Or it can connect to an existing network, and then it will insist on being connected to the internet. If internet access is removed the camera will go into a reboot loop. So you have the choice of letting anybody in the vicinity access this camera or allowing it to be accessed from the internet.

The communication of this camera is largely unencrypted. The underlying PPPP protocol supports “encryption” which is better described as obfuscation, but the LookCam app almost never makes use of it. Not that it would be of much help, the proprietary encryption algorithms being developed without any understanding of cryptography. These rely on static encryption keys which are trivially extracted from the app but should be easy enough to deduce even from merely observing some traffic.

The camera firmware is riddled with buffer overflow issues which should be trivial to turn into arbitrary code execution. Protection mechanisms like DEP or ASLR might have been a hurdle but these are disabled. And while the app allows you to set an access password, the firmware doesn’t really enforce it. So access without knowing the password can be accomplished simply by modifying the app to skip the password checks.

The only thing preventing complete compromise of any camera is the “secret” device ID which has to be known in order to establish a connection. And by “secret” I mean that device IDs can generally be enumerated but they are “secured” with a five letter verification code. Unlike with some similar cameras, the algorithm used to generate the verification code isn’t public knowledge yet. So somebody wishing to compromise as many cameras as possible would need to either guess the algorithm or guess the verification codes by trying out all possible combinations. I suspect that both approaches are viable.

And while the devices themselves have access passwords which a future firmware version could in theory start verifying, the corresponding cloud service has no authentication beyond knowledge of the device ID. So any recordings uploaded to the cloud are accessible even if the device itself isn’t. Even if the camera owner hasn’t paid for the cloud service, anyone could book it for them if they know the device ID. The cloud configuration is managed by the server, so making the camera upload its recordings doesn’t require device access.

## The hardware

Most cameras connecting to the LookCam app are being marketed as “spy cam” or “nanny cam.” These are made to look like radio clocks, USB chargers, bulb sockets, smoke detectors, even wall outlets. Most of the time their pretended functionality really works. In addition they have an almost invisible pinhole camera that can create remarkably good recordings. I’ve seen prices ranging from US$40 to hundreds of dollars.

The marketing spin says that these cameras are meant to detect when your house is being robbed. Or maybe they allow you to observe your baby while it is in the next room. Of course, in reality people are far more inventive in their use of tiny cameras. Students [discovered them for cheating in exams](https://theconversation.com/students-are-using-smart-spy-technology-to-cheat-in-exams-59241). Gamblers use them to [get an advantage at card games](https://www.wired.com/story/miniature-camera-poker-cheating/). And then there is of course the matter of non-consentual video recordings. So next time you stay somewhere where you don’t quite trust the host you might want to search for “LookCam” on YouTube, just to get an idea of how to recognize such devices.

The camera I had was based on the [Anyka AK39Ev330 hardware platform](http://anyka.net/en/productInfo.aspx?id=123), essentially an ARM CPU with an attached pinhole camera. Presumably, other cameras connecting to the LookCam app are similar, even though there are some provisions for hardware differences in the firmware. The device looked very convincing, its main giveaway being unexpected heat development.

All LookCam cameras I’ve seen were strictly noname devices, it is unclear who builds them. Given the variety of competing form factors I suspect that a number of hardware vendors are involved. Maybe there is one vendor producing the raw camera kit and several others who package it within the respective casings.

## The LookCam app

The LookCam app can manage a number of cameras. Some people demonstrating the app on YouTube had around 50 of them, though I suspect that these are camera sellers and not regular users.

{{< img src="screenshot.png" width="240" alt="App screenshot, a screen titled “My Device.” It lists a number of cameras with stills on the left side. The cameras are titled something like G000001NRLXW. At the bottom of the screen are the options Video (selected), Photo, Files and More.">}}
LookCam app as seen in the example screenshot
{{< /img >}}

While each camera can be given a custom name, its unique ID is always visible as well. For example, the first camera listed in the screenshot above has the ID GHBB-000001-NRLXW which the apps shortens into G000001NRLXW. Here GHBB is the device prefix: LookCam supports a number of these but only BHCC, FHBB and GHBB seem to exist in reality (abbreviated as B, F and G respectively). 000001 is the device number, each prefix can theoretically support a million devices. The final part is a five-letter verification code: NRLXW. This one has to be known for the device connection to succeed, it makes enumerating device IDs more difficult.

Out of the box, the device is in access point mode: it provides a WiFi access point with the device ID used as wireless network name. You can connect to that access point, and LookCam will be able to find the camera via a network broadcast, allowing you to configure it. You might be inclined to leave the camera in access point mode but it is impossible to set a WiFi password. This means that anybody in the vicinity can connect to this WiFi network and access the camera through it. So there is no way around configuring the camera to connect to your network.

Once the camera is connected to your network the P2P “magic” happens. LookCam app can still find the camera via a network broadcast. But it can also establish a connection when you are not on the same network. In other words: the camera can be accessed from the internet, assuming that someone knows its device ID.

Exposing the camera to internet-based attacks might not be something that you want, with it being in principle perfectly capable of writing its recordings to an SD card. But if you deny it access to the internet (e.g. via a firewall rule) the camera will try to contact its server, fail, panic and reboot. It will keep rebooting until it receives a response from the server.

One thing to note is also: the device ID is displayed in pretty much every screen of this app. So when users share screenshots or videos of the app (which they do often) they will inevitably expose the ID of their camera, allowing anyone in the world to connect to it. I’ve seen very few cases of people censoring the device ID, clearly most of them aren’t aware that it is sensitive information. The LookCam app definitely isn’t communicating that it is.

## The PPPP protocol

### The basics

How can LookCam establish a connection to the camera having only its device ID? The app uses the PPPP protocol developed by the Chinese company CS2 Network. Supposedly, in 2019 CS2 Network had 300 customers with 20 million devices in total. This company supplies its customers with a code library and the corresponding server code which the customers can run as a black box. The idea of the protocol is providing an equivalent of the TCP protocol which implicitly locates a device by its ID and connects to it.

{{< img src="slide_tcp_p2p.png" width="475" alt="Screenshot of a presentation slide divided in two with TCP on the left and P2P on the right. Left side shows the calls to establish a TCP connection and write data, right side equivalent function calls with PPC_ prefix" >}}
Slide from a CS2 Network sales pitch
{{< /img >}}

*Side note*: Whoever designed this protocol didn’t really understand TCP. For example, they tried to replicate the fault tolerance of TCP. But instead of making retransmissions an underlying protocol feature there are dozens of different (not duplicated but really different) retransmission loops throughout the library. Where TCP tries to detect network congestions and back off the PPPP protocol will send even more retransmitted messages, rendering suboptimal connections completely unusable.

Despite being marketed as Peer-to-Peer (P2P) this protocol relies on centralized servers. Each device prefix is associated with a set of three servers, this being the protocol designers’ idea of high-availability infrastructure. Devices regularly send messages to all three servers, making sure that these are aware of the device’s IP address. When the LookCam app (client) wants to connect to a device, it also contacts all three servers to get the device’s IP address.

{{< img src="slide_high_availability.png" width="362" alt="Screenshot of a presentation slide titled “High Availability Architecture.” The text says: Redundant P2P Servers, Flexible and Expandable Relay Servers" >}}
Slide from a CS2 Network sales pitch
{{< /img >}}

The P2P part is the fact that device and client try to establish a direct connection instead of relaying all communication via a central server. The complicating factor here are firewalls which usually disallow direct connections. The developers didn’t like established approaches like [Universal Plug and Play (UPnP)](https://en.wikipedia.org/wiki/Universal_Plug_and_Play), probably because these are often disabled for security reasons. So they used a trick called [UDP hole punching](https://en.wikipedia.org/wiki/UDP_hole_punching). This involves guessing which port the firewall assigned to outgoing UDP traffic and then communicating with that port, so that the firewall considers incoming packets a response to previously sent UDP packets and allows them through.

Does that always work? That’s doubtful. So the PPPP protocol allows for relay servers to be used as fallback, forwarding traffic from and to the device. But this direct communication presumably succeeds often enough to keep the traffic on PPPP servers low, saving costs.

The FHBB and GHBB device prefixes are handled by the same set of servers, named the “mykj” network in the LookCam app internally. Same string appears in the name of the main class as well, indicating that it likely refers to the company developing the app. This seems to be a short form of “Meiyuan Keji,” a company name that translates as “Dollar Technology.” I couldn’t find any further information on this company however.

The BHCC device prefix is handled by a different set of servers that the app calls the “hekai” network. The corresponding devices appear to be marketed in China only.

### The “encryption”

With potentially very sensitive data being transmitted one would hope that the data is safely encrypted in transit. The TCP protocol outsources this task to additional layers like TLS. The PPPP protocol on the other hand has built-in “encryption,” in fact even two different encryption mechanisms.

First there is the blanket encryption of all transmitted messages. The corresponding function is aptly named `P2P_Proprietary_Encrypt` and it is in fact a very proprietary encryption algorithm. To my untrained eye there are a few issues with it:

* It is optional, with many networks choosing not to use it (like all networks supported by LookCam).
* When present, the encryption key is part of the “init string” which is hardcoded in the app. It is trivial to extract from the application, even a file viewer will do if you know what to look for.
* Even if the encryption key weren’t easily extracted, it is mashed into four bytes which become the effective key. So there are merely four billion possible keys.
* Even if it weren’t possible to just go through all possible encryption keys, the algorithm can be trivially attacked via a [known-plaintext attack](https://en.wikipedia.org/wiki/Known-plaintext_attack). It’s sometimes even possible to deduce the effective key by passively observing a single four bytes `MSG_HELLO` message (it is known that the first four bytes message sent to port 32100 has the plaintext `F1 00 00 00`).

In addition to that, some messages get special treatment. For example, the `MSG_REPORT_SESSION_READY` message is generally encrypted via `P2P_Proprietary_Encrypt` function with a key that is hardcoded in the CS2 library and has the same value in every app I checked.

Some messages employ a different encryption method. In case of the networks supported by LookCam it is only the `MSG_DEV_LGN_CRC` message (device registering with the server) that is used instead of the plaintext `MSG_DEV_LGN` message. As this message is sent by the device, the corresponding encryption key is only present in the device firmware, not in the application. I didn’t bother checking whether the server would still accept the unencrypted `MSG_DEV_LGN` message.

The encryption function responsible here is `PPPP_CRCEnc`. No, this isn’t a cyclic redundancy check (CRC). It’s rather an encryption function that will extend the plaintext by a four bytes padding. The decryptor will validate the padding, presumably that’s the reason for the name.

Of course, this still doesn’t make it an authenticated encryption scheme, yet the [padding oracle attack](https://en.wikipedia.org/wiki/Padding_oracle_attack) is really the least of its worries. While there is a complicated selection approach, it effectively results in a sequence of bytes that the plaintext is XOR’ed with. *Same* sequence for every single message being encrypted in this way. Wikipedia has the following to say on the [security of XOR ciphers](https://en.wikipedia.org/wiki/XOR_cipher#Use_and_security):

> By itself, using a constant repeating key, a simple XOR cipher can trivially be broken using frequency analysis. If the content of any message can be guessed or otherwise known then the key can be revealed.

Well, yes. That’s what we have here.

It’s doubtful that any of these encryption algorithms can deter even a barely determined attacker. But a blanket encryption with `P2P_Proprietary_Encrypt` (which LookCam doesn’t enable) would have three effects:

1. Network traffic is obfuscated, making the contents of transmitted messages not immediately obvious.
2. Vulnerable devices cannot be discovered on the local network using the [script developed by Paul Marrapese](https://github.com/pmarrapese/iot/tree/master/p2p/lansearch). This script relies on devices responding to an unencrypted search request.
3. P2P servers can no longer be discovered easily and won’t show up on Shodan for example. This discovery method relies on servers responding to an unencrypted `MSG_HELLO` message.

### The threat model

It is obvious that the designers of the PPPP protocol don’t understand cryptography, yet for some reason they don’t want to use established solutions either. It cannot even be about performance because AES is supported in hardware on these devices. But why for example this strange choice of encrypting a particular message while keeping the encryption of highly private data optional? Turns out, this is due to the threat model used by the PPPP protocol designers.

{{< img src="slide_fake_devices.png" width="380" alt="Screenshot of a presentation slide containing yellow text: Malicious hacker can make thousands of Fake Device by writing a software program (As you know, the cost may be less than 1 USD), however. It then continues with red text: It may cause thousands pcs of your product to malfunction, thus cost hundred thousands." >}}
Slide from a CS2 Network sales pitch
{{< /img >}}

As a CS2 Network presentation deck shows, their threat model isn’t concerned about data leaks. The concern is rather denial-of-service attacks caused by registering fake devices. And that’s why this one message enjoys additional encryption. Not that I really understand the concern here, since the supposed hacker would still have to generate valid device IDs somehow. And if they can do that – well, them bringing the server down should really be the least concern.

But wait, there is another security layer here!

{{< img src="slide_init_string.png" width="383" alt="Screenshot of a presentation slide titled “Encrypted P2P Server IP String.” The text says: The encrypted string is given to platform owner only. Without correct string, Fake Device can’t use P2P API to reach P2P Server. The API require encrypt P2P Server IP String, but not raw IP String." >}}
Slide from a CS2 Network sales pitch
{{< /img >}}

This is about the “init string” already mentioned in the context of encryption keys above. It also contains the IP addresses of the servers, mildly obfuscated. While these were “given to platform owner only,” these are necessarily contained in the LookCam app:

{{< img src="initstrings.png" width="607" alt="Screenshot of a source code listing with four fields g_hekai_init_string, g_mykj_init_string, g_ppcs_init_string, g_rtos_init_string. All four values are strings consisting of upper-case letters." />}}

Some other apps contain dozens of such init strings, allowing them to deal with many different networks. So the threat model of the PPPP protocol cannot imagine someone extracting the “encrypted P2P server IP string” from the app. It cannot imagine someone reverse engineering the (trivial) obfuscation used here. And it definitely cannot imagine someone reverse engineering the protocol, so that they can communicate with the servers via “raw IP string” instead of their obfuscated one. *Note*: The latter has happened on several documented occasions already, e.g. [here](https://www.elastic.co/security-labs/storm-on-the-horizon#building-a-p2p-client).

These underlying assumptions become even more obvious on this slide:

{{< img src="slide_spying.png" width="412" alt="Screenshot of a presentation slide titled “Worry about security?” The text says: Super Device can not spy any data it Relayed (No API for this)" >}}
Slide from a CS2 Network sales pitch
{{< /img >}}

Yes, the only imaginable way to read out network data is via the API of their library. With a threat model like this, it isn’t surprising that the protocol makes all the wrong choices security-wise.

## The firmware

Once a connection is etablished the LookCam app and the camera will exchange JSON-encoded messages like the following:

```json
{
  "cmd": "LoginDev",
  "pwd": "123456"
}
```

A [paper from the Warwick University](https://www.dcs.warwick.ac.uk/~fenghao/files/hidden_camera.pdf) already took a closer look at the firmware and discovered something surprising. The LookCam app will send a `LoginDev` command like above to check whether the correct access password is being used for the device. But sending this command is entirely optional, and the firmware will happily accept other commands without a “login”!

The LookCam app will also send the access password along with every other command yet this password isn’t checked by the firmware either. I tried adding a trivial modification to the LookCam app which made it ignore the result of the `LoginDev` command. And this in fact bypassed the authentication completely, allowing me to access my camera despite a wrong password.

I could also confirm their finding that the `DownloadFile` command will read arbitrary files, allowing me to extract the firmware of my camera with the approach described in the paper. They even describe a trivial Remote Code Execution vulnerability which I also found in my firmware: that firmware often relies on running shell commands for tasks that could be easily done in its C language code.

This clearly isn’t the only Remote Code Execution vulnerability however. Here is some fairly typical code for this firmware:

```c
char[256] buf;
char *cmd = cJSON_GetObjectItem(request, "cmd")->valuestring;
memset(buf, 0, sizeof(buf));
memcpy(buf, cmd, strlen(cmd));
```

This code copies a string (pointlessly but this isn’t the issue here). It completely fails to consider the size of the target buffer, going by the size of the incoming data instead. So any command larger than 255 bytes will cause a [buffer overflow](https://en.wikipedia.org/wiki/Buffer_overflow). And there is no stack canary here, Data Execution Prevention (DEP) and Address Space Layout Randomization (ASLR) are disabled, so nothing prevents this buffer overflow from being turned into Remote Code Execution.

Finally, I’ve discovered that the `searchWiFiList` command will produce the list of WiFi networks visible to the camera. These by itself often already allow a good guess as to where the camera is located. In combination with a [geolocation service](https://developers.google.com/maps/documentation/geolocation/overview) these will typically narrow down the camera’s position to a radius of only a few dozen meters.

The only complication here: most geolocation services require not the network names but the MAC addresses of the access points. The MAC addresses aren’t part of the response data however. But: `searchWiFiList` works by running `iwlist` shell command and storing the complete output in `/tmp/wifi_scan.txt` file. It reads this file but does not remove it. This means that the file can subsequently be downloaded via `DownloadFile` command (allows reading arbitrary files as mentioned above) and that one contains full data including MAC addresses of all access points. So somebody who happened to learn the device ID can not only access the video stream but also find out where exactly this footage is being recorded.

The camera I’ve been looking at is running firmware version 2023-11-22. Is there a newer version, maybe one that fixes the password checks or the already published Remote Code Execution vulnerability? I have no idea. If the firmware for these cameras is available somewhere online then I cannot find it. I’ve also been looking for some kind of update functionality in these devices. But there is only a generic script from the Anyka SDK which isn’t usable for anyone other than maybe the hardware vendor.

## The cloud

When looking at the firmware I noticed some code uploading 5 MiB data chunks to `api.l040z.com` (or `apicn.l040z.com` if you happen to own a `BHCC` device). Now uploading *exactly* 5 MiB is weird (this size is hardcoded) but inspecting the LookCam app confirmed it: this is cloud functionality, and the firmware regularly uploads videos in this way. At least it does that when cloud functionality is enabled.

First thing worth noting: while the cloud server uses regular HTTP rather than some exotic protocol, all connections to it are generally unencrypted. The firmware simply lacks a TLS library it could use, and so the server doesn’t bother with supporting TLS. Meaning for example: if you happen to use their cloud functionality your ISP better be very trustworthy because it can see all the data your camera sends to the LookCam cloud. In fact, your ISP could even run its own “cloud server” and the camera will happily send your recorded videos to it.

Anyone dare a guess what the app developers mean by “financial-grade encryption scheme” here?

{{< img src="cloud.png" width="385" alt="Screenshot containing two text section. The section above it titled “Safe storage” and reads: The video data is stored in the cloud, even if the device is offline or lost. Can also view previous recordings. The section below is titled “Privacy double encryption” and reads: Using financial-grade encryption scheme, data is transmitted from data to Transfer data from transfer data from transfer." >}}
Screenshot from the LookCam app
{{< /img >}}

Second interesting finding: the cloud server has no authentication whatsoever. The camera only needs to know its device ID when uploading to the cloud. And the LookCam app – well, any cloud-related requests here also require device ID only. If somebody happens to learn your device ID they will gain full access to your cloud storage.

Now you might think that you can simply skip paying for the cloud service which, depending on the package you book, can come for as much as $40 per month. But this doesn’t mean that you are on the safe side because you aren’t the one controlling the cloud functionality on your device, the cloud server is. Every time the device boots up it sends a request to `http://api.l040z.com/camera/signurl` and the response tells it whether cloud functionality needs to be enabled.

So if LookCam developers decide that they want to see what your camera is doing (or if Chinese authorities become interested in that), they can always adjust that server response and the camera will start uploading video snapshots. You won’t even notice anything because the LookCam app checks cloud configuration by requesting `http://api.l040z.com/app/cloudConfig` which can remain unchanged.

And they aren’t the only ones who can enable the cloud functionality of your device. Anybody who happens to know your device ID can buy a cloud package for it. This way they can get access to your video recordings without ever accessing your device directly. And you will only notice the cloud functionality being active if you happen to go to the corresponding tab in the LookCam app.

## How safe are device IDs?

Now that you are aware of device IDs being highly sensitive data, you certainly won’t upload screenshots containing them to social media. Does that mean that your camera is safe because nobody other than you knows its ID?

The short answer is: you don’t know that. First of all, you simply don’t know who already has your device ID. Did the shop that sold you the camera write the ID down? Did they maybe record a sales pitch featuring your camera before they sold it to you? Did somebody notice your camera’s device ID show up in the list of WiFi networks when it was running in access point mode? Did anybody coming to your home run a [script to discover PPPP devices on the network](https://github.com/pmarrapese/iot/tree/master/p2p/lansearch)? Yes, all of that might seem unlikely, yet it should be reason enough to wonder whether your camera’s recordings are really as private as they should be.

Then there is the issue of unencrypted data transfers. Whenever you connect to your camera from outside your home network the LookCam app will send all data unencrypted – including the device ID. Do you do that when connected to public WiFi? At work? In a vacation home? You don’t know who else is listening.

And finally there is the matter of verification codes which are the only mechanism preventing somebody from enumerating all device IDs. How difficult would it be to guess a verification code? Verification codes seem to use 22 letters (all Latin uppercase letters but A, I, O, Q). With five letters this means around 5 million possible combinations. According to Paul Marrapese [PPPP servers don’t implement rate limiting](https://media.defcon.org/DEF%20CON%2028/DEF%20CON%20Safe%20Mode%20presentations/DEF%20CON%20Safe%20Mode%20-%20Paul%20Marrapese%20-%20Abusing%20P2P%20to%20Hack%203%20Million%20Cameras%20Ain%27t%20Nobody%20Got%20Time%20for%20NAT.pdf) (page 33), making trying out all these combinations perfectly realistic – maybe not for all possible device IDs but definitely for some.

But that resource-intensive approach is only necessary as long as the algorithm used to generate verification codes is a secret. Yet we have to assume that at least CS2 Network’s 300 customers have access to that algorithm, given that their server software somehow validates device IDs. Are they all trustworthy? How much would it cost to become a “customer” simply in order to learn that algorithm?

And even if we are willing to assume that CS2 Network runs proper background checks to ensure that their algorithm remains a secret: how difficult would it be to guess that algorithm? I found a number of device IDs online, and my primitive analysis of their verification codes indicates that these aren’t distributed equally. There is a noticeable affinity for certain prime numbers, so the algorithm behind them is likely a similar hack job as the other CS2 Network algorithms, throwing in mathematical operations and table lookups semi-randomly to make things look complicated. How long would this approach hold if somebody with actual cryptanalysis knowledge decided to figure this out?

## Recommendations

So if you happen to own one of these cameras, what does all this mean to you? Even if you never disclosed the camera’s device ID yourself, you cannot rely on it staying a secret. And this means that whatever your camera is recording is no longer private.

Are you using it as a security camera? Your security camera might now inform potential thieves of the stuff that you have standing around and the times when you leave home. It will also let them know where exactly you live.

Are you using it to keep an eye on your child? Just… don’t. Even if you think that you yourself have a right to violate your child’s privacy, you really don’t want anybody else to watch.

And even if you “have nothing to hide”: somebody could compromise the camera in order to hack other devices on your network or to simply make it part of a botnet. Such things [happened before](https://www.bleepingcomputer.com/news/security/hackers-target-critical-zero-day-vulnerability-in-ptz-cameras/), many times actually.

So the best solution is to dispose of this camera ASAP. Don’t sell it please because this only moves the problem to the next person. The main question is: how do you know that the camera you get instead will do better? I can only think of one indicator: if you want to access the camera from outside your network it should involve explicit setup steps, likely changing router configuration. The camera shouldn’t just expose itself to the internet automatically.

But if you actually paid hundreds of dollars for that camera and dumping it isn’t an option: running it in a safe manner is complicated. As I mentioned already, simply blocking internet access for the camera won’t work. This can be worked around but it’s complex enough to be not worth doing. You should be better off by installing a [custom firmware](https://github.com/Nemobi/Anyka/). I haven’t tried it but at least this one looks like somebody actually thought about security.

## Further reading

As far as I am aware, the first research on the PPPP protocol was [published by Paul Marrapese in 2019](https://hacked.camera/). He found a number of vulnerabilities, including one brand of cameras shipping their algorithm to generate verification codes with their client application. Knowing this algorithm, device IDs could be enumerated easily. Paul used this flaw to display the locations of millions of affected devices. His DEF CON talk is linked from the website and well worth watching.

A [paper from the Warwick University (2023)](https://www.dcs.warwick.ac.uk/~fenghao/files/hidden_camera.pdf) researched LookCam app specifically. In additions to some vulnerabilities I mentioned here it contains a number of details on how these cameras operate.

This [Elastic Labs article (2024)](https://www.elastic.co/security-labs/storm-on-the-horizon) took a close look at some other PPPP-based cameras, finding a number of issues.

The [CS2 Network sales presentation (2016)](https://prezi.com/5cztk-98izyc/cs2-network-p2p/) offers a fascinating look into the thinking of PPPP protocol designers and into how their system was meant to work.
