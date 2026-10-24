# Drive Video Player
Plays videos from a Google Drive folder in your phone browser. Runs entirely in the browser (GitHub Pages); no server, no secrets.

## Setup (one time, ~10 min)
1. Go to https://console.cloud.google.com → top bar project menu → **New Project** → name it → Create.
2. Menu → **APIs & Services → Library** → search **Google Drive API** → **Enable**.
3. **APIs & Services → OAuth consent screen** (Google Auth Platform): choose **External**, fill app name + your email, Save. Leave it in **Testing**. Under **Audience/Test users** → **Add users** → add your own Gmail.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID** → type **Web application**. Under **Authorized JavaScript origins** add `https://<your-github-username>.github.io` (no trailing slash/path). Create, copy the **Client ID**.
5. Open `config.js`, replace `PASTE_YOUR_CLIENT_ID...` with your Client ID. Commit.
6. GitHub repo → **Settings → Pages** → Deploy from branch `main` / root. Open `https://<user>.github.io/<repo>/`.

## Use
Paste a folder URL or ID → Load → sign in (Google warns "unverified app" in Testing: click Continue). Tap a video to play.

## Playback notes
- Plays by pointing the video at `files/{id}?alt=media&access_token=…`, so the browser streams with range requests (seeking works, low memory; works on iOS Safari & Android Chrome).
- If that fails, it falls back to downloading the whole file into memory (blob) — slow and may crash on very large files on phones.
- Tokens last ~1 hour; reload/sign in again if playback stops. Only formats the browser supports play (MP4/H.264 best; MKV/AVI often won't).
- Scope is full Drive (needed for rename). Testing-mode apps require re-consent periodically.
