# aethos-spaces
Zen Spaces Client for AethOS apps

## Installation


Not currently available as a true npm package, so do the following to install it locally on your machine.

```
git clone https://github.com/aethosio/aethos-spaces.git
cd aethos-spaces
npm install
gulp build
npm link # may require sudo
```

Once this is done, in a project that requires aethos-spaces you can install the package using a symlink using:

```
npm link aethos-spaces
```

The advantage of this is that we can continue developing this library until it's production ready (Grunt - and I'm too lazy to publish it; see #1)

