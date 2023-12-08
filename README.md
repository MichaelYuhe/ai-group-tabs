# AI Group Tabs

[![Build](https://github.com/MichaelYuhe/ai-group-tabs/actions/workflows/build.yml/badge.svg)](https://github.com/MichaelYuhe/ai-group-tabs/actions/workflows/build.yml)

Group your tabs with AI.

[Demo Video](https://twitter.com/i/status/1732560960936935555)

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
- [x] Group the updated tab only when a tab is updated

## Download and Start Using

Download the latest released `dist.zip` from [the release page](https://github.com/MichaelYuhe/ai-group-tabs/releases), unzip after download, you will get a folder named `dist`. 

Open Chrome, go to `chrome://extensions/`, turn on `Developer mode` on the top right corner, click `Load unpacked` on the top left corner, select the `dist` folder you just unzipped.

## Development

```bash
# Install dependencies
yarn
```

Add your OpenAI API key in `popup.tsx`

```bash
# Development
yarn watch
```

```bash
# Build
yarn build
```

## Contribution

Feel free to open issues and pull requests. Any suggestions are welcome.
