# Installing Pixel Terrarium

This guide walks you through getting Pixel Terrarium onto your computer as a
normal desktop app, step by step. No programming knowledge needed. It takes
about 10 minutes, most of it waiting for downloads.

There are two ways to do it:

- **Option A: build your own installer** (recommended). You end up with a real
  app in your Start menu, Applications folder or app launcher.
- **Option B: just run it** without installing. This is quicker and handy for
  trying it out, but you start it from a terminal each time.

Both start the same way: install Node.js and download the game.

---

## Step 1: Install Node.js (one time only)

Node.js is a free tool the game uses to build and run itself.

1. Go to **https://nodejs.org**.
2. Download the version marked **LTS** (the recommended one).
3. Open the file you downloaded and click through the installer, keeping all
   the default options.

**Linux:** you can also install it from your package manager, for example
`sudo apt install nodejs npm` on Ubuntu or Debian. Make sure the version is
18 or newer: run `node --version` to check.

## Step 2: Download the game

1. Open the project page on GitHub: **https://github.com/stefke20/DesktopSandbox**
2. If you need a specific version, use the branch dropdown (top left, it says
   `main` or similar) to pick the branch that has it.
3. Click the green **Code** button, then **Download ZIP**.
4. Find the ZIP in your Downloads folder and unzip it:
   - **Windows:** right-click it and choose **Extract All…**
   - **Mac:** double-click it.
   - **Linux:** right-click it and choose **Extract Here**.
5. Move the unzipped folder somewhere easy to find, like your Documents folder.

## Step 3: Open a terminal in the game folder

A terminal is a window where you type commands. You only need to type a couple.

- **Windows:** open the game folder in File Explorer. Click the address bar at
  the top, type `cmd`, and press **Enter**. A black window opens, already in the
  right folder.
- **Mac:** open **Terminal** (press ⌘ Space and type "Terminal"). Type `cd `
  (with a space after it), drag the game folder into the Terminal window, and
  press **Return**.
- **Linux:** right-click inside the game folder and choose **Open in Terminal**.

## Step 4: Download what the game needs

In the terminal, type this and press Enter:

```
npm install
```

This downloads the parts the game is built from (around 200 MB). It can take a
few minutes. Warnings in yellow are normal. Wait until you can type again.

---

## Option A: Build your own installer (recommended)

In the same terminal, type:

```
npm run dist
```

After a few minutes, a new folder called **`dist`** appears inside the game
folder. Your installer is in there:

| Your computer | File in `dist` | How to install |
| --- | --- | --- |
| **Windows** | `Pixel Terrarium Setup 0.1.0.exe` | Double-click it. The game installs and gets a Start menu and desktop shortcut. |
| **Mac** | `Pixel Terrarium-0.1.0.dmg` (on newer Macs: `…-arm64.dmg`) | Double-click it, then drag **Pixel Terrarium** into **Applications**. |
| **Linux** | `Pixel Terrarium-0.1.0.AppImage` | Right-click → **Properties** → **Permissions** → tick **Allow executing file as program**. Then double-click it. |

The installer only works on the kind of computer you built it on. Build on a
Mac to get a Mac app, on Windows to get a Windows app, and so on. You can copy
the installer to other computers of the same kind; they don't need Node.js.

### "Windows protected your PC" or "can't be opened" warnings

Your computer shows a warning because this home-made app isn't signed by a
registered developer. That's expected for apps you build yourself.

- **Windows:** click **More info**, then **Run anyway**.
- **Mac:** don't double-click it. Right-click (or Control-click) the app in
  Applications, choose **Open**, then **Open** again. If that doesn't appear,
  go to **System Settings → Privacy & Security**, scroll down, and click
  **Open Anyway**. You only need to do this once.

---

## Option B: Just run it

In the terminal, type:

```
npm start
```

The game opens in a window. To play again later, open a terminal in the game
folder (Step 3) and type `npm start` again. Closing the terminal closes the
game.

**Even quicker, no install at all:** open the `src` folder and double-click
`index.html`. The game runs in your web browser. The desktop extras (wallpaper
mode, tray icon, click-through) only work in the desktop app.

---

## First launch

- The game opens on the **main menu**. Pick **Sandbox**, **World** or **Colony**.
- Move your mouse to see the controls at the bottom. They hide again when you
  stop.
- To make it a live wallpaper or a strip along the bottom of your screen, open
  **⚙️ Settings → Desktop**, or right-click the tray icon (near the clock).
- **Ctrl+Alt+G** (⌘+Alt+G on Mac) switches between "watch only", where clicks
  go through to your other windows, and "play god".
- In the tray menu you can also make it **start with your computer**.

## Updating to a new version

1. Download the new ZIP (Step 2) and unzip it.
2. Run `npm install`, then `npm run dist` again.
3. Install the new installer over the old one.

Your settings are kept.

## Uninstalling

- **Windows:** Settings → Apps → **Pixel Terrarium** → Uninstall.
- **Mac:** drag **Pixel Terrarium** from Applications to the Bin.
- **Linux:** delete the `.AppImage` file.

You can also delete the game folder you downloaded.

## Something went wrong?

| Problem | Fix |
| --- | --- |
| `'npm' is not recognized` or `command not found: npm` | Node.js isn't installed, or the terminal was open while you installed it. Close the terminal, open a new one, and try again. If it still fails, reinstall Node.js (Step 1). |
| `npm install` fails with network errors | Check your internet connection and run it again. It picks up where it left off. |
| `npm run dist` fails on a Mac with a signing error | Run `CSC_IDENTITY_AUTO_DISCOVERY=false npm run dist` instead. |
| The window is black or the game is slow | Open **⚙️ Settings** and raise the **pixel size**, or lower the frame rate. |
| You can't click anything in the game | It's in "watch only" mode. Press **Ctrl+Alt+G** (⌘+Alt+G on Mac) or click the tray icon. |
| The Linux AppImage won't start | Install FUSE: `sudo apt install libfuse2` (Ubuntu 22.04+: `libfuse2t64`). |
