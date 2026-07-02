# FlowSense Devlog

## how it started

it started with a simple thought: *where does my day go?* sit down at 9am, suddenly 6pm, chrome for 4 hours. cool. very productive.

so I built FlowSense: a desktop app that watches what app youre in, finds patterns, and guides you through workflows. electron + react + typescript + tailwind on the frontend. fastapi + sqlite on the backend. recharts for charts. framer motion for animations.

## the stack

electron + react + typescript + tailwind + shadcn/ui. fastapi + sqlite + sqlalchemy. recharts, framer motion, lucide. multi-provider AI: gemini, openrouter, nvidia nim, deepseek.

## the monitoring

powershell calls `GetForegroundWindow` and `GetWindowThreadProcessId` from user32.dll. every 5 seconds it checks what app your in, logs the transition with duration. data flows desktop → fastapi → renderer in real time.

## the bugs (oh the bugs)

1. **`$pid` is reserved in powershell.** spent an hour on this. renamed to `$targetPid`. felt smart and dumb simultaneously.

2. **here-strings need `"@` at column zero.** our js template literal was indenting it. powershell silently read the whole thing as one big string.

3. **the ⌘ keys.** shortcuts showed mac symbols on a windows machine. had to do a byte-level search-and-replace because the edit tool couldnt match the unicode glyph.

4. **fake sine wave data.** hourly chart used `Math.sin()`. youd stare thinking "my activity drops after 5pm" — ITS A SINE WAVE. always drops after 5pm.

5. **uvicorn `--reload` ghosts.** new routes imported fine. running server? 404. `--reload` was caching old module state. killed everything, started fresh. `--reload` more like `--refuse-to-reload`.

6. **gemini 429.** AI naming rate limited on every call. added fallback naming from step names. less poetic, more honest.

7. **embeddable python `._pth` overrides PYTHONPATH.** spent a day debugging why `import app` failed. the `._pth` file silently rewrote the path. now we delete it at runtime.

8. **pydantic-settings doesnt populate `os.environ`.** API key was in `.env`, settings object had it, but `os.environ.get("GEMINI_API_KEY")` returned None. added a fallback chain through settings fields.

9. **`uv venv` fails on MS Store python.** `failed to copy file... could not be encrypted (os error 6000)`. found real python at `AppData\Local\Programs\Python\Python313` and used that.

10. **NSIS only has 4 page hooks.** tried `customInstallPage`, `customLeave` — none exist. only `customWelcomePage`, `licensePage`, `customPageAfterChangeDir`, `customFinishPage`. rewrote the installer prompt to use `customWelcomePage`.

11. **`!endmacro` vs `!macroend`.** NSIS parser requires `!macroend`. `!endmacro` gives "unterminated macro". one character, two hours.

12. **`Workflow is not defined`.** used the lucide `Workflow` icon in JSX but only imported it as a type. page crashed. added to the import line.

## what it does now (v1.0.0)

- **activity tracking** — detects every app switch, logs durations, real data only
- **workflow detection** — finds repeat patterns in your app usage
- **multi-provider AI naming** — gemini, openrouter, nvidia nim, or deepseek
- **rate-limit + key-invalid toasts** — clear in-app notification instead of silent fallback
- **model picker in installer** — pick provider + model before the app launches
- **bundled python runtime** — embeddable python 3.13 with all deps ships in the installer. no user setup.
- **custom flow shortcuts** — assign a keyboard combo to any saved flow. press it anywhere, flow starts.
- **flow mode** — guided step by step. floating overlay. progress bar. auto-advances on app switch.
- **dark + light mode** — full palettes from stitch (granola dark + ethereal glass). toggle in settings or topbar.
- **analytics** — hourly trends, app usage, daily breakdowns. all real data.
- **search** — full-text across your activity log.
- **chrome extension** — tracks browser URLs (opt-in).

## the feeling

when flow mode works — you hit start, switch apps, the checkmark appears, the progress bar fills — tiny dopamine hit. the app went from "creepy observer" to "helpful coach". still rough around the edges but its *alive*.

built using claude code cli for code completion and stitch for UI design. all logic, architecture, and shipping decisions were mine. the tools helped me move fast and look good doing it.

\- Subham
p.s. v1.0.0 is out. go install it. break it. tell me what broke.