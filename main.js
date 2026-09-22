// --- Game State ---
let gameState = {
    coins: 1000,
    maxQuestions: 10,
    questions: [],
    currentQuestionIndex: 0,
    betAmount: 100,
    selectedOptionIndex: -1
};

let defaultQuestions = [];

// --- DOM Elements ---
const screens = {
    setup: document.getElementById('setup-screen'),
    game: document.getElementById('game-screen'),
    gameOver: document.getElementById('game-over-screen'),
    create: document.getElementById('create-screen')
};

// Setup Screen Elements
const startCoinsInput = document.getElementById('start-coins');
const numGamesInput = document.getElementById('num-games');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');
const exportTemplateBtn = document.getElementById('export-template-btn');
const openCreateBtn = document.getElementById('open-create-btn');
const startGameBtn = document.getElementById('startGameBtn') || document.getElementById('start-game-btn');

// Create Screen Elements
const questionListContainer = document.getElementById('question-list-container');
const newQText = document.getElementById('new-q-text');
const newQOptA = document.getElementById('new-q-opt-a');
const newQOptB = document.getElementById('new-q-opt-b');
const newQOptC = document.getElementById('new-q-opt-c');
const newQOptD = document.getElementById('new-q-opt-d');
const newQAnswer = document.getElementById('new-q-answer');
const addQBtn = document.getElementById('add-q-btn');
const closeCreateBtn = document.getElementById('close-create-btn');

// Game Screen Elements
const currentQNum = document.getElementById('current-q-num');
const totalQNum = document.getElementById('total-q-num');
const currentCoinsDisplay = document.getElementById('current-coins');
const questionText = document.getElementById('question-text');
const optionsGrid = document.getElementById('options-grid');
const betInput = document.getElementById('current-bet');
const betSlider = document.getElementById('bet-slider');
const betDecrease = document.getElementById('bet-decrease');
const betIncrease = document.getElementById('bet-increase');
const betAllIn = document.getElementById('bet-all-in');
const submitAnswerBtn = document.getElementById('submit-answer-btn');

// Result Overlay Elements
const resultOverlay = document.getElementById('result-overlay');
const resultModal = document.querySelector('.result-modal');
const resultIcon = document.getElementById('result-icon');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');
const resultCoinDiff = document.getElementById('result-coin-diff');
const resultNewBalance = document.getElementById('result-new-balance');
const nextQuestionBtn = document.getElementById('next-question-btn');

// Game Over Elements
const finalCoins = document.getElementById('final-coins');
const playAgainBtn = document.getElementById('play-again-btn');
const exportResultsBtn = document.getElementById('export-results-btn');

// --- Initialization ---
async function init() {
    try {
        const response = await fetch('default-questions.json');
        defaultQuestions = await response.json();
        gameState.questions = [...defaultQuestions];
    } catch (e) {
        console.error("Failed to load default questions", e);
        alert("Could not load default questions. Please import a JSON file.");
    }
    
    attachEventListeners();
}

// --- Event Listeners ---
function attachEventListeners() {
    // File I/O & Screens
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', handleImport);
    exportTemplateBtn.addEventListener('click', () => exportQuestions(defaultQuestions, 'betting-game-template.json'));
    exportResultsBtn.addEventListener('click', () => exportQuestions(gameState.questions, 'my-betting-game.json'));
    openCreateBtn.addEventListener('click', () => {
        renderQuestionList();
        showScreen('create');
    });
    closeCreateBtn.addEventListener('click', () => showScreen('setup'));
    addQBtn.addEventListener('click', addNewQuestion);

    // Setup
    startGameBtn.addEventListener('click', startGame);

    // Betting
    betInput.addEventListener('input', handleBetInput);
    betSlider.addEventListener('input', handleBetSlider);
    betDecrease.addEventListener('click', () => updateBet(gameState.betAmount - 100));
    betIncrease.addEventListener('click', () => updateBet(gameState.betAmount + 100));
    betAllIn.addEventListener('click', () => updateBet(gameState.coins));

    // Game Actions
    submitAnswerBtn.addEventListener('click', submitAnswer);
    nextQuestionBtn.addEventListener('click', nextQuestion);
    playAgainBtn.addEventListener('click', resetToSetup);
}

