import * as readlinePromises from 'node:readline/promises';
import { ANSI } from './ansi.mjs';
import { HANGMAN_UI } from './graphics.mjs';
import fs from 'fs';

//#region Initialization
const rl = readlinePromises.createInterface({ input: process.stdin, output: process.stdout });

// Utility functions
async function askQuestion(question) {
    return await rl.question(question);
}

function getRandomWord(words) {
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex].toLowerCase();
}

function drawWordDisplay(guessedWord) {
    return guessedWord.split('').map(char => char !== '_' ? ANSI.COLOR.GREEN + char + ANSI.RESET : '_').join(' ');
}

function drawList(list, color) {
    return color + list.join(' ') + ANSI.RESET;
}

function ifPlayerGuessedLetter(answer) {
    return answer.length === 1;
}

function isGameOver(wrongGuesses, maxGuesses) {
    return wrongGuesses.length >= maxGuesses;
}

function updateGuessedWord(correctWord, guessedWord, guess) {
    let newGuessedWord = '';
    let isCorrect = false;
    
    for (let i = 0; i < correctWord.length; i++) {
        if (correctWord[i] === guess) {
            newGuessedWord += guess;
            isCorrect = true;
        } else {
            newGuessedWord += guessedWord[i];
        }
    }
    
    return { newGuessedWord, isCorrect };
}

function displayGameStats(stats) {
    console.log(`Games Played: ${stats.gamesPlayed}`);
    console.log(`Games Won: ${stats.gamesWon}`);
    console.log(`Games Lost: ${stats.gamesLost}`);
}

const MAX_ATTEMPTS = 10;
const WORDS_FILE_PATH = './words.txt';

// Load words from file
const words = fs.readFileSync(WORDS_FILE_PATH, 'utf-8').split('\n').map(word => word.trim()).filter(word => word.length > 0);

// Game loop
let stats = { gamesPlayed: 0, gamesWon: 0, gamesLost: 0 };
let playAgain = true;

while (playAgain) {
    const correctWord = getRandomWord(words);
    let guessedWord = '_'.repeat(correctWord.length);
    let wrongGuesses = new Set();
    let isGameOverFlag = false;
    let wasGuessCorrect = false;
    
    while (!isGameOverFlag) {
        console.clear();
        console.log(drawWordDisplay(guessedWord));
        console.log(drawList([...wrongGuesses], ANSI.COLOR.RED));
        console.log(HANGMAN_UI[wrongGuesses.size]);

        const answer = (await askQuestion("Guess a char or the word: ")).toLowerCase();
        
        // Debugging logs
        console.log(`Answer: ${answer}`);
        console.log(`Correct Word: ${correctWord}`);
        console.log(`Guessed Word: ${guessedWord}`);
        console.log(`Wrong Guesses: ${[...wrongGuesses].join(', ')}`);

        if (answer === correctWord) {
            guessedWord = correctWord;
            isGameOverFlag = true;
            wasGuessCorrect = true;
        } else if (ifPlayerGuessedLetter(answer)) {
            if (wrongGuesses.has(answer)) {
                console.log("You already guessed that letter.");
                continue;
            }

            const { newGuessedWord, isCorrect } = updateGuessedWord(correctWord, guessedWord, answer);

            if (isCorrect) {
                guessedWord = newGuessedWord;
                if (guessedWord === correctWord) {
                    isGameOverFlag = true;
                    wasGuessCorrect = true;
                }
            } else {
                wrongGuesses.add(answer);
            }
        } else {
            console.log("Invalid input. Please enter a single letter or the full word.");
        }

        // Check if the game should end due to max attempts
        if (isGameOver(wrongGuesses, MAX_ATTEMPTS)) {
            isGameOverFlag = true;
        }
    }

    // Update stats
    stats.gamesPlayed++;
    if (wasGuessCorrect) {
        stats.gamesWon++;
        console.log(ANSI.COLOR.YELLOW + "Congratulations, winner winner chicken dinner!" + ANSI.RESET);
    } else {
        stats.gamesLost++;
    }
    
    console.log("Game Over");
    displayGameStats(stats);

    playAgain = (await askQuestion("Do you want to play again? (yes/no): ")).toLowerCase() === 'yes';
}

rl.close();
process.exit();