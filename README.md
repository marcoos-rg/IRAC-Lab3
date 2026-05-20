# IRAC Practice 3 - Part 5: Optional DRM Tasks

## Overview

Part 5 covers two optional DRM exercises that extend the DASH streaming setup from previous parts. Both use `dash.js` as the client player and run inside the Docker container `rstiupm/irac_p3:2025`.

---

## Part 5.1 - Widevine / PlayReady DRM

### Description

A DASH player configured to consume a remotely hosted, commercially encrypted stream using Widevine and PlayReady DRM, with license acquisition via the Axinom license server.

### Files

| File | Description |
|---|---|
| `part51/index.html` | Main HTML page with the video player |
| `part51/script.js` | Player initialization and DRM protection configuration |
| `part51/styles.css` | Page styles |
| `part51/dash.all.min.js` | dash.js library |
| `part51/chart.min.js` | Chart.js library (available for metrics) |

### How it works

1. `dash.js` loads the remote protected DASH manifest (MPD)
2. The browser's CDM (Content Decryption Module) requests a DRM license
3. dash.js forwards the request to the Axinom license server, attaching the `X-AxDRM-Message` JWT token in the HTTP headers
4. The license server validates the token and returns the content key
5. The CDM decrypts the stream and playback begins

### DRM Systems

| System | Key System | Best browser |
|---|---|---|
| Widevine | `com.widevine.alpha` | Chrome, Edge |
| PlayReady | `com.microsoft.playready` | Edge on Windows |

### Configuration

Before running, edit `part51/script.js` and set:

- `manifestUrl` — URL of your protected DASH stream (`.mpd`)
- `axinomToken` — Valid `X-AxDRM-Message` JWT token from your Axinom tenant
- `widevineLicenseUrl` — Widevine license endpoint of your Axinom tenant
- `playreadyLicenseUrl` — PlayReady license endpoint of your Axinom tenant

### How to run

```bash
python3 -m http.server 8000 &
```

Access: http://localhost:8000/part51/index.html

---

## Part 5.2 - Dynamic DRM Key Management via REST API

### Description

A full DRM stack running locally: a Python REST license server that delivers ClearKey decryption keys only to authorized users. Unauthorized users receive a fake key and the video plays corrupted.

### Files

| File | Description |
|---|---|
| `part52/index.html` | DASH client with login form and dynamic license request |
| `part52/script.js` | License request logic and dash.js player initialization |
| `part52/styles.css` | Page styles |
| `part52/license_server.py` | REST API license server (port 8001) |
| `part52/output_drm/` | DASH segments and MPD encrypted with MPEG-CENC |

### How it works

1. User logs in with username and password in the browser
2. The client sends credentials to the license server via `POST /get-license`
3. The server checks if the user exists and is authorized:
   - **Authorized** → responds with the real ClearKey DRM keys → video plays correctly
   - **Not authorized** → responds with `403 Access Denied` → client uses a fake key → video is corrupted
4. `dash.js` initializes the player with the received keys and the local MPEG-CENC stream

### Users

| User | Password | Access |
|---|---|---|
| `user1` | `pass1` | Granted — receives real DRM key |
| `user2` | `pass2` | Denied — receives fake key, video corrupted |

### DRM Keys (MPEG-CENC ClearKey)

| Field | Hex | Base64 |
|---|---|---|
| KEY | `87237D20A19F58A740C05684E699B4AA` | `hyN9IKGfWKdAwFaE5pm0qg` |
| KID | `A16E402B9056E371F36D348AA62BB749` | `oW5AK5BW43HzbTSKpiu3SQ` |

### How to run

#### Requirements

- Docker container `rstiupm/irac_p3:2025` with ports 8000 and 8001 mapped

#### Start servers

```bash
python3 part52/license_server.py &
python3 -m http.server 8000 &
```

#### Access

- DRM License Player: http://localhost:8000/part52/index.html
- License Server API: http://localhost:8001/get-license

> **Note:** Always use `http://` (not `https://`). The built-in Python HTTP server does not support TLS, and browsers that auto-redirect to HTTPS will fail to connect.

### Regenerate encrypted video files

```bash
./x264 --output Low_config.264 --fps 24 --preset slow --bitrate 100 --vbv-maxrate 4800 --vbv-bufsize 9600 --min-keyint 48 --keyint 48 --scenecut 0 --no-scenecut --pass 1 --video-filter "resize:width=160,height=90" video_p3.mp4
./x264 --output Med_config.264 --fps 24 --preset slow --bitrate 600 --vbv-maxrate 4800 --vbv-bufsize 9600 --min-keyint 48 --keyint 48 --scenecut 0 --no-scenecut --pass 1 --video-filter "resize:width=640,height=360" video_p3.mp4
./x264 --output High_config.264 --fps 24 --preset slow --bitrate 2400 --vbv-maxrate 4800 --vbv-bufsize 9600 --min-keyint 48 --keyint 48 --scenecut 0 --no-scenecut --pass 1 --video-filter "resize:width=1280,height=720" video_p3.mp4
./gpac_public/bin/gcc/MP4Box -add Low_config.264 -fps 24 Low_config.mp4
./gpac_public/bin/gcc/MP4Box -add Med_config.264 -fps 24 Med_config.mp4
./gpac_public/bin/gcc/MP4Box -add High_config.264 -fps 24 High_config.mp4
./Bento4/bin/mp4fragment Low_config.mp4 Low_frag.mp4
./Bento4/bin/mp4fragment Med_config.mp4 Med_frag.mp4
./Bento4/bin/mp4fragment High_config.mp4 High_frag.mp4
./Bento4/bin/mp4encrypt --method MPEG-CENC --key 1:87237D20A19F58A740C05684E699B4AA:random --property 1:KID:A16E402B9056E371F36D348AA62BB749 --global-option mpeg-cenc.eme-pssh:true Low_frag.mp4 Low_enc.mp4
./Bento4/bin/mp4encrypt --method MPEG-CENC --key 1:87237D20A19F58A740C05684E699B4AA:random --property 1:KID:A16E402B9056E371F36D348AA62BB749 --global-option mpeg-cenc.eme-pssh:true Med_frag.mp4 Med_enc.mp4
./Bento4/bin/mp4encrypt --method MPEG-CENC --key 1:87237D20A19F58A740C05684E699B4AA:random --property 1:KID:A16E402B9056E371F36D348AA62BB749 --global-option mpeg-cenc.eme-pssh:true High_frag.mp4 High_enc.mp4
./Bento4/bin/mp4dash Low_enc.mp4 Med_enc.mp4 High_enc.mp4 --output part52/output_drm
```

---

## Comparison

| | Part 5.1 | Part 5.2 |
|---|---|---|
| DRM system | Widevine / PlayReady | ClearKey (MPEG-CENC) |
| License server | Axinom (external, commercial) | Custom Python server (local) |
| Stream | Remote (Axinom test vectors) | Local (`output_drm/`) |
| Access control | Token-based (JWT) | Username + password |
| Browser CDM required | Yes | No (ClearKey is handled in JS) |
