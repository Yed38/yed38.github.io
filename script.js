document.getElementById('year').textContent = new Date().getFullYear();
const frame = document.getElementById('photoFrame');
const photo = document.getElementById('profilePhoto');
if (photo.complete && photo.naturalWidth) frame.classList.add('has-photo');
photo.addEventListener('load', () => frame.classList.add('has-photo'));
photo.addEventListener('error', () => frame.classList.remove('has-photo'));

const interestData = {
  ml: {
    label:'Foundation', title:'Machine Learning',
    question:'How can a system learn useful patterns and procedures from data rather than relying only on hand-written rules?',
    focus:'Reliable learned representations and algorithms that generalize beyond the examples seen during training.',
    connection:'The common foundation for my work on reasoning, neuro-symbolic methods, continual learning, and reinforcement learning.'
  },
  reasoning: {
    label:'Inference', title:'Reasoning Problems',
    question:'How can a model combine facts and intermediate steps to reach a valid conclusion?',
    focus:'Structured problems that require mathematical, logical, or multi-step inference—not only pattern matching.',
    connection:'Provides the tasks on which neuro-symbolic methods and generalization can be studied concretely.'
  },
  neurosymbolic: {
    label:'Structure', title:'Neuro-symbolic Learning',
    question:'How can flexible neural representations work together with explicit symbols, rules, or executors?',
    focus:'Separating learned local decisions from structured symbolic computation when that improves reliability.',
    connection:'Connects machine learning with interpretable operations that can support systematic reasoning.'
  },
  length: {
    label:'Generalization', title:'Length Generalization',
    question:'Can a procedure learned on short examples still work when the input or reasoning chain becomes much longer?',
    focus:'Reducing dependence on training-time sequence length by learning reusable, bounded operations.',
    connection:'A central test of whether a reasoning model has learned a procedure rather than memorized familiar sizes.'
  },
  continual: {
    label:'Adaptation', title:'Continual Learning',
    question:'How can a model acquire new knowledge over time without erasing what it learned before?',
    focus:'Adaptation under changing data and tasks while limiting catastrophic forgetting.',
    connection:'Extends reliable learning from a fixed training set to systems that evolve after deployment.'
  },
  rl: {
    label:'Interaction', title:'Reinforcement Learning',
    question:'How can an agent learn a sequence of decisions from actions, feedback, and delayed outcomes?',
    focus:'Decision-making strategies that improve through interaction rather than labeled examples alone.',
    connection:'Offers a complementary view of multi-step reasoning as choosing useful actions over time.'
  }
};

const interestButtons = [...document.querySelectorAll('.interest-node')];
const interestDetail = document.getElementById('interestDetail');
function renderInterest(key) {
  const item = interestData[key];
  document.getElementById('interestLabel').textContent=item.label;
  document.getElementById('interestTitle').textContent=item.title;
  document.getElementById('interestQuestion').textContent=item.question;
  document.getElementById('interestFocus').textContent=item.focus;
  document.getElementById('interestConnection').textContent=item.connection;
  interestButtons.forEach(button=>{const selected=button.dataset.interest===key;button.classList.toggle('active',selected);button.setAttribute('aria-selected',String(selected));});
  interestDetail.style.animation='none'; requestAnimationFrame(()=>{interestDetail.style.animation='';});
}
interestButtons.forEach(button=>button.addEventListener('click',()=>renderInterest(button.dataset.interest)));
renderInterest('ml');

const stageCopy = [
  ['Split text into tokens','A tokenizer breaks text into reusable pieces. Transformers process token IDs—not raw words—and punctuation or parts of a word may become separate tokens.'],
  ['Give every token meaning and order','A learned embedding turns each token into a vector. Position information is added because attention alone does not know which token came first. The resulting sequence of vectors is X.'],
  ['Create three views of each token','Learned matrices project X into Query, Key, and Value vectors. Query asks what a token needs; Key advertises what a token contains; Value carries the content that can be retrieved.'],
  ['Use query–key scores to select','A Query is compared with all Keys. After scaling and softmax, the scores become weights that answer: “How much should this token read from every other token?”'],
  ['Mix the selected content','The attention weights multiply the Value vectors. Their weighted sum produces a context-aware representation containing the information selected for this token.'],
  ['Run several heads, then transform locally','Different heads can focus on entities, relations, or the question at the same time. Their outputs are concatenated; an FFN then applies the same local nonlinear transformation to each token.'],
  ['Predict one token, append it, and repeat','The final representation becomes probabilities over the vocabulary. The chosen token is appended to the sequence, and the Transformer runs again to generate the next token.']
];

const stageCanvas = document.getElementById('stageCanvas');
const stageNumber = document.getElementById('stageNumber');
const stageTitle = document.getElementById('stageTitle');
const stageText = document.getElementById('stageText');
const play = document.getElementById('playTransformer');
const stageButtons = [...document.querySelectorAll('.stage-button')];
let currentStage = 0;
let playTimer = null;

