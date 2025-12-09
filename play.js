import { letters, wordPuzzles } from "./letters.js";

let selectedLetter = null;
let unlockedLetters = {};
let currentGuess = '';
let attempts = 0;
let maxAttempts = 6;
let guesses = [];
let keyboardState = {};
let currentPuzzle = null;

let keyboard = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
];

function renderEnvelopes() {
    let container = document.getElementById('envelopes');
    container.innerHTML = '';

    letters.forEach(function(letter) {
        let isLetterUnlocked = unlockedLetters[letter.day];
        
        let envelope = document.createElement('div');
        envelope.className = 'envelope ' + (isLetterUnlocked ? 'unlocked ' + letter.color : 'available');
        
        if (!isLetterUnlocked) {
            envelope.onclick = function() {
                startGame(letter);
            };
            envelope.style.cursor = 'pointer';
        } else {
            envelope.onclick = function() {
                openLetter(letter);
            };
            envelope.style.cursor = 'pointer';
        }

        let icon = isLetterUnlocked ? '✉️' : '🎮';
        let subtitle = isLetterUnlocked ? 'Click to read' : 'Play to unlock';

        envelope.innerHTML = '<div class="envelope-left"><div class="envelope-icon">' + 
            icon + 
            '</div><div><div class="envelope-title">Day ' + letter.day + 
            '</div><div class="envelope-subtitle">' + subtitle + 
            '</div></div></div>' + 
            (isLetterUnlocked ? '<div class="heart-small">❤️</div>' : '');

        container.appendChild(envelope);
    });

    let unlockedCount = Object.keys(unlockedLetters).length;
    document.getElementById('dayCounter').textContent = unlockedCount + ' of ' + letters.length + ' letters unlocked';
}

function startGame(letter) {
    selectedLetter = letter;
    currentPuzzle = wordPuzzles[letter.day];
    currentGuess = '';
    attempts = 0;
    guesses = [];
    keyboardState = {};
    
    document.getElementById('gameDay').textContent = letter.day;
    document.getElementById('hintSection').textContent = currentPuzzle.hint;
    document.getElementById('gameCard').className = 'game-card ' + letter.color;
    document.getElementById('attemptCount').textContent = '0';
    document.getElementById('gameMessage').textContent = '';
    document.getElementById('gameMessage').className = 'message';
    
    renderKeyboard();
    renderGuesses();
    
    document.getElementById('mainView').style.display = 'none';
    document.getElementById('gameView').classList.add('active');
}

function renderKeyboard() {
    let container = document.getElementById('keyboard');
    container.innerHTML = '';
    
    keyboard.forEach(function(row) {
        let rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        
        row.forEach(function(key) {
            let keyBtn = document.createElement('button');
            keyBtn.className = 'key' + (key.length > 1 ? ' wide' : '');
            keyBtn.textContent = key;
            keyBtn.onclick = function() { handleKeyPress(key); };
            
            if (keyboardState[key]) {
                keyBtn.classList.add(keyboardState[key]);
            }
            
            rowDiv.appendChild(keyBtn);
        });
        
        container.appendChild(rowDiv);
    });
}

function renderGuesses() {
    let container = document.getElementById('guessesContainer');
    container.innerHTML = '';
    
    for (let i = 0; i < maxAttempts; i++) {
        let guessDiv = document.createElement('div');
        guessDiv.className = 'word-display';
        
        let wordLength = currentPuzzle.word.length;
        for (let j = 0; j < wordLength; j++) {
            let box = document.createElement('div');
            box.className = 'letter-box';
            
            if (guesses[i]) {
                box.textContent = guesses[i].letters[j];
                box.classList.add(guesses[i].states[j]);
            } else if (i === attempts && currentGuess[j]) {
                box.textContent = currentGuess[j];
            }
            
            guessDiv.appendChild(box);
        }
        
        container.appendChild(guessDiv);
    }
}

function handleKeyPress(key) {
    if (attempts >= maxAttempts) return;
    
    let msg = document.getElementById('gameMessage');
    msg.textContent = '';
    
    if (key === '⌫') {
        currentGuess = currentGuess.slice(0, -1);
    } else if (key === 'ENTER') {
        if (currentGuess.length === currentPuzzle.word.length) {
            submitGuess();
        } else {
            msg.textContent = 'Not enough letters!';
            msg.className = 'message error';
        }
    } else if (currentGuess.length < currentPuzzle.word.length) {
        currentGuess += key;
    }
    
    renderGuesses();
}

function submitGuess() {
    let target = currentPuzzle.word.toUpperCase();
    let guess = currentGuess.toUpperCase();
    let states = [];
    let letterCount = {};
    
    for (let i = 0; i < target.length; i++) {
        letterCount[target[i]] = (letterCount[target[i]] || 0) + 1;
    }
    
    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === target[i]) {
            states[i] = 'correct';
            letterCount[guess[i]]--;
        } else {
            states[i] = 'absent';
        }
    }
    
    for (let i = 0; i < guess.length; i++) {
        if (states[i] === 'absent' && letterCount[guess[i]] > 0) {
            states[i] = 'present';
            letterCount[guess[i]]--;
        }
    }
    
    guesses.push({
        letters: guess.split(''),
        states: states
    });
    
    for (let i = 0; i < guess.length; i++) {
        let letter = guess[i];
        let state = states[i];
        
        if (!keyboardState[letter] || 
            (state === 'correct') ||
            (state === 'present' && keyboardState[letter] !== 'correct')) {
            keyboardState[letter] = state;
        }
    }
    
    attempts++;
    document.getElementById('attemptCount').textContent = attempts;
    
    let msg = document.getElementById('gameMessage');
    
    if (guess === target) {
        msg.textContent = '🎉 Correct! Letter unlocked!';
        msg.className = 'message success';
        unlockedLetters[selectedLetter.day] = true;
        
        setTimeout(function() {
            closeGame();
            openLetter(selectedLetter);
        }, 1500);
    } else if (attempts >= maxAttempts) {
        msg.textContent = 'The word was: ' + target + '. Try again!';
        msg.className = 'message error';
        
        setTimeout(function() {
            closeGame();
        }, 2500);
    }
    
    currentGuess = '';
    renderKeyboard();
    renderGuesses();
}

export function closeGame() {
    document.getElementById('mainView').style.display = 'block';
    document.getElementById('gameView').classList.remove('active');
    renderEnvelopes();
}

export function openLetter(letter) {
    document.getElementById('letterTitle').textContent = letter.title;
    document.getElementById('letterDay').textContent = 'Day ' + letter.day + ' of ' + letters.length;
    document.getElementById('letterText').textContent = letter.content;
    document.getElementById('letterCard').className = 'letter-card ' + letter.color;
    
    document.getElementById('mainView').style.display = 'none';
    document.getElementById('letterView').classList.add('active');
}

export function closeLetter() {
    document.getElementById('mainView').style.display = 'block';
    document.getElementById('letterView').classList.remove('active');
}

renderEnvelopes();

document.addEventListener('keydown', function(e) {
    if (document.getElementById('gameView').classList.contains('active')) {
        let key = e.key.toUpperCase();
        
        if (key === 'BACKSPACE') {
            handleKeyPress('⌫');
        } else if (key === 'ENTER') {
            handleKeyPress('ENTER');
        } else if (key.length === 1 && key >= 'A' && key <= 'Z') {
            handleKeyPress(key);
        }
    }
});

window.closeGame = closeGame;
window.openLetter = openLetter;
window.closeLetter = closeLetter;