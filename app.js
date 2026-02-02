// Vanilla JS SPA: Home → Flashcards → Tests (Random / Quick 10 / Mock Exam)
import { loadJSON, shuffleInPlace, sampleOne, formatTime, store, toast, confirmModal } from './lib/ui.js';
import { createHomeView, createFlashcardsView, createTestView, createSettingsView } from './lib/views.js';
import { registerSW, maybeShowA2HS } from './lib/pwa.js';

const state = {
  route: 'home',
  flashcards: [],
  questions: [],
  settings: store.get('settings', {
    flashcardsFirstSide: 'term', // 'term' or 'definition'
    sound: false,
  }),
};

const viewEl = document.querySelector('#view');
const subtitleEl = document.querySelector('#subtitle');
const homeBtn = document.querySelector('#homeBtn');
const settingsBtn = document.querySelector('#settingsBtn');

function setSubtitle(t){ subtitleEl.textContent = t; }

async function initData(){
  // Load data shipped in /data. You can replace these with your full decks later.
  state.flashcards = await loadJSON('./data/flashcards.json').catch(()=>[]);
  state.questions  = await loadJSON('./data/questions.json').catch(()=>[]);
  // If no questions exist, auto-generate simple questions from flashcards (local-only).
  if ((!state.questions || state.questions.length===0) && state.flashcards.length){
    state.questions = state.flashcards.flatMap((c, idx) => ([
      {
        id: `fc-${idx}-t2d`,
        category: 'general', // edit/override per question later
        type: 'mcq',
        prompt: `What is the definition of: “${c.term}”?`,
        choices: makeChoices(state.flashcards, c, 'definition'),
        answerIndex: 0,
        explanation: c.definition
      },
      {
        id: `fc-${idx}-d2t`,
        category: 'general',
        type: 'mcq',
        prompt: `Which term matches this definition?`,
        stem: c.definition,
        choices: makeChoices(state.flashcards, c, 'term', true),
        answerIndex: 0,
        explanation: c.term
      }
    ]));
    // Shuffle to avoid repetitive pattern
    shuffleInPlace(state.questions);
  }
}

function makeChoices(deck, correctCard, field, includeStem=false){
  // Returns an array where index 0 is correct, others are random wrong answers.
  const correct = includeStem ? correctCard[field] : correctCard[field];
  const pool = deck.filter(c => c !== correctCard).slice();
  shuffleInPlace(pool);
  const wrongs = pool.slice(0,3).map(c => c[field]);
  const choices = [correct, ...wrongs];
  shuffleInPlace(choices);
  // Return and also inform answerIndex: we want correct's index.
  const correctIndex = choices.indexOf(correct);
  // Store on a hidden symbol via property for convenience
  choices._correctIndex = correctIndex;
  return choices;
}

function routeTo(route, params={}){
  state.route = route;

  // Toggle home button
  homeBtn.hidden = (route === 'home');

  // Render
  viewEl.innerHTML = '';
  if (route === 'home'){
    setSubtitle('Home');
    viewEl.appendChild(createHomeView({
      onOpenFlashcards: ()=>routeTo('flashcards'),
      onOpenRandom: ()=>routeTo('test', { mode:'random' }),
      onOpenQuick10: ()=>routeTo('test', { mode:'quick10' }),
      onOpenMock: ()=>routeTo('test', { mode:'mock' }),
    }));
    return;
  }

  if (route === 'settings'){
    setSubtitle('Settings');
    viewEl.appendChild(createSettingsView({
      settings: state.settings,
      onChange: (next)=>{
        state.settings = next;
        store.set('settings', next);
        toast('Saved');
      }
    }));
    return;
  }

  if (route === 'flashcards'){
    setSubtitle('Flashcards');
    viewEl.appendChild(createFlashcardsView({
      cards: state.flashcards,
      firstSide: state.settings.flashcardsFirstSide,
    }));
    return;
  }

  if (route === 'test'){
    const { mode } = params;
    const title = mode==='random' ? 'Random Question' : mode==='quick10' ? 'Quick 10' : 'Mock Exam';
    setSubtitle(title);
    viewEl.appendChild(createTestView({
      mode,
      questions: state.questions,
    }));
    return;
  }
}

homeBtn.addEventListener('click', ()=>{
   routeTo('home');
});
settingsBtn.addEventListener('click', ()=>{
  routeTo(state.route === 'settings' ? 'home' : 'settings');
});

(async function main(){
  await initData();
  routeTo('home');
  registerSW();
  maybeShowA2HS();
})();
