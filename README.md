# AI Group Tabs

[![Build](https://github.com/MichaelYuhe/ai-group-tabs/actions/workflows/build.yml/badge.svg)](https://github.com/MichaelYuhe/ai-group-tabs/actions/workflows/build.yml)

A Chrome extension helps you group your tabs with AI.

[Demo Video](https://twitter.com/i/status/1732560960936935555)

> The extension is still under development, feel free to open issues and pull requests. Any suggestions are welcome.
> 
> [![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/+99v98-XOQY0zZGNl)

## Roadmap

- [x] Group tabs with AI by default categrories
- [x] Fill OpenAI API key in popup and save in Chrome storage
- [x] Customize categories in popup
- [x] Group new tabs automatically
- [ ] Publish on Chrome store
- [ ] Better prompt engineering
- [ ] Logo and name
- [ ] CI / CD for build and release new version
- [ ] Add toast
- [x] Use Vite and pnpm
- [x] Group the updated tab only when a tab is updated

## Download and Start Using

Download the latest released `dist.zip` from [the release page](https://github.com/MichaelYuhe/ai-group-tabs/releases), unzip after download, you will get a folder named `dist`.

Open Chrome, go to `chrome://extensions/`, turn on `Developer mode` on the top right corner, click `Load unpacked` on the top left corner, select the `dist` folder you just unzipped.

- Fill in the OpenAI API key, add some types and click on the "Save" button.
- Click on the "Group Tabs" button, your current tabs will be grouped.
- Your new tab will be grouped automatically.

## Development

```bash
# Install dependencies
pnpm install

# Development
pnpm dev

# Build
pnpm build
```
