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

  // Keep important names on one line on every device. CSS supplies the normal
  // responsive size; this helper only steps the font down further when a long
  // Japanese name would otherwise wrap or overflow on a narrow screen.
  function fitSingleLineText(el,{maxWidthRatio=.92,minPx=16}={}){
    if(!el)return;
    el.style.removeProperty('font-size');
    const maxWidth=Math.max(80,window.innerWidth*maxWidthRatio);
    el.style.maxWidth=`${maxWidth}px`;
    el.style.whiteSpace='nowrap';
    const base=parseFloat(getComputedStyle(el).fontSize)||32;
    let size=base;
    while(el.scrollWidth>maxWidth&&size>minPx){size=Math.max(minPx,size-1);el.style.fontSize=`${size}px`;}
  }
  function fitVisibleNames(){
    fitSingleLineText(els?.stageOverlayName,{maxWidthRatio:.90,minPx:20});
    fitSingleLineText($('bossNameText'),{maxWidthRatio:.90,minPx:20});
    fitSingleLineText(els?.stageClearName,{maxWidthRatio:.90,minPx:18});
    fitSingleLineText(els?.stageName,{maxWidthRatio:.42,minPx:10});
    fitSingleLineText(els?.enemyName,{maxWidthRatio:.31,minPx:9});
  }

  const STORAGE_KEY='sansuQuestSave_v10';
  const DEBUG_SESSION_KEY='sansuQuestDebugFullUnlock_v1';
  let debugFullUnlock=false;
  try{debugFullUnlock=sessionStorage.getItem(DEBUG_SESSION_KEY)==='1';}catch{}
  const DEFAULT_SAVE={gold:0,owned:[],frontClears:0,backClears:0,backUnlocked:false,monsterBook:{front:[],back:[]},monsterEncounters:{front:{},back:{}},musicUnlocked:{front:[],back:[]}};
  let save=loadSave();

  const FRONT_STAGES=[
    {name:'はじまりの もり',key:'forest',count:15,normalCount:10,bossCount:5,bgm:'Cybern.mp3',bossBgm:'boss.mp3',bg:'bg_forest.png',boss:['森王トレントロード','boss_front_1.png']},
    {name:'ふしぎな どうくつ',key:'cave',count:15,normalCount:10,bossCount:5,bgm:'Cold Amber.mp3',bossBgm:'boss.mp3',bg:'bg_cave.png',boss:['晶竜グランクリスタ','boss_front_2.png']},
    {name:'まほうの とう',key:'tower',count:15,normalCount:10,bossCount:5,bgm:'Crate Lockup Tango.mp3',bossBgm:'boss.mp3',bg:'bg_tower.png',boss:['大魔導師アストラル','boss_front_3.png']},
    {name:'まおうの しろ',key:'castle',count:15,normalCount:10,bossCount:5,bgm:'Quantized Panic.mp3',bossBgm:'boss.mp3',bg:'bg_castle.png',boss:['黒騎将ヴァルガス','boss_front_4.png']},
    {name:'まおうの へや',key:'boss',count:15,normalCount:10,bossCount:5,bgm:'Geology.mp3',bossBgm:'maoh.mp3',bg:'bg_boss.png',boss:['魔王キング','boss_front_5.png']}
  ];
  const BACK_STAGES=[
    {name:'渋谷スクランブル交差点',key:'shibuya',count:15,normalCount:10,bossCount:5,bgm:'C Breaker.mp3',bossBgm:'boss.mp3',bg:'back_shibuya.png',boss:['ネオンラットキング','boss_back_1.png']},
    {name:'浅草寺 仲見世通り',key:'asakusa',count:15,normalCount:10,bossCount:5,bgm:'my war.mp3',bossBgm:'boss.mp3',bg:'back_asakusa.png',boss:['百灯鬼カグラ・極','boss_back_2.png']},
    {name:'東京スカイツリー',key:'skytree',count:15,normalCount:10,bossCount:5,bgm:'inside out.mp3',bossBgm:'boss.mp3',bg:'back_skytree.png',boss:['電波竜スカイノイズ','boss_back_3.png']},
    {name:'新宿 東京都庁',key:'tocho',count:15,normalCount:10,bossCount:5,bgm:'COKE.mp3',bossBgm:'boss.mp3',bg:'back_tocho.png',boss:['機甲騎将クロム・ゼロ','boss_back_4.png']},
    {name:'魔王の部屋',key:'backboss',count:15,normalCount:10,bossCount:5,bgm:'FUSE.mp3',bossBgm:'duel.mp3',bg:'back_boss.png',boss:['時空の魔王キング','boss_back_5.png']}
  ];

  const FRONT_MONSTER_NAMES=[
    [['ぷるるスライム',1],['きのこぞう',1],['リーフラット',2],['モリバット',2],['フラワーフェアリー',3],['白銀オオカミ',4],['虹羽ユニコーン',5]],
    [['いわムシ',1],['ケイブスライム',1],['クリスタルバット',2],['いわゴーレム',2],['宝石ミミック',3],['水晶騎士',4],['地底竜クリスタロス',5]],
    [['まほうネズミ',1],['ほんオバケ',1],['ほうきゴースト',2],['ルーンスライム',2],['まほうつかい',3],['星詠みグリフォン',4],['時の魔導獣クロノ',5]],
    [['こあくま',1],['よろいオバケ',1],['ダークバット',2],['あくまのナイト',2],['首なし騎士',3],['黒炎の竜騎士',4],['堕天獣ルシフェル',5]],
    [['シャドウ',1],['魔界スライム',1],['デーモンアイ',2],['魔剣兵',2],['深淵の魔術師',3],['魔界竜',4],['終焉獣アポカリオン',5]]
  ];
  const BACK_MONSTER_NAMES=[
    [['ネオンラット',1],['ゴミバコモドキ',1],['デビルスマホ',2],['ノイズバード',2],['シグナルゴースト',3],['ネオンケルベロス',4],['幻光獣スクランブル',5]],
    [['ちょうちんムシ',1],['せんすオバケ',1],['提灯ゴースト',2],['雷門ガード',2],['夜祭キツネ',3],['百灯鬼カグラ',4],['金色九尾ヨルミコ',5]],
    [['電波クラゲ',1],['アンテナバット',1],['グリッチウイルス',2],['ドローンアイ',2],['電脳ファントム',3],['電磁竜パルサー',4],['天空機竜スカイゼロ',5]],
    [['ケーブルワーム',1],['セキュリティアイ',1],['クロムナイト',2],['パトロールドローン',2],['機甲魔導士',3],['都市守護機アーク',4],['超機神メトロポリス',5]],
    [['バグスライム',1],['ノイズシャドウ',1],['エラーゴースト',2],['次元獣',2],['虚像魔術師',3],['時空騎士ゼロ',4],['次元喰らいウロボロス',5]]
  ];
  function buildMonsterCatalog(raw,world){
    let id=0;return raw.flatMap((stageArr,stage)=>stageArr.map(([name,rarity])=>({id:`${world}-${++id}`,world,stage,rarity,name,img:`monster_${world}_${stage+1}_${rarity}_${id}.png`})));
  }
  const FRONT_MONSTERS=buildMonsterCatalog(FRONT_MONSTER_NAMES,'front');
  const BACK_MONSTERS=buildMonsterCatalog(BACK_MONSTER_NAMES,'back');
  const RARITY_WEIGHTS=[[1,.50],[2,.30],[3,.15],[4,.04],[5,.01]];


  const els={
    titleScreen:$('titleScreen'),shopScreen:$('shopScreen'),collectionScreen:$('collectionScreen'),monsterBookScreen:$('monsterBookScreen'),gameScreen:$('gameScreen'),
    titleHero:$('titleHero'),titleSubtitle:$('titleSubtitle'),titleEyebrow:$('titleEyebrow'),titleGold:$('titleGold'),titleModeName:$('titleModeName'),titleTrackName:$('titleTrackName'),
    playBtn:$('playBtn'),shopBtn:$('shopBtn'),collectionBtn:$('collectionBtn'),monsterBookBtn:$('monsterBookBtn'),backWorldBtn:$('backWorldBtn'),frontWorldBtn:$('frontWorldBtn'),musicBtn:$('musicBtn'),debugBadge:$('debugBadge'),
    musicOverlay:$('musicOverlay'),musicCloseBtn:$('musicCloseBtn'),musicFrontTab:$('musicFrontTab'),musicBackTab:$('musicBackTab'),musicTrackList:$('musicTrackList'),musicNowTitle:$('musicNowTitle'),musicNowWhere:$('musicNowWhere'),musicPrevBtn:$('musicPrevBtn'),musicPlayBtn:$('musicPlayBtn'),musicNextBtn:$('musicNextBtn'),musicStopBtn:$('musicStopBtn'),
    debugOverlay:$('debugOverlay'),debugStatus:$('debugStatus'),debugToggleBtn:$('debugToggleBtn'),debugStagePanel:$('debugStagePanel'),debugStageGrid:$('debugStageGrid'),debugCloseBtn:$('debugCloseBtn'),
    shopGold:$('shopGold'),shopFilters:$('shopFilters'),shopList:$('shopList'),shopBackBtn:$('shopBackBtn'),
    collectionCount:$('collectionCount'),collectionGrid:$('collectionGrid'),collectionDetail:$('collectionDetail'),collectionBackBtn:$('collectionBackBtn'),
    monsterBookCount:$('monsterBookCount'),monsterBookFilters:$('monsterBookFilters'),monsterBookGrid:$('monsterBookGrid'),monsterBookBackBtn:$('monsterBookBackBtn'),monsterCardOverlay:$('monsterCardOverlay'),monsterCard:$('monsterCard'),monsterCardClose:$('monsterCardClose'),monsterCardRarity:$('monsterCardRarity'),monsterCardName:$('monsterCardName'),monsterCardImage:$('monsterCardImage'),monsterCardWorld:$('monsterCardWorld'),monsterCardStage:$('monsterCardStage'),monsterCardEncounter:$('monsterCardEncounter'),monsterCardText:$('monsterCardText'),
    progressText:$('progressText'),progressFill:$('progressFill'),stageLabel:$('stageLabel'),stageName:$('stageName'),lifeDisplay:$('lifeDisplay'),timerText:$('timerText'),soundBtn:$('soundBtn'),pauseBtn:$('pauseBtn'),
    battleBg:$('battleBg'),heroActor:$('heroActor'),heroName:$('heroName'),heroImage:$('heroImage'),attackEffect:$('attackEffect'),specialHud:$('specialHud'),specialBtn:$('specialBtn'),specialFill:$('specialFill'),bossHpHud:$('bossHpHud'),bossHpFill:$('bossHpFill'),enemyActor:$('enemyActor'),enemySprite:$('enemySprite'),enemyName:$('enemyName'),enemyImage:$('enemyImage'),answerMark:$('answerMark'),mathProblem:$('mathProblem'),feedbackText:$('feedbackText'),choices:$('choices'),
    mapOverlay:$('mapOverlay'),mapModeLabel:$('mapModeLabel'),mapTitle:$('mapTitle'),mapImage:$('mapImage'),mapMessage:$('mapMessage'),
    stageOverlay:$('stageOverlay'),stagePreview:$('stagePreview'),stageOverlayLabel:$('stageOverlayLabel'),stageOverlayName:$('stageOverlayName'),
    stageClearOverlay:$('stageClearOverlay'),stageClearName:$('stageClearName'),
    resultOverlay:$('resultOverlay'),resultMistakes:$('resultMistakes'),resultTimeouts:$('resultTimeouts'),resultRestarts:$('resultRestarts'),resultGold:$('resultGold'),resultErrors:$('resultErrors'),replayBtn:$('replayBtn'),toTitleBtn:$('toTitleBtn'),
    rewardOverlay:$('rewardOverlay'),rewardIcon:$('rewardIcon'),rewardName:$('rewardName'),rewardText:$('rewardText'),rewardOkBtn:$('rewardOkBtn'),transitionFx:$('transitionFx'),pauseOverlay:$('pauseOverlay'),pauseMenu:$('pauseMenu'),pauseConfirm:$('pauseConfirm'),pauseResumeBtn:$('pauseResumeBtn'),pauseTitleBtn:$('pauseTitleBtn'),pauseCancelTitleBtn:$('pauseCancelTitleBtn'),pauseConfirmTitleBtn:$('pauseConfirmTitleBtn'),battleCountdownOverlay:$('battleCountdownOverlay'),battleCountdownText:$('battleCountdownText'),gameOverOverlay:$('gameOverOverlay'),gameOverMessage:$('gameOverMessage'),gameOverRetryBtn:$('gameOverRetryBtn'),gameOverTitleBtn:$('gameOverTitleBtn')
  };

  let mode='front',stageIndex=0,stageQuestion=0,totalProgress=0,lives=3,timeLeft=60,timerId=null,locked=true,soundOn=true,bossPhase=false,bossQuestion=0,currentMonster=null,bossActionActive=false,bossSpecialSequence=null,paused=false,pauseRestoreLocked=false,pauseBgmShouldResume=false,countCuePlayed=false,gameOverActive=false,specialGauge=0,comboStreak=0,specialActive=false;
  let runStageRewards=new Set(),stats={mistakes:0,timeouts:0,restarts:0,errors:[],gold:0};
  let currentQuestion=null,currentBgm=null;
  const stageBgmPlayer=new Audio();
  stageBgmPlayer.loop=true;
  stageBgmPlayer.preload='auto';
  const musicPlayer=new Audio();
  musicPlayer.loop=true;
  musicPlayer.preload='auto';
  musicPlayer.volume=.38;
  let musicWorld='front',musicTrackIndex=-1;
  const correctSE=new Audio('./assets/correct.mp3'),wrongSE=new Audio('./assets/wrong.mp3');
  const swordSE=new Audio('./assets/sword_a.mp3'),magicSE=new Audio('./assets/mahou_a.mp3');
  const sirenSE=new Audio('./assets/siren.mp3'),cutinSE=new Audio('./assets/cutin.mp3');
  const frontFinisherSE=new Audio('./assets/omote_h.mp3'),backFinisherSE=new Audio('./assets/ura_h.mp3');
  const countSE=new Audio('./assets/count.mp3'),buttonSE=new Audio('./assets/button.mp3');
  const cancelSE=new Audio('./assets/cancel.mp3'),start321SE=new Audio('./assets/start_321.mp3'),start0SE=new Audio('./assets/start_0.mp3'),clearSE=new Audio('./assets/clear.mp3');
  [sirenSE,cutinSE,frontFinisherSE,backFinisherSE,countSE,buttonSE,cancelSE,start321SE,start0SE,clearSE].forEach(a=>a.preload='auto');

  // BGM collection: only tracks already used by the current game are listed.
  // Title-screen tracks are deliberately excluded until the title BGM issue is resolved.
  function musicTracks(world){
    const stages=world==='front'?FRONT_STAGES:BACK_STAGES;
    const worldLabel=world==='front'?'表の世界':'裏の世界';
    const normal=stages.map((st,i)=>({
      id:`stage-${i+1}`,file:st.bgm,label:`STAGE ${i+1}`,title:st.bgm.replace(/\.mp3$/i,''),
      where:`${worldLabel} STAGE ${i+1}「${st.name}」の通常戦闘で流れるBGM。`
    }));
    const bossWhere=world==='front'?'表の世界 STAGE 1～4のボス戦で流れる共通BGM。':'裏の世界 STAGE 1～4のボス戦で流れる共通BGM。';
    const finalStage=stages[4];
    return [...normal,
      {id:'boss',file:stages[0].bossBgm,label:'BOSS',title:stages[0].bossBgm.replace(/\.mp3$/i,''),where:bossWhere},
      {id:'final',file:finalStage.bossBgm,label:'LAST BOSS',title:finalStage.bossBgm.replace(/\.mp3$/i,''),where:`${worldLabel} STAGE 5「${finalStage.name}」の最終ボス戦で流れるBGM。`}
    ];
  }
  function inferMusicUnlocksFromSave(target){
    target.musicUnlocked=target.musicUnlocked||{front:[],back:[]};
    for(const world of ['front','back']){
      const list=Array.isArray(target.musicUnlocked[world])?target.musicUnlocked[world]:[];
      const set=new Set(list);
      const book=target.monsterBook?.[world]||[];
      for(const id of book){
        const normal=id.match(new RegExp(`^${world}-(\\d+)$`));
        if(normal){const n=Number(normal[1]);const stage=Math.floor((n-1)/7)+1;if(stage>=1&&stage<=5)set.add(`stage-${stage}`);}
        const boss=id.match(new RegExp(`^boss-${world}-(\\d+)$`));
        if(boss){const stage=Number(boss[1]);set.add(`stage-${stage}`);set.add(stage===5?'final':'boss');}
      }
      if((world==='front'&&(target.frontClears>0||target.backUnlocked))||(world==='back'&&target.backClears>0)){
        for(let i=1;i<=5;i++)set.add(`stage-${i}`);set.add('boss');set.add('final');
      }
      target.musicUnlocked[world]=[...set];
    }
  }
  function isMusicUnlocked(world,id){return debugFullUnlock||!!save.musicUnlocked?.[world]?.includes(id);}
  function unlockMusic(world,id){
    if(debugFullUnlock)return false;
    if(!save.musicUnlocked)save.musicUnlocked={front:[],back:[]};
    if(!Array.isArray(save.musicUnlocked[world]))save.musicUnlocked[world]=[];
    if(save.musicUnlocked[world].includes(id))return false;
    save.musicUnlocked[world].push(id);
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(save));}catch{}
    return true;
  }
  function unlockCurrentStageMusic(){unlockMusic(mode,`stage-${stageIndex+1}`);}
  function unlockCurrentBossMusic(){unlockMusic(mode,stageIndex===4?'final':'boss');}

  // The hit effect belongs to the battlefield, not to the hero actor.  Keeping it
  // outside the hero's coordinate system lets sword/magic impacts land on the enemy.
  const battlefield=document.querySelector('.battlefield');
  if(battlefield&&els.attackEffect?.parentElement!==battlefield)battlefield.appendChild(els.attackEffect);

  function loadSave(){
    try{
      const raw=JSON.parse(localStorage.getItem(STORAGE_KEY))||{};
      const merged={...DEFAULT_SAVE,...raw};
      merged.owned=Array.isArray(raw.owned)?raw.owned:[100];
      merged.monsterBook={front:Array.isArray(raw.monsterBook?.front)?raw.monsterBook.front:[],back:Array.isArray(raw.monsterBook?.back)?raw.monsterBook.back:[]};
      merged.monsterEncounters={front:{...(raw.monsterEncounters?.front||{})},back:{...(raw.monsterEncounters?.back||{})}};
      merged.musicUnlocked={front:Array.isArray(raw.musicUnlocked?.front)?raw.musicUnlocked.front:[],back:Array.isArray(raw.musicUnlocked?.back)?raw.musicUnlocked.back:[]};
      inferMusicUnlocksFromSave(merged);
      return merged;
    }catch{const fallback={...DEFAULT_SAVE,owned:[100],monsterBook:{front:[],back:[]},monsterEncounters:{front:{},back:{}},musicUnlocked:{front:[],back:[]}};inferMusicUnlocksFromSave(fallback);return fallback;}
  }
  function persist(){
    if(!debugFullUnlock)try{localStorage.setItem(STORAGE_KEY,JSON.stringify(save));}catch{}
    renderTitle();
  }
  function isItemOwned(id){return debugFullUnlock||save.owned.includes(id);}
  function effectiveGold(){return debugFullUnlock?99999:save.gold;}
  function effectiveOwnedCount(){return debugFullUnlock?100:save.owned.length;}
  function isBackWorldUnlocked(){return debugFullUnlock||save.backUnlocked;}
  function isMonsterSeen(world,id){return debugFullUnlock||!!save.monsterBook?.[world]?.includes(id);}
  function effectiveEncounterCount(world,id){const n=save.monsterEncounters?.[world]?.[id]||0;return debugFullUnlock?Math.max(1,n):n;}

  function itemIcon(name){
    const rules=[
      [/ブーツ/, '👢'], [/てぶくろ|手袋/, '🧤'], [/マント|よろい|鱗のよろい/, '🧥'],
      [/バックラー|盾/, '🛡️'], [/ショートソード|ロングソード|剣|ダガー/, '🗡️'], [/槍/, '🔱'], [/斧/, '🪓'],
      [/弓|クロスボウ|矢筒/, '🏹'], [/杖/, '🪄'], [/魔導書|本/, '📖'], [/指輪|リング/, '💍'],
      [/ペンダント|ブローチ|羽飾り|お守り|護符|印章/, '📿'], [/ランタン/, '🏮'], [/薬草/, '🌿'], [/ポーチ/, '🎒'],
      [/びん|小びん/, '🧪'], [/コンパス/, '🧭'], [/地図/, '🗺️'], [/鈴/, '🔔'], [/ロープ/, '🪢'],
      [/かぶと/, '🪖'], [/コイン/, '🪙'], [/日時計|懐中時計|砂時計/, '⏳'], [/火打ち石/, '🔥'],
      [/ハンマー/, '🔨'], [/縫い針/, '🪡'], [/手紙/, '✉️'], [/マグ/, '☕'], [/証票|バッジ|メダル/, '🏅'],
      [/王冠|ティアラ/, '👑'], [/仮面/, '🎭'], [/鍵/, '🗝️'], [/羽/, '🪶'], [/うろこ/, '🐉'], [/角片/, '🦄'],
      [/卵/, '🥚'], [/聖杯|杯/, '🏆'], [/鏡/, '🪞'], [/種/, '🌱'],
      [/真珠|紅玉|蒼玉|翠玉|水晶|晶石|宝珠|石/, '💎']
    ];
    for(const [re,icon] of rules) if(re.test(name)) return icon;
    return '✨';
  }

  function buildItems(){
    const defs=[
      // COMMON 1-50
      ['さびたショートソード',10],['木のバックラー',10],['革のてぶくろ',10],['見習いの杖',10],['旅人のマント',12],
      ['薬草ポーチ',12],['青銅の指輪',12],['銅のペンダント',12],['小さなランタン',12],['古びたコンパス',12],
      ['鉄のダガー',15],['革のブーツ',15],['丸盾',15],['狩人の弓',15],['矢筒',15],['青い薬草',15],['赤い薬草',15],
      ['火打ち石',15],['旅の鈴',15],['ロープの束',15],['鉄のかぶと',18],['鎖のブレスレット',18],['冒険者の地図',18],
      ['空の小びん',18],['幸運のコイン',18],['樫の杖',18],['初歩の魔導書',18],['羽根のお守り',18],['携帯日時計',18],
      ['色ガラスの宝珠',18],['兵士の槍',20],['鉄の手斧',20],['革のよろい',20],['見張りの盾',20],['小型クロスボウ',20],
      ['小さな魔力びん',20],['旅人のマグ',20],['封のされた手紙',20],['歯車の懐中時計',20],['商人の証票',20],
      ['青晶石のかけら',22],['赤晶石のかけら',22],['緑晶石のかけら',22],['白晶石のかけら',22],['黒晶石のかけら',22],
      ['銀の縫い針',25],['職人のハンマー',25],['こわれた王冠の欠片',25],['古い冒険者バッジ',25],['忘れられた森の地図',25],
      // UNCOMMON 51-80
      ['銀のロングソード',30],['騎士の盾',30],['魔術師の杖',30],['森人の長弓',30],['錬金術師のポーチ',35],
      ['癒やしの杯',35],['月明かりのランタン',35],['隼のブローチ',35],['黒曜石のダガー',40],['鱗のよろい',40],
      ['ルーンの手袋',40],['星読みの地図',40],['深海の真珠',45],['紅玉',45],['蒼玉',45],['翠玉',45],
      ['雷のお守り',50],['氷のお守り',50],['炎のお守り',50],['風のお守り',50],['古代の魔導書',50],['からくりの鍵',55],
      ['幻影の仮面',55],['竜のうろこ',55],['一角獣の角片',55],['太陽石',60],['月光石',60],['王家の印章',60],
      ['冒険王のメダル',60],['封印された宝の地図',60],
      // RARE 81-100
      ['勇者の剣',70],['天青の大盾',75],['賢者の杖',80],['竜翼の弓',85],['不死鳥の羽',90],['海竜のうろこ',90],
      ['星くずのティアラ',95],['月の王冠',100],['太陽の王冠',100],['賢者の石',110],['古代竜の卵',110],['王の聖杯',120],
      ['深淵の鏡',120],['天使の羽飾り',125],['魔王の指輪',130],['世界樹の種',135],['永遠の砂時計',140],
      ['虹色水晶',145],['星渡りのコンパス',150],['時空の鍵',null]
    ];
    return defs.map(([name,price],i)=>{
      const id=i+1,rarity=id<=50?'common':id<=80?'uncommon':'rare';
      const special=id===100;
      const flavor=special
        ?'時空の扉を開くと伝わる神秘の鍵。持つ者に新たな世界への扉を見る力を与える。'
        : rarity==='common'?'旅や暮らしの中で使われる、素朴だが味わい深い冒険の品。'
        : rarity==='uncommon'?'淡い魔力や由来を秘めた、少し珍しい冒険者たちの収集品。'
        :'めったに目にすることのない、伝説や特別な物語を宿した宝。';
      return {id,name,rarity,price,icon:itemIcon(name),flavor};
    });
  }
  const ITEMS=buildItems();
  const rarityLabel={common:'コモン',uncommon:'アンコモン',rare:'レア'};

  function titleTrackLabel(){return `${effectiveOwnedCount()} / 100`;}
  function stopTitleBgm(){}
  async function fadeTitleBgm(){return;}
  async function playTitleBgm(){return;}

  function primeStageBgm(){
    if(!soundOn)return;
    const file=bossPhase?currentStage().bossBgm:currentStage().bgm;
    try{
      stageBgmPlayer.pause();
      stageBgmPlayer.src=`./assets/${file}`;
      stageBgmPlayer.currentTime=0;
      stageBgmPlayer.volume=0;
      stageBgmPlayer.muted=true;
      const promise=stageBgmPlayer.play();
      if(promise&&typeof promise.catch==='function')promise.catch(()=>{});
      currentBgm=stageBgmPlayer;
    }catch{}
  }

  function showOnly(el){[els.titleScreen,els.shopScreen,els.collectionScreen,els.monsterBookScreen,els.gameScreen].forEach(x=>x.hidden=x!==el);syncPauseButton();}
  function setMenuButton(btn,glyph,label){btn.innerHTML=`<span class="menu-glyph" aria-hidden="true">${glyph}</span><span class="menu-label">${label}</span>`;}
  function renderTitle(){
    document.body.dataset.mode=mode;
    els.titleGold.textContent=`${effectiveGold()} G`;
    els.titleModeName.textContent=mode==='front'?'光の世界':'夜の東京';
    els.titleTrackName.textContent=titleTrackLabel();
    if(els.debugBadge)els.debugBadge.hidden=!debugFullUnlock;
    if(mode==='front'){
      els.titleHero.src='./assets/hero.png';els.titleEyebrow.textContent='MATH FANTASY ADVENTURE';els.titleSubtitle.innerHTML='計算で道をひらき、5つのエリアを進む。<br>最後に待つ魔王を倒せ。';setMenuButton(els.playBtn,'⚔','ぼうけんを はじめる');setMenuButton(els.shopBtn,'◆','ショップ');setMenuButton(els.collectionBtn,'✦','コレクション');setMenuButton(els.monsterBookBtn,'◆','モンスター図鑑');setMenuButton(els.backWorldBtn,'∞','ウラステージへ');
      els.backWorldBtn.hidden=!isBackWorldUnlocked();els.frontWorldBtn.hidden=true;
    }else{
      els.titleHero.src='./assets/back_hero.png';els.titleEyebrow.textContent='NIGHT TOKYO / ANOTHER QUEST';els.titleSubtitle.innerHTML='夜の東京を巡り、時空の裂け目の先へ。<br>魔法少女のもう一つの冒険。';setMenuButton(els.playBtn,'✦','ウラ面を はじめる');setMenuButton(els.shopBtn,'◆','ショップ');setMenuButton(els.collectionBtn,'✧','コレクション');setMenuButton(els.monsterBookBtn,'◇','モンスター図鑑');setMenuButton(els.frontWorldBtn,'↩','表のタイトルへ');
      els.backWorldBtn.hidden=true;els.frontWorldBtn.hidden=false;
    }
  }

  function stopMusicPlayer(){
    musicPlayer.pause();
    try{musicPlayer.currentTime=0;}catch{}
    if(els.musicPlayBtn)els.musicPlayBtn.textContent='▶';
    document.querySelectorAll('.music-track-row.playing').forEach(x=>x.classList.remove('playing'));
  }
  function renderMusicPlayer(){
    if(!els.musicTrackList)return;
    const tracks=musicTracks(musicWorld);
    els.musicFrontTab.classList.toggle('active',musicWorld==='front');
    els.musicBackTab.classList.toggle('active',musicWorld==='back');
    els.musicFrontTab.setAttribute('aria-selected',musicWorld==='front'?'true':'false');
    els.musicBackTab.setAttribute('aria-selected',musicWorld==='back'?'true':'false');
    els.musicTrackList.innerHTML='';
    tracks.forEach((track,i)=>{
      const unlocked=isMusicUnlocked(musicWorld,track.id);
      const row=document.createElement('button');
      row.type='button';row.className=`music-track-row${unlocked?'':' locked'}${i===musicTrackIndex&&!musicPlayer.paused?' playing':''}`;
      row.disabled=!unlocked;
      row.innerHTML=`<span class="music-order">${track.label}</span><span class="music-track-copy"><b>${unlocked?track.title:'？？？？？？'}</b><small>${track.where}</small></span><span class="music-track-state">${unlocked?'▶':'LOCK'}</span>`;
      if(unlocked)row.onclick=()=>playMusicTrack(i,true);
      els.musicTrackList.appendChild(row);
    });
    const current=tracks[musicTrackIndex];
    if(current&&isMusicUnlocked(musicWorld,current.id)){
      els.musicNowTitle.textContent=current.title;els.musicNowWhere.textContent=current.where;
    }else{
      els.musicNowTitle.textContent='曲を選んでください';els.musicNowWhere.textContent='解禁済みの曲をタップすると再生します。';
    }
    const unlockedIndices=tracks.map((t,i)=>isMusicUnlocked(musicWorld,t.id)?i:-1).filter(i=>i>=0);
    const has=unlockedIndices.length>0;
    els.musicPrevBtn.disabled=!has;els.musicPlayBtn.disabled=!has;els.musicNextBtn.disabled=!has;els.musicStopBtn.disabled=musicTrackIndex<0;
    els.musicPlayBtn.textContent=musicTrackIndex>=0&&!musicPlayer.paused?'Ⅱ':'▶';
  }
  async function playMusicTrack(index,restart=false){
    const tracks=musicTracks(musicWorld),track=tracks[index];
    if(!track||!isMusicUnlocked(musicWorld,track.id))return;
    const src=`./assets/${track.file}`;
    try{
      const changed=musicTrackIndex!==index||!decodeURIComponent(musicPlayer.src||'').endsWith(`/assets/${track.file}`);
      if(changed){musicPlayer.pause();musicPlayer.src=src;musicPlayer.load();}
      musicTrackIndex=index;musicPlayer.loop=true;musicPlayer.volume=.38;
      if(changed||restart)try{musicPlayer.currentTime=0;}catch{}
      await musicPlayer.play();
    }catch{}
    renderMusicPlayer();
  }
  function moveMusicTrack(direction){
    const tracks=musicTracks(musicWorld),allowed=tracks.map((t,i)=>isMusicUnlocked(musicWorld,t.id)?i:-1).filter(i=>i>=0);
    if(!allowed.length)return;
    let pos=allowed.indexOf(musicTrackIndex);
    if(pos<0)pos=direction>0?-1:0;
    pos=(pos+direction+allowed.length)%allowed.length;
    playMusicTrack(allowed[pos],true);
  }
  async function transitionMusicOverlay(opening){
    const curtain=ensureSceneCurtain();
    curtain.style.setProperty('--scene-in','260ms');curtain.style.setProperty('--scene-out','420ms');
    curtain.hidden=false;curtain.className='scene-curtain entering';void curtain.offsetWidth;
    await sleep(260);curtain.className='scene-curtain covered';
    await transitionTo(()=>{
      if(opening){musicWorld=mode;musicTrackIndex=-1;stopMusicPlayer();renderMusicPlayer();els.musicOverlay.hidden=false;}
      else{stopMusicPlayer();musicTrackIndex=-1;els.musicOverlay.hidden=true;renderTitle();}
    },mode==='back'?'back':'normal',1450);
    await sleep(70);curtain.className='scene-curtain leaving';await sleep(420);curtain.hidden=true;curtain.className='scene-curtain';
  }
  async function openMusicPlayer(){if(!els.musicOverlay.hidden)return;await transitionMusicOverlay(true);}
  async function closeMusicPlayer(){if(els.musicOverlay.hidden)return;await transitionMusicOverlay(false);}
  function switchMusicWorld(world){
    if(musicWorld===world)return;stopMusicPlayer();musicTrackIndex=-1;musicWorld=world;renderMusicPlayer();
  }

  function renderDebugPanel(){
    if(!els.debugOverlay)return;
    els.debugStatus.textContent=debugFullUnlock?'ON':'OFF';
    els.debugStatus.classList.toggle('on',debugFullUnlock);
    els.debugToggleBtn.textContent=debugFullUnlock?'全解放を解除':'仮想全解放をON';
    els.debugToggleBtn.classList.toggle('danger',debugFullUnlock);
    els.debugStagePanel.hidden=!debugFullUnlock;
    if(els.debugStageGrid){
      els.debugStageGrid.innerHTML='';
      for(const world of ['front','back']){
        const stages=world==='front'?FRONT_STAGES:BACK_STAGES;
        stages.forEach((st,i)=>{
          const prefix=world==='front'?'表':'裏';
          const start=document.createElement('button');start.type='button';start.className=`debug-stage-btn debug-stage-start debug-world-${world}`;
          start.textContent=`${prefix} S${i+1} 最初`;start.title=`${st.name}：ステージ最初から`;
          start.onclick=()=>debugJumpToStage(world,i);els.debugStageGrid.appendChild(start);
          const boss5=document.createElement('button');boss5.type='button';boss5.className=`debug-stage-btn debug-boss5-btn debug-world-${world}`;
          boss5.textContent=`${prefix} S${i+1} ボス5`;boss5.title=`${st.name}：ボス5問目から`;
          boss5.onclick=()=>debugJumpToBossFifth(world,i);els.debugStageGrid.appendChild(boss5);
        });
      }
    }
  }
  function openDebugPanel(){if(!els.debugOverlay)return;renderDebugPanel();els.debugOverlay.hidden=false;}
  function closeDebugPanel(){if(els.debugOverlay)els.debugOverlay.hidden=true;}
  function setDebugFullUnlock(enabled){
    debugFullUnlock=!!enabled;
    try{if(debugFullUnlock)sessionStorage.setItem(DEBUG_SESSION_KEY,'1');else sessionStorage.removeItem(DEBUG_SESSION_KEY);}catch{}
    if(!debugFullUnlock){
      save=loadSave();
      if(mode==='back'&&!save.backUnlocked)mode='front';
    }
    renderTitle();renderDebugPanel();
    if(els.collectionScreen&&!els.collectionScreen.hidden)renderCollection();
    if(els.monsterBookScreen&&!els.monsterBookScreen.hidden)renderMonsterBook();
    if(els.shopScreen&&!els.shopScreen.hidden)renderShop();
    if(els.musicOverlay&&!els.musicOverlay.hidden)renderMusicPlayer();
  }
  async function debugJumpToStage(world,index){
    if(!debugFullUnlock)return;
    closeDebugPanel();resetRun();mode=world;stageIndex=Math.max(0,Math.min(4,index));totalProgress=stageIndex*15;
    primeStageBgm();
    await transitionTo(()=>{showOnly(els.gameScreen);prepareMapOverlay(true);},mode==='back'?'back':'normal',1500);
    await showMapSequence(true,true);
  }
  async function debugJumpToBossFifth(world,index){
    if(!debugFullUnlock)return;
    closeDebugPanel();resetRun();
    mode=world;stageIndex=Math.max(0,Math.min(4,index));stageQuestion=10;bossPhase=true;bossQuestion=4;
    totalProgress=stageIndex*15+14;lives=3;currentMonster=null;currentQuestion=null;clearBossAction();unlockCurrentBossMusic();
    primeStageBgm();
    await transitionTo(()=>{
      showOnly(els.gameScreen);document.body.dataset.mode=mode;document.body.dataset.stage=stageIndex;
      bossPhase=true;bossQuestion=4;currentMonster=null;renderGame();clearQuestionUi();enemyVisualToken++;concealEnemyVisual(true);
      document.querySelector('.battlefield')?.classList.remove('battle-base-enter');
    },mode==='back'?'back':'normal',1250);
    await playStageBgm();
    await runBattleCountdown();
    await showBossEntrance(true,4);
  }
  function installDebugSecretGesture(){
    const target=document.querySelector('.title-logo-wrap h1');if(!target)return;
    let taps=[],armedUntil=0,holdTimer=null,downAt=0;
    const clearHold=()=>{if(holdTimer){clearTimeout(holdTimer);holdTimer=null;}};
    target.addEventListener('pointerdown',()=>{
      downAt=Date.now();clearHold();
      if(Date.now()<armedUntil){holdTimer=setTimeout(()=>{holdTimer=null;armedUntil=0;taps=[];openDebugPanel();},2000);}
    });
    target.addEventListener('pointerup',()=>{
      const now=Date.now(),duration=now-downAt;clearHold();
      if(duration>650||now<armedUntil)return;
      taps=taps.filter(t=>now-t<4200);taps.push(now);
      if(taps.length>=7){armedUntil=now+5500;taps=[];}
    });
    target.addEventListener('pointercancel',clearHold);target.addEventListener('pointerleave',clearHold);
  }

  async function transitionTo(swap,kind='normal',ms=1500){
    const duration=Math.max(ms,1400),coverAt=Math.round(duration*0.46);
    els.transitionFx.style.setProperty('--transition-ms',`${duration}ms`);
    els.transitionFx.classList.remove('active','back');
    if(kind==='back')els.transitionFx.classList.add('back');
    els.transitionFx.hidden=false;
    void els.transitionFx.offsetWidth;
    els.transitionFx.classList.add('active');
    await sleep(coverAt);
    if(typeof swap==='function') await swap();
    await sleep(duration-coverAt+90);
    els.transitionFx.classList.remove('active');
    els.transitionFx.hidden=true;
  }
  async function transition(kind='normal',ms=1500){return transitionTo(null,kind,ms);}

  function renderShop(filter='all'){
    els.shopGold.textContent=`${effectiveGold()} G`;
    const filters=[['all','すべて'],['common','コモン'],['uncommon','アンコモン'],['rare','レア'],['missing','もっていない']];
    els.shopFilters.innerHTML='';filters.forEach(([k,t])=>{const b=document.createElement('button');b.textContent=t;b.className=k===filter?'active':'';b.onclick=()=>renderShop(k);els.shopFilters.appendChild(b);});
    els.shopList.innerHTML='';
    ITEMS.filter(it=>it.id!==100).filter(it=>filter==='all'||it.rarity===filter||(filter==='missing'&&!isItemOwned(it.id))).forEach(it=>{
      const owned=isItemOwned(it.id),row=document.createElement('div');row.className=`shop-row shop-${it.rarity}`;row.innerHTML=`<div class="item-icon"><span>${it.icon}</span><em>No.${String(it.id).padStart(3,'0')}</em></div><div class="item-name"><b>${it.name}</b><small class="rarity-${it.rarity}">${rarityLabel[it.rarity]}</small></div><div class="item-price">${it.price} <small>G</small></div><button class="buy-btn" ${owned||effectiveGold()<it.price?'disabled':''}>${owned?'もっている':'購入'}</button>`;
      row.querySelector('button').onclick=()=>{if(debugFullUnlock)return;if(!owned&&save.gold>=it.price){save.gold-=it.price;save.owned.push(it.id);persist();renderShop(filter);}};els.shopList.appendChild(row);
    });
  }

  function renderCollection(){
    els.collectionCount.textContent=`${effectiveOwnedCount()} / 100`;els.collectionGrid.innerHTML='';
    ITEMS.forEach(it=>{const owned=isItemOwned(it.id);const c=document.createElement('button');c.className=`collection-cell ${owned?`rarity-${it.rarity}`:'locked'}`;c.innerHTML=`<span class="cell-icon">${owned?it.icon:'?'}</span><small>${owned?String(it.id).padStart(3,'0'):'???'}</small>`;c.title=owned?it.name:'？？？？？？';c.onclick=()=>showItemDetail(it,owned);els.collectionGrid.appendChild(c);});
  }
  function showItemDetail(it,owned){
    els.collectionDetail.innerHTML=owned?`<div class="detail-no">No.${String(it.id).padStart(3,'0')}</div><div class="detail-icon rarity-frame-${it.rarity}">${it.icon}</div><h3>${it.name}</h3><p class="detail-rarity rarity-${it.rarity}">${rarityLabel[it.rarity]}</p><div class="detail-divider"></div><p>${it.flavor}</p>`:`<div class="detail-no">UNKNOWN</div><div class="detail-icon">?</div><h3>？？？？？？</h3><div class="detail-divider"></div><p>まだ手に入れていないアイテムです。</p>`;
  }
  function monsterBookEntries(){
    const normals=getMonsterCatalog();
    const bosses=getStages().map((_,i)=>{const [name,img]=getStages()[i].boss;return{id:`boss-${mode}-${i+1}`,world:mode,stage:i,rarity:5,name,img,boss:true};});
    return [...normals,...bosses];
  }
  function monsterFlavor(m){
    if(m.boss)return `${getStages()[m.stage].name}に立ちはだかるボスモンスター。5問の勝負を乗り越えよう。`;
    const labels=['','身近な姿をしたモンスター。','少し珍しい力を持つモンスター。','めったに姿を見せないレアモンスター。','強い魔力を宿したスーパーレア。','遭遇そのものが特別なSSRモンスター。'];
    return labels[m.rarity]||'未知のモンスター。';
  }
  function renderMonsterBook(filter='all'){
    const entries=monsterBookEntries();
    const seen=new Set(debugFullUnlock?entries.map(m=>m.id):save.monsterBook[mode]);
    els.monsterBookCount.textContent=`${entries.filter(m=>seen.has(m.id)).length} / ${entries.length}`;
    const filters=[['all','すべて'],['1','★1'],['2','★2'],['3','★3 RARE'],['4','★4 SR'],['5','★5 SSR'],['boss','BOSS']];
    els.monsterBookFilters.innerHTML='';
    filters.forEach(([key,label])=>{const b=document.createElement('button');b.textContent=label;b.className=key===filter?'active':'';b.onclick=()=>renderMonsterBook(key);els.monsterBookFilters.appendChild(b);});
    els.monsterBookGrid.innerHTML='';
    entries.filter(m=>filter==='all'||(filter==='boss'&&m.boss)||(!m.boss&&String(m.rarity)===filter)).forEach(m=>{
      const owned=seen.has(m.id),card=document.createElement('button');
      card.className=`monster-book-cell rarity-monster-${m.rarity}${m.boss?' boss-entry':''}${owned?'':' locked'}`;
      card.innerHTML=owned?`<span class="monster-book-thumb"><img src="./assets/${m.img}" alt=""></span><b>${m.name}</b><small>${m.boss?'BOSS':rarityLabelMonster(m.rarity)}</small>`:`<span class="monster-book-thumb unknown">?</span><b>？？？？？？</b><small>${m.boss?'BOSS':rarityLabelMonster(m.rarity)}</small>`;
      if(owned){const im=card.querySelector('img');im.onerror=()=>{im.onerror=null;im.src=monsterPlaceholder(m,!!m.boss);};card.onclick=()=>showMonsterCard(m);}else card.disabled=true;
      els.monsterBookGrid.appendChild(card);
    });
  }
  function showMonsterCard(m){
    const counts=save.monsterEncounters[mode]||{};
    els.monsterCardRarity.textContent=m.boss?'BOSS':rarityLabelMonster(m.rarity);
    els.monsterCardName.textContent=m.name;
    els.monsterCardImage.onerror=()=>{els.monsterCardImage.onerror=null;els.monsterCardImage.src=monsterPlaceholder(m,!!m.boss);};
    els.monsterCardImage.src=`./assets/${m.img}`;
    els.monsterCardWorld.textContent=mode==='front'?'表の世界':'裏の世界';
    els.monsterCardStage.textContent=`STAGE ${m.stage+1}`;
    els.monsterCardEncounter.textContent=`遭遇 ${effectiveEncounterCount(mode,m.id)||1}`;
    els.monsterCardText.textContent=monsterFlavor(m);
    const slimeLike=!m.boss && m.name.includes('スライム');
    els.monsterCard.className=`monster-card rarity-monster-${m.rarity}${m.boss?' boss-card':''}${slimeLike?' slime-card':''}`;
    els.monsterCardOverlay.hidden=false;
  }
  function closeMonsterCard(){els.monsterCardOverlay.hidden=true;}


  function getStages(){return mode==='front'?FRONT_STAGES:BACK_STAGES;}
  function stageStartTotal(idx){return getStages().slice(0,idx).reduce((a,s)=>a+s.count,0);}
  function resetRun(){stageIndex=0;stageQuestion=0;totalProgress=0;lives=3;bossPhase=false;bossQuestion=0;currentMonster=null;bossActionActive=false;bossSpecialSequence=null;currentQuestion=null;paused=false;gameOverActive=false;specialGauge=0;comboStreak=0;specialActive=false;document.body.classList.remove('game-paused','game-over-active','battle-countdown-active','special-assist-active','vargas-double-strike','boss-technique-active','boss-shield-active');if(els.pauseOverlay)els.pauseOverlay.hidden=true;if(els.gameOverOverlay)els.gameOverOverlay.hidden=true;if(els.battleCountdownOverlay)els.battleCountdownOverlay.hidden=true;runStageRewards=new Set();stats={mistakes:0,timeouts:0,restarts:0,errors:[],gold:0};locked=true;updateSpecialHud();syncPauseButton();}

  function getMonsterCatalog(){return mode==='front'?FRONT_MONSTERS:BACK_MONSTERS;}
  function rarityRoll(r=Math.random()){
    let acc=0;for(const [rarity,w] of RARITY_WEIGHTS){acc+=w;if(r<acc)return rarity;}return 5;
  }
  function unlockedMonsters(rarity){return getMonsterCatalog().filter(m=>m.stage<=stageIndex&&m.rarity===rarity);}
  function selectMonster(rng=Math.random){
    const rarity=rarityRoll(rng());let pool=unlockedMonsters(rarity);if(!pool.length)pool=getMonsterCatalog().filter(m=>m.stage<=stageIndex);
    const unowned=pool.filter(m=>!isMonsterSeen(mode,m.id));
    const source=unowned.length&&rng()<.58?unowned:pool;
    return source[Math.floor(rng()*source.length)]||pool[0];
  }
  function registerMonster(monster){
    if(!monster||debugFullUnlock)return;
    const list=save.monsterBook[mode];if(!list.includes(monster.id))list.push(monster.id);
    const counts=save.monsterEncounters[mode];counts[monster.id]=(counts[monster.id]||0)+1;persist();
  }
  function rarityLabelMonster(r){return r===5?'SSR':r===4?'SR':r===3?'RARE':`★${r}`;}
  function rarityBattleLabel(r){return r>=3?`★${r} ${rarityLabelMonster(r)}`:`★${r}`;}
  function setEnemyNameDisplay(en){
    if(!els.enemyName)return;
    els.enemyName.classList.remove('enemy-name-with-rarity');
    els.enemyName.replaceChildren();
    if(!en)return;
    if(en.boss||bossPhase){
      els.enemyName.textContent=en.name;
      return;
    }
    els.enemyName.classList.add('enemy-name-with-rarity');
    const badge=document.createElement('span');
    badge.className=`enemy-rarity-badge battle-rarity-${en.rarity}`;
    badge.textContent=rarityBattleLabel(en.rarity);
    const name=document.createElement('span');
    name.className='enemy-name-text';
    name.textContent=en.name;
    els.enemyName.append(badge,name);
  }
  function ensureBossHpHud(){
    if(els.bossHpHud&&els.bossHpFill)return true;
    const battlefield=document.querySelector('.battlefield');if(!battlefield)return false;
    let hud=$('bossHpHud');
    if(!hud){
      hud=document.createElement('div');hud.id='bossHpHud';hud.className='boss-hp-hud';hud.hidden=true;hud.setAttribute('aria-label','ボスHP');
      hud.innerHTML='<span class="boss-hp-label">BOSS HP</span><div class="boss-hp-meter" aria-hidden="true"><i id="bossHpFill"></i><span class="boss-hp-shine"></span></div>';
      const question=battlefield.querySelector('.question-panel');
      if(question)battlefield.insertBefore(hud,question);else battlefield.appendChild(hud);
    }
    els.bossHpHud=hud;els.bossHpFill=hud.querySelector('#bossHpFill');
    return !!els.bossHpFill;
  }
  function updateBossHpHud(forceHide=false){
    if(!ensureBossHpHud())return;
    const show=!forceHide&&bossPhase&&!els.gameScreen.hidden;
    els.bossHpHud.hidden=!show;
    if(!show)return;
    const remaining=Math.max(0,Math.min(5,5-bossQuestion));
    const pct=remaining/5*100;
    els.bossHpFill.style.width=`${pct}%`;
    els.bossHpHud.classList.toggle('critical',remaining===1);
    els.bossHpHud.classList.toggle('empty',remaining===0);
    els.bossHpHud.setAttribute('aria-label',`ボスHP ${remaining} / 5`);
  }
  function monsterPlaceholder(monster,boss=false){
    const palette=boss?['#180008','#7e0923','#ff355f']:monster.rarity===5?['#1a0934','#ffbf27','#f44dff']:monster.rarity===4?['#180d32','#914cff','#6eeaff']:monster.rarity===3?['#10264b','#d9b64b','#fff1a6']:monster.rarity===2?['#09243b','#45bfff','#ddfaff']:['#20252c','#cfd7e0','#ffffff'];
    const label=(boss?'BOSS':rarityLabelMonster(monster.rarity)).replace(/&/g,'');
    const name=(monster.name||'MONSTER').replace(/[&<>"']/g,'');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 620"><defs><radialGradient id="g"><stop stop-color="${palette[2]}"/><stop offset="1" stop-color="${palette[0]}"/></radialGradient></defs><ellipse cx="240" cy="315" rx="180" ry="220" fill="url(#g)" opacity=".28"/><path d="M240 80c90 0 150 90 145 190 55 40 55 135-10 172-42 72-228 72-270 0-65-37-65-132-10-172-5-100 55-190 145-190z" fill="${palette[1]}" stroke="${palette[2]}" stroke-width="12"/><circle cx="180" cy="280" r="26" fill="#080b14"/><circle cx="300" cy="280" r="26" fill="#080b14"/><path d="M175 365q65 55 130 0" fill="none" stroke="#080b14" stroke-width="16" stroke-linecap="round"/><text x="240" y="525" text-anchor="middle" font-size="36" font-family="sans-serif" fill="white">${label}</text><text x="240" y="575" text-anchor="middle" font-size="24" font-family="sans-serif" fill="white">${name}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  }
  function currentBoss(){const [name,img]=currentStage().boss;return{id:`boss-${mode}-${stageIndex+1}`,world:mode,stage:stageIndex,rarity:5,name,img,boss:true};}
  function makeBossQuestion(idx){
    if(idx<4)return mode==='front'?makeFrontQuestion(idx+1):makeBackQuestion(idx+1);
    if(mode==='front')return makeFrontFinalBossQuestion();
    return makeBackFinalBossQuestion();
  }
  function makeFrontFinalBossQuestion(){
    for(let i=0;i<5000;i++){
      const op=Math.random()<.5?'+':'-',a=rand(100,999),b=rand(100,999);
      if(op==='+'){
        const ans=a+b;if(ans>999)continue;
        const carry=((a%10)+(b%10)>=10)||(Math.floor(a/10)%10+Math.floor(b/10)%10>=10);
        if(carry)return q2(a,'+',b);
      }else{
        if(a<=b)continue;const borrow=(a%10)<(b%10)||(Math.floor(a/10)%10)<(Math.floor(b/10)%10);
        if(borrow)return q2(a,'-',b);
      }
    }
    return q2(731,'-',456);
  }
  function makeBackFinalBossQuestion(){
    if(Math.random()<.5){const a=rand(10,99),b=rand(2,9),c=rand(100,999);return{expression:`${a}×${b}+${c}`,answer:a*b+c};}
    const a=rand(100,999),b=rand(2,9),c=rand(10,99);return{expression:`${a}+${b}×${c}`,answer:a+b*c};
  }
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
  function sameDigitLength(a,b){return String(Math.abs(a)).length===String(Math.abs(b)).length;}
  function makeChoices(ans){
    if(ans===0)return shuffle([0,1,2]);
    if(ans<10)return shuffle([Math.max(0,ans-1),ans,ans+1]);

    // For two digits and above, mix the old ±1 trap with place-value traps.
    // ans±10 keeps the ones digit identical, so the player cannot solve only by
    // glancing at the ones column.  We deliberately keep ±1 in the pool as well,
    // avoiding a single predictable distractor pattern.
    const adjacent=[ans-1,ans+1].filter(v=>v>=0&&v!==ans);
    const tens=[ans-10,ans+10].filter(v=>v>=10&&v!==ans&&sameDigitLength(v,ans));
    const roll=Math.random();
    let wrong=[];
    if(roll<.42){
      wrong=adjacent.slice(0,2);
    }else if(roll<.78&&tens.length>=2){
      wrong=tens.slice(0,2);
    }else{
      const a=pick(tens.length?tens:adjacent);
      const otherPool=[...adjacent,...tens].filter(v=>v!==a);
      wrong=[a,pick(otherPool.length?otherPool:[ans+2])];
    }
    wrong=[...new Set(wrong)].filter(v=>v!==ans&&v>=0);
    for(const candidate of [...adjacent,...tens,ans+2,Math.max(0,ans-2),ans+20]){
      if(wrong.length>=2)break;
      if(candidate!==ans&&!wrong.includes(candidate))wrong.push(candidate);
    }
    return shuffle([ans,...wrong.slice(0,2)]);
  }
  // Battle-facing correction. PNG files stay untouched; mirroring is presentation-only.
  // These source images already face toward the hero (left), so they remain unmirrored.
  const BATTLE_KEEP_ORIGINAL_FACING=new Set([
    'monster_front_1_1_2.png','monster_front_1_4_6.png','monster_front_1_5_7.png','boss_front_1.png',
    'monster_front_2_5_14.png','boss_front_2.png',
    'monster_front_3_4_20.png','monster_front_5_1_30.png',
    'monster_back_1_2_4.png','monster_back_2_5_14.png'
  ]);
  const BATTLE_SPRITE_SCALE={};
  const BATTLE_SPRITE_OFFSET_Y={
    // The source art extends lower with particles, which makes the knight itself appear
    // unusually high when bottom-aligned. Shift only the battle presentation downward.
    'monster_front_4_2_25.png':'7%'
  };
  function applyEnemyFacing(en){
    if(!els.enemySprite)return;
    const keepOriginal=!!en&&BATTLE_KEEP_ORIGINAL_FACING.has(en.img);
    els.enemySprite.classList.toggle('flip-facing',!!en&&!keepOriginal);
    els.enemySprite.style.setProperty('--enemy-scale',String(en?(BATTLE_SPRITE_SCALE[en.img]||1):1));
    els.enemySprite.style.setProperty('--enemy-y',en?(BATTLE_SPRITE_OFFSET_Y[en.img]||'0%'):'0%');
  }

  // Enemy image lifecycle: never replace a visible enemy's src in place.  The old
  // sprite is first hidden and detached, the next PNG is decoded off-screen, and only
  // then is the prepared image committed while the actor is still invisible.  This
  // prevents a previous normal enemy/boss flashing for a frame after stage changes.
  let enemyVisualToken=0;
  function concealEnemyVisual(clearSource=true){
    els.enemyActor.style.opacity='0';
    els.enemyActor.style.transform='';
    els.enemyActor.classList.remove('hit','finisher-hit','spawn-boss','boss-defeat','spawn-r1','spawn-r2','spawn-r3','spawn-r4','spawn-r5');
    if(els.enemySprite){els.enemySprite.classList.remove('flip-facing');els.enemySprite.style.setProperty('--enemy-scale','1');els.enemySprite.style.setProperty('--enemy-y','0%');}
    if(clearSource){
      els.enemyImage.onerror=null;
      els.enemyImage.removeAttribute('src');
      els.enemyImage.removeAttribute('data-monster-img');
    }
    els.enemyName.textContent='';els.enemyName.classList.remove('enemy-name-with-rarity');
  }
  async function decodeImageSource(src){
    // Attach handlers before assigning src so cached images cannot finish between the two.
    // decode() is then used as an additional readiness check, not as the only load signal.
    const probe=new Image();
    const loaded=new Promise((resolve,reject)=>{probe.onload=()=>resolve(true);probe.onerror=reject;});
    probe.src=src;
    try{
      if(!probe.complete||!probe.naturalWidth)await loaded;
      if(probe.decode)await probe.decode().catch(()=>{});
      return probe.naturalWidth?src:null;
    }catch{return null;}
  }
  async function commitEnemyImage(src,token){
    if(token!==enemyVisualToken)return false;
    return await new Promise(resolve=>{
      let settled=false;
      const done=(ok)=>{if(settled)return;settled=true;els.enemyImage.onload=null;els.enemyImage.onerror=null;resolve(ok&&token===enemyVisualToken);};
      els.enemyImage.onload=async()=>{
        try{if(els.enemyImage.decode)await els.enemyImage.decode().catch(()=>{});}catch{}
        done(!!els.enemyImage.naturalWidth);
      };
      els.enemyImage.onerror=()=>done(false);
      els.enemyImage.src=src;
      // Cached images can already be complete before onload dispatch reaches this task.
      if(els.enemyImage.complete&&els.enemyImage.naturalWidth)queueMicrotask(()=>done(true));
    });
  }
  async function stageEnemyVisual(en){
    const token=++enemyVisualToken;
    concealEnemyVisual(true);
    if(!en)return false;
    const desired=`./assets/${en.img}`;
    let resolved=await decodeImageSource(desired);
    if(token!==enemyVisualToken)return false;
    // One cache-busting retry handles rare mobile cache/decode failures without changing
    // the canonical filename kept in data-monster-img.
    if(!resolved){
      const retry=`${desired}?retry=${Date.now()}`;
      resolved=await decodeImageSource(retry);
    }
    if(token!==enemyVisualToken)return false;
    if(!resolved)resolved=monsterPlaceholder(en,!!en.boss);
    applyEnemyFacing(en);
    setEnemyNameDisplay(en);
    let committed=await commitEnemyImage(resolved,token);
    if(!committed&&token===enemyVisualToken){
      // A decoded probe can still fail when the visible <img> commits on memory-constrained
      // mobile browsers. Retry the canonical PNG once with a fresh cache key before fallback.
      const retry=`${desired}?commitRetry=${Date.now()}`;
      if(await decodeImageSource(retry))committed=await commitEnemyImage(retry,token);
    }
    if(!committed&&token===enemyVisualToken){
      committed=await commitEnemyImage(monsterPlaceholder(en,!!en.boss),token);
    }
    if(token!==enemyVisualToken){concealEnemyVisual(true);return false;}
    if(!committed)return false;
    els.enemyImage.dataset.monsterImg=en.img;
    return true;
  }


  function stageDisplayProgress(){
    return Math.max(0,Math.min(15,totalProgress-stageIndex*15));
  }
  function renderGame(){
    const s=currentStage(),stageProgress=stageDisplayProgress();document.body.dataset.mode=mode;document.body.dataset.stage=stageIndex;
    els.progressText.textContent=`${stageProgress} / 15`;els.progressFill.style.width=`${stageProgress/15*100}%`;els.stageLabel.textContent=`STAGE ${stageIndex+1}`;els.stageName.textContent=s.name;els.lifeDisplay.textContent=[0,1,2].map(i=>i<lives?'♥':'♡').join(' ');els.timerText.textContent=timeLeft;
    fitSingleLineText(els.stageName,{maxWidthRatio:.42,minPx:10});
    els.battleBg.style.backgroundImage=`url('./assets/${s.bg}')`;els.heroImage.src=mode==='front'?'./assets/hero.png':'./assets/back_hero.png';els.heroName.textContent=mode==='front'?'ゆうしゃ':'魔法少女';
    const en=bossPhase?currentBoss():currentMonster;
    if(en){
      applyEnemyFacing(en);
      setEnemyNameDisplay(en);
      fitSingleLineText(els.enemyName,{maxWidthRatio:.31,minPx:9});
      // src is deliberately not changed here. New sprites are committed only by
      // stageEnemyVisual() after decode, while enemyActor remains hidden.
    }else{setEnemyNameDisplay(null);}
    updateBossHpHud();
  }

  function syncPauseButton(){
    if(!els.pauseBtn)return;
    const playable=!els.gameScreen.hidden&&!paused&&!gameOverActive&&!locked&&!!timerId&&!!currentQuestion;
    els.pauseBtn.disabled=!playable;
    els.pauseBtn.setAttribute('aria-disabled',playable?'false':'true');
  }
  function stopTimer(){clearInterval(timerId);timerId=null;syncPauseButton();}
  function updateTimerUrgency(){
    const timer=els.timerText?.closest('.timer');
    if(!timer)return;
    // The last 30 seconds are visually urgent for every question, not only boss actions.
    timer.classList.toggle('time-pressure',timeLeft<=30);
    timer.classList.toggle('time-critical',timeLeft<=10);
  }
  function playCountCueOnce(){
    if(countCuePlayed)return;
    countCuePlayed=true;
    playSE(countSE);
  }
  function startTimer(seconds=60,{preserveCountCue=false}={}){
    stopTimer();if(!preserveCountCue)countCuePlayed=false;timeLeft=seconds;els.timerText.textContent=timeLeft;updateTimerUrgency();
    // Boss STAGE3+ fifth actions start directly at 30 seconds, so cue immediately there.
    if(timeLeft<=30)playCountCueOnce();
    timerId=setInterval(()=>{timeLeft--;els.timerText.textContent=timeLeft;updateTimerUrgency();if(timeLeft===30)playCountCueOnce();if(timeLeft<=0){stopTimer();resolveAnswer(null,true);}},1000);syncPauseButton();updateSpecialHud();
  }
  function playSE(a){if(!soundOn)return;try{a.currentTime=0;a.play().catch(()=>{});}catch{}}
  function stopSE(a){try{a.pause();a.currentTime=0;}catch{}}
  function playAttackSE(){
    if(!soundOn)return;
    const a=mode==='front'?swordSE:magicSE;
    try{a.currentTime=0;a.play().catch(()=>playSE(correctSE));}catch{playSE(correctSE);}
  }
  function clearBattleFx(){
    els.heroActor.classList.remove('attack-front','attack-back','finisher-front','finisher-back');
    els.enemyActor.classList.remove('hit','finisher-hit');
    els.attackEffect.className='attack-effect';
    els.answerMark.hidden=true;
    els.answerMark.className='answer-mark';
  }
  function showAnswerMark(ok){
    els.answerMark.textContent=ok?'〇':'×';
    els.answerMark.className=`answer-mark ${ok?'mark-correct':'mark-wrong'}`;
    els.answerMark.hidden=false;
    void els.answerMark.offsetWidth;
    els.answerMark.classList.add('show');
  }
  function runAttackMotion(){
    els.heroActor.classList.remove('attack-front','attack-back','finisher-front','finisher-back');
    els.enemyActor.classList.remove('hit','finisher-hit');
    els.attackEffect.className='attack-effect';
    void els.heroActor.offsetWidth;void els.attackEffect.offsetWidth;
    els.heroActor.classList.add(mode==='front'?'attack-front':'attack-back');
    els.attackEffect.classList.add(mode==='front'?'front-hit':'back-hit');
    els.enemyActor.classList.add('hit');
    playAttackSE();
  }
  function playFinisherSE(){
    if(!soundOn)return;
    const a=mode==='front'?frontFinisherSE:backFinisherSE;
    try{a.currentTime=0;a.play().catch(()=>playAttackSE());}catch{playAttackSE();}
  }
  function runFinisherMotion(){
    els.heroActor.classList.remove('attack-front','attack-back','finisher-front','finisher-back');
    els.enemyActor.classList.remove('hit','finisher-hit');
    els.attackEffect.className='attack-effect';
    void els.heroActor.offsetWidth;void els.attackEffect.offsetWidth;
    els.heroActor.classList.add(mode==='front'?'finisher-front':'finisher-back');
    els.attackEffect.classList.add(mode==='front'?'finisher-front-fx':'finisher-back-fx');
    els.enemyActor.classList.add('finisher-hit');
    playFinisherSE();
  }
  async function stopBgmFade(ms=1100){
    if(!currentBgm)return;
    const a=currentBgm,start=a.muted?0:(a.volume||.32),steps=14;
    if(start>0){
      for(let i=1;i<=steps;i++){a.volume=start*(1-i/steps);await sleep(ms/steps);}
    }
    a.pause();
    try{a.currentTime=0;}catch{}
    a.volume=.32;
    a.muted=false;
    currentBgm=null;
  }
  async function playStageBgm(){
    if(!soundOn)return;
    const file=bossPhase?currentStage().bossBgm:currentStage().bgm;
    const wanted=`./assets/${file}`;
    const player=stageBgmPlayer;
    try{
      if(!player.src||!decodeURIComponent(player.src).endsWith(`/assets/${file}`)){
        player.pause();
        player.src=wanted;
        player.load();
      }
      player.loop=true;
      player.muted=false;
      player.volume=.32;
      try{player.currentTime=0;}catch{}
      await player.play();
      currentBgm=player;
    }catch{
      try{
        player.pause();
        player.src='./assets/bgm.mp3';
        player.load();
        player.loop=true;
        player.muted=false;
        player.volume=.32;
        player.currentTime=0;
        await player.play();
        currentBgm=player;
      }catch{}
    }
  }

  function ensureSceneCurtain(){
    let curtain=$('sceneCurtain');
    if(curtain)return curtain;
    curtain=document.createElement('div');
    curtain.id='sceneCurtain';
    curtain.className='scene-curtain';
    curtain.hidden=true;
    curtain.innerHTML='<div class="scene-curtain-noise"></div>';
    document.body.appendChild(curtain);
    return curtain;
  }
  async function sceneBlackout(swap,{hold=90,fadeIn=280,fadeOut=360}={}){
    const curtain=ensureSceneCurtain();
    curtain.style.setProperty('--scene-in',`${fadeIn}ms`);
    curtain.style.setProperty('--scene-out',`${fadeOut}ms`);
    curtain.hidden=false;
    curtain.className='scene-curtain entering';
    void curtain.offsetWidth;
    await sleep(fadeIn);
    curtain.className='scene-curtain covered';
    if(swap)await swap();
    await new Promise(requestAnimationFrame);
    await sleep(hold);
    curtain.className='scene-curtain leaving';
    await sleep(fadeOut);
    curtain.hidden=true;curtain.className='scene-curtain';
  }

  function prepareMapOverlay(initial=false){
    els.mapModeLabel.textContent=mode==='front'?'WORLD MAP':'NIGHT TOKYO';
    els.mapTitle.textContent=mode==='front'?'ぼうけんの ちず':'ウラのせかい';
    els.mapImage.src=mode==='front'?'./assets/world_map_v3_clean.png':'./assets/back_map.png';
    const mapLinesFront=['森を抜けて、つぎの地へ。','洞くつの先へ進みます…','塔へ向かっています…','まおうの城へ進軍中…','決戦の部屋へ向かいます…'];
    const mapLinesBack=['渋谷の裂け目へ移動中…','浅草の夜へ向かいます…','スカイツリー方面へ移動中…','都庁前へ急行中…','時空の最深部へ向かいます…'];
    els.mapMessage.textContent=(mode==='front'?mapLinesFront:mapLinesBack)[stageIndex] || (initial?'最初のエリアへ向かっています…':'次のエリアへ移動しています…');
    els.mapOverlay.hidden=false;
  }

  function prepareStageOverlay(){
    const s=currentStage();
    els.stagePreview.style.backgroundImage=`url('./assets/${s.bg}')`;
    els.stageOverlayLabel.textContent=`STAGE ${stageIndex+1}`;
    els.stageOverlayName.textContent=s.name;
    els.stageOverlay.hidden=false;
    requestAnimationFrame(()=>fitSingleLineText(els.stageOverlayName,{maxWidthRatio:.90,minPx:20}));
  }

  function clearMonsterAnnouncement(){
    const w=$('rarityWarning');
    if(w){w.hidden=true;w.textContent='';w.className='rarity-warning';}
    const warning=$('bossWarningFx');
    if(warning){warning.hidden=true;warning.className='boss-warning-fx';}
    const nameFx=$('bossNameFx');
    if(nameFx){nameFx.hidden=true;nameFx.className='boss-name-fx';}
    const c=$('bossCutin');
    if(c){c.hidden=true;c.className='boss-cutin';const img=c.querySelector('.cutin-art');if(img)img.removeAttribute('src');}
    document.querySelector('.battlefield')?.classList.remove('cutin-scene');
    const layer=$('monsterFxLayer');if(layer)layer.classList.remove('rare-arrival-4','rare-arrival-5');
  }

  // Combo-inspired assist gauge. The streak itself stays internal; the player only sees
  // the gauge. Correct answers add 20%, wrong answers subtract 20% without wiping all
  // progress. The gauge carries from normal encounters into the boss, then resets per stage.
  function updateSpecialHud(){
    if(!els.specialHud||!els.specialFill||!els.specialBtn)return;
    const value=Math.max(0,Math.min(100,specialGauge));
    els.specialFill.style.width=`${value}%`;
    els.specialHud.classList.toggle('ready',value>=100);
    const canUse=value>=100&&!specialActive&&!paused&&!gameOverActive&&!locked&&!!currentQuestion&&!!timerId&&!els.gameScreen.hidden;
    els.specialBtn.hidden=value<100||!currentQuestion||!timerId||paused||gameOverActive||specialActive;
    els.specialBtn.disabled=!canUse;
    els.specialBtn.setAttribute('aria-disabled',canUse?'false':'true');
  }
  function adjustSpecialGauge(delta){
    specialGauge=Math.max(0,Math.min(100,specialGauge+delta));
    updateSpecialHud();
  }
  function resetSpecialGauge(){specialGauge=0;comboStreak=0;specialActive=false;document.body.classList.remove('special-assist-active');updateSpecialHud();}
  async function activateSpecialMove(){
    if(specialActive||paused||gameOverActive||locked||specialGauge<100||!currentQuestion||!timerId)return;
    const wrongButtons=[...els.choices.children].filter(b=>b.dataset.eliminated!=='true'&&Number(b.textContent)!==currentQuestion.answer);
    if(!wrongButtons.length)return;
    specialActive=true;locked=true;
    const resumeTime=timeLeft;
    stopTimer();updateSpecialHud();syncPauseButton();
    [...els.choices.children].forEach(b=>b.disabled=true);
    document.body.classList.add('special-assist-active');
    specialGauge=0;updateSpecialHud();
    const heroFile=mode==='front'?'hero.png':'back_hero.png';
    await showActionCutin('hero',heroFile,{variant:'assist',duration:980});
    const target=pick(wrongButtons);
    playFinisherSE();
    target.classList.add('special-breaking');
    target.setAttribute('aria-label','必殺技で消去された選択肢');
    await sleep(420);
    target.textContent='✦';
    target.dataset.eliminated='true';
    target.onclick=null;
    target.disabled=true;
    target.classList.remove('special-breaking');
    target.classList.add('special-shattered');
    await sleep(260);
    document.body.classList.remove('special-assist-active');
    specialActive=false;locked=false;
    [...els.choices.children].forEach(b=>{b.disabled=b.dataset.eliminated==='true';});
    updateSpecialHud();syncPauseButton();
    if(currentQuestion&&timeLeft>0&&!paused&&!gameOverActive)startTimer(resumeTime,{preserveCountCue:true});
  }

  function prepareQuestion(){
    clearMonsterAnnouncement();
    locked=true;clearBattleFx();renderGame();
    currentQuestion=bossPhase?makeBossQuestion(stageIndex):(mode==='front'?makeFrontQuestion(stageIndex):makeBackQuestion(stageIndex));
    els.mathProblem.textContent=`${currentQuestion.expression}=?`;els.feedbackText.textContent='';els.choices.innerHTML='';
    makeChoices(currentQuestion.answer).forEach(v=>{const b=document.createElement('button');b.textContent=v;b.onclick=()=>resolveAnswer(v,false);els.choices.appendChild(b);});
    locked=false;syncPauseButton();updateSpecialHud();
  }

  function clearQuestionUi(){els.mathProblem.textContent='';els.feedbackText.textContent='';els.choices.innerHTML='';updateSpecialHud();}
  function prepareEmptyBattle(){enemyVisualToken++;concealEnemyVisual(true);currentMonster=null;bossPhase=false;renderGame();clearQuestionUi();document.querySelector('.battlefield').classList.add('battle-base-enter');}
  function ensureMonsterFx(){
    let layer=$('monsterFxLayer');if(layer)return layer;
    layer=document.createElement('div');layer.id='monsterFxLayer';
    layer.innerHTML=`
      <div id="rarityWarning"></div>
      <div id="bossWarningFx" class="boss-warning-fx" hidden aria-hidden="true">
        <div class="warning-grid"></div><div class="warning-band band-a"></div><div class="warning-band band-b"></div>
        <div class="warning-scan"></div><strong>WARNING!</strong><span>HOSTILE SIGNATURE DETECTED</span>
      </div>
      <div id="bossNameFx" class="boss-name-fx" hidden aria-hidden="true">
        <div class="boss-name-rail rail-a"></div><div class="boss-name-rail rail-b"></div><div class="boss-name-glitch"></div>
        <small>BOSS ENCOUNTER</small><strong id="bossNameText"></strong>
      </div>
      <div id="bossCutin" class="boss-cutin" hidden aria-hidden="true">
        <div class="cutin-dim"></div><div class="cutin-slash slash-a"></div><div class="cutin-slash slash-b"></div>
        <div class="cutin-band"><img class="cutin-art" alt=""><div class="cutin-speedlines"></div></div><div class="cutin-white"></div>
      </div>
      <div class="boss-obscurer one">★</div><div class="boss-obscurer two">★</div><div class="boss-obscurer three">★</div><div class="boss-obscurer four">★</div><div class="boss-obscurer five">★</div><div class="boss-obscurer six">★</div>`;
    document.querySelector('.battlefield').appendChild(layer);return layer;
  }
  async function showMonsterEntrance(monster){
    const layer=ensureMonsterFx();clearMonsterAnnouncement();els.enemyActor.style.opacity='0';els.enemyActor.style.transform='translateY(12px) scale(.92)';
    const w=$('rarityWarning');
    const entranceLabel=monster.rarity===5?'★★★★★ SSR':monster.rarity===4?'★★★★ SR':monster.rarity===3?'★★★ RARE':'';
    w.className=`rarity-warning rarity-${monster.rarity}${monster.rarity>=4?' rarity-high':''}`;
    w.textContent=entranceLabel;
    if(monster.rarity>=4)layer.classList.add(`rare-arrival-${monster.rarity}`);
    if(monster.rarity>=3){
      w.hidden=false;
      await sleep(monster.rarity===5?760:monster.rarity===4?560:420);
      w.hidden=true;w.textContent='';
    }else{w.hidden=true;w.textContent='';}
    els.enemyActor.classList.add(`spawn-r${monster.rarity}`);els.enemyActor.style.opacity='1';els.enemyActor.style.transform='';
    await sleep([0,380,520,760,1050,1450][monster.rarity]);
    els.enemyActor.classList.remove(`spawn-r${monster.rarity}`);
    layer.classList.remove('rare-arrival-4','rare-arrival-5');
    clearMonsterAnnouncement();
  }

  async function showBossWarning(){
    ensureMonsterFx();clearMonsterAnnouncement();
    const fx=$('bossWarningFx');
    fx.hidden=false;fx.className='boss-warning-fx active';
    playSE(sirenSE);
    await sleep(3000);
    stopSE(sirenSE);
    fx.hidden=true;fx.className='boss-warning-fx';
  }

  async function showBossName(){
    const fx=$('bossNameFx');const text=$('bossNameText');
    text.textContent=currentBoss().name;
    fx.hidden=false;fx.className='boss-name-fx active';
    fitSingleLineText(text,{maxWidthRatio:.90,minPx:20});
    await sleep(3000);
    fx.hidden=true;fx.className='boss-name-fx';
  }

  const CUTIN_FOCUS={
    'hero.png':{y:.22,height:320,side:4},
    'back_hero.png':{y:.18,height:320,side:4},
    'boss_front_1.png':{y:.33,height:310,side:3},
    'boss_front_2.png':{y:.29,height:320,side:2},
    'boss_front_3.png':{y:.28,height:320,side:3},
    'boss_front_4.png':{y:.29,height:320,side:4},
    'boss_front_5.png':{y:.31,height:320,side:3},
    'boss_back_1.png':{y:.33,height:320,side:3},
    'boss_back_2.png':{y:.27,height:320,side:4},
    'boss_back_3.png':{y:.30,height:320,side:2},
    'boss_back_4.png':{y:.29,height:320,side:3},
    'boss_back_5.png':{y:.34,height:320,side:2}
  };
  let specialHudCutinDepth=0;
  function hideSpecialHudForCutin(){
    specialHudCutinDepth++;
    if(els.specialHud)els.specialHud.classList.add('cutin-hidden');
    if(els.bossHpHud)els.bossHpHud.classList.add('cutin-hidden');
  }
  function restoreSpecialHudAfterCutin(){
    specialHudCutinDepth=Math.max(0,specialHudCutinDepth-1);
    if(specialHudCutinDepth===0){
      if(els.specialHud){els.specialHud.classList.remove('cutin-hidden');updateSpecialHud();}
      if(els.bossHpHud){els.bossHpHud.classList.remove('cutin-hidden');updateBossHpHud();}
    }
  }
  async function showActionCutin(side,imgFile,{variant='finisher',duration=1680}={}){
    hideSpecialHudForCutin();
    try{
      ensureMonsterFx();
      const c=$('bossCutin');const art=c.querySelector('.cutin-art');
      const focus=CUTIN_FOCUS[imgFile]||{y:.30,height:315,side:4};
      const top=50-focus.y*focus.height;
      art.src=`./assets/${imgFile}`;
      art.style.setProperty('--cutin-top',`${top.toFixed(1)}%`);
      art.style.setProperty('--cutin-height',`${focus.height}%`);
      art.style.setProperty('--cutin-side',`${focus.side}%`);
      c.style.setProperty('--cutin-duration',`${duration}ms`);
      const originalFacing=side==='enemy'&&BATTLE_KEEP_ORIGINAL_FACING.has(imgFile);
      c.className=`boss-cutin active ${side==='hero'?'hero-cutin':'enemy-cutin'} ${variant==='assist'?'assist-cutin':'finisher-cutin'}${originalFacing?' cutin-original-facing':''}`;
      c.hidden=false;
      document.querySelector('.battlefield')?.classList.add('cutin-scene');
      playSE(cutinSE);
      await sleep(duration);
      c.hidden=true;c.className='boss-cutin';c.style.removeProperty('--cutin-duration');
      document.querySelector('.battlefield')?.classList.remove('cutin-scene');
    
    }finally{
      restoreSpecialHudAfterCutin();
    }
  }
  async function showBossEntrance(retry=false,startAt=0){
    ensureMonsterFx();clearMonsterAnnouncement();locked=true;
    enemyVisualToken++;concealEnemyVisual(true);
    bossPhase=true;bossQuestion=Math.max(0,Math.min(4,Number(startAt)||0));currentMonster=null;
    const boss=currentBoss();registerMonster(boss);renderGame();updateBossHpHud(true);
    // Decode during WARNING so the boss is ready before its reveal, but keep the enemy
    // region empty until the dedicated spawn animation begins.
    const visualReady=stageEnemyVisual(boss);
    await showBossWarning();
    if(!(await visualReady))return;
    els.enemyActor.style.opacity='0';
    if(!retry)await playStageBgm();
    await showBossName();
    els.enemyActor.classList.add('spawn-boss');void els.enemyActor.offsetWidth;els.enemyActor.style.opacity='1';
    await sleep(1400);els.enemyActor.classList.remove('spawn-boss');clearMonsterAnnouncement();updateBossHpHud();
    if(bossQuestion===4){await runBossFifthAction();return;}
    prepareQuestion();startTimer(60);
  }

  function bossObscurerCount(){
    // Only the first front-world boss retains the original vision-obstruction attack.
    return mode==='front'&&stageIndex===0?3:0;
  }
  function configureBossObscurers(count){
    ensureMonsterFx();
    document.querySelectorAll('.boss-obscurer').forEach((star,i)=>{star.hidden=i>=count;});
  }
  const BOSS_SPECIALS={
    front:[
      {type:'obscure',name:'森羅封界',time:60},
      {type:'shield',name:'晶壁結界',time:60},
      {type:'reverse',name:'反転術式',time:60},
      {type:'double',name:'黒炎双断',time:30},
      {type:'shield-reverse',name:'魔王終式',time:30}
    ],
    back:[
      {type:'transform',name:'式界改竄',time:60},
      {type:'reconstruct',name:'百灯連算',time:60},
      {type:'reverse',name:'欠落信号',time:30},
      {type:'shield-double',name:'機甲連環',time:60},
      {type:'reverse-reconstruct',name:'時空再演算',time:30}
    ]
  };
  function currentBossSpecial(){return BOSS_SPECIALS[mode][stageIndex];}
  function ensureBossSpecialFxLayer(){
    let layer=$('bossSpecialFxLayer');
    if(!layer){
      const battlefield=document.querySelector('.battlefield');
      if(!battlefield)return null;
      layer=document.createElement('div');
      layer.id='bossSpecialFxLayer';
      layer.className='boss-special-fx-layer';
      layer.setAttribute('aria-hidden','true');
      layer.innerHTML=`
        <div id="bossTechniqueBanner" class="boss-technique-banner" hidden>
          <small>SPECIAL ATTACK</small><strong id="bossTechniqueName"></strong><i></i>
        </div>
        <div id="bossStrikeTransition" class="boss-strike-transition" hidden>
          <span class="boss-slash slash-one"></span><span class="boss-slash slash-two"></span>
          <div><small id="bossStrikeKicker">SECOND STRIKE</small><strong id="bossStrikeTitle">第二撃</strong></div>
        </div>
        <div id="bossRewriteFx" class="boss-rewrite-fx" hidden>
          <small>FORMULA REWRITE</small><div><span id="bossRewriteFrom"></span><b>→</b><strong id="bossRewriteTo"></strong></div>
        </div>
        <div id="bossReconstructFx" class="boss-reconstruct-fx" hidden>
          <small>RECONSTRUCT</small><strong id="bossReconstructNumber"></strong><i></i>
        </div>`;
      battlefield.appendChild(layer);
    }
    let shield=$('bossShieldFx');
    if(!shield&&els.enemyActor){
      shield=document.createElement('div');shield.id='bossShieldFx';shield.className='boss-shield-fx';shield.hidden=true;
      shield.innerHTML='<span class="shield-ring ring-a"></span><span class="shield-ring ring-b"></span><span class="shield-core"></span><b>SHIELD</b>';
      els.enemyActor.appendChild(shield);
    }
    return layer;
  }
  function clearBossTechniqueFx(){
    const banner=$('bossTechniqueBanner');if(banner){banner.hidden=true;banner.classList.remove('active');}
    const strike=$('bossStrikeTransition');if(strike){strike.hidden=true;strike.className='boss-strike-transition';}
    const rewrite=$('bossRewriteFx');if(rewrite){rewrite.hidden=true;rewrite.classList.remove('active');}
    const reconstruct=$('bossReconstructFx');if(reconstruct){reconstruct.hidden=true;reconstruct.classList.remove('active');}
    const shield=$('bossShieldFx');if(shield){shield.hidden=true;shield.classList.remove('active','breaking');}
    const chip=$('bossStrikeChip');if(chip)chip.remove();
  }
  async function showBossTechnique(name,kicker='SPECIAL ATTACK'){
    ensureBossSpecialFxLayer();
    const banner=$('bossTechniqueBanner'),label=$('bossTechniqueName');
    if(!banner||!label)return;
    hideSpecialHudForCutin();
    try{
      document.body.classList.add('boss-technique-active');
      banner.querySelector('small').textContent=kicker;
      label.textContent=name;
      banner.hidden=false;banner.classList.remove('active');void banner.offsetWidth;banner.classList.add('active');
      await sleep(920);
      banner.classList.remove('active');await sleep(160);banner.hidden=true;
    }finally{document.body.classList.remove('boss-technique-active');restoreSpecialHudAfterCutin();}
  }
  function setBossStepChip(text,step=1){
    let chip=$('bossStrikeChip');
    if(!chip){chip=document.createElement('span');chip.id='bossStrikeChip';chip.className='boss-strike-chip';document.querySelector('.question-panel')?.appendChild(chip);}
    chip.textContent=text;chip.dataset.step=String(step);
  }
  function populateSpecialQuestion(q,{chip='',step=1}={}){
    clearMonsterAnnouncement();locked=true;clearBattleFx();renderGame();
    currentQuestion=q;
    els.mathProblem.textContent=q.displayExpression||`${q.expression}=?`;els.feedbackText.textContent='';els.choices.innerHTML='';
    makeChoices(q.answer).forEach(v=>{const b=document.createElement('button');b.textContent=v;b.onclick=()=>resolveAnswer(v,false);els.choices.appendChild(b);});
    if(chip)setBossStepChip(chip,step);else{$('bossStrikeChip')?.remove();}
    locked=false;syncPauseButton();updateSpecialHud();
  }
  async function showBossPhaseTransition(kicker='SECOND STRIKE',title='第二撃',variant='slash'){
    ensureBossSpecialFxLayer();const fx=$('bossStrikeTransition');if(!fx)return;
    clearQuestionUi();locked=true;hideSpecialHudForCutin();document.body.classList.add('boss-technique-active');
    try{
      $('bossStrikeKicker').textContent=kicker;$('bossStrikeTitle').textContent=title;
      fx.hidden=false;fx.className=`boss-strike-transition ${variant}`;void fx.offsetWidth;fx.classList.add('active');
      await sleep(760);fx.classList.remove('active');await sleep(120);fx.hidden=true;
    }finally{document.body.classList.remove('boss-technique-active');restoreSpecialHudAfterCutin();}
  }
  async function showShieldForm(){
    ensureBossSpecialFxLayer();const shield=$('bossShieldFx');if(!shield)return;
    shield.hidden=false;shield.classList.remove('breaking');shield.classList.add('active');await sleep(620);
  }
  async function showShieldBreak(){
    const shield=$('bossShieldFx');if(!shield)return;
    shield.classList.remove('active');shield.classList.add('breaking');await sleep(680);shield.hidden=true;shield.classList.remove('breaking');
  }
  async function showEquationRewrite(from,to){
    ensureBossSpecialFxLayer();const fx=$('bossRewriteFx');if(!fx)return;
    clearQuestionUi();locked=true;hideSpecialHudForCutin();document.body.classList.add('boss-technique-active');
    try{
      $('bossRewriteFrom').textContent=from;$('bossRewriteTo').textContent=to;
      fx.hidden=false;fx.classList.remove('active');void fx.offsetWidth;fx.classList.add('active');await sleep(920);fx.classList.remove('active');await sleep(120);fx.hidden=true;
    }finally{document.body.classList.remove('boss-technique-active');restoreSpecialHudAfterCutin();}
  }
  async function showReconstructTransition(value,title='再構成'){
    ensureBossSpecialFxLayer();const fx=$('bossReconstructFx');if(!fx)return;
    clearQuestionUi();locked=true;hideSpecialHudForCutin();document.body.classList.add('boss-technique-active');
    try{
      fx.querySelector('small').textContent=title;$('bossReconstructNumber').textContent=value;
      fx.hidden=false;fx.classList.remove('active');void fx.offsetWidth;fx.classList.add('active');await sleep(900);fx.classList.remove('active');await sleep(100);fx.hidden=true;
    }finally{document.body.classList.remove('boss-technique-active');restoreSpecialHudAfterCutin();}
  }
  function makeShieldQuestion(){
    // Shield-breaking questions deliberately use the current stage's normal range.
    return mode==='front'?makeFrontQuestion(stageIndex):makeBackQuestion(stageIndex);
  }
  function makeReverseQuestion(){
    if(mode==='front'&&stageIndex===2){
      for(let i=0;i<500;i++){
        const a=rand(20,79),b=rand(10,39),c=rand(1,29),result=a+b-c;
        if(result>0&&result<100)return{expression:`□+${b}-${c}=${result}`,displayExpression:`□ + ${b} - ${c} = ${result}`,answer:a};
      }
      return{expression:'□+24-9=52',displayExpression:'□ + 24 - 9 = 52',answer:37};
    }
    if(mode==='front'&&stageIndex===4){
      for(let i=0;i<1500;i++){
        if(Math.random()<.5){
          const a=rand(100,699),b=rand(100,299),sum=a+b;if(sum>999)continue;
          const carry=((a%10)+(b%10)>=10)||(Math.floor(a/10)%10+Math.floor(b/10)%10>=10);
          if(carry)return{expression:`${a}+□=${sum}`,displayExpression:`${a} + □ = ${sum}`,answer:b};
        }else{
          const a=rand(300,999),b=rand(100,Math.min(699,a-1)),diff=a-b;
          const borrow=(a%10)<(b%10)||(Math.floor(a/10)%10)<(Math.floor(b/10)%10);
          if(borrow)return{expression:`${a}-□=${diff}`,displayExpression:`${a} - □ = ${diff}`,answer:b};
        }
      }
      return{expression:'731-□=275',displayExpression:'731 - □ = 275',answer:456};
    }
    if(mode==='back'&&stageIndex===2){
      const a=rand(2,9),b=rand(2,9);return{expression:`□×${b}=${a*b}`,displayExpression:`□ × ${b} = ${a*b}`,answer:a};
    }
    if(mode==='back'&&stageIndex===4){
      const a=rand(2,9),b=rand(2,9);return{expression:`□×${b}=${a*b}`,displayExpression:`□ × ${b} = ${a*b}`,answer:a};
    }
    const q=makeBossQuestion(stageIndex);return{...q,displayExpression:`${q.expression} = ?`};
  }
  function makeTransformQuestion(){
    for(let i=0;i<1200;i++){
      const a=rand(20,89),b=rand(12,69),c=rand(10,59);const ans=a+b-c;
      if(ans<=0||ans>199)continue;
      const shift=10;
      return{expression:`${a}+${b+shift}-${c+shift}`,displayExpression:`${a} + ${b+shift} - ${c+shift} = ?`,answer:ans,from:`${a} + ${b} - ${c} = ?`};
    }
    return{expression:'38+57-36',displayExpression:'38 + 57 - 36 = ?',answer:59,from:'38 + 47 - 26 = ?'};
  }
  function makeReconstructedQuestion(value,{finalBoss=false}={}){
    if(finalBoss){
      const mult=rand(10,49),base=rand(100,699);return{expression:`${base}+${value}×${mult}`,displayExpression:`${base} + ${value} × ${mult} = ?`,answer:base+value*mult};
    }
    const n=rand(10,79);
    if(value>n+8&&Math.random()<.55)return{expression:`${value}-${n}`,displayExpression:`${value} - ${n} = ?`,answer:value-n};
    const add=Math.min(n,Math.max(1,999-value));
    if(add>0)return{expression:`${value}+${add}`,displayExpression:`${value} + ${add} = ?`,answer:value+add};
    return{expression:`${value}-17`,displayExpression:`${value} - 17 = ?`,answer:value-17};
  }
  async function announceTimeLimit(seconds){
    if(seconds>30)return;
    const w=$('rarityWarning');w.className='rarity-warning time-warning';w.textContent=`${seconds}びょう！`;w.hidden=false;await sleep(620);w.hidden=true;w.textContent='';
  }
  async function runBossFifthAction(){
    const spec=currentBossSpecial();
    ensureMonsterFx();ensureBossSpecialFxLayer();clearBossAction();locked=true;stopTimer();clearQuestionUi();
    // All boss techniques begin only after the existing enemy cut-in has fully finished.
    await showActionCutin('enemy',currentBoss().img,{variant:'finisher',duration:1480});
    bossActionActive=true;bossSpecialSequence={type:spec.type,step:'start'};
    await showBossTechnique(spec.name);
    switch(spec.type){
      case'obscure':{
        bossSpecialSequence={type:'obscure',step:'final'};
        configureBossObscurers(bossObscurerCount());document.body.classList.add('boss-obscure-active');
        prepareQuestion();startTimer(60);break;
      }
      case'shield':{
        bossSpecialSequence={type:'shield',step:'shield'};await showShieldForm();
        populateSpecialQuestion(makeShieldQuestion(),{chip:'結界',step:1});startTimer(60);break;
      }
      case'reverse':{
        bossSpecialSequence={type:'reverse',step:'final'};
        if(spec.time<=30){document.body.classList.add('boss-time-pressure');await announceTimeLimit(spec.time);}
        populateSpecialQuestion(makeReverseQuestion(),{chip:'逆算',step:1});startTimer(spec.time);break;
      }
      case'double':{
        bossSpecialSequence={type:'double',step:1};document.body.classList.add('boss-time-pressure');await announceTimeLimit(spec.time);
        populateSpecialQuestion(makeBossQuestion(stageIndex),{chip:'第一撃',step:1});startTimer(spec.time);break;
      }
      case'shield-reverse':{
        bossSpecialSequence={type:'shield-reverse',step:'shield'};await showShieldForm();
        populateSpecialQuestion(makeShieldQuestion(),{chip:'魔王結界',step:1});startTimer(60);break;
      }
      case'transform':{
        const q=makeTransformQuestion();bossSpecialSequence={type:'transform',step:'final',question:q};
        await showEquationRewrite(q.from,q.displayExpression);populateSpecialQuestion(q,{chip:'改竄',step:1});startTimer(spec.time);break;
      }
      case'reconstruct':{
        bossSpecialSequence={type:'reconstruct',step:1};
        populateSpecialQuestion(makeBossQuestion(stageIndex),{chip:'第一算',step:1});startTimer(spec.time);break;
      }
      case'shield-double':{
        bossSpecialSequence={type:'shield-double',step:'shield'};await showShieldForm();
        populateSpecialQuestion(makeShieldQuestion(),{chip:'装甲',step:1});startTimer(60);break;
      }
      case'reverse-reconstruct':{
        bossSpecialSequence={type:'reverse-reconstruct',step:1};
        populateSpecialQuestion(makeReverseQuestion(),{chip:'逆算',step:1});startTimer(60);break;
      }
    }
  }
  function clearBossAction(){
    bossActionActive=false;bossSpecialSequence=null;clearBossTechniqueFx();
    document.body.classList.remove('boss-obscure-active','boss-time-pressure','vargas-double-strike','boss-technique-active','boss-shield-active');
    document.querySelectorAll('.boss-obscurer').forEach(star=>{star.hidden=true;});
    const timer=els.timerText?.closest('.timer');if(timer)timer.classList.remove('time-pressure','time-critical');
  }
  async function beginNormalEncounter(){
    bossPhase=false;bossQuestion=0;clearBossAction();unlockCurrentStageMusic();
    enemyVisualToken++;concealEnemyVisual(true);
    currentMonster=selectMonster();registerMonster(currentMonster);renderGame();clearQuestionUi();
    if(!(await stageEnemyVisual(currentMonster)))return;
    await showMonsterEntrance(currentMonster);prepareQuestion();startTimer(60);
  }
  async function showMapSequence(initial=false,mapAlreadyVisible=false){
    if(!mapAlreadyVisible)prepareMapOverlay(initial);
    // Give the map enough time to be read, especially after a stage clear.
    // Existing transitionFx is intentionally untouched; these timings only slow the
    // map -> stage intro -> battle presentation with a gentler blackout/fade rhythm.
    await sleep(initial?2800:3200);
    await sceneBlackout(async()=>{
      prepareStageOverlay();
      els.mapOverlay.hidden=true;
    },{fadeIn:650,hold:150,fadeOut:780});
    // Let the stage card breathe before entering the battlefield.
    await sleep(1500);
    await sceneBlackout(async()=>{
      prepareEmptyBattle();
      els.stageOverlay.hidden=true;
    },{fadeIn:700,hold:180,fadeOut:900});
    document.querySelector('.battlefield')?.classList.remove('battle-base-enter');
    // A short visual beat prevents the monster entrance from starting on the same
    // frame as the fade finishes.
    await sleep(320);
    // Start the stage track before the visible 3-2-1 sequence so the countdown lands
    // on music instead of beginning in silence.
    await playStageBgm();
    await runBattleCountdown();
    await beginNormalEncounter();
  }

  async function runBattleCountdown(){
    if(!els.battleCountdownOverlay||!els.battleCountdownText)return;
    locked=true;stopTimer();clearBattleFx();syncPauseButton();
    document.body.classList.add('battle-countdown-active');
    els.battleCountdownOverlay.hidden=false;
    const steps=[['3',650],['2',650],['1',650],['START!',850]];
    for(const [label,ms] of steps){
      els.battleCountdownText.textContent=label;
      els.battleCountdownText.className=`battle-countdown-text ${label==='START!'?'is-start':''}`;
      void els.battleCountdownText.offsetWidth;
      els.battleCountdownText.classList.add('pulse');
      playSE(label==='START!'?start0SE:start321SE);
      await sleep(ms);
    }
    els.battleCountdownOverlay.classList.add('leaving');
    await sleep(300);
    els.battleCountdownOverlay.hidden=true;
    els.battleCountdownOverlay.classList.remove('leaving');
    els.battleCountdownText.className='battle-countdown-text';
    document.body.classList.remove('battle-countdown-active');
  }

  async function showGameOver(){
    gameOverActive=true;locked=true;stopTimer();resetSpecialGauge();syncPauseButton();
    if(currentBgm)try{currentBgm.pause();}catch{}
    document.body.classList.add('game-over-active');
    const fromBoss=!!bossPhase;
    els.gameOverRetryBtn.textContent=fromBoss?'ボスから':'ステージ最初から';
    els.gameOverMessage.textContent=fromBoss?'ボス戦の最初からやりなおしますか？':'このステージの最初からやりなおしますか？';
    els.gameOverOverlay.hidden=false;
    const card=els.gameOverOverlay.querySelector('.game-over-card');
    if(card){card.classList.remove('show');void card.offsetWidth;card.classList.add('show');}
  }
  async function retryFromGameOver(){
    if(!gameOverActive)return;
    const retryBoss=!!bossPhase;
    gameOverActive=false;els.gameOverOverlay.hidden=true;document.body.classList.remove('game-over-active');
    lives=3;locked=true;clearBattleFx();clearMonsterAnnouncement();
    if(retryBoss){await restartBossCheckpoint();return;}
    totalProgress=stageIndex*15;stageQuestion=0;bossPhase=false;bossQuestion=0;currentMonster=null;
    await showMapSequence(false,false);
  }
  async function returnTitleFromGameOver(){
    if(!gameOverActive)return;
    gameOverActive=false;els.gameOverOverlay.hidden=true;document.body.classList.remove('game-over-active');locked=true;stopTimer();
    clearBossAction();clearMonsterAnnouncement();clearBattleFx();enemyVisualToken++;concealEnemyVisual(true);
    try{stageBgmPlayer.pause();stageBgmPlayer.currentTime=0;}catch{}currentBgm=null;
    stopSE(sirenSE);stopSE(cutinSE);stopSE(frontFinisherSE);stopSE(backFinisherSE);stopSE(countSE);stopSE(start321SE);stopSE(start0SE);stopSE(clearSE);stopSE(cancelSE);resetRun();
    await transitionTo(()=>{showOnly(els.titleScreen);renderTitle();},mode==='back'?'back':'normal',1050);
  }

  function showPauseMenu(){els.pauseMenu.hidden=false;els.pauseConfirm.hidden=true;}
  function showPauseConfirm(){els.pauseMenu.hidden=true;els.pauseConfirm.hidden=false;}
  function pauseGame(){
    if(paused||locked||els.gameScreen.hidden||!timerId||!currentQuestion)return;
    pauseRestoreLocked=locked;pauseBgmShouldResume=!!(soundOn&&currentBgm&&!currentBgm.paused);
    paused=true;locked=true;stopTimer();
    if(currentBgm)try{currentBgm.pause();}catch{}
    [...els.choices.children].forEach(b=>b.disabled=true);
    document.body.classList.add('game-paused');showPauseMenu();els.pauseOverlay.hidden=false;syncPauseButton();
  }
  function resumeGame(){
    if(!paused)return;
    els.pauseOverlay.hidden=true;document.body.classList.remove('game-paused');paused=false;locked=pauseRestoreLocked;
    [...els.choices.children].forEach(b=>{b.disabled=b.dataset.eliminated==='true';});
    if(pauseBgmShouldResume&&soundOn&&currentBgm)currentBgm.play().catch(()=>{});
    if(!locked&&currentQuestion&&timeLeft>0)startTimer(timeLeft,{preserveCountCue:true});else syncPauseButton();
    updateSpecialHud();
  }
  async function returnTitleFromPause(){
    if(!paused)return;
    els.pauseOverlay.hidden=true;document.body.classList.remove('game-paused');paused=false;locked=true;stopTimer();
    clearBossAction();clearMonsterAnnouncement();clearBattleFx();
    try{stageBgmPlayer.pause();stageBgmPlayer.currentTime=0;}catch{}currentBgm=null;
    stopSE(sirenSE);stopSE(cutinSE);stopSE(frontFinisherSE);stopSE(backFinisherSE);stopSE(countSE);stopSE(start321SE);stopSE(start0SE);stopSE(clearSE);stopSE(cancelSE);resetRun();
    await transitionTo(()=>{showOnly(els.titleScreen);renderTitle();},mode==='back'?'back':'normal',1050);
  }

  async function startAdventure(){resetRun();primeStageBgm();await transitionTo(()=>{showOnly(els.gameScreen);prepareMapOverlay(true);},mode==='back'?'back':'normal',1500);await showMapSequence(true,true);}
  async function nextQuestion(){if(bossPhase){prepareQuestion();startTimer((bossQuestion===4&&stageIndex>=2)?30:60);}else{await beginNormalEncounter();}}

  async function resolveAnswer(value,timeout=false){
    if(locked)return;locked=true;stopTimer();updateSpecialHud();[...els.choices.children].forEach(b=>{b.disabled=true;if(Number(b.textContent)===currentQuestion.answer)b.classList.add('correct');if(value!==null&&Number(b.textContent)===value&&value!==currentQuestion.answer)b.classList.add('wrong');});
    const ok=!timeout&&value===currentQuestion.answer;
    if(ok&&bossPhase&&bossQuestion===4&&bossSpecialSequence){
      const seq=bossSpecialSequence;
      const intermediate=async(message)=>{els.feedbackText.textContent=message;showAnswerMark(true);playSE(correctSE);await sleep(520);};
      if(seq.type==='shield'&&seq.step==='shield'){
        await intermediate('結界を破壊！');await showShieldBreak();bossSpecialSequence={type:'shield',step:'final'};
        populateSpecialQuestion(makeBossQuestion(stageIndex),{chip:'本撃',step:2});startTimer(60,{preserveCountCue:true});return;
      }
      if(seq.type==='shield-reverse'&&seq.step==='shield'){
        await intermediate('魔王結界を破壊！');await showShieldBreak();await showBossPhaseTransition('FINAL CALCULATION','最終演算','impact');
        bossSpecialSequence={type:'shield-reverse',step:'final'};document.body.classList.add('boss-time-pressure');await announceTimeLimit(30);
        populateSpecialQuestion(makeReverseQuestion(),{chip:'最終演算',step:2});startTimer(30);return;
      }
      if(seq.type==='double'&&seq.step===1){
        await intermediate('第一撃を突破！');await showBossPhaseTransition('SECOND STRIKE','第二撃','slash');
        bossSpecialSequence={type:'double',step:2};populateSpecialQuestion(makeBossQuestion(stageIndex),{chip:'第二撃',step:2});startTimer(30,{preserveCountCue:true});return;
      }
      if(seq.type==='reconstruct'&&seq.step===1){
        const first=currentQuestion.answer;await intermediate('第一算を突破！');await showReconstructTransition(first,'ANSWER LINK');
        bossSpecialSequence={type:'reconstruct',step:2,source:first};populateSpecialQuestion(makeReconstructedQuestion(first),{chip:'再構成',step:2});startTimer(60,{preserveCountCue:true});return;
      }
      if(seq.type==='shield-double'&&seq.step==='shield'){
        await intermediate('装甲を破壊！');await showShieldBreak();await showBossPhaseTransition('CORE EXPOSED','コア露出','impact');
        bossSpecialSequence={type:'shield-double',step:1};populateSpecialQuestion(makeBossQuestion(stageIndex),{chip:'第一撃',step:1});startTimer(60,{preserveCountCue:true});return;
      }
      if(seq.type==='shield-double'&&seq.step===1){
        await intermediate('第一撃を突破！');await showBossPhaseTransition('SECOND STRIKE','第二撃','slash');
        bossSpecialSequence={type:'shield-double',step:2};populateSpecialQuestion(makeBossQuestion(stageIndex),{chip:'第二撃',step:2});startTimer(60,{preserveCountCue:true});return;
      }
      if(seq.type==='reverse-reconstruct'&&seq.step===1){
        const first=currentQuestion.answer;await intermediate('逆算成功！');await showReconstructTransition(first,'TIME RECONSTRUCT');
        bossSpecialSequence={type:'reverse-reconstruct',step:2,source:first};document.body.classList.add('boss-time-pressure');await announceTimeLimit(30);
        populateSpecialQuestion(makeReconstructedQuestion(first,{finalBoss:true}),{chip:'時空再構成',step:2});startTimer(30);return;
      }
    }
    if(ok){
      comboStreak++;adjustSpecialGauge(20);
      els.feedbackText.textContent='せいかい！';showAnswerMark(true);
      if(bossPhase&&bossQuestion===4){playSE(correctSE);await sleep(520);totalProgress++;bossQuestion++;renderGame();await defeatBoss();return;}
      runAttackMotion();await sleep(180);playSE(correctSE);await sleep(720);totalProgress++;
      if(bossPhase){
        bossQuestion++;
        if(bossQuestion>=5){await defeatBoss();return;}
        if(bossQuestion===4){await runBossFifthAction();return;}
        prepareQuestion();startTimer(60);return;
      }
      stageQuestion++;
      if(stageQuestion>=10){await enterBossPhase();return;}
      await beginNormalEncounter();return;
    }
    comboStreak=0;adjustSpecialGauge(-20);playSE(wrongSE);showAnswerMark(false);stats.mistakes++;if(timeout)stats.timeouts++;stats.errors.push({q:currentQuestion.expression,selected:timeout?'時間切れ':value,answer:currentQuestion.answer});lives--;els.feedbackText.textContent=timeout?`じかんぎれ！ 正解は ${currentQuestion.answer}`:`ざんねん！ 正解は ${currentQuestion.answer}`;renderGame();await sleep(1200);
    if(lives<=0){
      stats.restarts++;
      await showGameOver();
      return;
    }
    if(bossPhase){
      if(bossQuestion===4){await runBossFifthAction();return;}
      prepareQuestion();startTimer(60);
    }else{prepareQuestion();startTimer(60);}
  }

  async function enterBossPhase(){
    locked=true;stopTimer();clearQuestionUi();enemyVisualToken++;concealEnemyVisual(true);await stopBgmFade(900);bossPhase=true;bossQuestion=0;currentMonster=null;clearBossAction();unlockCurrentBossMusic();await showBossEntrance(false);
  }
  async function restartBossCheckpoint(){
    stopTimer();await stopBgmFade(600);clearBossAction();lives=3;bossPhase=true;bossQuestion=0;totalProgress=stageIndex*15+10;unlockCurrentBossMusic();
    prepareMapOverlay(false);await sleep(1100);
    await sceneBlackout(async()=>{prepareStageOverlay();els.mapOverlay.hidden=true;},{fadeIn:250,hold:70,fadeOut:310});
    await sleep(760);
    await sceneBlackout(async()=>{bossPhase=true;currentMonster=null;renderGame();clearQuestionUi();els.enemyActor.style.opacity='0';els.stageOverlay.hidden=true;},{fadeIn:270,hold:100,fadeOut:360});
    await playStageBgm();
    await runBattleCountdown();
    await showBossEntrance(true);
  }
  async function defeatBoss(){
    stopTimer();clearBossAction();
    // The large correct mark has already had a clear beat before the cut-in; hide it
    // so the cut-in itself remains visually clean even though answer marks are top-layer UI.
    els.answerMark.hidden=true;
    await showActionCutin('hero',mode==='front'?'hero.png':'back_hero.png');
    runFinisherMotion();
    await sleep(980);
    els.enemyActor.classList.add('boss-defeat');
    await sleep(2100);
    els.enemyActor.classList.remove('boss-defeat','finisher-hit');
    els.heroActor.classList.remove('finisher-front','finisher-back');
    els.attackEffect.className='attack-effect';
    await clearStage();
  }

  async function clearStage(){
    resetSpecialGauge();
    if(!runStageRewards.has(stageIndex)){
      runStageRewards.add(stageIndex);stats.gold+=5;
      if(!debugFullUnlock){save.gold+=5;persist();}
    }
    els.stageClearName.textContent=currentStage().name;
    requestAnimationFrame(()=>fitSingleLineText(els.stageClearName,{maxWidthRatio:.90,minPx:18}));
    els.stageClearOverlay.hidden=false;
    playSE(clearSE);
    enemyVisualToken++;concealEnemyVisual(true);
    const fade=stopBgmFade(1500);
    // Give the victory card a fuller reward beat before the existing fade-to-map transition.
    await sleep(2750);

    if(stageIndex>=getStages().length-1){
      els.stageClearOverlay.hidden=true;
      await fade;
      await finishRun();
      return;
    }

    // Prepare the next map behind the clear screen, then reveal it through the same
    // blackout/fade language used elsewhere. This avoids exposing the previous battle
    // while keeping the existing transitionFx system intact.
    stageIndex++;
    stageQuestion=0;bossPhase=false;bossQuestion=0;currentMonster=null;clearBossAction();
    lives=3;
    prepareMapOverlay(false);
    await new Promise(requestAnimationFrame);
    await sceneBlackout(async()=>{
      els.stageClearOverlay.hidden=true;
    },{fadeIn:650,hold:160,fadeOut:850});
    await fade;
    await showMapSequence(false,true);
  }

  async function finishRun(){
    stopTimer();await stopBgmFade(500);let reward=null;
    if(!debugFullUnlock){
      if(mode==='front'){save.frontClears++;if(!save.backUnlocked){save.backUnlocked=true;if(!save.owned.includes(100))save.owned.push(100);reward=ITEMS.find(i=>i.id===100);}else reward=randomReward();}
      else{save.backClears++;reward=randomReward();}
      persist();
    }else renderTitle();
    renderResult();els.resultOverlay.hidden=false;
    if(reward){await sleep(600);els.rewardIcon.textContent=reward.icon;els.rewardName.textContent=reward.name;els.rewardText.textContent=reward.id===100?'時空の扉が開いた……。表のタイトルに「ウラステージへ」が追加されました。':'ゲームクリア報酬として、新しいコレクションアイテムを手に入れた！';els.rewardOverlay.hidden=false;}
  }
  function randomReward(){const unowned=ITEMS.filter(i=>!save.owned.includes(i.id)&&i.id!==100);if(!unowned.length)return null;const roll=Math.random(),rar=roll<.6?'common':roll<.9?'uncommon':'rare';let pool=unowned.filter(i=>i.rarity===rar);if(!pool.length)pool=unowned;const r=pick(pool);save.owned.push(r.id);persist();return r;}
  function renderResult(){els.resultMistakes.textContent=stats.mistakes;els.resultTimeouts.textContent=stats.timeouts;els.resultRestarts.textContent=stats.restarts;els.resultGold.textContent=`${stats.gold} G`;els.resultErrors.innerHTML=stats.errors.length?stats.errors.map(e=>`<div class="error-row"><b>${e.q}=?</b>　あなた: ${e.selected}　正解: ${e.answer}</div>`).join(''):'<div class="error-row">ミスはありませんでした！</div>';}

  els.musicBtn.onclick=()=>openMusicPlayer();
  els.musicCloseBtn.onclick=()=>closeMusicPlayer();
  els.musicOverlay.onclick=e=>{if(e.target===els.musicOverlay){playSE(cancelSE);closeMusicPlayer();}};
  els.musicFrontTab.onclick=()=>switchMusicWorld('front');
  els.musicBackTab.onclick=()=>switchMusicWorld('back');
  els.musicPrevBtn.onclick=()=>moveMusicTrack(-1);
  els.musicNextBtn.onclick=()=>moveMusicTrack(1);
  els.musicStopBtn.onclick=()=>{stopMusicPlayer();renderMusicPlayer();};
  els.musicPlayBtn.onclick=()=>{
    if(musicTrackIndex<0){moveMusicTrack(1);return;}
    if(musicPlayer.paused)musicPlayer.play().then(renderMusicPlayer).catch(()=>{});else{musicPlayer.pause();renderMusicPlayer();}
  };
  musicPlayer.addEventListener('play',renderMusicPlayer);
  musicPlayer.addEventListener('pause',renderMusicPlayer);
  if(els.debugToggleBtn)els.debugToggleBtn.onclick=()=>setDebugFullUnlock(!debugFullUnlock);
  if(els.debugCloseBtn)els.debugCloseBtn.onclick=closeDebugPanel;
  if(els.debugOverlay)els.debugOverlay.onclick=e=>{if(e.target===els.debugOverlay)closeDebugPanel();};

  els.playBtn.onclick=startAdventure;
  els.shopBtn.onclick=async()=>{await transitionTo(()=>{showOnly(els.shopScreen);renderShop();},mode==='back'?'back':'normal',1450);};
  els.collectionBtn.onclick=async()=>{await transitionTo(()=>{showOnly(els.collectionScreen);renderCollection();},mode==='back'?'back':'normal',1450);};
  els.monsterBookBtn.onclick=async()=>{await transitionTo(()=>{showOnly(els.monsterBookScreen);renderMonsterBook();},mode==='back'?'back':'normal',1450);};
  els.shopBackBtn.onclick=async()=>{await transitionTo(()=>{showOnly(els.titleScreen);renderTitle();},mode==='back'?'back':'normal',1450);};
  els.collectionBackBtn.onclick=els.shopBackBtn.onclick;
  els.monsterBookBackBtn.onclick=els.shopBackBtn.onclick;
  els.monsterCardClose.onclick=closeMonsterCard;
  els.monsterCardOverlay.onclick=e=>{if(e.target===els.monsterCardOverlay){playSE(cancelSE);closeMonsterCard();}};
  els.backWorldBtn.onclick=async()=>{await transitionTo(()=>{mode='back';renderTitle();showOnly(els.titleScreen);},'back',1700);};
  els.frontWorldBtn.onclick=async()=>{await transitionTo(()=>{mode='front';renderTitle();showOnly(els.titleScreen);},'normal',1700);};
  els.soundBtn.onclick=()=>{soundOn=!soundOn;els.soundBtn.textContent=`♪ ${soundOn?'ON':'OFF'}`;if(!soundOn){if(currentBgm)currentBgm.pause();[sirenSE,cutinSE,frontFinisherSE,backFinisherSE,countSE,buttonSE,cancelSE,start321SE,start0SE,clearSE].forEach(stopSE);}else{playSE(buttonSE);if(currentBgm)currentBgm.play().catch(()=>{});}};
  els.pauseBtn.onclick=pauseGame;
  if(els.specialBtn)els.specialBtn.onclick=activateSpecialMove;
  els.pauseResumeBtn.onclick=resumeGame;
  els.pauseTitleBtn.onclick=showPauseConfirm;
  els.pauseCancelTitleBtn.onclick=showPauseMenu;
  els.pauseConfirmTitleBtn.onclick=returnTitleFromPause;
  els.gameOverRetryBtn.onclick=retryFromGameOver;
  els.gameOverTitleBtn.onclick=returnTitleFromGameOver;
  els.replayBtn.onclick=async()=>{resetRun();primeStageBgm();await transitionTo(()=>{els.resultOverlay.hidden=true;els.rewardOverlay.hidden=true;showOnly(els.gameScreen);prepareMapOverlay(true);},mode==='back'?'back':'normal',1500);await showMapSequence(true,true);};
  els.toTitleBtn.onclick=async()=>{await transitionTo(()=>{els.resultOverlay.hidden=true;els.rewardOverlay.hidden=true;showOnly(els.titleScreen);renderTitle();},mode==='back'?'back':'normal',1500);};
  els.rewardOkBtn.onclick=()=>{els.rewardOverlay.hidden=true;};

  const CANCEL_BUTTON_IDS=new Set([
    'shopBackBtn','collectionBackBtn','monsterBookBackBtn','monsterCardClose','musicCloseBtn','debugCloseBtn','frontWorldBtn',
    'pauseTitleBtn','pauseCancelTitleBtn','pauseConfirmTitleBtn','gameOverTitleBtn','toTitleBtn'
  ]);
  document.addEventListener('pointerdown',e=>{
    const b=e.target.closest('button');if(!b||b.disabled)return;
    // Battle answer choices keep their existing correct/wrong/attack sound design.
    // Back/close/title-navigation controls use cancel.mp3; other UI controls use button.mp3.
    if(!b.closest('#choices'))playSE(CANCEL_BUTTON_IDS.has(b.id)?cancelSE:buttonSE);
    b.classList.add('pressed');setTimeout(()=>b.classList.remove('pressed'),180);
  });

  window.__SANSU_TEST__={
    get state(){return{mode,stageIndex,stageQuestion,totalProgress,lives,timeLeft,bossPhase,bossQuestion,currentMonster:currentMonster&&{...currentMonster},bossActionActive,bossSpecialSequence:bossSpecialSequence&&{...bossSpecialSequence},currentQuestion:currentQuestion&&{...currentQuestion},paused,gameOverActive,specialGauge,comboStreak,specialActive};},
    rarityRoll,selectMonster,makeBossQuestion,makeFrontFinalBossQuestion,makeBackFinalBossQuestion,currentBoss,makeChoices,
    showActionCutin,showBossTechnique,runBossFifthAction,showBossPhaseTransition,showShieldForm,showShieldBreak,showEquationRewrite,showReconstructTransition,makeReverseQuestion,makeTransformQuestion,makeReconstructedQuestion,runAttackMotion,runFinisherMotion,activateSpecialMove,sceneBlackout,pauseGame,resumeGame,runBattleCountdown,showGameOver,retryFromGameOver,BATTLE_KEEP_ORIGINAL_FACING,
    setMode(v){mode=v;renderTitle();},setStage(i){clearBossAction();stageIndex=i;stageQuestion=0;bossPhase=false;bossQuestion=0;currentMonster=null;},
    forceBoss(q=0){bossPhase=true;bossQuestion=q;currentMonster=null;renderGame();},
    setLives(v){lives=v;renderGame();},
    registerMonster,get save(){return save;},get debugFullUnlock(){return debugFullUnlock;},setDebugFullUnlock,openDebugPanel,debugJumpToStage,debugJumpToBossFifth,FRONT_MONSTERS,BACK_MONSTERS,FRONT_STAGES,BACK_STAGES,musicTracks,renderMusicPlayer,
    async beginNormal(){await beginNormalEncounter();},async enterBoss(){await enterBossPhase();},async bossAction(){await runBossFifthAction();},async restartBoss(){await restartBossCheckpoint();},async resolve(v,t=false){await resolveAnswer(v,t);},stop(){stopTimer();},setProgress(sq,tp,bq=0,bp=false){stageQuestion=sq;totalProgress=tp;bossQuestion=bq;bossPhase=bp;renderGame();}
  };

  window.addEventListener('resize',()=>requestAnimationFrame(fitVisibleNames),{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(fitVisibleNames,80),{passive:true});
  if(document.fonts?.ready)document.fonts.ready.then(()=>fitVisibleNames()).catch(()=>{});

  installDebugSecretGesture();
  renderTitle();showOnly(els.titleScreen);
})();
