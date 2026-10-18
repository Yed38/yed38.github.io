document.getElementById('year').textContent = new Date().getFullYear();
const frame = document.getElementById('photoFrame');
const photo = document.getElementById('profilePhoto');
if (photo.complete && photo.naturalWidth) frame.classList.add('has-photo');
photo.addEventListener('load', () => frame.classList.add('has-photo'));
photo.addEventListener('error', () => frame.classList.remove('has-photo'));

const inputWords = ['Alice','is older than','Bob','.','Bob','is older than','Carol','.','Who','is youngest','?'];
const outputWords = ['<start>','Carol','<end>'];
const stageCopy = [
  ['Text becomes vectors','The facts and question are split into tokens. Each token becomes a numerical representation combined with information about its position in the sequence.'],
  ['Multiple heads add context','Inside the encoder, multi-head self-attention runs several attention operations in parallel. Different heads can emphasize the Alice–Bob relation, the Bob–Carol relation, or the question while building contextual representations.'],
  ['The encoder stores the problem','After several attention and feed-forward layers, the encoder outputs one contextual vector for each input token. Together these vectors represent the facts and the question for the decoder.'],
  ['The decoder reads only the past','The decoder begins with a start token and generates left to right. Masked multi-head self-attention prevents every head from looking at future output tokens, because those tokens do not exist yet.'],
  ['Decoder heads look back at the problem','Multi-head cross-attention is the bridge: decoder Queries score encoder Keys in parallel. While producing “Carol”, different heads can retrieve Carol, the “older than” relations, and the request for the youngest person.'],
  ['A probability becomes the answer','The decoder representation is projected to a probability for every vocabulary token. “Carol” is selected and appended, then generation continues until the decoder emits an end token. The probabilities here are illustrative.']
];

const inputRail = document.getElementById('inputTokens');
const outputRail = document.getElementById('outputTokens');
const lab = document.getElementById('transformerLab');
const svg = document.getElementById('connectionLayer');
const encoder = document.getElementById('encoderStack');
const decoder = document.getElementById('decoderStack');
const memory = document.getElementById('memoryBridge');
const predictionPanel = document.getElementById('predictionPanel');
const stageNumber = document.getElementById('stageNumber');
const stageTitle = document.getElementById('stageTitle');
const stageText = document.getElementById('stageText');
const play = document.getElementById('playTransformer');
const stageButtons = [...document.querySelectorAll('.stage-button')];
let currentStage = 0;
let playTimer = null;

function makeTokens(words, container, prefix) {
  words.forEach((word,index) => {
    const token = document.createElement('span');
    token.className = 'sim-token'; token.textContent = word;
    token.id = `${prefix}-${index}`; container.appendChild(token);
  });
}
makeTokens(inputWords,inputRail,'input');
makeTokens(outputWords,outputRail,'output');

function point(element,edge) {
  const box = element.getBoundingClientRect();
  const root = lab.getBoundingClientRect();
  return { x:box.left-root.left+box.width/2, y:(edge === 'top' ? box.top : box.bottom)-root.top };
}
function line(from,to,weight=0.5,cross=false) {
  const path = document.createElementNS('http://www.w3.org/2000/svg','path');
  const bend = Math.max(28,Math.abs(to.y-from.y)*.35);
  path.setAttribute('d',`M ${from.x} ${from.y} C ${from.x} ${from.y+bend}, ${to.x} ${to.y-bend}, ${to.x} ${to.y}`);
  path.setAttribute('class',`attention-line${cross?' cross':''}`);
  path.style.strokeWidth = `${.7+weight*4}px`; path.style.opacity = `${.12+weight*.72}`;
  svg.appendChild(path);
}
function clearLines() { svg.innerHTML=''; svg.setAttribute('viewBox',`0 0 ${lab.clientWidth} ${lab.clientHeight}`); }
function markTokens(container,visible,focus=[]) {
  [...container.children].forEach((token,index) => {
    token.classList.toggle('dim',!visible.includes(index));
    token.classList.toggle('focus',focus.includes(index));
  });
}
function renderStage(stage) {
  currentStage = stage; clearLines();
  stageButtons.forEach((button,index) => { button.classList.toggle('active',index===stage); button.setAttribute('aria-selected',String(index===stage)); });
  stageNumber.textContent=String(stage+1).padStart(2,'0'); stageTitle.textContent=stageCopy[stage][0]; stageText.textContent=stageCopy[stage][1];
  encoder.className='model-stack encoder-stack'; decoder.className='model-stack decoder-stack'; memory.className='memory-bridge';
  predictionPanel.classList.toggle('visible',stage===5);
  markTokens(inputRail,inputWords.map((_,i)=>i),[]); markTokens(outputRail,stage<3?[]:[0,1],stage===5?[1]:[]);
  if(stage===0){ encoder.classList.add('inactive'); decoder.classList.add('inactive'); }
  if(stage===1){ encoder.classList.add('active'); decoder.classList.add('inactive');
    const focus=4; markTokens(inputRail,inputWords.map((_,i)=>i),[focus]);
    const weights=[.42,.72,.95,.08,1,.78,.9,.06,.12,.2,.03]; inputWords.forEach((_,i)=>line(point(document.getElementById(`input-${focus}`),'bottom'),point(document.getElementById(`input-${i}`),'bottom'),weights[i]));
  }
  if(stage===2){ encoder.classList.add('active'); memory.classList.add('active'); decoder.classList.add('inactive'); }
  if(stage===3){ encoder.classList.add('inactive'); decoder.classList.add('active'); markTokens(outputRail,[0,1],[1]);
    line(point(document.getElementById('output-1'),'top'),point(document.getElementById('output-0'),'top'),.72,true);
  }
  if(stage===4){ decoder.classList.add('active'); memory.classList.add('active'); decoder.querySelector('.cross-layer').classList.add('active'); markTokens(outputRail,[0,1],[1]);
    const weights=[.2,.58,.3,.03,.55,.72,1,.04,.38,.82,.08]; weights.forEach((weight,i)=>line(point(document.getElementById(`input-${i}`),'bottom'),point(document.getElementById('output-1'),'top'),weight,true));
  } else decoder.querySelector('.cross-layer').classList.remove('active');
  if(stage===5){ decoder.classList.add('active'); memory.classList.add('active'); markTokens(outputRail,[0,1],[1]); }
}

stageButtons.forEach(button=>button.addEventListener('click',()=>{ clearInterval(playTimer); playTimer=null; play.textContent='Play the flow'; renderStage(Number(button.dataset.stage)); }));
play.addEventListener('click',()=>{
  if(playTimer){ clearInterval(playTimer); playTimer=null; play.textContent='Play the flow'; return; }
  currentStage=currentStage===5?0:currentStage; renderStage(currentStage); play.textContent='Pause';
  playTimer=setInterval(()=>{ if(currentStage===5){clearInterval(playTimer);playTimer=null;play.textContent='Replay';return;} renderStage(currentStage+1); },1800);
});
window.addEventListener('resize',()=>renderStage(currentStage));
requestAnimationFrame(()=>renderStage(0));
