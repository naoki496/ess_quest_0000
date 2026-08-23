(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const rand = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
  const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];
  const shuffle = (arr) => {
    const a=[...arr];
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  };

  const STORAGE_KEY='sansuQuestSave_v10';
  const DEFAULT_SAVE={gold:0,owned:[],frontClears:0,backClears:0,backUnlocked:false};
  let save=loadSave();

  const FRONT_STAGES=[
    {name:'はじまりの もり',key:'forest',count:10,bgm:'Cybern.mp3',bg:'bg_forest.png',enemy:[['ぷるるスライム','slime.png'],['きのこぞう','mushroom.png']]},
    {name:'ふしぎな どうくつ',key:'cave',count:10,bgm:'Cold Amber.mp3',bg:'bg_cave.png',enemy:[['クリスタルバット','crystal.png'],['いわゴーレム','golem.png']]},
    {name:'まほうの とう',key:'tower',count:10,bgm:'Crate Lockup Tango.mp3',bg:'bg_tower.png',enemy:[['まほうつかい','wizard.png'],['そらバット','bat.png']]},
    {name:'まおうの しろ',key:'castle',count:10,bgm:'Quantized Panic.mp3',bg:'bg_castle.png',enemy:[['あくまのナイト','knight.png'],['くろゴーレム','golem.png']]},
    {name:'まおうの へや',key:'boss',count:5,bgm:'Geology.mp3',bg:'bg_boss.png',enemy:[['まおうキング','demon.png']]}
  ];
  const BACK_STAGES=[
    {name:'渋谷スクランブル交差点',key:'shibuya',count:10,bgm:'C Breaker.mp3',bg:'back_shibuya.png',enemy:[['ネオンラット','back_mouse.png'],['ぷるるスライム','slime.png']]},
    {name:'浅草寺 仲見世通り',key:'asakusa',count:10,bgm:'my war.mp3',bg:'back_asakusa.png',enemy:[['デビルスマホ','back_phone.png'],['紅灯の使い魔','wizard.png']]},
    {name:'東京スカイツリー',key:'skytree',count:10,bgm:'inside out.mp3',bg:'back_skytree.png',enemy:[['グリッチウイルス','back_virus.png'],['そらバット','bat.png']]},
    {name:'新宿 東京都庁',key:'tocho',count:10,bgm:'COKE.mp3',bg:'back_tocho.png',enemy:[['クロム・ナイト','back_knight.png'],['あくまのナイト','knight.png']]},
    {name:'魔王の部屋',key:'backboss',count:5,bgm:'FUSE.mp3',bg:'back_boss.png',enemy:[['時空魔王','demon.png']]}
  ];

  const els={
    titleScreen:$('titleScreen'),shopScreen:$('shopScreen'),collectionScreen:$('collectionScreen'),gameScreen:$('gameScreen'),
    titleHero:$('titleHero'),titleSubtitle:$('titleSubtitle'),titleEyebrow:$('titleEyebrow'),titleGold:$('titleGold'),
    playBtn:$('playBtn'),shopBtn:$('shopBtn'),collectionBtn:$('collectionBtn'),backWorldBtn:$('backWorldBtn'),frontWorldBtn:$('frontWorldBtn'),
    shopGold:$('shopGold'),shopFilters:$('shopFilters'),shopList:$('shopList'),shopBackBtn:$('shopBackBtn'),
    collectionCount:$('collectionCount'),collectionGrid:$('collectionGrid'),collectionDetail:$('collectionDetail'),collectionBackBtn:$('collectionBackBtn'),
    progressText:$('progressText'),progressFill:$('progressFill'),stageLabel:$('stageLabel'),stageName:$('stageName'),lifeDisplay:$('lifeDisplay'),timerText:$('timerText'),soundBtn:$('soundBtn'),
    battleBg:$('battleBg'),heroName:$('heroName'),heroImage:$('heroImage'),enemyName:$('enemyName'),enemyImage:$('enemyImage'),mathProblem:$('mathProblem'),feedbackText:$('feedbackText'),choices:$('choices'),
    mapOverlay:$('mapOverlay'),mapModeLabel:$('mapModeLabel'),mapTitle:$('mapTitle'),mapImage:$('mapImage'),mapMarker:$('mapMarker'),mapMessage:$('mapMessage'),
    stageOverlay:$('stageOverlay'),stagePreview:$('stagePreview'),stageOverlayLabel:$('stageOverlayLabel'),stageOverlayName:$('stageOverlayName'),
    stageClearOverlay:$('stageClearOverlay'),stageClearName:$('stageClearName'),
    resultOverlay:$('resultOverlay'),resultMistakes:$('resultMistakes'),resultTimeouts:$('resultTimeouts'),resultRestarts:$('resultRestarts'),resultGold:$('resultGold'),resultErrors:$('resultErrors'),replayBtn:$('replayBtn'),toTitleBtn:$('toTitleBtn'),
    rewardOverlay:$('rewardOverlay'),rewardIcon:$('rewardIcon'),rewardName:$('rewardName'),rewardText:$('rewardText'),rewardOkBtn:$('rewardOkBtn'),transitionFx:$('transitionFx')
  };

  let mode='front',stageIndex=0,stageQuestion=0,totalProgress=0,lives=3,timeLeft=60,timerId=null,locked=true,soundOn=true;
  let runStageRewards=new Set(),stats={mistakes:0,timeouts:0,restarts:0,errors:[],gold:0};
  let currentQuestion=null,currentBgm=null;
  const correctSE=new Audio('./assets/correct.mp3'),wrongSE=new Audio('./assets/wrong.mp3');

  function loadSave(){
    try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY));return {...DEFAULT_SAVE,...s,owned:Array.isArray(s?.owned)?s.owned:[100]};}catch{return {...DEFAULT_SAVE,owned:[100]};}
  }
  function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(save));renderTitle();}

  const ICONS=['🗡️','🛡️','💍','📜','🧪','🔮','🏹','🪄','🧿','🕯️','🪙','🧭','🪶','⚙️','💎','🏺','🔔','🧰','🗝️','👑'];
  function buildItems(){
    const commonA=['さびた','旅人の','青銅の','革の','鉄の','古びた','木の','見習いの','小さな','森の'];
    const commonB=['ショートソード','バックラー','指輪','ブーツ','ランタン'];
    const uncommonA=['銀の','月明かりの','黒曜石の','ルーンの','深海の','紅玉の','蒼玉の','雷の','氷の','炎の'];
    const uncommonB=['ロングソード','護符','ランタン'];
    const rareNames=['勇者の剣','天青の大盾','賢者の杖','竜翼の弓','不死鳥の羽','海竜のうろこ','星くずのティアラ','月の王冠','太陽の王冠','賢者の石','古代竜の卵','王の聖杯','深淵の鏡','天使の羽飾り','魔王の指輪','世界樹の種','永遠の砂時計','虹色水晶','星渡りのコンパス','時空の鍵'];
    const out=[];
    let id=1;
    for(const a of commonA)for(const b of commonB)out.push({id:id++,name:a+b,rarity:'common',price:10+((id-2)%4)*5,icon:ICONS[(id-2)%ICONS.length],flavor:'長い旅のどこかで使われてきた、素朴な冒険の品。'});
    for(let i=0;i<30;i++){const name=uncommonA[i%uncommonA.length]+uncommonB[Math.floor(i/uncommonA.length)%uncommonB.length];out.push({id:id++,name,rarity:'uncommon',price:30+(i%7)*5,icon:ICONS[(i+6)%ICONS.length],flavor:'淡い魔力を宿し、持つ者に不思議な物語を感じさせる品。'});}
    for(let i=0;i<20;i++)out.push({id:id++,name:rareNames[i],rarity:'rare',price:i===19?null:Math.min(150,70+i*5),icon:i===19?'🗝️':ICONS[(i+12)%ICONS.length],flavor:i===19?'時空の扉を開くと伝わる神秘の鍵。持つ者に新たな世界への扉を見る力を与える。':'めったに目にすることのない、特別な力と伝説を宿した宝。'});
    return out;
  }
  const ITEMS=buildItems();
  const rarityLabel={common:'コモン',uncommon:'アンコモン',rare:'レア'};

  function showOnly(el){[els.titleScreen,els.shopScreen,els.collectionScreen,els.gameScreen].forEach(x=>x.hidden=x!==el);}
  function renderTitle(){
    document.body.dataset.mode=mode;
    els.titleGold.textContent=`${save.gold} G`;
    if(mode==='front'){
      els.titleHero.src='./assets/hero.png';els.titleEyebrow.textContent='MATH FANTASY ADVENTURE';els.titleSubtitle.innerHTML='計算で道をひらき、5つのエリアを進む。<br>最後に待つ魔王を倒せ。';els.playBtn.textContent='ぼうけんを はじめる';
      els.backWorldBtn.hidden=!save.backUnlocked;els.frontWorldBtn.hidden=true;
    }else{
      els.titleHero.src='./assets/back_hero.png';els.titleEyebrow.textContent='NIGHT TOKYO / ANOTHER QUEST';els.titleSubtitle.innerHTML='夜の東京を巡り、時空の裂け目の先へ。<br>魔法少女のもう一つの冒険。';els.playBtn.textContent='ウラ面を はじめる';
      els.backWorldBtn.hidden=true;els.frontWorldBtn.hidden=false;
    }
  }

  async function transition(kind='normal',ms=1400){
    els.transitionFx.classList.toggle('back',kind==='back');els.transitionFx.hidden=false;await sleep(ms);els.transitionFx.hidden=true;
  }

  function renderShop(filter='all'){
    els.shopGold.textContent=`${save.gold} G`;
    const filters=[['all','すべて'],['common','コモン'],['uncommon','アンコモン'],['rare','レア'],['missing','もっていない']];
    els.shopFilters.innerHTML='';filters.forEach(([k,t])=>{const b=document.createElement('button');b.textContent=t;b.className=k===filter?'active':'';b.onclick=()=>renderShop(k);els.shopFilters.appendChild(b);});
    els.shopList.innerHTML='';
    ITEMS.filter(it=>it.id!==100).filter(it=>filter==='all'||it.rarity===filter||(filter==='missing'&&!save.owned.includes(it.id))).forEach(it=>{
      const owned=save.owned.includes(it.id),row=document.createElement('div');row.className='shop-row';row.innerHTML=`<div class="item-icon">${it.icon}</div><div class="item-name"><b>${it.name}</b><small class="rarity-${it.rarity}">${rarityLabel[it.rarity]}</small></div><div>${it.price} G</div><button class="buy-btn" ${owned||save.gold<it.price?'disabled':''}>${owned?'もっている':'購入'}</button>`;
      row.querySelector('button').onclick=()=>{if(!owned&&save.gold>=it.price){save.gold-=it.price;save.owned.push(it.id);persist();renderShop(filter);}};els.shopList.appendChild(row);
    });
  }

  function renderCollection(){
    els.collectionCount.textContent=`${save.owned.length} / 100`;els.collectionGrid.innerHTML='';
    ITEMS.forEach(it=>{const owned=save.owned.includes(it.id);const c=document.createElement('button');c.className=`collection-cell ${owned?'':'locked'}`;c.textContent=owned?it.icon:'?';c.title=owned?it.name:'？？？？？？';c.onclick=()=>showItemDetail(it,owned);els.collectionGrid.appendChild(c);});
  }
  function showItemDetail(it,owned){
    els.collectionDetail.innerHTML=owned?`<div class="detail-icon">${it.icon}</div><h3>${it.name}</h3><p class="rarity-${it.rarity}">${rarityLabel[it.rarity]}</p><p>${it.flavor}</p>`:`<div class="detail-icon">?</div><h3>？？？？？？</h3><p>まだ手に入れていないアイテムです。</p>`;
  }

  function getStages(){return mode==='front'?FRONT_STAGES:BACK_STAGES;}
  function stageStartTotal(idx){return getStages().slice(0,idx).reduce((a,s)=>a+s.count,0);}
  function resetRun(){stageIndex=0;stageQuestion=0;totalProgress=0;lives=3;runStageRewards=new Set();stats={mistakes:0,timeouts:0,restarts:0,errors:[],gold:0};locked=true;}

  function makeFrontQuestion(idx){
    if(idx===0){if(Math.random()<.5){let a=rand(1,8),b=rand(1,8-a);return q2(a,'+',b);}let a=rand(2,9),b=rand(1,a-1);return q2(a,'-',b);}
    if(idx===1){for(let i=0;i<500;i++){let a=rand(10,29),b=rand(1,9),op=Math.random()<.5?'+':'-';if(op==='+'&&(a%10)+(b%10)<=9)return q2(a,op,b);if(op==='-'&&(a%10)>=b)return q2(a,op,b);}return q2(12,'+',6);}
    if(idx===2){for(let i=0;i<1200;i++){let a=rand(10,79),b=rand(10,79),op=Math.random()<.5?'+':'-';if(op==='+'&&(a%10)+(b%10)<=9&&Math.floor(a/10)+Math.floor(b/10)<=9)return q2(a,op,b);if(op==='-'&&a>b&&(a%10)>=(b%10)&&Math.floor(a/10)>=Math.floor(b/10))return q2(a,op,b);}return q2(24,'+',13);}
    return makeNoCarryThree(idx===4);
  }
  function makeNoCarryThree(boss=false){
    const pats=[['+','+'],['-','-'],['+','-'],['-','+']];
    for(let z=0;z<5000;z++){const ops=pick(pats),a=rand(boss?40:10,boss?99:79),b=rand(boss?10:1,boss?49:39),c=rand(boss?10:1,boss?39:29);let v=a,ok=true;for(const [op,n] of [[ops[0],b],[ops[1],c]]){if(op==='+'){if((v%10)+(n%10)>9||Math.floor(v/10)+Math.floor(n/10)>9){ok=false;break;}v+=n;}else{if(v<n||(v%10)<(n%10)||Math.floor(v/10)<Math.floor(n/10)){ok=false;break;}v-=n;}if(v<1||v>99)ok=false;}if(ok)return q3(a,ops[0],b,ops[1],c);}
    return q3(11,'+',28,'-',6);
  }
  function makeBackQuestion(idx){
    if(idx===0){for(let i=0;i<1000;i++){const op=Math.random()<.5?'+':'-',a=rand(10,99),b=rand(10,99);if(op==='+'&&a+b<=99&&((a%10)+(b%10)>=10||Math.floor(a/10)+Math.floor(b/10)>=10))return q2(a,op,b);if(op==='-'&&a>b&&(a%10)<(b%10))return q2(a,op,b);}return q2(47,'+',38);}
    if(idx===1){for(let i=0;i<3000;i++){const ops=pick([['+','+'],['+','-'],['-','+'],['-','-']]),a=rand(20,99),b=rand(10,89),c=rand(10,89);let v=ops[0]==='+'?a+b:a-b;if(v<=0||v>150)continue;let end=ops[1]==='+'?v+c:v-c;if(end<=0||end>199)continue;return q3(a,ops[0],b,ops[1],c);}return q3(38,'+',47,'-',26);}
    if(idx===2){for(let i=0;i<3000;i++){const ops=pick([['+','+'],['+','-'],['-','+'],['-','-']]),a=rand(100,899),b=rand(100,699),c=rand(100,699);let v=ops[0]==='+'?a+b:a-b;if(v<=0||v>1200)continue;let end=ops[1]==='+'?v+c:v-c;if(end>0&&end<=999)return q3(a,ops[0],b,ops[1],c);}return q3(438,'+',276,'-',154);}
    if(idx===3){return q2(rand(2,9),'×',rand(2,9));}
    return q2(rand(10,99),'×',rand(2,9));
  }
  function q2(a,op,b){return finishQ([a,b],[op]);}function q3(a,o1,b,o2,c){return finishQ([a,b,c],[o1,o2]);}
  function finishQ(nums,ops){let ans=nums[0];ops.forEach((op,i)=>{const n=nums[i+1];ans=op==='+'?ans+n:op==='-'?ans-n:ans*n;});return{expression:nums.map((n,i)=>i?`${ops[i-1]}${n}`:`${n}`).join(''),answer:ans};}

  function currentStage(){return getStages()[stageIndex];}
  function makeChoices(ans){if(ans===0)return shuffle([0,1,2]);return shuffle([Math.max(0,ans-1),ans,ans+1]);}
  function renderGame(){
    const s=currentStage();document.body.dataset.mode=mode;document.body.dataset.stage=stageIndex;
    els.progressText.textContent=`${totalProgress} / 45`;els.progressFill.style.width=`${totalProgress/45*100}%`;els.stageLabel.textContent=`STAGE ${stageIndex+1}`;els.stageName.textContent=s.name;els.lifeDisplay.textContent=[0,1,2].map(i=>i<lives?'♥':'♡').join(' ');els.timerText.textContent=timeLeft;
    els.battleBg.style.backgroundImage=`url('./assets/${s.bg}')`;els.heroImage.src=mode==='front'?'./assets/hero.png':'./assets/back_hero.png';els.heroName.textContent=mode==='front'?'ゆうしゃ':'魔法少女';const en=pick(s.enemy);els.enemyName.textContent=en[0];els.enemyImage.src=`./assets/${en[1]}`;
  }

  function stopTimer(){clearInterval(timerId);timerId=null;}function startTimer(){stopTimer();timeLeft=60;els.timerText.textContent=timeLeft;timerId=setInterval(()=>{timeLeft--;els.timerText.textContent=timeLeft;if(timeLeft<=0){stopTimer();resolveAnswer(null,true);}},1000);}
  function playSE(a){if(!soundOn)return;try{a.currentTime=0;a.play().catch(()=>{});}catch{}}
  async function stopBgmFade(ms=1100){if(!currentBgm)return;const a=currentBgm,start=a.volume||.32,steps=14;for(let i=1;i<=steps;i++){a.volume=start*(1-i/steps);await sleep(ms/steps);}a.pause();a.currentTime=0;a.volume=.32;currentBgm=null;}
  async function playStageBgm(){if(!soundOn)return;const file=currentStage().bgm;let a=new Audio(`./assets/${file}`);a.loop=true;a.volume=.32;try{await a.play();currentBgm=a;}catch{a=new Audio('./assets/bgm.mp3');a.loop=true;a.volume=.32;a.play().catch(()=>{});currentBgm=a;}}

  async function showMapSequence(initial=false){
    els.mapModeLabel.textContent=mode==='front'?'WORLD MAP':'NIGHT TOKYO';els.mapTitle.textContent=mode==='front'?'ぼうけんの ちず':'ウラのせかい';els.mapImage.src=mode==='front'?'./assets/world_map_v3_clean.png':'./assets/back_map.png';els.mapOverlay.hidden=false;
    const posFront=[[9,68],[30,60],[54,54],[77,58],[84,54]],posBack=[[15,60],[40,34],[67,50],[34,69],[82,72]],pos=(mode==='front'?posFront:posBack)[stageIndex];els.mapMarker.style.transition='none';els.mapMarker.style.left=initial?'4%':`${Math.max(4,pos[0]-16)}%`;els.mapMarker.style.top=initial?'78%':`${Math.min(85,pos[1]+10)}%`;void els.mapMarker.offsetWidth;els.mapMarker.style.transition='left 3.2s ease-in-out,top 3.2s ease-in-out';els.mapMarker.style.left=`${pos[0]}%`;els.mapMarker.style.top=`${pos[1]}%`;els.mapMessage.textContent=initial?'最初のエリアへ向かっています…':'次のエリアへ移動しています…';await sleep(3900);els.mapOverlay.hidden=true;
    const s=currentStage();els.stagePreview.style.backgroundImage=`url('./assets/${s.bg}')`;els.stageOverlayLabel.textContent=`STAGE ${stageIndex+1}`;els.stageOverlayName.textContent=s.name;els.stageOverlay.hidden=false;await sleep(1500);els.stageOverlay.hidden=true;
  }

  async function startAdventure(){resetRun();showOnly(els.gameScreen);await transition(mode==='back'?'back':'normal',1300);await showMapSequence(true);await playStageBgm();await nextQuestion();}
  async function nextQuestion(){locked=true;renderGame();currentQuestion=mode==='front'?makeFrontQuestion(stageIndex):makeBackQuestion(stageIndex);els.mathProblem.textContent=`${currentQuestion.expression}=?`;els.feedbackText.textContent='';els.choices.innerHTML='';makeChoices(currentQuestion.answer).forEach(v=>{const b=document.createElement('button');b.textContent=v;b.onclick=()=>resolveAnswer(v,false);els.choices.appendChild(b);});locked=false;startTimer();}

  async function resolveAnswer(value,timeout=false){if(locked)return;locked=true;stopTimer();[...els.choices.children].forEach(b=>{b.disabled=true;if(Number(b.textContent)===currentQuestion.answer)b.classList.add('correct');if(value!==null&&Number(b.textContent)===value&&value!==currentQuestion.answer)b.classList.add('wrong');});
    if(!timeout&&value===currentQuestion.answer){playSE(correctSE);els.feedbackText.textContent='せいかい！';await sleep(650);stageQuestion++;totalProgress++;if(stageQuestion>=currentStage().count){await clearStage();}else await nextQuestion();return;}
    playSE(wrongSE);stats.mistakes++;if(timeout)stats.timeouts++;stats.errors.push({q:currentQuestion.expression,selected:timeout?'時間切れ':value,answer:currentQuestion.answer});lives--;els.feedbackText.textContent=timeout?`じかんぎれ！ 正解は ${currentQuestion.answer}`:`ざんねん！ 正解は ${currentQuestion.answer}`;renderGame();await sleep(1500);if(lives<=0){stats.restarts++;lives=3;totalProgress=stageStartTotal(stageIndex);stageQuestion=0;}await nextQuestion();
  }

  async function clearStage(){
    if(!runStageRewards.has(stageIndex)){runStageRewards.add(stageIndex);save.gold+=5;stats.gold+=5;persist();}
    els.stageClearName.textContent=currentStage().name;els.stageClearOverlay.hidden=false;const fade=stopBgmFade(1200);await sleep(1250);els.stageClearOverlay.hidden=true;await fade;
    if(stageIndex>=getStages().length-1){await finishRun();return;}
    stageIndex++;stageQuestion=0;lives=3;await showMapSequence(false);await playStageBgm();await nextQuestion();
  }

  async function finishRun(){
    stopTimer();await stopBgmFade(500);let reward=null;
    if(mode==='front'){save.frontClears++;if(!save.backUnlocked){save.backUnlocked=true;if(!save.owned.includes(100))save.owned.push(100);reward=ITEMS.find(i=>i.id===100);}else reward=randomReward();}
    else{save.backClears++;reward=randomReward();}
    persist();renderResult();els.resultOverlay.hidden=false;
    if(reward){await sleep(600);els.rewardIcon.textContent=reward.icon;els.rewardName.textContent=reward.name;els.rewardText.textContent=reward.id===100?'時空の扉が開いた……。表のタイトルに「ウラステージへ」が追加されました。':'ゲームクリア報酬として、新しいコレクションアイテムを手に入れた！';els.rewardOverlay.hidden=false;}
  }
  function randomReward(){const unowned=ITEMS.filter(i=>!save.owned.includes(i.id)&&i.id!==100);if(!unowned.length)return null;const roll=Math.random(),rar=roll<.6?'common':roll<.9?'uncommon':'rare';let pool=unowned.filter(i=>i.rarity===rar);if(!pool.length)pool=unowned;const r=pick(pool);save.owned.push(r.id);persist();return r;}
  function renderResult(){els.resultMistakes.textContent=stats.mistakes;els.resultTimeouts.textContent=stats.timeouts;els.resultRestarts.textContent=stats.restarts;els.resultGold.textContent=`${stats.gold} G`;els.resultErrors.innerHTML=stats.errors.length?stats.errors.map(e=>`<div class="error-row"><b>${e.q}=?</b>　あなた: ${e.selected}　正解: ${e.answer}</div>`).join(''):'<div class="error-row">ミスはありませんでした！</div>';}

  els.playBtn.onclick=startAdventure;
  els.shopBtn.onclick=async()=>{await transition(mode==='back'?'back':'normal',900);showOnly(els.shopScreen);renderShop();};
  els.collectionBtn.onclick=async()=>{await transition(mode==='back'?'back':'normal',900);showOnly(els.collectionScreen);renderCollection();};
  els.shopBackBtn.onclick=async()=>{await transition(mode==='back'?'back':'normal',900);showOnly(els.titleScreen);renderTitle();};
  els.collectionBackBtn.onclick=els.shopBackBtn.onclick;
  els.backWorldBtn.onclick=async()=>{await transition('back',1500);mode='back';renderTitle();showOnly(els.titleScreen);};
  els.frontWorldBtn.onclick=async()=>{await transition('normal',1500);mode='front';renderTitle();showOnly(els.titleScreen);};
  els.soundBtn.onclick=()=>{soundOn=!soundOn;els.soundBtn.textContent=`♪ ${soundOn?'ON':'OFF'}`;if(!soundOn&&currentBgm)currentBgm.pause();else if(soundOn&&currentBgm)currentBgm.play().catch(()=>{});};
  els.replayBtn.onclick=async()=>{els.resultOverlay.hidden=true;els.rewardOverlay.hidden=true;await startAdventure();};
  els.toTitleBtn.onclick=async()=>{els.resultOverlay.hidden=true;els.rewardOverlay.hidden=true;await transition(mode==='back'?'back':'normal',1100);showOnly(els.titleScreen);renderTitle();};
  els.rewardOkBtn.onclick=()=>{els.rewardOverlay.hidden=true;};

  renderTitle();showOnly(els.titleScreen);
})();
