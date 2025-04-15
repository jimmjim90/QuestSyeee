# Sacred OS - Quest Terminal

## Overview

Sacred OS - Quest Terminal is a browser-based quest verification system designed for a conceptual spiritual evolution game. It simulates a terminal interface where players receive quests related to mystical awakening and personal growth, complete them in real life, and submit proof for simulated verification. The system emphasizes reflection and authentic engagement, incorporating cooldowns and delayed follow-ups.

The project runs entirely client-side using HTML, CSS, and vanilla JavaScript, storing all player progress locally within the browser's `localStorage`.

## Theme

The application adopts a "tech-mystic" or "cyberpunk shrine" aesthetic, featuring:
* A dark color palette (black, violet, crimson)
* Gradient accents and subtle glow effects
* A monospaced, terminal-like font (`Share Tech Mono`)
* UI elements styled to resemble a sacred operating system interface

## Features

* **Quest Viewer:** Displays the currently available quest, including its title, description, objective, and required proof type.
* **Quest Lifecycle:** Players can initiate quests, which reveals the proof submission interface.
* **Proof Submission:** Supports submitting different types of proof (currently implemented):
    * **Text:** For journal entries, reflections, or descriptions.
    * **Image:** Includes a file input (selection is checked, but content isn't processed).
    * **Audio/Video (Simulated):** Uses a text input for describing simulated A/V proof.
* **Simulated Verification:**
    * Analyzes text submissions based on minimum length and the presence of relevant emotional or thematic keywords.
    * Simulates verification for image/AV proof based on input presence.
* **Cooldown System:** Prevents spamming by enforcing a 24-hour cooldown period after a quest is successfully verified before it (or the next one, depending on configuration) becomes available.
* **Delayed Reflection:** Prompts the user with a reflective question via a modal popup 12 hours after a quest is verified, requiring text input to fully "seal" the quest's insights.
* **Witness Verification (Mocked):** Includes an optional feature to enter a "witness code," simulating a request to another user to vouch for completion. A successful mock verification can influence the main verification outcome.
* **Local Storage Persistence:** All quest progress, completion times, cooldowns, reflection status, and user stats are saved in the browser's `localStorage`.
* **User Stats:** Displays basic statistics like "Verified Quests" and "Fragments Unlocked".
* **Responsive Design:** Basic responsiveness for usability on different screen sizes.

## Technology Stack

* **HTML:** Structures the application content.
* **CSS:** Styles the application, implements the theme, animations, and layout. Uses CSS variables for easy theming.
* **JavaScript (Vanilla):** Handles all application logic, including:
    * Quest loading and management
    * DOM manipulation and UI updates
    * Event handling (button clicks, form submissions)
    * Proof verification simulation
    * Cooldown and reflection timing
    * Interaction with `localStorage`
* **Google Fonts:** Uses the 'Share Tech Mono' font.

## Setup & Usage

1.  **Download:** Clone this repository or download the project files (`index.html`, `style.css`, `script.js`).
2.  **Place Files:** Ensure all three files are in the same directory.
3.  **Open:** Open the `index.html` file in a modern web browser (like Chrome, Firefox, Edge, Safari).

The application will initialize, load any saved progress from `localStorage`, and display the first available quest or a cooldown message.

## How It Works

* **Quest Data:** A predefined array of quest objects is stored within `script.js`.
* **State Management:** The application manages its state (current quest, cooldowns, completed quests, stats) using JavaScript variables and persists this state to `localStorage`.
* **Quest Availability:** On load and after actions, the script checks `localStorage` for completed quests and active cooldowns to determine which quest (if any) to display.
* **Verification Logic:** The `simulateVerification` function in `script.js` contains the rules for checking submitted proof against quest requirements (text length, keywords, file input presence).
* **Timers:** `Date.now()` and stored timestamps in `localStorage` are used to manage cooldowns and reflection prompt delays. `setInterval` is used for updating timer displays and periodically checking for due reflections.

## Project Files

* `index.html`: The main HTML structure of the application.
* `style.css`: Contains all the CSS rules for styling and layout.
* `script.js`: Holds all the JavaScript logic for interactivity and state management.

## Future Ideas

* Integrate actual image analysis (requires server-side or more complex client-side libraries).
* Implement real audio/video recording or upload (requires server-side).
* Connect to a backend database instead of `localStorage` for persistent storage across devices/browsers.
* Expand the quest library and complexity.
* Develop the "spiritual skill unlock" system based on stats.
* Refine the witness verification into a functional peer-to-peer system (complex).

## License

Consider adding a license file (e.g., MIT License) to define how others can use your code.
