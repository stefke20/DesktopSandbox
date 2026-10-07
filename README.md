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
| 🦒 | Savanna | lions, zebras, giraffes, elephants, rhinos, cheetahs, hyenas, wildebeest, meerkats, ostriches; acacias and baobabs around a waterhole |
| 🐊 | Swamp | alligators, herons, egrets, frogs, toads, salamanders, fireflies, mosquitoes; cypress, mangrove, cattails, lily pads |
| 🐠 | Coral reef | clownfish, angelfish, tangs, parrotfish, lionfish, pufferfish, seahorses, moray eels, rays, turtles among coral and anemones |
| 🍁 | Autumn forest | maples, oaks and birches dropping leaves; deer, elk, boar, hedgehogs, badgers, turkeys, woodpeckers, toadstools |
| 🐼 | Bamboo forest | giant and red pandas, a koi pond, cherry blossoms |
| 🦣 | Ice age tundra | woolly mammoths, sabertooth cats, musk oxen, wolves, aurora |
| 🪷 | Garden pond | koi, goldfish, tadpoles, frogs, newts, water striders, lily pads |
| 🏞️ | River & waterfall | a waterfall pouring off a cliff into a flowing river; salmon leap, otters, beavers, grizzlies |
| 🦑 | Deep sea | sunlight fades into the abyss, where glowing anglerfish, lanternfish and vampire squid live; hydrothermal vents, tube worms, giant squid, sperm whales, marine snow |
| 🐝 | Inside a beehive | a cross-section of a hive hanging from an oak: workers fly out to flowers and fill the comb with honey, and the queen lays brood that hatches into new bees |
| 🌱 | Backyard lawn | a bug's-eye view (think *Grounded*): grass blades like trees, giant dandelions and clover, a soda can, and huge ants, spiders, ladybugs, weevils and mantises |
| 🦩 | Wetlands | cranes, spoonbills, ibises, coots, geese, muskrats among reeds and pools |
| 🪨 | Mesa canyons | red-rock plateaus with striped cliffs; cougars, bighorn sheep, javelinas, Gila monsters |
| 🌴 | Oasis | a palm-ringed lake in the dunes with camels, gazelles, flamingos |
| 🧚 | Enchanted forest | fairies, pixies, unicorns, elves, gnomes, an ent, a kitsune, giant toadstools |

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
  thunderstorms (lightning sets trees on fire and fuses sand into glass), dry
  lightning (strikes with no rain to put the fires out), windy days that strip
  leaves and blow snow and sand around, snow, sandstorms that move dunes, ash
  fall, and fog.
- **Biodiversity:** 375 species across mammals, birds, fish and sea life,
  reptiles and amphibians, insects, prehistoric animals, people and machines,
  and fantasy & mythology. There are about 40 kinds of plant, including oak, birch, maple, cherry,
  willow, baobab, acacia, bamboo, kelp, sunflowers, tall grass and berry bushes.

## Playing god

Move the mouse to show the dock at the bottom of the screen. It hides itself
again when you stop.

**Looking around:** the world is bigger than your screen. Move the mouse
to any screen edge to scroll in that direction; there is extra room mostly
to the left and right, and a little above and below. A minimap shows where
you are. Edge scrolling can be turned off in ⚙️ Settings.

**Zoom:** mouse wheel (or `+` / `-`, or the dock buttons) zooms up to 8×
around the cursor. Drag empty space or use `WASD` / arrow keys to pan, and `0`
resets. Double-click a creature with the hand to follow it around.

- ✋ **Hand:** pick up a creature and throw it. Hover over a creature to see what it is doing.
- 🖌️ **Paint:** 24 elements, including water, lava, fire, oil, toxic sludge, seeds, ice, glass, lava vents and eternal flames. Right-drag erases.
- 🐾 **Life:** create any of the 375 creatures anywhere, even a T-rex in the suburbs. Browse by category or search.
- 🐉 **Fantasy & myth** (a category in the Life panel): 54 creatures, many with special abilities:
  - **Dragons** breathe fire, **wyverns** spit poison, and the **phoenix** is reborn from its ashes.
  - **Medusa** and the **basilisk** turn creatures into stone statues, and **trolls** turn to stone in sunlight.
  - **Vampires** burn in daylight and turn their victims. **Ghosts** drift through walls at night.
  - **Zeus** and the **Thunderbird** call down lightning, and **Poseidon** raises the water.
  - The **witch** turns animals into frogs, **wizards** cast random spells, **Cupid** makes animals fall in love, and the **siren** lures creatures.
  - **Fairies** and **unicorns** leave flowers (unicorns also a rainbow trail), and **ents** plant trees.
  - **Dwarves** dig mines, the **kraken** sinks boats, cutting a **hydra** or **slime** makes two, and **knights** hunt monsters.
  - Also robots, werewolves, orcs, goblins, ogres, cyclopes, titans, Talos, centaurs, minotaurs, pegasi, griffins, harpies, Cerberus, the chimera, the sphinx, satyrs, mermaids, sea serpents, Nessie and more.
