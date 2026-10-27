# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Building exact legacy aliases

The reviewed legacy browse aliases include case-distinct paths such as
`/browse/tags/Psalm-88/` and `/browse/tags/psalm-88/`. Build on a case-sensitive
filesystem, as in the existing Linux Replit workspace. `npm run build` checks
this before generating output and stops on a case-insensitive filesystem so an
alias cannot overwrite its canonical page. On macOS, use a case-sensitive
checkout for builds; the ordinary checkout remains suitable for editing.

Aliases use the existing Static HTML mechanism: HTTP 200 with `noindex`, an
immediate meta refresh and a canonical target. They are not server 301s.

## Local regression and release checks

Run `npm test` for the search, catalog-count and real-Git sitemap-date regressions.
Before a candidate is considered for release, run `npm run check:release` in a
case-sensitive checkout. It runs the full regression suite followed by the
production build (including alias-filesystem and internal-path leak guards).
Neither command pushes, publishes or deploys. Inspect the generated sitemap
and rendered affected-page checks as part of review; a passing build alone does
not verify metadata suppression, responsive navigation or live publication.

The song-details block uses the existing catalog confidence/quarantine gates;
its earlier placement does not verify previously unsourced musical numbers.
