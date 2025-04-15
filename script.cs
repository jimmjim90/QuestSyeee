// script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const questViewer = document.getElementById('quest-viewer');
    const questContent = document.getElementById('quest-content');
    const questTitle = document.getElementById('quest-title');
    const questDescription = document.getElementById('quest-description');
    const questObjective = document.getElementById('quest-objective');
    const questProofType = document.getElementById('quest-proof-type');
    const beginQuestBtn = document.getElementById('begin-quest-btn');
    const cooldownMessage = document.getElementById('cooldown-message');
    const cooldownTimerDisplay = document.getElementById('cooldown-timer');
    const noQuestsMessage = document.getElementById('no-quests-message');

    const proofSubmission = document.getElementById('proof-submission');
    const proofForm = document.getElementById('proof-form');
    const currentQuestIdInput = document.getElementById('current-quest-id');
    const textProofGroup = document.getElementById('text-proof-group');
    const textProofInput = document.getElementById('text-proof');
    const imageProofGroup = document.getElementById('image-proof-group');
    const imageProofInput = document.getElementById('image-proof');
    const avProofGroup = document.getElementById('audio-video-proof-group');
    const avProofInput = document.getElementById('av-proof');
    const submitProofBtn = document.getElementById('submit-proof-btn');
    const cancelQuestBtn = document.getElementById('cancel-quest-btn');

    const witnessVerificationSection = document.getElementById('witness-verification');
    const witnessCodeInput = document.getElementById('witness-code');
    const requestWitnessBtn = document.getElementById('request-witness-btn');
    const witnessStatus = document.getElementById('witness-status');

    const reflectionModal = document.getElementById('reflection-modal');
    const reflectionForm = document.getElementById('reflection-form');
    const reflectionQuestTitle = document.getElementById('reflection-quest-title');
    const reflectionQuestIdInput = document.getElementById('reflection-quest-id');
    const reflectionTextInput = document.getElementById('reflection-text');

    const userStatsVerified = document.getElementById('verified-quests-count');
    const userStatsFragments = document.getElementById('fragments-unlocked-count');
    const messageArea = document.getElementById('message-area');

    // --- Constants ---
    const QUEST_COOLDOWN_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const REFLECTION_DELAY = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
    //const REFLECTION_DELAY = 30 * 1000; // 30 seconds for testing
    const TEXT_PROOF_MIN_LENGTH = 150;
    const EMOTIONAL_KEYWORDS = ["afraid", "grateful", "angry", "free", "release", "breakthrough", "realization", "clarity", "fear", "joy", "peace", "connected", "struggle", "overcome", "insight", "let go"];

    // --- Game Data ---
    // In a real app, this might be fetched from a server or a larger local file
    const ALL_QUESTS = [
        { id: "meditate01", title: "Still the Mind's Echo", description: "Find a quiet space, free from external distractions. Focus solely on your breath for 15 uninterrupted minutes.", objective: "Achieve 15 minutes of focused meditation.", proofType: "text", keywords: ["peace", "calm", "focus", "breath", "quiet", "present", "mindful"] },
        { id: "sigil01", title: "Manifest Intent", description: "Design and draw a personal sigil representing a core desire or intention for growth. Infuse it with purpose.", objective: "Create and photograph your sigil.", proofType: "image", keywords: ["intention", "desire", "symbol", "create", "focus", "manifest"] },
        { id: "fear01", title: "Confront the Shadow", description: "Identify one small fear that holds you back. Take one concrete step today to face it, no matter how minor.", objective: "Describe the fear and the action taken.", proofType: "text", keywords: ["fear", "afraid", "confront", "step", "action", "overcome", "challenge", "release", "brave"] },
        { id: "gratitude01", title: "Acknowledge Abundance", description: "Record three specific things you are genuinely grateful for today, explaining *why* they matter.", objective: "Write a short gratitude journal entry.", proofType: "text", keywords: ["grateful", "thankful", "appreciate", "blessing", "joy", "abundance", "positive"] },
        { id: "nature01", title: "Connect to Gaia", description: "Spend 20 minutes outdoors, consciously observing the natural world. Listen, watch, feel.", objective: "Describe your sensory experience and any insights.", proofType: "text", keywords: ["nature", "observe", "connect", "earth", "listen", "feel", "grounded", "peace"] },
        // Add more quests here
    ];

    // --- State Variables ---
    let currentQuest = null;
    let activeQuestStartTime = null; // Timestamp when 'Begin Quest' was clicked
    let witnessRequested = false;
    let witnessVerified = false; // Flag for witness verification status
    let cooldownInterval = null; // Interval ID for cooldown timer

    // --- Local Storage Functions ---
    const getLocalStorage = (key, defaultValue) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    };

    const setLocalStorage = (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    };

    // --- Initialization ---
    const initializeSystem = () => {
        console.log("Initializing Sacred OS...");
        loadUserStats();
        checkForDueReflections(); // Check reflections first
        loadNextQuest();
        setupEventListeners();
        console.log("System Nominal.");
    };

    // --- Event Listeners Setup ---
    const setupEventListeners = () => {
        beginQuestBtn.addEventListener('click', handleBeginQuest);
        proofForm.addEventListener('submit', handleProofSubmit);
        cancelQuestBtn.addEventListener('click', handleCancelQuest);
        requestWitnessBtn.addEventListener('click', handleRequestWitness);
        reflectionForm.addEventListener('submit', handleReflectionSubmit);
        // Listener for modal close button is inline HTML for simplicity here
    };

    // --- Quest Management ---
    const loadNextQuest = () => {
        console.log("Scanning for next available quest...");
        clearMessage();
        hideProofSubmission(); // Ensure proof form is hidden initially
        hideCooldownMessage(); // Hide cooldown message initially
        hideNoQuestsMessage(); // Hide "no quests" message

        const completedQuests = getLocalStorage('completedQuests', {}); // { questId: { completionTime, reflectionDue, reflectionCompleted } }
        const questCooldowns = getLocalStorage('questCooldowns', {}); // { questId: cooldownEndTime }
        const now = Date.now();

        let availableQuests = ALL_QUESTS.filter(quest => {
            const isCompleted = completedQuests[quest.id];
            const cooldownEndTime = questCooldowns[quest.id];
            const isOnCooldown = cooldownEndTime && now < cooldownEndTime;
            // Quest is available if not completed OR if completed but cooldown has passed
            // (This logic might need refinement based on whether quests are repeatable)
            // For now, let's assume quests are NOT repeatable once fully completed (including reflection)
            const fullyCompleted = isCompleted && completedQuests[quest.id].reflectionCompleted;

            // Filter logic: Not fully completed AND not currently on cooldown
            return !fullyCompleted && !isOnCooldown;
        });

        console.log(`Found ${availableQuests.length} potential quests.`);

        if (availableQuests.length > 0) {
            // Simple selection: pick the first available one
            currentQuest = availableQuests[0];
            displayQuest(currentQuest);
        } else {
            // Check if any quests are on cooldown
            const activeCooldowns = Object.entries(questCooldowns).filter(([id, endTime]) => now < endTime);

            if (activeCooldowns.length > 0) {
                 // Find the soonest ending cooldown
                const soonestCooldown = activeCooldowns.reduce((soonest, [id, endTime]) => {
                    return endTime < soonest.endTime ? { id, endTime } : soonest;
                }, { id: null, endTime: Infinity });

                displayCooldownMessage(soonestCooldown.endTime);

            } else {
                 displayNoQuestsMessage(); // No available quests and no active cooldowns
                 currentQuest = null;
            }
        }
    };

    const displayQuest = (quest) => {
        questTitle.textContent = quest.title;
        questDescription.textContent = quest.description;
        questObjective.textContent = quest.objective;
        questProofType.textContent = quest.proofType.charAt(0).toUpperCase() + quest.proofType.slice(1); // Capitalize first letter
        currentQuestIdInput.value = quest.id; // Set hidden input for form submission

        // Reset and show quest content area
        questContent.style.display = 'block';
        beginQuestBtn.disabled = false;
        beginQuestBtn.textContent = 'Initiate Quest';
        hideProofSubmission();
        hideCooldownMessage();
        hideNoQuestsMessage();
        console.log(`Displaying Quest: ${quest.title}`);
    };

     const displayCooldownMessage = (cooldownEndTime) => {
        questContent.style.display = 'none'; // Hide normal quest content
        proofSubmission.style.display = 'none'; // Hide proof submission
        noQuestsMessage.style.display = 'none'; // Hide no quests message
        cooldownMessage.style.display = 'block';

        // Clear existing interval if any
        if (cooldownInterval) {
            clearInterval(cooldownInterval);
        }

        const updateTimer = () => {
            const now = Date.now();
            const timeLeft = cooldownEndTime - now;

            if (timeLeft <= 0) {
                cooldownTimerDisplay.textContent = "00:00:00";
                clearInterval(cooldownInterval);
                cooldownInterval = null;
                console.log("Cooldown finished. Reloading quests.");
                loadNextQuest(); // Reload quests when cooldown ends
            } else {
                const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
                const seconds = Math.floor((timeLeft / 1000) % 60);
                cooldownTimerDisplay.textContent =
                    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
        };

        updateTimer(); // Initial call
        cooldownInterval = setInterval(updateTimer, 1000); // Update every second
        console.log(`System on cooldown. Next available transmission after ${new Date(cooldownEndTime).toLocaleString()}`);
    };

     const displayNoQuestsMessage = () => {
        questContent.style.display = 'none';
        proofSubmission.style.display = 'none';
        cooldownMessage.style.display = 'none';
        noQuestsMessage.style.display = 'block';
        console.log("No available quests or active cooldowns.");
    };

    const handleBeginQuest = () => {
        if (!currentQuest) return;

        console.log(`Beginning Quest: ${currentQuest.title}`);
        activeQuestStartTime = Date.now();
        beginQuestBtn.disabled = true;
        beginQuestBtn.textContent = 'Quest Active...';
        // Hide quest viewer content briefly? Or just show proof section?
        // questContent.style.display = 'none'; // Optional: hide quest details once started
        showProofSubmission(currentQuest.proofType);
        clearMessage();
    };

    const handleCancelQuest = () => {
        console.log(`Quest Aborted: ${currentQuest?.title}`);
        activeQuestStartTime = null;
        witnessRequested = false;
        witnessVerified = false;
        hideProofSubmission();
        // Reset the begin button state only if a quest is loaded
        if(currentQuest) {
            beginQuestBtn.disabled = false;
            beginQuestBtn.textContent = 'Initiate Quest';
        }
        showMessage('Quest sequence aborted. Recalibrating...', 'info');
        // Optionally add a short cooldown for cancelling? For now, no penalty.
        loadNextQuest(); // Go back to quest selection/cooldown view
    };

    // --- Proof Submission & Verification ---
    const showProofSubmission = (proofType) => {
        proofSubmission.style.display = 'block';
        // Hide all proof groups initially
        textProofGroup.style.display = 'none';
        imageProofGroup.style.display = 'none';
        avProofGroup.style.display = 'none';
        witnessVerificationSection.style.display = 'block'; // Show witness option
        witnessStatus.style.display = 'none'; // Hide witness status initially
        witnessCodeInput.value = ''; // Clear witness input
        witnessRequested = false;
        witnessVerified = false;


        // Show the relevant proof group
        if (proofType === 'text') {
            textProofGroup.style.display = 'block';
            textProofInput.value = ''; // Clear previous input
        } else if (proofType === 'image') {
            imageProofGroup.style.display = 'block';
            imageProofInput.value = ''; // Clear file selection
        } else if (proofType === 'audio' || proofType === 'video') {
            avProofGroup.style.display = 'block';
            avProofInput.value = ''; // Clear previous input
        }
        // Scroll smoothly to the submission section
        proofSubmission.scrollIntoView({ behavior: 'smooth' });
    };

    const hideProofSubmission = () => {
        proofSubmission.style.display = 'none';
        textProofInput.value = '';
        imageProofInput.value = '';
        avProofInput.value = '';
        witnessCodeInput.value = '';
        witnessStatus.style.display = 'none';
    };

    const handleProofSubmit = (event) => {
        event.preventDefault();
        if (!currentQuest) return;

        console.log("Transmitting proof for verification...");
        submitProofBtn.disabled = true;
        submitProofBtn.textContent = 'Verifying...';

        const proofData = {
            text: textProofInput.value,
            imageFile: imageProofInput.files.length > 0 ? imageProofInput.files[0] : null,
            avDescription: avProofInput.value
        };

        const verificationResult = simulateVerification(currentQuest, proofData);

        // Short delay to simulate processing
        setTimeout(() => {
            if (verificationResult.verified) {
                handleQuestVerified(currentQuest, verificationResult.message);
            } else {
                handleQuestFailed(verificationResult.message, verificationResult.reason);
            }
             // Re-enable button after processing
             submitProofBtn.disabled = false;
             submitProofBtn.textContent = 'Transmit Proof';
        }, 1500); // Simulate 1.5 seconds verification time
    };

    const simulateVerification = (quest, proofData) => {
        console.log(`Simulating verification for Quest ID: ${quest.id}, Type: ${quest.proofType}`);
        let verified = false;
        let message = "Resonance unclear. Verification pending further analysis.";
        let reason = "Unknown discrepancy."; // Default failure reason

        // Add witness check bonus
        if (witnessVerified) {
             console.log("Witness verification confirmed. Applying bonus.");
             // Witness verification could potentially bypass other checks or lower thresholds
             // For simplicity, let's make it automatically pass if witness verified
             verified = true;
             message = "Resonance confirmed by witness echo. Alignment achieved.";
             return { verified, message, reason: null };
        }


        switch (quest.proofType) {
            case 'text':
                const text = proofData.text.trim();
                const wordCount = text.split(/\s+/).filter(Boolean).length; // Basic word count
                const includesEmotionalKeyword = EMOTIONAL_KEYWORDS.some(keyword => text.toLowerCase().includes(keyword));
                const includesQuestKeyword = quest.keywords.some(keyword => text.toLowerCase().includes(keyword));

                console.log(`Text Analysis: Length=${text.length}, Words=${wordCount}, EmotionalKeyword=${includesEmotionalKeyword}, QuestKeyword=${includesQuestKeyword}`);

                if (text.length >= TEXT_PROOF_MIN_LENGTH && (includesEmotionalKeyword || includesQuestKeyword)) {
                    verified = true;
                    message = "Textual resonance confirmed. Emotional signature detected. Alignment achieved.";
                } else if (text.length < TEXT_PROOF_MIN_LENGTH) {
                    reason = `Log entry too brief (requires ${TEXT_PROOF_MIN_LENGTH} characters). Deeper reflection needed.`;
                    message = "Insufficient data stream. Resonance weak.";
                } else {
                     reason = "Emotional or thematic resonance not detected in log entry. Refine focus.";
                     message = "Data stream lacks required resonance signature.";
                }
                break;
            case 'image':
                if (proofData.imageFile) {
                    // Simple check: Did the user select *any* file?
                    verified = true; // Simulate successful image verification
                    message = "Visual pattern acknowledged. Sigil energy detected. Alignment achieved.";
                } else {
                    reason = "No visual data stream detected. Upload required.";
                    message = "Visual input missing.";
                }
                break;
            case 'audio':
            case 'video':
                 // Simulate based on description length maybe?
                 if (proofData.avDescription && proofData.avDescription.length > 20) {
                      verified = true; // Simulate successful AV verification
                      message = "Auditory/Visual log acknowledged. Resonance pattern stable. Alignment achieved.";
                 } else {
                      reason = "Auditory/Visual log description insufficient or missing.";
                      message = "A/V stream description unclear.";
                 }
                break;
            default:
                reason = "Unsupported proof type encountered.";
                message = "System error: Unknown proof protocol.";
        }

        return { verified, message, reason };
    };

    const handleQuestVerified = (quest, successMessage) => {
        console.log(`Quest Verified: ${quest.title}`);
        showMessage(successMessage, 'success');

        // Update Stats
        const stats = getLocalStorage('userStats', { verifiedQuests: 0, fragmentsUnlocked: 0 });
        stats.verifiedQuests += 1;
        // Award fragments based on quest? For now, just +1 per quest
        stats.fragmentsUnlocked += 1;
        setLocalStorage('userStats', stats);
        updateUserStatsDisplay(stats);

        // Record Completion Time and Set Reflection Timer
        const completedQuests = getLocalStorage('completedQuests', {});
        const completionTime = Date.now();
        completedQuests[quest.id] = {
            completionTime: completionTime,
            reflectionDueTime: completionTime + REFLECTION_DELAY,
            reflectionCompleted: false,
            title: quest.title // Store title for reflection prompt
        };
        setLocalStorage('completedQuests', completedQuests);

        // Set Cooldown
        const questCooldowns = getLocalStorage('questCooldowns', {});
        questCooldowns[quest.id] = Date.now() + QUEST_COOLDOWN_DURATION;
        setLocalStorage('questCooldowns', questCooldowns);

        // Reset state and load next quest
        currentQuest = null;
        activeQuestStartTime = null;
        witnessRequested = false;
        witnessVerified = false;
        hideProofSubmission();
        // Delay loading next quest slightly to allow user to read message
        setTimeout(loadNextQuest, 3000);
    };

    const handleQuestFailed = (failMessage, reason) => {
        console.warn(`Quest Failed: ${currentQuest?.title}. Reason: ${reason}`);
        // Provide unique supportive message based on the reason?
        let supportiveMessage = "Discrepancy detected. Recalibrate your approach and attempt transmission again when ready.";
        if (reason.includes("brief")) {
            supportiveMessage = "The signal was too faint. Elaborate further; delve deeper into the experience.";
        } else if (reason.includes("resonance not detected")) {
            supportiveMessage = "The core frequency is missing. Re-center your intention and ensure alignment with the objective.";
        } else if (reason.includes("missing")) {
             supportiveMessage = "Required data stream absent. Ensure the correct proof format is provided.";
        }

        showMessage(`${failMessage} ${supportiveMessage}`, 'error');
        // Do not set cooldown on failure, allow retry
        // Reset button state
        submitProofBtn.disabled = false;
        submitProofBtn.textContent = 'Transmit Proof';
        // Keep the proof submission section open for retry
    };

    // --- Witness Verification (Mocked) ---
    const handleRequestWitness = () => {
        const code = witnessCodeInput.value.trim();
        if (!code || witnessRequested) {
            witnessStatus.textContent = witnessRequested ? "Witness request already pending." : "Please enter a valid witness code.";
            witnessStatus.style.display = 'block';
            return;
        }

        console.log(`Requesting witness verification with code: ${code}`);
        witnessRequested = true;
        requestWitnessBtn.disabled = true;
        requestWitnessBtn.textContent = 'Requesting...';
        witnessStatus.textContent = `Sending secure ping to witness [${code}]... Awaiting confirmation...`;
        witnessStatus.style.display = 'block';

        // Simulate network delay and witness response (random success/failure)
        const delay = Math.random() * 5000 + 3000; // 3-8 seconds delay
        setTimeout(() => {
            const success = Math.random() > 0.3; // 70% chance of success

            if (success) {
                console.log(`Witness [${code}] confirmed.`);
                witnessStatus.textContent = `Witness [${code}] Confirmed! Resonance amplified.`;
                witnessVerified = true; // Set the flag
                // Optionally auto-submit or just notify user
                showMessage('Witness confirmation received! You may now submit proof with amplified resonance.', 'info');

            } else {
                console.warn(`Witness [${code}] did not respond or denied confirmation.`);
                witnessStatus.textContent = `Witness [${code}] unresponsive or unable to confirm. Proceeding without echo.`;
                witnessVerified = false;
            }
            // Re-enable button regardless of outcome
             requestWitnessBtn.disabled = false;
             requestWitnessBtn.textContent = 'Request Witness';
             witnessRequested = false; // Allow another request maybe? Or disable after one attempt per quest? For now, allow retry.

        }, delay);
    };


    // --- Reflection System ---
    const checkForDueReflections = () => {
        console.log("Checking for due reflections...");
        const completedQuests = getLocalStorage('completedQuests', {});
        const now = Date.now();
        let reflectionToShow = null;

        for (const questId in completedQuests) {
            const questData = completedQuests[questId];
            if (!questData.reflectionCompleted && questData.reflectionDueTime && now >= questData.reflectionDueTime) {
                reflectionToShow = { id: questId, title: questData.title };
                break; // Show one reflection prompt at a time
            }
        }

        if (reflectionToShow) {
            console.log(`Reflection due for Quest: ${reflectionToShow.title}`);
            showReflectionModal(reflectionToShow.id, reflectionToShow.title);
        } else {
            console.log("No reflections currently due.");
        }
    };

    const showReflectionModal = (questId, questTitle) => {
        reflectionQuestIdInput.value = questId;
        reflectionQuestTitle.textContent = `Regarding Quest: ${questTitle}`;
        reflectionTextInput.value = ''; // Clear previous text
        reflectionModal.style.display = 'block';
    };

    // Global function to close modal (referenced in HTML)
    window.closeReflectionModal = () => {
        reflectionModal.style.display = 'none';
        // Optionally add a reminder or consequence for closing without submitting?
        showMessage('Deeper resonance postponed. Phanes awaits your insight.', 'info');
    };

    const handleReflectionSubmit = (event) => {
        event.preventDefault();
        const questId = reflectionQuestIdInput.value;
        const reflectionText = reflectionTextInput.value.trim();

        if (!questId || reflectionText.length < 50) { // Require some minimal reflection
            showMessage('Reflection incomplete. Provide at least 50 characters of insight.', 'error', reflectionModal); // Show message inside modal?
            return;
        }

        console.log(`Submitting reflection for Quest ID: ${questId}`);

        const completedQuests = getLocalStorage('completedQuests', {});
        if (completedQuests[questId]) {
            completedQuests[questId].reflectionCompleted = true;
            completedQuests[questId].reflectionText = reflectionText; // Store the reflection
            setLocalStorage('completedQuests', completedQuests);

            console.log(`Reflection for ${completedQuests[questId].title} sealed.`);
            showMessage('Reflection sealed. Core truth integrated.', 'success');

            // Optionally update stats again or grant a bonus?
            // const stats = getLocalStorage('userStats', { verifiedQuests: 0, fragmentsUnlocked: 0 });
            // stats.fragmentsUnlocked += 1; // Bonus fragment for reflection
            // setLocalStorage('userStats', stats);
            // updateUserStatsDisplay(stats);

            closeReflectionModal();
            // Check if more reflections are due immediately after submitting one
            checkForDueReflections();
             // Reload quests in case completing the reflection made a new one available (if quests were repeatable after reflection)
             loadNextQuest();

        } else {
            console.error(`Could not find completed quest data for ID: ${questId} during reflection submission.`);
            showMessage('Error recording reflection. Quest data mismatch.', 'error', reflectionModal);
        }
    };

    // --- User Stats ---
    const loadUserStats = () => {
        const stats = getLocalStorage('userStats', { verifiedQuests: 0, fragmentsUnlocked: 0 });
        updateUserStatsDisplay(stats);
    };

    const updateUserStatsDisplay = (stats) => {
        userStatsVerified.textContent = stats.verifiedQuests;
        userStatsFragments.textContent = stats.fragmentsUnlocked;
        console.log(`Stats Updated: Verified=${stats.verifiedQuests}, Fragments=${stats.fragmentsUnlocked}`);
    };

    // --- UI Utilities ---
    const showMessage = (message, type = 'info', container = messageArea) => {
        container.textContent = message;
        container.className = `message-box ${type}`; // Reset classes and add type
        container.style.display = 'block';

        // Auto-hide non-error messages after a delay
        if (type !== 'error' && container === messageArea) { // Only auto-hide main message area non-errors
            setTimeout(() => {
                 // Check if the message is still the same before hiding
                 if (container.textContent === message) {
                    clearMessage(container);
                 }
            }, 5000); // Hide after 5 seconds
        }
         // Scroll to the message if it's the main area
         if (container === messageArea) {
             container.scrollIntoView({ behavior: 'smooth', block: 'start' });
         }
    };

    const clearMessage = (container = messageArea) => {
        container.textContent = '';
        container.style.display = 'none';
        container.className = 'message-box'; // Reset class
    };

     const hideCooldownMessage = () => {
        cooldownMessage.style.display = 'none';
        if (cooldownInterval) {
            clearInterval(cooldownInterval);
            cooldownInterval = null;
        }
    };

     const hideNoQuestsMessage = () => {
        noQuestsMessage.style.display = 'none';
    };

    // --- Start the Application ---
    initializeSystem();

    // Periodically check for reflections (e.g., every minute)
    // This isn't super efficient but works for a simple local app
    setInterval(checkForDueReflections, 60 * 1000);

}); // End DOMContentLoaded