- ⛰️ **Landscape:** raise, dig or flatten the ground (with soil, stone, sand, snow or mud), drop a mountain, lake or island with a click, and plant any of the ~40 plant types. Paint springs and drains to make rivers.
- ⚡ **Powers:** lightning, meteor, explosion, earthquake, smite, bless (offspring), grow plants, scatter food, heat wave, ice age, found an ant colony.
- 🌋 **Special events:**
  - **Volcano eruption:** builds a cone, then throws lava bombs and ash.
  - **Alien abduction:** a UFO beams creatures up, leaves a crop circle and sometimes drops off some aliens.
  - **Tornado:** tears up soil, plants and animals along its path.
  - **Black hole:** swallows terrain and creatures, then collapses in a flash.
  - **Radiation storm:** mutant, glowing creatures.
  - **Hurricane:** extreme wind, shredded trees and a storm surge.
  - **Solar flare:** daytime aurora, heat, wildfires, and electronics stop working.
  - **Drought:** water dries up, grass turns yellow, trees drop their leaves.
  - **Monsoon:** downpours, floods and lush regrowth.

  You place the volcano, abduction, tornado and black hole with a click; the others start straight away.
- 🌦️ **Weather:** force any weather or set it back to automatic, and control the wind.
- 🕑 **Time:** jump to sunrise, noon, sunset or midnight, scrub the clock, set the day length, pause, or run at 2× or 4× speed.
- ⚙️ **Settings:** pixel size, frame rate, info overlays, idle biome cycling, desktop mode.

**Keys:** `H` hide controls · `Space` pause · `B` / `Shift+B` next/previous biome ·
`N` day/night · `R` rain · `I` population stats · `[` `]` or `Shift`+wheel brush size ·
`+` `-` `0` zoom · `WASD` / arrows pan · `F` stop following · `Esc` hand tool.

## Project layout

```
main.js, preload.js     Electron shell: window modes, tray, click-through, shortcut
src/index.html          page shell
src/js/util.js          maths, RNG, noise, colours
src/js/materials.js     cell materials and their properties
src/js/world.js         the cell grid: simulation + pixel rendering
src/js/flora.js         plant structures (trees, cacti, coral, ...)
src/js/species.js       creature pixel art and behaviour parameters
src/js/species-more.js  sprite generators (quadrupeds, birds, fish) and most species
src/js/species-world.js humanoid sprite generator, deep-sea/hive/lawn species
src/js/fantasy.js       fantasy & mythical creatures and their magic
src/js/hive.js          beehive colonies
src/js/creatures.js     creature AI and the ecosystem
src/js/ants.js          ant colonies
src/js/weather.js       clouds, precipitation, lightning
src/js/background.js    sky, sun/moon/stars, parallax scenery, aurora
src/js/terrain.js       landscaping tools (raise/lower/flatten, mountains, lakes)
src/js/events.js        special events (volcano, tornado, black hole, ...)
src/js/biomes.js        biome definitions and terrain generators
src/js/biomes-more.js   pond, river, deep sea, beehive, lawn, wetlands, mesa, oasis, enchanted forest
src/js/god.js           god-mode tools and UI panels
src/js/app.js           main loop, lighting, settings, desktop bridge
```

To add a biome, add an entry to `src/js/biomes.js` with its sky, weather,
plants, fauna and a `gen()` function. To add a creature, add a `D()` to
`src/js/species-more.js`, either with hand-drawn pixel art or with the
`quad()` / `bird()` / `gbird()` / `fish()` sprite generators.
