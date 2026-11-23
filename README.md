# DML Learning Journey

[Open the documentation](https://xiaobo.github.io/dml-learning-journey/) · [中文文档](https://xiaobo.github.io/dml-learning-journey/docs.zh.html) · [Task examples](https://xiaobo.github.io/dml-learning-journey/examples--index.html)

## Repository layout

- `docs/`: the complete published website, including pages, styles, scripts, images, and downloadable examples.
- `README.md`: this repository guide.

GitHub Pages serves `main` → `/docs`. Moving the site here does not change any public page or download URL. The nested `docs/docs/` directory preserves the existing `/docs/` compatibility route.

## Updating the website

This repository contains generated public artifacts. Edit the maintained documentation sources and use the guarded release workflow with `repositoryPrefix: "docs"`. Keep the Pages source at `/docs`; do not publish website files into the repository root. The publisher preserves this README and checks the complete site tree before updating the branch without force.

Private compiler binaries, credentials, connection configurations, release logs, and private skill archives do not belong in this repository.
