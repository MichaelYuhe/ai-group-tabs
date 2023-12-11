# AI Group Tabs

[![Build](https://github.com/MichaelYuhe/ai-group-tabs/actions/workflows/build.yml/badge.svg)](https://github.com/MichaelYuhe/ai-group-tabs/actions/workflows/build.yml)

A Chrome extension helps you group your tabs with AI.

> The extension is still under development, feel free to open issues and pull requests. Any suggestions are welcome.
>
> [![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/+99v98-XOQY0zZGNl)

Demo Video:

> [![Watch the video](https://img.youtube.com/vi/SjfKiXy3zOc/default.jpg)](https://youtu.be/SjfKiXy3zOc)

## Roadmap

- [x] Group tabs with AI by default categories
- [x] Fill OpenAI API key in popup and save in Chrome storage
- [x] Customize categories in popup
- [x] Group new tabs automatically
- [ ] Publish on Chrome store
- [x] Better prompt engineering
- [x] Logo and name
- [ ] CI / CD for build and release new version
- [ ] Add toast
- [x] Use Vite and pnpm
- [x] Group the updated tab only when a tab is updated
- [x] Custom model and API server
- [x] HMR for development

## Download and Start Using

Download the latest released `dist.zip` from [the release page](https://github.com/MichaelYuhe/ai-group-tabs/releases), unzip after download, you will get a folder named `dist`.

Open Chrome, go to `chrome://extensions/`, turn on `Developer mode` on the top right corner, click `Load unpacked` on the top left corner, select the `dist` folder you just unzipped.

> You can change the model and API server in the options page.

## Development

```bash
# Install dependencies
pnpm install

# Development
pnpm dev

# Build
pnpm build
```

## Sponsor

> Everyone contributor can get your one month free of Developer Plan on Zeabur.

[![Deployed on Zeabur](https://zeabur.com/deployed-on-zeabur-dark.svg)](https://zeabur.com?referralCode=MichaelYuhe&utm_source=ai-group-tab&utm_campaign=oss)