// --- Screen Management ---
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

// --- Game Logic ---
function startGame() {
    gameState.coins = parseInt(startCoinsInput.value) || 1000;
    gameState.maxQuestions = parseInt(numGamesInput.value) || 10;
    gameState.currentQuestionIndex = 0;
    gameState.betAmount = Math.min(100, gameState.coins);

    // Shuffle questions and pick maxQuestions
    gameState.questions = gameState.questions.sort(() => 0.5 - Math.random()).slice(0, gameState.maxQuestions);
    
    if (gameState.questions.length === 0) {
        alert("No questions available! Please import questions.");
        return;
    }

    updateBetUI();
    loadQuestion();
    showScreen('game');
}

function loadQuestion() {
    const q = gameState.questions[gameState.currentQuestionIndex];
    currentQNum.innerText = gameState.currentQuestionIndex + 1;
    totalQNum.innerText = gameState.questions.length;
    currentCoinsDisplay.innerText = gameState.coins;
    
    questionText.innerText = q.question;
    
    // Render Options
    optionsGrid.innerHTML = '';
    gameState.selectedOptionIndex = -1;
    submitAnswerBtn.classList.add('disabled');
    submitAnswerBtn.disabled = true;

    const optionLetters = ['A', 'B', 'C', 'D'];
    
    q.options.forEach((optText, index) => {
        const card = document.createElement('div');
        card.className = 'option-card';
        card.innerHTML = `
            <div class="option-label">${optionLetters[index] || index+1}</div>
            <div class="option-text">${optText}</div>
        `;
        card.addEventListener('click', () => selectOption(index, card));
        optionsGrid.appendChild(card);
    });
    
    // Ensure bet is valid for new question
    if (gameState.coins === 0) {
        endGame();
    } else {
        updateBet(Math.min(gameState.betAmount, gameState.coins));
    }
}

function selectOption(index, cardElement) {
    gameState.selectedOptionIndex = index;
    
    // Update UI
    document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
    cardElement.classList.add('selected');
    
    // Enable submit button
    submitAnswerBtn.classList.remove('disabled');
    submitAnswerBtn.disabled = false;
}

function handleBetInput(e) {
    let val = parseInt(e.target.value);
    if (isNaN(val)) return;
    updateBet(val);
}

function handleBetSlider(e) {
    updateBet(parseInt(e.target.value));
}

function updateBet(amount) {
    if (amount < 1) amount = 1;
    if (amount > gameState.coins) amount = gameState.coins;
    
    gameState.betAmount = amount;
    
    // Update inputs safely
    if (document.activeElement !== betInput) betInput.value = amount;
    betSlider.max = gameState.coins;
    betSlider.value = amount;
}

function updateBetUI() {
    betSlider.max = gameState.coins;
    updateBet(gameState.betAmount);
}

function submitAnswer() {
    if (gameState.selectedOptionIndex === -1) return;
    
    const q = gameState.questions[gameState.currentQuestionIndex];
    const isCorrect = gameState.selectedOptionIndex === q.answerIndex;
    const bet = gameState.betAmount;

    if (isCorrect) {
        gameState.coins += bet;
        showResult(true, bet);
        triggerConfetti();
    } else {
        gameState.coins -= bet;
        showResult(false, bet);
        screens.game.classList.add('shake');
        setTimeout(() => screens.game.classList.remove('shake'), 500);
    }
}

function showResult(isCorrect, amount) {
    resultModal.className = `result-modal glass-panel ${isCorrect ? 'result-correct' : 'result-incorrect'}`;
    resultIcon.innerHTML = isCorrect ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-circle-xmark"></i>';
    resultTitle.innerText = isCorrect ? 'Correct!' : 'Incorrect!';
    resultMessage.innerText = isCorrect ? 'Your bet was doubled!' : 'You lost your bet.';
    
    resultCoinDiff.innerText = (isCorrect ? '+' : '-') + amount;
    resultNewBalance.innerText = gameState.coins;
    
    resultOverlay.classList.add('active');
}

