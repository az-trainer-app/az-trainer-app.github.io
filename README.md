# az-trainer-app.github.io

The website for [AZ Trainer](https://github.com/az-trainer-app/az_trainer), served at https://az-trainer-app.github.io.

`index.html` is the home page; `games/<id>/` is a page per supported game, listing
that game's real options and shortcuts. Screenshots and game art load from the
`az_trainer` repository, so a new trainer only needs its files there.

## Adding a game

From an `az_trainer` checkout beside this one, export what the configs declare,
then rebuild the pages:

```bash
cargo run --bin cfgcheck -- --json configs/games > ../az-trainer-app.github.io/games.json
cd ../az-trainer-app.github.io
node build.mjs          # games/<id>/, the home page's list, sitemap.xml
```

A new game also needs a line in `build.mjs`'s `META` (its release date, which
orders the site, and the height of its screenshot) and, for the home carousel,
an entry in the `GAMES` array in `index.html`.