const visualStages = [
  `<div class="stage-visual"><p class="visual-kicker">Raw text → token pieces</p><p class="prompt-line">Alice is older than Bob. Bob is older than Carol. Who is youngest?</p><div class="token-row"><span class="token-chip">Alice<small>3815</small></span><span class="token-chip">is<small>318</small></span><span class="token-chip">older<small>6342</small></span><span class="token-chip">than<small>621</small></span><span class="token-chip">Bob<small>5811</small></span><span class="token-chip">…<small>tokens</small></span><span class="token-chip accent">youngest<small>12204</small></span><span class="token-chip">?<small>30</small></span></div></div>`,
  `<div class="stage-visual"><p class="visual-kicker">Token vector + position vector = input representation X</p><div class="vector-row"><div class="vector-card"><strong>“youngest” embedding</strong><div class="number-vector"><i>.21</i><i>−.47</i><i>.08</i><i>…</i></div></div><span class="plus">+</span><div class="vector-card"><strong>position 13</strong><div class="number-vector"><i>.64</i><i>.12</i><i>−.31</i><i>…</i></div></div><span class="plus">=</span><div class="vector-card"><strong>X<sub>13</sub></strong><div class="number-vector"><i>.85</i><i>−.35</i><i>−.23</i><i>…</i></div></div></div></div>`,
  `<div class="stage-visual"><p class="visual-kicker">The same X is projected through three learned matrices</p><div class="qkv-grid"><div class="qkv-card"><b>Query</b><code>Q = XW<sub>Q</sub></code><p>What information does “youngest” need?</p></div><div class="qkv-card"><b>Key</b><code>K = XW<sub>K</sub></code><p>What information can each token offer?</p></div><div class="qkv-card"><b>Value</b><code>V = XW<sub>V</sub></code><p>What content will each token contribute?</p></div></div></div>`,
  `<div class="stage-visual"><p class="visual-kicker">Query for “youngest” scores every key → softmax weights</p><div class="attention-map"><span>Alice</span><div class="weight-track"><i style="--weight:24%"></i></div><span>older than</span><div class="weight-track"><i style="--weight:72%"></i></div><span>Bob</span><div class="weight-track"><i style="--weight:58%"></i></div><span>Carol</span><div class="weight-track"><i style="--weight:94%"></i></div><span>youngest?</span><div class="weight-track"><i style="--weight:81%"></i></div></div></div>`,
  `<div class="stage-visual"><p class="visual-kicker">Weights choose; values carry the information</p><div class="mix-flow"><div class="value-stack"><span style="--opacity:.45">0.24 × Alice vector</span><span style="--opacity:.8">0.72 × relation vector</span><span style="--opacity:.68">0.58 × Bob vector</span><span style="--opacity:1">0.94 × Carol vector</span></div><span class="flow-arrow">→ Σ →</span><div class="context-card"><strong>Context-aware “youngest” representation</strong><br>Contains a weighted mixture of entities, relations, and the question.</div></div></div>`,
  `<div class="stage-visual"><p class="visual-kicker">Parallel attention heads capture different patterns</p><div class="head-grid"><div class="head-card"><b>Head 1 · entities</b>Alice, Bob, Carol</div><div class="head-card"><b>Head 2 · relations</b>older-than chain</div><div class="head-card"><b>Head 3 · question</b>retrieve the youngest</div></div><div class="merge-strip">concatenate heads → output projection</div><div class="ffn-flow"><div class="context-card">Contextual token vector</div><span class="flow-arrow">→</span><div class="ffn-card"><strong>FFN</strong><br>Local nonlinear transformation applied to this token</div></div></div>`,
  `<div class="stage-visual"><p class="visual-kicker">Vocabulary probabilities → choose → append → run again</p><div class="prediction-bars"><div class="prediction-row"><span>Carol</span><div class="weight-track"><i style="--weight:86%"></i></div><b>86%</b></div><div class="prediction-row"><span>Bob</span><div class="weight-track"><i style="--weight:9%"></i></div><b>9%</b></div><div class="prediction-row"><span>Alice</span><div class="weight-track"><i style="--weight:5%"></i></div><b>5%</b></div></div><div class="timeline"><span>Prompt</span><em>→</em><span class="generated">Carol</span><em>append and repeat →</em><span>&lt;end&gt;</span></div></div>`
];

function renderStage(stage) {
  currentStage = stage;
  stageButtons.forEach((button,index) => { button.classList.toggle('active',index===stage); button.setAttribute('aria-selected',String(index===stage)); });
  stageNumber.textContent=String(stage+1).padStart(2,'0'); stageTitle.textContent=stageCopy[stage][0]; stageText.textContent=stageCopy[stage][1];
  stageCanvas.innerHTML = visualStages[stage];
}

stageButtons.forEach(button=>button.addEventListener('click',()=>{ clearInterval(playTimer); playTimer=null; play.textContent='Play the flow'; renderStage(Number(button.dataset.stage)); }));
play.addEventListener('click',()=>{
  if(playTimer){ clearInterval(playTimer); playTimer=null; play.textContent='Play the flow'; return; }
  currentStage=currentStage===6?0:currentStage; renderStage(currentStage); play.textContent='Pause';
  playTimer=setInterval(()=>{ if(currentStage===6){clearInterval(playTimer);playTimer=null;play.textContent='Replay';return;} renderStage(currentStage+1); },2400);
});
requestAnimationFrame(()=>renderStage(0));
