# sphere

Sneknet's 2019 backend for /r/Sequence

probably not useful for anything else, but it's here for archival purposes  
feel free to look thru the spaghetti js

## running

again no idea why you'd want to but ok

setting up postgres:

```bash
createuser -P sphere
createdb sphere
psql sphere < migrate.sql
```

```bash
npm i
cp config.hjson.example config.hjson
$EDITOR config.hjson
node index.js

# server runs on ::4003
```