function nextQuestion() {
    resultOverlay.classList.remove('active');
    
    if (gameState.coins <= 0) {
        setTimeout(endGame, 400); // Wait for overlay animation
        return;
    }

    gameState.currentQuestionIndex++;
    
    if (gameState.currentQuestionIndex >= gameState.questions.length) {
        setTimeout(endGame, 400);
    } else {
        setTimeout(loadQuestion, 400);
    }
}

function endGame() {
    finalCoins.innerText = gameState.coins;
    
    if (gameState.coins === 0) {
        document.getElementById('game-over-title').innerText = "Bankrupt!";
        document.getElementById('game-over-subtitle').innerText = "You lost all your coins.";
    } else {
        document.getElementById('game-over-title').innerText = "Game Complete!";
        document.getElementById('game-over-subtitle').innerText = "Great job, high roller!";
        triggerConfetti(2);
    }
    
    showScreen('gameOver');
}

function resetToSetup() {
    showScreen('setup');
}

// --- Effects ---
function triggerConfetti(durationSeconds = 1) {
    if (typeof confetti !== 'function') return;
    
    let duration = durationSeconds * 1000;
    let animationEnd = Date.now() + duration;
    let defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    let interval = setInterval(function() {
        let timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        let particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}

function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

// --- File I/O ---
function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedQuestions = JSON.parse(e.target.result);
            if (Array.isArray(importedQuestions) && importedQuestions.length > 0 && importedQuestions[0].question) {
                gameState.questions = importedQuestions;
                alert(`Successfully imported ${importedQuestions.length} questions!`);
                importBtn.innerHTML = `<i class="fa-solid fa-check"></i> Loaded ${importedQuestions.length} Qs`;
                importBtn.classList.add('btn-primary');
                importBtn.classList.remove('btn-secondary');
            } else {
                alert("Invalid JSON format. Please make sure it matches the template.");
            }
        } catch (err) {
            alert("Error parsing JSON file. Is it valid JSON?");
        }
    };
    reader.readAsText(file);
}

function exportQuestions(questionsData, filename) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(questionsData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// --- Question Creator Logic ---
function renderQuestionList() {
    questionListContainer.innerHTML = '';
    
    if (gameState.questions.length === 0) {
        questionListContainer.innerHTML = '<div class="text-center" style="padding: 10px; color: var(--text-secondary);">No questions available. Add some!</div>';
        return;
    }

    gameState.questions.forEach((q, index) => {
        const item = document.createElement('div');
        item.className = 'question-list-item';
        
        const title = document.createElement('div');
        title.className = 'question-list-item-title';
        title.innerText = `${index + 1}. ${q.question}`;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon';
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        deleteBtn.onclick = () => {
            gameState.questions.splice(index, 1);
            renderQuestionList();
        };
        
        item.appendChild(title);
        item.appendChild(deleteBtn);
        questionListContainer.appendChild(item);
    });
}

function addNewQuestion() {
    const text = newQText.value.trim();
    const optA = newQOptA.value.trim();
    const optB = newQOptB.value.trim();
    const optC = newQOptC.value.trim();
    const optD = newQOptD.value.trim();
    const answerIdx = parseInt(newQAnswer.value);

    if (!text || !optA || !optB || !optC || !optD) {
        alert("Please fill out the question and all 4 options.");
        return;
    }

    const newQuestion = {
        question: text,
        options: [optA, optB, optC, optD],
        answerIndex: answerIdx
    };

    gameState.questions.push(newQuestion);
    
    // Clear form
    newQText.value = '';
    newQOptA.value = '';
    newQOptB.value = '';
    newQOptC.value = '';
    newQOptD.value = '';
    newQAnswer.value = '0';

    renderQuestionList();
    
    // Small animation on add button
    addQBtn.innerText = "Added!";
    addQBtn.style.background = "var(--success)";
    setTimeout(() => {
        addQBtn.innerText = "Add";
        addQBtn.style.background = "";
    }, 1000);
}

// Start app
init();
