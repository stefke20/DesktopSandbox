# Pixel Terrarium

A living 2D pixel sandbox that runs on your desktop. Leave it alone and the world
goes about its day: ants forage for leaves and dig out their colony, sharks cruise
the reef hunting fish, deer graze, foxes chase rabbits, fireflies come out at
dusk and it rains, snows or storms on its own. Or take over and **play god**.

![icon](assets/icon.png)

## Running it

```bash
npm install
npm start          # desktop app (Electron)
```

No build step is needed. The simulation itself is plain HTML + JavaScript, so you
can also open `src/index.html` directly in a browser, or run `npm run web` and visit
http://localhost:8080.

To build installers (Windows `.exe`, macOS `.dmg`, Linux `.AppImage`):

```bash
npm run dist
```

## Desktop modes

Switch modes from **⚙️ Settings → Desktop** or the tray icon:

| Mode | What it does |
| --- | --- |
| **Window** | A normal resizable window. |
| **Desktop strip** | A borderless band docked along the bottom of your screen (20–50% high). |
| **Full-screen wallpaper** | Fills the screen. On Linux and macOS it sits behind your other windows like a live wallpaper. |

**Watch only (click-through):** clicks pass straight through to whatever is
underneath, so the terrarium can run while you work. Press **Ctrl+Alt+G**
(⌘+Alt+G on macOS) or click the tray icon to play god again. The tray menu also
switches biome, weather and time, pauses the simulation, and can start the app
with your computer.

## Biomes

| | Biome | Life |
| --- | --- | --- |
| 🌾 | Grasslands | rabbits, foxes, bison, deer, songbirds, butterflies, owls, fireflies |
| 🏜️ | Desert | camels, lizards, scorpions, snakes, vultures, tumbleweeds, oasis palms |
| 🏞️ | Lake | fish, bass, ducks, frogs, herons, dragonflies, turtles, reeds, lily pads |
| 🌊 | Open sea | fish schools, clownfish, tuna, sharks, whales, dolphins, jellyfish, octopus, crabs, coral |
| 🏖️ | Beach | crabs, seagulls, turtles, dolphins, beach-goers, palms |
| 🌲 | Taiga | moose, wolves, bears, deer, squirrels, owls |
| ❄️ | Snowy hills | snow hares, arctic foxes, reindeer, snowy owls, ptarmigans, a frozen pond |
| 🏔️ | Mountains | mountain goats, eagles, marmots; snowline that depends on altitude |
| 🐧 | Arctic | polar bears, penguins, seals, orcas, cod, ice floes, aurora at night |
| 🦜 | Rainforest | monkeys climbing trees, parrots, toucans, jaguars, poison dart frogs, capybaras |
| 🏡 | Suburbs | people, dogs chasing cats and squirrels, pigeons, cars; windows and street lamps light up at night |
| ☢️ | Ruined city | rats, cockroaches, crows, survivors, zombies that infect survivors, toxic sludge, burning barrels |
| 🦖 | Prehistoric | brontosaurus, triceratops, raptors, T-rex, pterodactyls, giant dragonflies, an erupting volcano |
| 🐜 | Inside an ant hill | a cross-section of a colony: the queen lays eggs, workers cut leaves and bring them home to grow a fungus garden, diggers carry soil up to build the mound; spiders, ladybugs, aphids and earthworms |

## How the world works

- **Cells:** every pixel is a material (sand, water, lava, fire, snow, wood,
  leaves and so on) with falling-sand physics. Water flows and evaporates, lava
  turns water into stone and steam, fire spreads through wood and leaves, snow
  and ice melt or freeze with the temperature, and seeds grow into plants that
  suit the biome.
- **Plants:** grass spreads, trees regrow leaves, and leaves fall as litter.
- **Creatures** walk, climb, fly, swim, float, burrow or roll. They get hungry,
  graze or hunt, flee from predators, sleep at night (or in the day, if
  nocturnal), breed when well fed, and die of old age. Animals wander in from the
  edges when a population runs low, so the world keeps going indefinitely.
- **Day and night:** the sun, moon and stars move; temperature follows the time of
  day; lights come on at night. The day can last 3 minutes to an hour, be
  frozen, or follow your real clock.
- **Weather** changes on its own, depending on the biome: clear, cloudy, rain,
  thunderstorms (lightning sets trees on fire and fuses sand into glass), snow,
  sandstorms that move dunes, ash fall, and fog.

## Playing god

Move the mouse to show the dock at the bottom of the screen. It hides itself
again when you stop.

- ✋ **Hand:** pick up a creature and throw it. Hover over a creature to see what it is doing.
- 🖌️ **Paint:** 24 elements, including water, lava, fire, oil, toxic sludge, seeds, ice, glass, lava vents and eternal flames. Right-drag erases.
- 🐾 **Life:** create any of 80+ creatures anywhere, even a T-rex in the suburbs.
- ⚡ **Powers:** lightning, meteor, explosion, earthquake, smite, bless (offspring), grow plants, scatter food, heat wave, ice age, found an ant colony.
- 🌦️ **Weather:** force any weather or set it back to automatic, and control the wind.
- 🕑 **Time:** jump to sunrise, noon, sunset or midnight, scrub the clock, set the day length, pause, or run at 2× or 4× speed.
- ⚙️ **Settings:** pixel size, frame rate, info overlays, idle biome cycling, desktop mode.

**Keys:** `H` hide controls · `Space` pause · `B` / `Shift+B` next/previous biome ·
`N` day/night · `R` rain · `I` population stats · `[` `]` brush size · `Esc` hand tool.

## Project layout

```
main.js, preload.js     Electron shell: window modes, tray, click-through, shortcut
src/index.html          page shell
src/js/util.js          maths, RNG, noise, colours
src/js/materials.js     cell materials and their properties
src/js/world.js         the cell grid: simulation + pixel rendering
src/js/flora.js         plant structures (trees, cacti, coral, ...)
src/js/species.js       creature pixel art and behaviour parameters
src/js/creatures.js     creature AI and the ecosystem
src/js/ants.js          ant colonies
src/js/weather.js       clouds, precipitation, lightning
src/js/background.js    sky, sun/moon/stars, parallax scenery, aurora
src/js/biomes.js        biome definitions and terrain generators
src/js/god.js           god-mode tools and UI panels
src/js/app.js           main loop, lighting, settings, desktop bridge
```

To add a biome, add an entry to `src/js/biomes.js` with its sky, weather,
plants, fauna and a `gen()` function. To add a creature, add a `def()` to
`src/js/species.js` with some pixel art.
