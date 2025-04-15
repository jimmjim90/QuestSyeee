// script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const questViewer = document.getElementById('quest-viewer');
    const questContent = document.getElementById('quest-content');
    const questTitle = document.getElementById('quest-title');
    const questDescription = document.getElementById('quest-description');
    const questObjective = document.getElementById('quest-objective');
    const questProofType = document.getElementById('quest-proof-type');
    const questRewardDisplay = document.getElementById('quest-reward'); // Added
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

    // User Stats Elements (Updated)
    const playerLevelDisplay = document.getElementById('player-level');
    const playerXpDisplay = document.getElementById('player-xp');
    const xpToNextLevelDisplay = document.getElementById('xp-to-next-level');
    const xpBar = document.getElementById('xp-bar');
    const userStatsVerified = document.getElementById('verified-quests-count');
    // Removed fragments unlocked element reference

    const messageArea = document.getElementById('message-area');
    const levelUpAlert = document.getElementById('level-up-alert'); // Added

    // --- Constants ---
    const QUEST_COOLDOWN_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const REFLECTION_DELAY = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
    //const REFLECTION_DELAY = 30 * 1000; // 30 seconds for testing
    const TEXT_PROOF_MIN_LENGTH = 150;
    const EMOTIONAL_KEYWORDS = ["afraid", "grateful", "angry", "free", "release", "breakthrough", "realization", "clarity", "fear", "joy", "peace", "connected", "struggle", "overcome", "insight", "let go", "understand", "integrate", "process"]; // Added more keywords
    const REFLECTION_XP_BONUS = 50; // Bonus XP for completing reflection

    // XP Progression (Example: Needs more XP for higher levels)
    // Index corresponds to the level (e.g., XP_THRESHOLDS[1] is XP needed to reach level 2)
    const XP_THRESHOLDS = [0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500]; // XP needed *to reach* this level from level 1

    // --- Game Data (Updated with XP Rewards) ---
    const ALL_QUESTS = [
        { id: "meditate01", title: "Still the Mind's Echo", description: "Find a quiet space. Focus solely on your breath for 15 uninterrupted minutes.", objective: "Achieve 15 minutes of focused meditation.", proofType: "text", keywords: ["peace", "calm", "focus", "breath", "quiet", "present", "mindful"], xpReward: 75 },
        { id: "sigil01", title: "Manifest Intent", description: "Design and draw a personal sigil representing a core intention for growth.", objective: "Create and photograph your sigil.", proofType: "image", keywords: ["intention", "desire", "symbol", "create", "focus", "manifest"], xpReward: 100 },
        { id: "fear01", title: "Confront the Shadow", description: "Identify one small fear. Take one concrete step today to face it.", objective: "Describe the fear and the action taken.", proofType: "text", keywords: ["fear", "afraid", "confront", "step", "action", "overcome", "challenge", "release", "brave"], xpReward: 120 },
        { id: "gratitude01", title: "Acknowledge Abundance", description: "Record three specific things you are genuinely grateful for today, explaining *why*.", objective: "Write a short gratitude journal entry.", proofType: "text", keywords: ["grateful", "thankful", "appreciate", "blessing", "joy", "abundance", "positive"], xpReward: 60 },
        { id: "nature01", title: "Connect to Gaia", description: "Spend 20 minutes outdoors, consciously observing the natural world.", objective: "Describe your sensory experience and any insights.", proofType: "text", keywords: ["nature", "observe", "connect", "earth", "listen", "feel", "grounded", "peace"], xpReward: 85 },
        // Add more quests with varying xpReward
    ];

    // --- State Variables ---
    let currentQuest = null;
    let activeQuestStartTime = null;
    let witnessRequested = false;
    let witnessVerified = false;
    let cooldownInterval = null;

    // --- Local Storage Functions ---
    const getLocalStorage = (key, defaultValue) => {
        const data = localStorage.getItem(key);
        try {
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error(`Error parsing localStorage key "${key}":`, e);
            return defaultValue; // Return default value if parsing fails
        }
    };

    const setLocalStorage = (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Error setting localStorage key "${key}":`, e);
        }
    };

    // --- Initialization ---
    const initializeSystem = () => {
        console.log("Initializing System Interface...");
        loadUserStats();
        checkForDueReflections();
        loadNextQuest();
        setupEventListeners();
        console.log("System Online.");
    };

    // --- Event Listeners Setup ---
    const setupEventListeners = () => {
        beginQuestBtn.addEventListener('click', handleBeginQuest);
        proofForm.addEventListener('submit', handleProofSubmit);
        cancelQuestBtn.addEventListener('click', handleCancelQuest);
        requestWitnessBtn.addEventListener('click', handleRequestWitness);
        reflectionForm.addEventListener('submit', handleReflectionSubmit);
        // Listener for modal close button is inline HTML
    };

    // --- Quest Management ---
    const loadNextQuest = () => {
        console.log("Scanning for next available directive...");
        clearMessage();
        hideProofSubmission();
        hideCooldownMessage();
        hideNoQuestsMessage();

        const completedQuests = getLocalStorage('completedQuests', {});
        const questCooldowns = getLocalStorage('questCooldowns', {});
        const now = Date.now();

        let availableQuests = ALL_QUESTS.filter(quest => {
            const isCompleted = completedQuests[quest.id];
            const cooldownEndTime = questCooldowns[quest.id];
            const isOnCooldown = cooldownEndTime && now < cooldownEndTime;
            const fullyCompleted = isCompleted && completedQuests[quest.id].reflectionCompleted;
            // Filter logic: Not fully completed AND not currently on cooldown
            return !fullyCompleted && !isOnCooldown;
        });

        console.log(`Found ${availableQuests.length} potential directives.`);

        if (availableQuests.length > 0) {
            // Simple selection: pick the first available one
            // TODO: Could add logic for difficulty or player level requirements here
            currentQuest = availableQuests[0];
            displayQuest(currentQuest);
        } else {
            const activeCooldowns = Object.entries(questCooldowns).filter(([id, endTime]) => now < endTime);
            if (activeCooldowns.length > 0) {
                const soonestCooldown = activeCooldowns.reduce((soonest, [id, endTime]) => {
                    return endTime < soonest.endTime ? { id, endTime } : soonest;
                }, { id: null, endTime: Infinity });
                displayCooldownMessage(soonestCooldown.endTime);
            } else {
                 displayNoQuestsMessage();
                 currentQuest = null;
            }
        }
    };

    const displayQuest = (quest) => {
        questTitle.textContent = quest.title;
        questDescription.textContent = quest.description;
        questObjective.textContent = quest.objective;
        questProofType.textContent = quest.proofType.charAt(0).toUpperCase() + quest.proofType.slice(1);
        questRewardDisplay.textContent = quest.xpReward; // Display XP reward
        currentQuestIdInput.value = quest.id;

        questContent.style.display = 'block';
        beginQuestBtn.disabled = false;
        beginQuestBtn.textContent = 'Accept Directive';
        hideProofSubmission();
        hideCooldownMessage();
        hideNoQuestsMessage();
        console.log(`Displaying Directive: ${quest.title}`);
    };

     const displayCooldownMessage = (cooldownEndTime) => {
        questContent.style.display = 'none';
        proofSubmission.style.display = 'none';
        noQuestsMessage.style.display = 'none';
        cooldownMessage.style.display = 'block';

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
                console.log("Cooldown finished. Reloading directives.");
                loadNextQuest();
            } else {
                const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
                const seconds = Math.floor((timeLeft / 1000) % 60);
                cooldownTimerDisplay.textContent =
                    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
        };
        updateTimer();
        cooldownInterval = setInterval(updateTimer, 1000);
        console.log(`System on cooldown. Next directive available after ${new Date(cooldownEndTime).toLocaleString()}`);
    };

     const displayNoQuestsMessage = () => {
        questContent.style.display = 'none';
        proofSubmission.style.display = 'none';
        cooldownMessage.style.display = 'none';
        noQuestsMessage.style.display = 'block';
        console.log("No available directives.");
    };

    const handleBeginQuest = () => {
        if (!currentQuest) return;
        console.log(`Accepting Directive: ${currentQuest.title}`);
        activeQuestStartTime = Date.now();
        beginQuestBtn.disabled = true;
        beginQuestBtn.textContent = 'Directive Active...';
        showProofSubmission(currentQuest.proofType);
        clearMessage();
    };

    const handleCancelQuest = () => {
        console.log(`Directive Aborted: ${currentQuest?.title}`);
        activeQuestStartTime = null;
        witnessRequested = false;
        witnessVerified = false;
        hideProofSubmission();
        if(currentQuest) {
            beginQuestBtn.disabled = false;
            beginQuestBtn.textContent = 'Accept Directive';
        }
        showMessage('Directive sequence aborted by user.', 'info');
        loadNextQuest();
    };

    // --- Proof Submission & Verification ---
    const showProofSubmission = (proofType) => {
        proofSubmission.style.display = 'block';
        textProofGroup.style.display = 'none';
        imageProofGroup.style.display = 'none';
        avProofGroup.style.display = 'none';
        witnessVerificationSection.style.display = 'block';
        witnessStatus.style.display = 'none';
        witnessCodeInput.value = '';
        witnessRequested = false;
        witnessVerified = false;

        if (proofType === 'text') {
            textProofGroup.style.display = 'block';
            textProofInput.value = '';
        } else if (proofType === 'image') {
            imageProofGroup.style.display = 'block';
            imageProofInput.value = '';
        } else if (proofType === 'audio' || proofType === 'video') {
            avProofGroup.style.display = 'block';
            avProofInput.value = '';
        }
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
        console.log("Transmitting verification data...");
        submitProofBtn.disabled = true;
        submitProofBtn.textContent = 'Verifying...';

        const proofData = {
            text: textProofInput.value,
            imageFile: imageProofInput.files.length > 0 ? imageProofInput.files[0] : null,
            avDescription: avProofInput.value
        };
        const verificationResult = simulateVerification(currentQuest, proofData);

        setTimeout(() => {
            if (verificationResult.verified) {
                handleQuestVerified(currentQuest, verificationResult.message);
            } else {
                handleQuestFailed(verificationResult.message, verificationResult.reason);
            }
             submitProofBtn.disabled = false;
             submitProofBtn.textContent = 'Transmit Data';
        }, 1500);
    };

    const simulateVerification = (quest, proofData) => {
        console.log(`Simulating verification for Directive ID: ${quest.id}, Type: ${quest.proofType}`);
        let verified = false;
        let message = "Verification data unclear. Analysis pending.";
        let reason = "Unknown discrepancy.";

        if (witnessVerified) {
             console.log("Peer confirmation received. Applying verification bonus.");
             verified = true;
             message = "Verification confirmed by peer node. Alignment achieved.";
             return { verified, message, reason: null };
        }

        switch (quest.proofType) {
            case 'text':
                const text = proofData.text.trim();
                const wordCount = text.split(/\s+/).filter(Boolean).length;
                const includesEmotionalKeyword = EMOTIONAL_KEYWORDS.some(keyword => text.toLowerCase().includes(keyword));
                const includesQuestKeyword = quest.keywords.some(keyword => text.toLowerCase().includes(keyword));
                console.log(`Text Analysis: Length=${text.length}, Words=${wordCount}, EmotionalKeyword=${includesEmotionalKeyword}, QuestKeyword=${includesQuestKeyword}`);
                if (text.length >= TEXT_PROOF_MIN_LENGTH && (includesEmotionalKeyword || includesQuestKeyword)) {
                    verified = true;
                    message = "Textual data confirmed. Required signatures detected. Verification complete.";
                } else if (text.length < TEXT_PROOF_MIN_LENGTH) {
                    reason = `Log entry insufficient (requires ${TEXT_PROOF_MIN_LENGTH} characters). Analysis requires more data.`;
                    message = "Insufficient data stream.";
                } else {
                     reason = "Required thematic/emotional signatures not detected in log entry. Refine input.";
                     message = "Data stream lacks required signatures.";
                }
                break;
            case 'image':
                if (proofData.imageFile) {
                    verified = true;
                    message = "Visual data pattern acknowledged. Verification complete.";
                } else {
                    reason = "No visual data stream detected. Upload required.";
                    message = "Visual input missing.";
                }
                break;
            case 'audio': case 'video':
                 if (proofData.avDescription && proofData.avDescription.length > 20) {
                      verified = true;
                      message = "Auditory/Visual log acknowledged. Verification complete.";
                 } else {
                      reason = "Auditory/Visual log description insufficient or missing.";
                      message = "A/V stream description unclear.";
                 }
                break;
            default:
                reason = "Unsupported data type encountered.";
                message = "System error: Unknown verification protocol.";
        }
        return { verified, message, reason };
    };

    const handleQuestVerified = (quest, successMessage) => {
        console.log(`Directive Verified: ${quest.title}`);
        showMessage(successMessage, 'success');

        // Update Verified Count Stat
        const stats = loadUserStats(); // Load current stats including level/xp
        stats.verifiedQuests += 1;
        setLocalStorage('userStats', stats); // Save updated count immediately

        // Award XP
        gainXP(quest.xpReward); // This function handles level ups and saving stats

        // Record Completion Time and Set Reflection Timer
        const completedQuests = getLocalStorage('completedQuests', {});
        const completionTime = Date.now();
        completedQuests[quest.id] = {
            completionTime: completionTime,
            reflectionDueTime: completionTime + REFLECTION_DELAY,
            reflectionCompleted: false,
            title: quest.title
        };
        setLocalStorage('completedQuests', completedQuests);

        // Set Cooldown
        const questCooldowns = getLocalStorage('questCooldowns', {});
        questCooldowns[quest.id] = Date.now() + QUEST_COOLDOWN_DURATION;
        setLocalStorage('questCooldowns', questCooldowns);

        currentQuest = null;
        activeQuestStartTime = null;
        witnessRequested = false;
        witnessVerified = false;
        hideProofSubmission();
        setTimeout(loadNextQuest, 3000); // Load next quest after a delay
    };

    const handleQuestFailed = (failMessage, reason) => {
        console.warn(`Directive Failed: ${currentQuest?.title}. Reason: ${reason}`);
        let supportiveMessage = "Discrepancy detected. Re-evaluate and resubmit data when ready.";
        if (reason.includes("insufficient")) {
            supportiveMessage = "Data packet too small. Elaborate further; provide comprehensive details.";
        } else if (reason.includes("signatures not detected")) {
            supportiveMessage = "Core signatures missing. Re-center intention and ensure alignment with directive objective.";
        } else if (reason.includes("missing")) {
             supportiveMessage = "Required data stream absent. Ensure correct format is provided.";
        }
        showMessage(`${failMessage} ${supportiveMessage}`, 'error');
        submitProofBtn.disabled = false;
        submitProofBtn.textContent = 'Transmit Data';
    };

    // --- Witness Verification (Mocked) ---
    const handleRequestWitness = () => {
        const code = witnessCodeInput.value.trim();
        if (!code || witnessRequested) {
            witnessStatus.textContent = witnessRequested ? "Confirmation request pending." : "Enter valid Peer Identifier.";
            witnessStatus.style.display = 'block';
            return;
        }
        console.log(`Requesting peer confirmation: ${code}`);
        witnessRequested = true;
        requestWitnessBtn.disabled = true;
        requestWitnessBtn.textContent = 'Requesting...';
        witnessStatus.textContent = `Pinging peer node [${code}]... Awaiting confirmation...`;
        witnessStatus.style.display = 'block';

        const delay = Math.random() * 5000 + 3000;
        setTimeout(() => {
            const success = Math.random() > 0.3; // 70% success chance
            if (success) {
                console.log(`Peer [${code}] confirmed.`);
                witnessStatus.textContent = `Peer [${code}] Confirmed! Verification augmented.`;
                witnessVerified = true;
                showMessage('Peer confirmation received! Submit data with augmented verification.', 'info');
            } else {
                console.warn(`Peer [${code}] unresponsive or denied confirmation.`);
                witnessStatus.textContent = `Peer [${code}] unresponsive or unable to confirm. Proceeding standard verification.`;
                witnessVerified = false;
            }
             requestWitnessBtn.disabled = false;
             requestWitnessBtn.textContent = 'Request Confirmation';
             witnessRequested = false;
        }, delay);
    };

    // --- Reflection System ---
    const checkForDueReflections = () => {
        console.log("Checking for pending system inquiries...");
        const completedQuests = getLocalStorage('completedQuests', {});
        const now = Date.now();
        let reflectionToShow = null;

        for (const questId in completedQuests) {
            const questData = completedQuests[questId];
            if (!questData.reflectionCompleted && questData.reflectionDueTime && now >= questData.reflectionDueTime) {
                reflectionToShow = { id: questId, title: questData.title };
                break;
            }
        }
        if (reflectionToShow) {
            console.log(`System inquiry pending for Directive: ${reflectionToShow.title}`);
            showReflectionModal(reflectionToShow.id, reflectionToShow.title);
        } else {
            console.log("No pending inquiries.");
        }
    };

    const showReflectionModal = (questId, questTitle) => {
        reflectionQuestIdInput.value = questId;
        reflectionQuestTitle.textContent = `Regarding Directive: ${questTitle}`;
        reflectionTextInput.value = '';
        reflectionModal.style.display = 'block';
    };

    window.closeReflectionModal = () => { // Make globally accessible
        reflectionModal.style.display = 'none';
        showMessage('Analysis postponed. System awaits input.', 'info');
    };

    const handleReflectionSubmit = (event) => {
        event.preventDefault();
        const questId = reflectionQuestIdInput.value;
        const reflectionText = reflectionTextInput.value.trim();

        if (!questId || reflectionText.length < 50) {
            showMessage('Analysis incomplete. Provide at least 50 characters.', 'error', reflectionModal);
            return;
        }
        console.log(`Submitting analysis for Directive ID: ${questId}`);
        const completedQuests = getLocalStorage('completedQuests', {});
        if (completedQuests[questId]) {
            completedQuests[questId].reflectionCompleted = true;
            completedQuests[questId].reflectionText = reflectionText;
            setLocalStorage('completedQuests', completedQuests);
            console.log(`Analysis for ${completedQuests[questId].title} finalized.`);
            showMessage('Analysis finalized. Core data integrated.', 'success');

            // Award bonus XP for reflection
            gainXP(REFLECTION_XP_BONUS, true); // Pass true to indicate bonus XP

            closeReflectionModal();
            checkForDueReflections();
            loadNextQuest();
        } else {
            console.error(`Could not find completed directive data for ID: ${questId}.`);
            showMessage('Error recording analysis. Data mismatch.', 'error', reflectionModal);
        }
    };

    // --- User Stats & Leveling (Updated) ---
    const loadUserStats = () => {
        const defaultStats = { level: 1, xp: 0, verifiedQuests: 0 };
        const stats = getLocalStorage('userStats', defaultStats);
        // Ensure all expected keys exist
        stats.level = stats.level || defaultStats.level;
        stats.xp = stats.xp || defaultStats.xp;
        stats.verifiedQuests = stats.verifiedQuests || defaultStats.verifiedQuests;
        updateUserStatsDisplay(stats);
        return stats; // Return the loaded stats
    };

    const updateUserStatsDisplay = (stats) => {
        playerLevelDisplay.textContent = stats.level;
        playerXpDisplay.textContent = stats.xp;
        userStatsVerified.textContent = stats.verifiedQuests;

        // Calculate XP needed for next level
        const currentLevelThreshold = XP_THRESHOLDS[stats.level -1] || 0; // XP needed to reach current level
        const nextLevelThreshold = XP_THRESHOLDS[stats.level] || XP_THRESHOLDS[XP_THRESHOLDS.length - 1]; // XP needed to reach next level (or max if at cap)

        const xpNeededForNextLevel = nextLevelThreshold - currentLevelThreshold;
        const xpProgressInCurrentLevel = stats.xp - currentLevelThreshold;

        xpToNextLevelDisplay.textContent = nextLevelThreshold; // Show total XP needed for next level

        // Update XP Bar
        let xpPercentage = 0;
        if (xpNeededForNextLevel > 0) {
             xpPercentage = Math.max(0, Math.min(100, (xpProgressInCurrentLevel / xpNeededForNextLevel) * 100));
        } else if (stats.level >= XP_THRESHOLDS.length) {
             xpPercentage = 100; // Max level
        }
        xpBar.style.width = `${xpPercentage}%`;


        console.log(`Stats Updated: Level=${stats.level}, XP=${stats.xp}, Verified=${stats.verifiedQuests}, XP Bar=${xpPercentage.toFixed(1)}%`);
    };

    const gainXP = (amount, isBonus = false) => {
        if (amount <= 0) return;

        const stats = loadUserStats();
        stats.xp += amount;
        console.log(`Gained ${amount} XP. Total XP: ${stats.xp}`);
        if (isBonus) {
             showMessage(`Bonus XP Acquired: +${amount} XP!`, 'success');
        } else {
             showMessage(`XP Acquired: +${amount} XP!`, 'info');
        }


        // Check for Level Up
        let leveledUp = false;
        // Ensure we don't exceed array bounds and check against the *next* level's threshold
        while (stats.level < XP_THRESHOLDS.length && stats.xp >= XP_THRESHOLDS[stats.level]) {
            stats.level += 1;
            leveledUp = true;
            console.log(`Level Up! Reached Level ${stats.level}`);
            // Optional: Reset XP for the level? No, keep cumulative XP for this model.
        }

        setLocalStorage('userStats', stats); // Save updated stats
        updateUserStatsDisplay(stats); // Update UI

        if (leveledUp) {
            triggerLevelUpVisual();
        }
    };

    const triggerLevelUpVisual = () => {
        levelUpAlert.style.display = 'block';
        // Could add sound effect here using Tone.js if integrated
        console.log("LEVEL UP VISUAL TRIGGERED");
        // Hide the alert after a few seconds
        setTimeout(() => {
            levelUpAlert.style.display = 'none';
        }, 4000); // Show for 4 seconds
    };


    // --- UI Utilities ---
    const showMessage = (message, type = 'info', container = messageArea) => {
        // Hide level up alert if showing a normal message
        if (container === messageArea) {
            levelUpAlert.style.display = 'none';
        }

        // Add [System Alert] prefix logic handled by CSS ::before
        container.textContent = message; // Set only the message text
        container.className = `message-box ${type}`;
        container.style.display = 'block';

        if (type !== 'error' && container === messageArea) {
            setTimeout(() => {
                 if (container.textContent === message) { // Hide only if message hasn't changed
                    clearMessage(container);
                 }
            }, 6000); // Hide after 6 seconds
        }
         if (container === messageArea) {
             container.scrollIntoView({ behavior: 'smooth', block: 'start' });
         }
    };

    const clearMessage = (container = messageArea) => {
        container.textContent = '';
        container.style.display = 'none';
        container.className = 'message-box';
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

    // Periodically check for reflections
    setInterval(checkForDueReflections, 60 * 1000); // Check every minute

}); // End DOMContentLoaded
