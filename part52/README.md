# IRAC Practice 3 - Part 5.2 Optional: Dynamic DRM Key Management via REST API

## Description
This is the implementation of the optional part 5.2 of Practice 3.
A REST API license server is implemented in Python that dynamically delivers DRM decryption keys only to authorized users.

## Files
- `index_p5.html` - DASH client with login and dynamic license request
- `license_server.py` - REST API license server (port 8001)
- `output_drm/` - DASH segments and MPD (MPEG-CENC encrypted)

## How it works
1. User logs in with username and password
2. Client sends credentials to the license server (port 8001)
3. If authorized, server returns the real ClearKey DRM keys
4. If not authorized, server returns access denied and client uses fake keys
5. Authorized user sees the video correctly, unauthorized user sees corrupted video

## Users
- user1 / pass1 -> access GRANTED (receives real DRM key)
- user2 / pass2 -> access DENIED (receives fake key, video corrupted)

## DRM Keys (MPEG-CENC ClearKey)
- KEY: 87237D20A19F58A740C05684E699B4AA -> hyN9IKGfWKdAwFaE5pm0qg (Base64)
- KID: A16E402B9056E371F36D348AA62BB749 -> oW5AK5BW43HzbTSKpiu3SQ (Base64)

## How to run

### Requirements
- Docker container rstiupm/irac_p3:2025
- Ports 8000 and 8001 mapped

### Start servers
```bash
python3 license_server.py &
python3 -m http.server 8000 &
```

### Access
- DRM License Player: http://localhost:8000/index_p5.html
- License Server API: http://localhost:8001/get-license

### Regenerate video files
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
./Bento4/bin/mp4dash Low_enc.mp4 Med_enc.mp4 High_enc.mp4 --output output_drm
```
