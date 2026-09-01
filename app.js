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
  const DEFAULT_SAVE={gold:0,owned:[],frontClears:0,backClears:0,crimsonClears:0,blueClears:0,silverClears:0,backUnlocked:false,monsterBook:{front:[],back:[],crimson:[],blue:[],silver:[]},monsterEncounters:{front:{},back:{},crimson:{},blue:{},silver:{}},musicUnlocked:{front:[],back:[],crimson:[],blue:[],silver:[]},secretRelics:[],secretRelicNotified:[],secretRelicVersion:0,mapTipIntroIndex:0,mapSecretTipTierSeen:0,worldUnlockNotified:[],worldUnlockNew:[],worldUnlockVersion:0};
  let save=loadSave();

  const FRONT_STAGES=[
    {name:'はじまりの もり',key:'forest',count:15,normalCount:10,bossCount:5,bgm:'Cybern.mp3',bossBgm:'boss.mp3',bg:'bg_forest.png',boss:['森王トレントロード','boss_front_1.png']},
    {name:'ふしぎな どうくつ',key:'cave',count:15,normalCount:10,bossCount:5,bgm:'Cold Amber.mp3',bossBgm:'boss.mp3',bg:'bg_cave.png',boss:['晶竜グランクリスタ','boss_front_2.png']},
    {name:'まほうの とう',key:'tower',count:15,normalCount:10,bossCount:5,bgm:'Crate Lockup Tango.mp3',bossBgm:'boss.mp3',bg:'bg_tower.png',boss:['大魔導師アストラル','boss_front_3.png']},
    {name:'まおうの しろ',key:'castle',count:15,normalCount:10,bossCount:5,bgm:'Quantized Panic.mp3',bossBgm:'boss.mp3',bg:'bg_castle.png',boss:['黒騎将ヴァルガス','boss_front_4.png']},
    {name:'まおうの へや',key:'boss',count:15,normalCount:10,bossCount:5,bgm:'Geology.mp3',bossBgm:'MAOH.mp3',bg:'bg_boss.png',boss:['魔王キング','boss_front_5.png']}
  ];
  const BACK_STAGES=[
    {name:'渋谷スクランブル交差点',key:'shibuya',count:15,normalCount:10,bossCount:5,bgm:'C Breaker.mp3',bossBgm:'boss.mp3',bg:'back_shibuya.png',boss:['ネオンラットキング','boss_back_1.png']},
    {name:'浅草寺 仲見世通り',key:'asakusa',count:15,normalCount:10,bossCount:5,bgm:'my war.mp3',bossBgm:'boss.mp3',bg:'back_asakusa.png',boss:['百灯鬼カグラ・極','boss_back_2.png']},
    {name:'東京スカイツリー',key:'skytree',count:15,normalCount:10,bossCount:5,bgm:'inside out.mp3',bossBgm:'boss.mp3',bg:'back_skytree.png',boss:['電波竜スカイノイズ','boss_back_3.png']},
    {name:'新宿 東京都庁',key:'tocho',count:15,normalCount:10,bossCount:5,bgm:'COKE.mp3',bossBgm:'boss.mp3',bg:'back_tocho.png',boss:['機甲騎将クロム・ゼロ','boss_back_4.png']},
    {name:'魔王の部屋',key:'backboss',count:15,normalCount:10,bossCount:5,bgm:'FUSE.mp3',bossBgm:'DUEL.mp3',bg:'back_boss.png',boss:['時空の魔王キング','boss_back_5.png']}
  ];


  const CRIMSON_STAGES=[
    {name:'実りの里',key:'crimson1',count:15,normalCount:10,bossCount:5,bgm:'一路順風.mp3',bossBgm:'乾坤一擲.mp3',bg:'crimson_stage1.png',boss:['田守の大入道','boss_crimson_1.png']},
    {name:'紅葉隠れの社',key:'crimson2',count:15,normalCount:10,bossCount:5,bgm:'捲土重来.mp3',bossBgm:'乾坤一擲.mp3',bg:'crimson_stage2.png',boss:['深山烏天狗・玄羽','boss_crimson_2.png']},
    {name:'湯煙の古宿',key:'crimson3',count:15,normalCount:10,bossCount:5,bgm:'歳月不待.mp3',bossBgm:'乾坤一擲.mp3',bg:'crimson_stage3.png',boss:['湯宿総支配人・お滝','boss_crimson_3.png']},
    {name:'錦秋の城下',key:'crimson4',count:15,normalCount:10,bossCount:5,bgm:'紫電一閃.mp3',bossBgm:'乾坤一擲.mp3',bg:'crimson_stage4.png',boss:['算盤鬼武者・勘兵衛','boss_crimson_4.png']},
    {name:'月影の山城',key:'crimson5',count:15,normalCount:10,bossCount:5,bgm:'蛟竜雲雨.mp3',bossBgm:'乾坤一擲.mp3',bg:'crimson_stage5.png',boss:['天守守・月下丸','boss_crimson_5.png']}
  ];
  const CRIMSON_LAST={name:'秋尽の剣聖・玄真',key:'crimson-last',count:5,normalCount:0,bossCount:5,bgm:'驚天動地.mp3',bossBgm:'驚天動地.mp3',bg:'crimson_last.png',boss:['秋尽の剣聖・玄真','boss_crimson_last.png']};

  const BLUE_STAGES=[
    {name:'昔ながらの田舎町',key:'blue1',count:15,normalCount:10,bossCount:5,bgm:'ひと夏の冒険.mp3',bossBgm:'残夏.mp3',bg:'blue_stage1.png',boss:['夏草の甲王・オオカブト','boss_blue_1.png']},
    {name:'山と秘密基地',key:'blue2',count:15,normalCount:10,bossCount:5,bgm:'あの頃の秘密基地.mp3',bossBgm:'残夏.mp3',bg:'blue_stage2.png',boss:['秘密基地の守護獣・ヤマヌシ','boss_blue_2.png']},
    {name:'夏祭り',key:'blue3',count:15,normalCount:10,bossCount:5,bgm:'戻れない夏祭り.mp3',bossBgm:'残夏.mp3',bg:'blue_stage3.png',boss:['戻れない祭主・ヨイマツリ','boss_blue_3.png']},
    {name:'夕暮れの公園',key:'blue4',count:15,normalCount:10,bossCount:5,bgm:'みんな、どこへ行ったの？.mp3',bossBgm:'残夏.mp3',bg:'blue_stage4.png',boss:['逢魔の時守・ユウグレ','boss_blue_4.png']},
    {name:'かつて幸せだった家',key:'blue5',count:15,normalCount:10,bossCount:5,bgm:'遏･繧翫◆縺上↑縺.mp3',bossBgm:'対峙.mp3',bg:'blue_stage5_before.png',boss:['永夏の残像・トコナツ','boss_blue_5.png']}
  ];

  const SILVER_STAGES=[
    {name:'孤独の雪原',key:'silver1',count:15,normalCount:10,bossCount:5,bgm:'silver world.mp3',bossBgm:'CRAZY.mp3',bg:'silver_stage1.png',boss:['怪力道化・バルガ','boss_silver_1.png']},
    {name:'氷鏡の美術館',key:'silver2',count:15,normalCount:10,bossCount:5,bgm:'Nightfall.mp3',bossBgm:'CRAZY.mp3',bg:'silver_stage2.png',boss:['幻彩奇術師・ミラベル','boss_silver_2.png']},
    {name:'天穹の雪嶺',key:'silver3',count:15,normalCount:10,bossCount:5,bgm:'reverberation.mp3',bossBgm:'CRAZY.mp3',bg:'silver_stage3.png',boss:['白牙の猛獣使い・ヴェルカ','boss_silver_3.png']},
    {name:'白夜の大天幕',key:'silver4',count:15,normalCount:10,bossCount:5,bgm:'Frozen Steel.mp3',bossBgm:'CRAZY.mp3',bg:'silver_stage4.png',boss:['銀幕団長・アルジェント','boss_silver_4.png']},
    {name:'世界の果て',key:'silver5',count:15,normalCount:10,bossCount:5,bgm:'chilblains.mp3',bossBgm:'SAVER.mp3',bg:'silver_stage5.png',boss:['終幕の写し身・ミメシス','boss_silver_5.png']}
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

  const CRIMSON_MONSTER_NAMES=[
    [['わらしかかし',1],['いなほこぞう',1],['こめつぶだぬき',2],['あぜみちうりぼう',2],['ほたるびのれい',3],['山風の古狐',4],['稲魂大将',5]],
    [['一つ目童子',1],['小豆洗い',1],['山童',2],['ろくろ首',2],['鎌鼬',3],['山姥',4],['土蜘蛛',5]],
    [['湯桶小僧',1],['手拭い童',1],['行灯火',2],['鍵札小僧',2],['湯煙幽女',3],['宿帳妖',4],['百年湯釜',5]],
    [['提灯小僧',1],['古銭ねずみ',1],['算盤童子',2],['反物おばけ',2],['番傘小僧',3],['百目商人',4],['夜行鬼',5]],
    [['草履童',1],['襖小僧',1],['屏風の化生',2],['甲冑の付喪神',2],['落武者の霊',3],['影武者・朧',4],['修羅鎧',5]]
  ];
  const BLUE_MONSTER_NAMES=[
    [['こがねカブリン',1],['おおあごクワガタ',1],['そうげんトビトンボ',2],['ぴょこんアマガエル',2],['せせらぎザリガニ',3],['すすきのバッタ将',4],['天翔けるオニヤンマ',5]],
    [['ぶんぶんスズバチ',1],['じめりムカデラ',1],['いわかげアオヘビ',2],['からみ糸グモ',2],['鎌脚のカマギリ',3],['猪突の山牙',4],['深山毒王ムカオロチ',5]],
    [['ふわり狐面',1],['ゆらぎ金魚灯',1],['さまよい提灯',2],['ぬけがら浴衣',2],['夜店のかげ売り',3],['花火くらい',4],['祭囃子の面神',5]],
    [['カチコチ時計虫',1],['かえりの影ぼうし',1],['こくばん文字霊',2],['からんころん上ばき',2],['夕焼けチャイム',3],['置き去りランドセル',4],['黄昏の帰宅者',5]],
    [['うすれた家族写真',1],['からっぽ麦茶びん',1],['ねむれぬ扇風機',2],['つみあげダンボル',2],['とざしたカーテン影',3],['ちらかった書類影',4],['もうひとりの夏少年',5]]
  ];
  const SILVER_MONSTER_NAMES=[
    [['ゆきころがし',1],['こおりツノウサギ',1],['しろがねオオカミ',2],['雪灯りの精',2],['氷牙トナカイ',3],['吹雪の白梟',4],['永久凍土の巨獣',5]],
    [['額縁こぞう',1],['雪像ネズミ',1],['絵具の亡霊',2],['氷像の兵士',2],['鏡写しの少女',3],['白磁の獣',4],['未完の名画',5]],
    [['ゆきつばめ',1],['氷柱コウモリ',1],['雪崩ヤギ',2],['霜羽ワシ',2],['氷壁の山霊',3],['吹雪竜',4],['白嶺の巨鳥',5]],
    [['玉乗りペンギン',1],['ラッパ雪だるま',1],['ジャグリングモンキー',2],['一輪車ゴブリン',2],['双子の道化',3],['白獅子の曲芸王',4],['凍れる象王',5]],
    [['壊れたマリオネット',1],['忘却の仮面',1],['空席の影',2],['糸繰り人形',2],['捨てられた道化師',3],['銀糸の操者',4],['終幕の獣',5]]
  ];
  function buildMonsterCatalog(raw,world){
    let id=0;return raw.flatMap((stageArr,stage)=>stageArr.map(([name,rarity])=>({id:`${world}-${++id}`,world,stage,rarity,name,img:`monster_${world}_${stage+1}_${rarity}_${id}.png`})));
  }
  const FRONT_MONSTERS=buildMonsterCatalog(FRONT_MONSTER_NAMES,'front');
  const BACK_MONSTERS=buildMonsterCatalog(BACK_MONSTER_NAMES,'back');
  const CRIMSON_MONSTERS=buildMonsterCatalog(CRIMSON_MONSTER_NAMES,'crimson');
  const BLUE_MONSTERS=buildMonsterCatalog(BLUE_MONSTER_NAMES,'blue');
  const SILVER_MONSTERS=buildMonsterCatalog(SILVER_MONSTER_NAMES,'silver');
  const RARITY_WEIGHTS=[[1,.50],[2,.30],[3,.15],[4,.04],[5,.01]];


  const els={
    titleScreen:$('titleScreen'),shopScreen:$('shopScreen'),collectionScreen:$('collectionScreen'),monsterBookScreen:$('monsterBookScreen'),worldWarpScreen:$('worldWarpScreen'),gameScreen:$('gameScreen'),
    titleHero:$('titleHero'),titleSubtitle:$('titleSubtitle'),titleEyebrow:$('titleEyebrow'),titleGold:$('titleGold'),titleModeName:$('titleModeName'),titleTrackName:$('titleTrackName'),titleGradeGuide:$('titleGradeGuide'),
    playBtn:$('playBtn'),shopBtn:$('shopBtn'),collectionBtn:$('collectionBtn'),monsterBookBtn:$('monsterBookBtn'),worldWarpBtn:$('worldWarpBtn'),backWorldBtn:$('backWorldBtn'),frontWorldBtn:$('frontWorldBtn'),musicBtn:$('musicBtn'),debugBadge:$('debugBadge'),titleQuestionCount:$('titleQuestionCount'),
    musicOverlay:$('musicOverlay'),musicCloseBtn:$('musicCloseBtn'),musicFrontTab:$('musicFrontTab'),musicBackTab:$('musicBackTab'),musicCrimsonTab:$('musicCrimsonTab'),musicBlueTab:$('musicBlueTab'),musicSilverTab:$('musicSilverTab'),musicTrackList:$('musicTrackList'),musicNowTitle:$('musicNowTitle'),musicNowWhere:$('musicNowWhere'),musicPrevBtn:$('musicPrevBtn'),musicPlayBtn:$('musicPlayBtn'),musicNextBtn:$('musicNextBtn'),musicStopBtn:$('musicStopBtn'),
    debugOverlay:$('debugOverlay'),debugStatus:$('debugStatus'),debugToggleBtn:$('debugToggleBtn'),debugStagePanel:$('debugStagePanel'),debugStageGrid:$('debugStageGrid'),debugCloseBtn:$('debugCloseBtn'),
    worldWarpList:$('worldWarpList'),worldWarpBackBtn:$('worldWarpBackBtn'),
    shopGold:$('shopGold'),shopFilters:$('shopFilters'),shopList:$('shopList'),shopBackBtn:$('shopBackBtn'),
    collectionCount:$('collectionCount'),collectionGrid:$('collectionGrid'),collectionDetail:$('collectionDetail'),collectionBackBtn:$('collectionBackBtn'),
    monsterBookCount:$('monsterBookCount'),monsterBookFilters:$('monsterBookFilters'),monsterBookGrid:$('monsterBookGrid'),monsterBookBackBtn:$('monsterBookBackBtn'),monsterCardOverlay:$('monsterCardOverlay'),monsterCard:$('monsterCard'),monsterCardClose:$('monsterCardClose'),monsterCardRarity:$('monsterCardRarity'),monsterCardName:$('monsterCardName'),monsterCardImage:$('monsterCardImage'),monsterCardWorld:$('monsterCardWorld'),monsterCardStage:$('monsterCardStage'),monsterCardEncounter:$('monsterCardEncounter'),monsterCardText:$('monsterCardText'),
    progressText:$('progressText'),progressFill:$('progressFill'),stageLabel:$('stageLabel'),stageName:$('stageName'),lifeDisplay:$('lifeDisplay'),timerText:$('timerText'),soundBtn:$('soundBtn'),pauseBtn:$('pauseBtn'),
    battleBg:$('battleBg'),heroActor:$('heroActor'),heroName:$('heroName'),heroImage:$('heroImage'),attackEffect:$('attackEffect'),specialHud:$('specialHud'),specialBtn:$('specialBtn'),specialFill:$('specialFill'),bossHpHud:$('bossHpHud'),bossHpFill:$('bossHpFill'),enemyActor:$('enemyActor'),enemySprite:$('enemySprite'),enemyName:$('enemyName'),enemyImage:$('enemyImage'),answerMark:$('answerMark'),mathProblem:$('mathProblem'),feedbackText:$('feedbackText'),choices:$('choices'),
    mapOverlay:$('mapOverlay'),mapModeLabel:$('mapModeLabel'),mapTitle:$('mapTitle'),mapVisual:$('mapVisual'),mapImage:$('mapImage'),mapTipCategory:$('mapTipCategory'),mapTipText:$('mapTipText'),mapMessage:$('mapMessage'),mapNextBtn:$('mapNextBtn'),
    stageOverlay:$('stageOverlay'),stagePreview:$('stagePreview'),stageOverlayLabel:$('stageOverlayLabel'),stageOverlayName:$('stageOverlayName'),
    stageClearOverlay:$('stageClearOverlay'),stageClearName:$('stageClearName'),
    resultOverlay:$('resultOverlay'),resultMistakes:$('resultMistakes'),resultTimeouts:$('resultTimeouts'),resultRestarts:$('resultRestarts'),resultGold:$('resultGold'),resultErrors:$('resultErrors'),replayBtn:$('replayBtn'),toTitleBtn:$('toTitleBtn'),
    rewardOverlay:$('rewardOverlay'),rewardCard:$('rewardCard'),rewardKicker:$('rewardKicker'),rewardIcon:$('rewardIcon'),rewardName:$('rewardName'),rewardText:$('rewardText'),rewardOkBtn:$('rewardOkBtn'),transitionFx:$('transitionFx'),pauseOverlay:$('pauseOverlay'),pauseMenu:$('pauseMenu'),pauseConfirm:$('pauseConfirm'),pauseResumeBtn:$('pauseResumeBtn'),pauseTitleBtn:$('pauseTitleBtn'),pauseCancelTitleBtn:$('pauseCancelTitleBtn'),pauseConfirmTitleBtn:$('pauseConfirmTitleBtn'),battleCountdownOverlay:$('battleCountdownOverlay'),battleCountdownText:$('battleCountdownText'),gameOverOverlay:$('gameOverOverlay'),gameOverMessage:$('gameOverMessage'),gameOverRetryBtn:$('gameOverRetryBtn'),gameOverTitleBtn:$('gameOverTitleBtn')
  };

  let mode='front',stageIndex=0,stageQuestion=0,totalProgress=0,lives=3,timeLeft=60,timerId=null,locked=true,soundOn=true,bossPhase=false,bossQuestion=0,currentMonster=null,bossActionActive=false,bossSpecialSequence=null,paused=false,pauseRestoreLocked=false,pauseBgmShouldResume=false,countCuePlayed=false,gameOverActive=false,specialGauge=0,comboStreak=0,specialActive=false,crimsonLastPhase=false;
  let crimsonSpecialIntervals=[],crimsonSpecialTimeouts=[],crimsonMoonShiftBusy=false,silverSpecialBusy=false,blueSpecialBusy=false,silverSnowballCycleToken=0,silverBeastCycleToken=0,blueMemoryDim=0,blueAdultState=false;
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
  const breakSE=new Audio('./assets/break.mp3');
  const frontFinisherSE=new Audio('./assets/omote_h.mp3'),backFinisherSE=new Audio('./assets/ura_h.mp3');
  const countSE=new Audio('./assets/count.mp3'),buttonSE=new Audio('./assets/button.mp3');
  const cancelSE=new Audio('./assets/cancel.mp3'),start321SE=new Audio('./assets/start_321.mp3'),start0SE=new Audio('./assets/start_0.mp3'),clearSE=new Audio('./assets/clear.mp3');
  [sirenSE,cutinSE,breakSE,frontFinisherSE,backFinisherSE,countSE,buttonSE,cancelSE,start321SE,start0SE,clearSE].forEach(a=>a.preload='auto');

  // BGM collection: only tracks already used by the current game are listed.
  // Title-screen tracks are deliberately excluded until the title BGM issue is resolved.
  function musicTracks(world){
    const stages=world==='front'?FRONT_STAGES:world==='back'?BACK_STAGES:world==='crimson'?CRIMSON_STAGES:world==='blue'?BLUE_STAGES:SILVER_STAGES;
    const worldLabel=world==='front'?'光の世界':world==='back'?'裏の世界':world==='crimson'?'紅の世界':world==='blue'?'蒼の世界':'銀の世界';
    const normal=stages.map((st,i)=>({
      id:`stage-${i+1}`,file:st.bgm,label:`STAGE ${i+1}`,title:st.bgm.replace(/\.mp3$/i,''),
      where:`${worldLabel} STAGE ${i+1}「${st.name}」の通常戦闘で流れるBGM。`
    }));
    const bossWhere=world==='front'?'光の世界 STAGE 1～4のボス戦で流れる共通BGM。':world==='back'?'裏の世界 STAGE 1～4のボス戦で流れる共通BGM。':world==='crimson'?'紅の世界 STAGE 1～5のボス戦で流れる共通BGM。':world==='blue'?'蒼の世界 STAGE 1～4のボス戦で流れる共通BGM。':'銀の世界 STAGE 1～4のボス戦で流れる共通BGM。';
    const finalStage=stages[4];
    return [...normal,
      {id:'boss',file:stages[0].bossBgm,label:'BOSS',title:stages[0].bossBgm.replace(/\.mp3$/i,''),where:bossWhere},
      {id:'final',file:world==='crimson'?CRIMSON_LAST.bossBgm:finalStage.bossBgm,label:'LAST BOSS',title:(world==='crimson'?CRIMSON_LAST.bossBgm:finalStage.bossBgm).replace(/\.mp3$/i,''),where:world==='crimson'?'紅の世界 LAST BOSS「秋尽の剣聖・玄真」で流れるBGM。':`${worldLabel} STAGE 5「${finalStage.name}」の最終ボス戦で流れるBGM。`}
    ];
  }
  function inferMusicUnlocksFromSave(target){
    target.musicUnlocked=target.musicUnlocked||{front:[],back:[],crimson:[],blue:[],silver:[]};
    for(const world of ['front','back','crimson','blue','silver']){
      const list=Array.isArray(target.musicUnlocked[world])?target.musicUnlocked[world]:[];
      const set=new Set(list);
      const book=target.monsterBook?.[world]||[];
      for(const id of book){
        const normal=id.match(new RegExp(`^${world}-(\\d+)$`));
        if(normal){const n=Number(normal[1]);const stage=Math.floor((n-1)/7)+1;if(stage>=1&&stage<=5)set.add(`stage-${stage}`);}
        const boss=id.match(new RegExp(`^boss-${world}-(\\d+)$`));
        if(boss){const stage=Number(boss[1]);set.add(`stage-${stage}`);set.add(world==='crimson'?'boss':(stage===5?'final':'boss'));}
        if(world==='crimson'&&id==='boss-crimson-last')set.add('final');
      }
      if((world==='front'&&(target.frontClears>0||target.backUnlocked))||(world==='back'&&target.backClears>0)||(world==='crimson'&&target.crimsonClears>0)||(world==='blue'&&target.blueClears>0)||(world==='silver'&&target.silverClears>0)){
        for(let i=1;i<=5;i++)set.add(`stage-${i}`);set.add('boss');set.add('final');
      }
      target.musicUnlocked[world]=[...set];
    }
  }
  function isMusicUnlocked(world,id){return debugFullUnlock||!!save.musicUnlocked?.[world]?.includes(id);}
  function unlockMusic(world,id){
    if(debugFullUnlock)return false;
    if(!save.musicUnlocked)save.musicUnlocked={front:[],back:[],crimson:[],blue:[],silver:[]};
    if(!Array.isArray(save.musicUnlocked[world]))save.musicUnlocked[world]=[];
    if(save.musicUnlocked[world].includes(id))return false;
    save.musicUnlocked[world].push(id);
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(save));}catch{}
    return true;
  }
  function unlockCurrentStageMusic(){unlockMusic(mode,`stage-${stageIndex+1}`);}
  function unlockCurrentBossMusic(){unlockMusic(mode,mode==='crimson'?(crimsonLastPhase?'final':'boss'):(stageIndex===4?'final':'boss'));}

  // The hit effect belongs to the battlefield, not to the hero actor.  Keeping it
  // outside the hero's coordinate system lets sword/magic impacts land on the enemy.
  const battlefield=document.querySelector('.battlefield');
  if(battlefield&&els.attackEffect?.parentElement!==battlefield)battlefield.appendChild(els.attackEffect);

  function loadSave(){
    try{
      const raw=JSON.parse(localStorage.getItem(STORAGE_KEY))||{};
      const merged={...DEFAULT_SAVE,...raw};
      merged.owned=Array.isArray(raw.owned)?raw.owned:[100];
      merged.monsterBook={front:Array.isArray(raw.monsterBook?.front)?raw.monsterBook.front:[],back:Array.isArray(raw.monsterBook?.back)?raw.monsterBook.back:[],crimson:Array.isArray(raw.monsterBook?.crimson)?raw.monsterBook.crimson:[],blue:Array.isArray(raw.monsterBook?.blue)?raw.monsterBook.blue:[],silver:Array.isArray(raw.monsterBook?.silver)?raw.monsterBook.silver:[]};
      merged.monsterEncounters={front:{...(raw.monsterEncounters?.front||{})},back:{...(raw.monsterEncounters?.back||{})},crimson:{...(raw.monsterEncounters?.crimson||{})},blue:{...(raw.monsterEncounters?.blue||{})},silver:{...(raw.monsterEncounters?.silver||{})}};
      merged.musicUnlocked={front:Array.isArray(raw.musicUnlocked?.front)?raw.musicUnlocked.front:[],back:Array.isArray(raw.musicUnlocked?.back)?raw.musicUnlocked.back:[],crimson:Array.isArray(raw.musicUnlocked?.crimson)?raw.musicUnlocked.crimson:[],blue:Array.isArray(raw.musicUnlocked?.blue)?raw.musicUnlocked.blue:[],silver:Array.isArray(raw.musicUnlocked?.silver)?raw.musicUnlocked.silver:[]};
      merged.secretRelics=Array.isArray(raw.secretRelics)?raw.secretRelics:[];
      merged.secretRelicNotified=Array.isArray(raw.secretRelicNotified)?raw.secretRelicNotified:[];
      merged.secretRelicVersion=Number.isFinite(Number(raw.secretRelicVersion))?Number(raw.secretRelicVersion):0;
      merged.mapTipIntroIndex=Math.max(0,Number(raw.mapTipIntroIndex)||0);
      merged.mapSecretTipTierSeen=Math.max(0,Number(raw.mapSecretTipTierSeen)||0);
      merged.worldUnlockNotified=Array.isArray(raw.worldUnlockNotified)?raw.worldUnlockNotified:[];
      merged.worldUnlockNew=Array.isArray(raw.worldUnlockNew)?raw.worldUnlockNew:[];
      merged.worldUnlockVersion=Math.max(0,Number(raw.worldUnlockVersion)||0);
      inferMusicUnlocksFromSave(merged);
      return merged;
    }catch{const fallback={...DEFAULT_SAVE,owned:[100],monsterBook:{front:[],back:[],crimson:[],blue:[],silver:[]},monsterEncounters:{front:{},back:{},crimson:{},blue:{},silver:{}},musicUnlocked:{front:[],back:[],crimson:[],blue:[],silver:[]},secretRelics:[],secretRelicNotified:[],secretRelicVersion:0,mapTipIntroIndex:0,mapSecretTipTierSeen:0,worldUnlockNotified:[],worldUnlockNew:[],worldUnlockVersion:0};inferMusicUnlocksFromSave(fallback);return fallback;}
  }
  function persist(){
    if(!debugFullUnlock)try{localStorage.setItem(STORAGE_KEY,JSON.stringify(save));}catch{}
    renderTitle();
  }
  function persistQuietly(){if(!debugFullUnlock)try{localStorage.setItem(STORAGE_KEY,JSON.stringify(save));}catch{}}
  function isItemOwned(id){return debugFullUnlock||save.owned.includes(id);}
  function effectiveGold(){return debugFullUnlock?99999:save.gold;}
  function effectiveOwnedCount(){return debugFullUnlock?100:save.owned.length;}
  function isBackWorldUnlocked(){return debugFullUnlock||save.backUnlocked;}
  function canWorldWarp(){return debugFullUnlock||save.frontClears>0;}
  // BGM world tabs follow story progression. The back-world catalogue must not
  // be exposed before the Light World has been cleared once.
  function isMusicWorldVisible(world){
    if(world==='front')return true;
    if(world==='back')return debugFullUnlock||save.frontClears>0;
    if(world==='crimson')return isCrimsonWorldUnlocked();
    if(world==='blue')return isBlueWorldUnlocked();
    if(world==='silver')return isSilverWorldUnlocked();
    return false;
  }
  function isCrimsonWorldUnlocked(){return debugFullUnlock||hasSecretRelic('common_master');}
  function isBlueWorldUnlocked(){return debugFullUnlock||(hasSecretRelic('front_sr_master')&&hasSecretRelic('world3_sr_master'));}
  function isSilverWorldUnlocked(){return debugFullUnlock||(hasSecretRelic('uncommon_master')&&hasSecretRelic('front_ssr_master'));}
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

// Hidden collection items double as achievement flags and future content switches.
// They stay outside the normal 1-100 pool so the shop, normal rewards, and 100 / 100
// completion counter keep their existing meaning.
const SECRET_RELICS=[
  {id:'common_master',name:'妖刀マサムネ',icon:'🗡️',flavor:'コモンアイテムを すべて集めた証。',notice:'コモンアイテムを すべて集めた証。'},
  {id:'uncommon_master',name:'白銀の首輪',icon:'📿',flavor:'アンコモンアイテムを すべて集めた証。',notice:'アンコモンアイテムを すべて集めた証。'},
  {id:'rare_master',name:'オブシディアンコア',icon:'💎',flavor:'レアアイテムを すべて集めた証。',notice:'レアアイテムを すべて集めた証。'},
  {id:'front_sr_master',name:'蒼穹の縁結び',icon:'∞',flavor:'光の世界の SRモンスターを すべて見つけた証。',notice:'光の世界の SRモンスターを すべて見つけた証。'},
  {id:'front_ssr_master',name:'時空羅針盤',icon:'🧭',flavor:'光の世界の SSRモンスターを すべて見つけた証。',notice:'光の世界の SSRモンスターを すべて見つけた証。'},
  {id:'back_sr_master',name:'クリプティック・コード',icon:'⌘',flavor:'裏の世界の SRモンスターを すべて見つけた証。',notice:'裏の世界の SRモンスターを すべて見つけた証。'},
  {id:'back_ssr_master',name:'旅立ちを祝すハルシオン',icon:'🪶',flavor:'裏の世界の SSRモンスターを すべて見つけた証。',notice:'裏の世界の SSRモンスターを すべて見つけた証。'},
  {id:'world3_sr_master',name:'黄泉の供物',icon:'🍂',flavor:'紅の世界の SRモンスターを すべて見つけた証。',notice:'紅の世界の SRモンスターを すべて見つけた証。'},
  {id:'world3_ssr_master',name:'黒曜城',icon:'🏯',flavor:'紅の世界の SSRモンスターを すべて見つけた証。',notice:'紅の世界の SSRモンスターを すべて見つけた証。'},
  {id:'blue_sr_master',name:'鋼の黙示録',icon:'📘',flavor:'蒼の世界の SRモンスターを すべて見つけた証。',notice:'蒼の世界の SRモンスターを すべて見つけた証。'},
  {id:'blue_ssr_master',name:'トータルイクリプス',icon:'◉',flavor:'蒼の世界の SSRモンスターを すべて見つけた証。',notice:'蒼の世界の SSRモンスターを すべて見つけた証。'},
  {id:'world4_sr_master',name:'未来の結晶',icon:'❄️',flavor:'銀の世界の SRモンスターを すべて見つけた証。',notice:'銀の世界の SRモンスターを すべて見つけた証。'},
  {id:'world4_ssr_master',name:'コランダムギア',icon:'⚙️',flavor:'銀の世界の SSRモンスターを すべて見つけた証。',notice:'銀の世界の SSRモンスターを すべて見つけた証。'}
];
const SECRET_RELIC_VERSION=4;
const WORLD_UNLOCK_VERSION=3;
const WORLD_UNLOCKS=[
  {world:'back',sourceId:'item-100',sourceName:'時空の鍵',name:'裏の世界',desc:'時空の裂け目に広がる、もうひとつの世界'},
  {world:'crimson',sourceId:'common_master',sourceName:'妖刀マサムネ',name:'紅の世界',desc:'妖怪と剣客が息づく、晩秋に染まった世界'},
  {world:'blue',sourceIds:['front_sr_master','world3_sr_master'],sourceName:'蒼穹の縁結びと黄泉の供物',name:'蒼の世界',desc:'ひと夏の記憶をたどる、蒼い夏の世界'},
  {world:'silver',sourceIds:['uncommon_master','front_ssr_master'],sourceName:'白銀の首輪と時空羅針盤',name:'銀の世界',desc:'永遠の雪と静寂に閉ざされた、白銀の世界'}
];
const secretRelicById=id=>SECRET_RELICS.find(r=>r.id===id);
function hasSecretRelic(id){return debugFullUnlock||!!save.secretRelics?.includes(id);}
function isWorldActuallyUnlocked(world){
  if(world==='front')return true;
  if(world==='back')return !!save.backUnlocked;
  if(world==='crimson')return !!save.secretRelics?.includes('common_master');
  if(world==='blue')return !!save.secretRelics?.includes('front_sr_master')&&!!save.secretRelics?.includes('world3_sr_master');
  if(world==='silver')return !!save.secretRelics?.includes('uncommon_master')&&!!save.secretRelics?.includes('front_ssr_master');
  return false;
}
function worldUnlockByKey(world){return WORLD_UNLOCKS.find(w=>w.world===world);}
function ownsItemRange(from,to){for(let id=from;id<=to;id++)if(!save.owned.includes(id))return false;return true;}
function ownsMonsterRaritySet(world,rarity){
  const catalog=world==='front'?FRONT_MONSTERS:world==='back'?BACK_MONSTERS:world==='crimson'?CRIMSON_MONSTERS:world==='blue'?BLUE_MONSTERS:SILVER_MONSTERS;
  const targets=catalog.filter(m=>m.rarity===rarity);
  const seen=new Set(save.monsterBook?.[world]||[]);
  return targets.length>0&&targets.every(m=>seen.has(m.id));
}
function eligibleSecretRelics(){
  const ids=[];
  if(ownsItemRange(1,50))ids.push('common_master');
  if(ownsItemRange(51,80))ids.push('uncommon_master');
  if(ownsItemRange(81,99))ids.push('rare_master');
  if(ownsMonsterRaritySet('front',4))ids.push('front_sr_master');
  if(ownsMonsterRaritySet('front',5))ids.push('front_ssr_master');
  if(ownsMonsterRaritySet('back',4))ids.push('back_sr_master');
  if(ownsMonsterRaritySet('back',5))ids.push('back_ssr_master');
  if(ownsMonsterRaritySet('crimson',4))ids.push('world3_sr_master');
  if(ownsMonsterRaritySet('crimson',5))ids.push('world3_ssr_master');
  if(ownsMonsterRaritySet('blue',4))ids.push('blue_sr_master');
  if(ownsMonsterRaritySet('blue',5))ids.push('blue_ssr_master');
  if(ownsMonsterRaritySet('silver',4))ids.push('world4_sr_master');
  if(ownsMonsterRaritySet('silver',5))ids.push('world4_ssr_master');
  return ids;
}
function syncSecretRelics({silent=false}={}){
  if(debugFullUnlock)return [];
  save.secretRelics=Array.isArray(save.secretRelics)?save.secretRelics:[];
  save.secretRelicNotified=Array.isArray(save.secretRelicNotified)?save.secretRelicNotified:[];
  const added=[];
  for(const id of eligibleSecretRelics())if(!save.secretRelics.includes(id)){save.secretRelics.push(id);added.push(id);}
  if(silent)for(const id of added)if(!save.secretRelicNotified.includes(id))save.secretRelicNotified.push(id);
  if(added.length)persistQuietly();
  return added;
}
function initializeSecretRelics(){
  const migrating=save.secretRelicVersion!==SECRET_RELIC_VERSION;
  syncSecretRelics({silent:migrating});
  if(migrating){save.secretRelicVersion=SECRET_RELIC_VERSION;persistQuietly();}
}
function initializeWorldUnlockState(){
  save.worldUnlockNotified=Array.isArray(save.worldUnlockNotified)?save.worldUnlockNotified:[];
  save.worldUnlockNew=Array.isArray(save.worldUnlockNew)?save.worldUnlockNew:[];
  const migrating=save.worldUnlockVersion!==WORLD_UNLOCK_VERSION;
  if(migrating){
    // Re-evaluate unlock state whenever conditions change. Worlds that no longer meet
    // a strengthened requirement (notably Silver v2) must be allowed to notify again
    // after the missing relic is obtained. Existing genuinely-unlocked worlds remain silent.
    save.worldUnlockNotified=save.worldUnlockNotified.filter(world=>isWorldActuallyUnlocked(world));
    for(const w of WORLD_UNLOCKS)if(w.world!=='blue'&&isWorldActuallyUnlocked(w.world)&&!save.worldUnlockNotified.includes(w.world))save.worldUnlockNotified.push(w.world);
    save.worldUnlockNew=save.worldUnlockNew.filter(world=>isWorldActuallyUnlocked(world));
    save.worldUnlockVersion=WORLD_UNLOCK_VERSION;
    persistQuietly();
  }
}

let rewardFollowupQueue=[];
function presentRewardNotice({icon='✦',name='',text='',kind='item',kicker='NEW ITEM'}){
  if(els.rewardCard)els.rewardCard.classList.toggle('world-unlock',kind==='world-unlock');
  if(els.rewardKicker)els.rewardKicker.textContent=kicker;
  els.rewardIcon.textContent=icon;els.rewardName.textContent=name;els.rewardText.textContent=text;els.rewardOverlay.hidden=false;
}
function enqueuePendingWorldUnlockNotices({showNow=true}={}){
  if(debugFullUnlock)return;
  save.worldUnlockNotified=Array.isArray(save.worldUnlockNotified)?save.worldUnlockNotified:[];
  save.worldUnlockNew=Array.isArray(save.worldUnlockNew)?save.worldUnlockNew:[];
  const notified=new Set(save.worldUnlockNotified);
  const pending=WORLD_UNLOCKS.filter(w=>isWorldActuallyUnlocked(w.world)&&!notified.has(w.world));
  if(!pending.length)return;
  for(const w of pending){
    save.worldUnlockNotified.push(w.world);
    if(!save.worldUnlockNew.includes(w.world))save.worldUnlockNew.push(w.world);
    rewardFollowupQueue.push({kind:'world-unlock',kicker:'NEW WORLD UNLOCKED',icon:'∞',name:w.name,text:`${w.sourceName}が、新たな道を開いた。\n${w.desc}\n「世界渡り」から新たな世界へ行けるようになった。`});
  }
  persistQuietly();renderTitle();
  if(showNow&&els.rewardOverlay.hidden&&rewardFollowupQueue.length)presentRewardNotice(rewardFollowupQueue.shift());
}
function enqueuePendingSecretRelicNotices({showNow=true}={}){
  if(debugFullUnlock)return;
  // Secret relics that do not unlock a new world are recorded silently.
  // Only an actual world unlock receives a dedicated notification.
  const notified=new Set(save.secretRelicNotified||[]);
  const pending=(save.secretRelics||[]).filter(id=>!notified.has(id));
  if(pending.length){for(const id of pending)save.secretRelicNotified.push(id);persistQuietly();}
  enqueuePendingWorldUnlockNotices({showNow});
}
function hasNewWorldWaiting(){return !debugFullUnlock&&!!save.worldUnlockNew?.some(world=>isWorldActuallyUnlocked(world));}
function isWorldMarkedNew(world){return !debugFullUnlock&&!!save.worldUnlockNew?.includes(world)&&isWorldActuallyUnlocked(world);}
function markWorldVisited(world){
  if(debugFullUnlock||!Array.isArray(save.worldUnlockNew))return;
  const next=save.worldUnlockNew.filter(w=>w!==world);
  if(next.length!==save.worldUnlockNew.length){save.worldUnlockNew=next;persistQuietly();}
}

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

  function showOnly(el){[els.titleScreen,els.shopScreen,els.collectionScreen,els.monsterBookScreen,els.worldWarpScreen,els.gameScreen].filter(Boolean).forEach(x=>x.hidden=x!==el);syncPauseButton();}
  function setMenuButton(btn,glyph,label){btn.innerHTML=`<span class="menu-glyph" aria-hidden="true">${glyph}</span><span class="menu-label">${label}</span>`;}
  function renderTitle(){
    document.body.dataset.mode=mode;
    els.titleGold.textContent=`${effectiveGold()} G`;
    els.titleModeName.textContent=mode==='front'?'光の世界':mode==='back'?'裏の世界':mode==='crimson'?'紅の世界':mode==='blue'?'蒼の世界':'銀の世界';
    els.titleTrackName.textContent=titleTrackLabel();
    if(els.titleGradeGuide)els.titleGradeGuide.textContent=mode==='front'?'学習のめやす｜小学校1〜2年生中心':mode==='back'?'学習のめやす｜小学校2〜3年生中心':mode==='crimson'?'学習のめやす｜小学校3〜4年生':mode==='blue'?'学習のめやす｜小学校5年生':'学習のめやす｜小学校6年生中心';
    if(els.titleQuestionCount)els.titleQuestionCount.textContent=mode==='crimson'?'80':'75';
    const titleRuleNote=$('titleQuestionRuleNote');if(titleRuleNote)titleRuleNote.textContent=mode==='crimson'?'5ステージ＋最終決戦':'全5ステージ';
    const restartTotal=mode==='crimson'?'80':'75';document.querySelectorAll('[data-run-total]').forEach(el=>el.textContent=restartTotal);
    if(els.debugBadge)els.debugBadge.hidden=!debugFullUnlock;
    els.backWorldBtn.hidden=true;els.frontWorldBtn.hidden=true;
    if(els.worldWarpBtn)els.worldWarpBtn.hidden=!canWorldWarp();
    if(mode==='front'){
      els.titleHero.src='./assets/hero.png';els.titleEyebrow.textContent='MATH FANTASY ADVENTURE';els.titleSubtitle.innerHTML='計算で道をひらき、5つのエリアを進む。<br>最後に待つ魔王を倒せ。';setMenuButton(els.playBtn,'⚔','ぼうけんを はじめる');setMenuButton(els.shopBtn,'◆','ショップ');setMenuButton(els.collectionBtn,'✦','コレクション');setMenuButton(els.monsterBookBtn,'◆','モンスター図鑑');
    }else if(mode==='back'){
      els.titleHero.src='./assets/back_hero.png';els.titleEyebrow.textContent='BACK WORLD / ANOTHER QUEST';els.titleSubtitle.innerHTML='裏の世界を巡り、時空の裂け目の先へ。<br>魔法少女のもう一つの冒険。';setMenuButton(els.playBtn,'✦','ウラ面を はじめる');setMenuButton(els.shopBtn,'◆','ショップ');setMenuButton(els.collectionBtn,'✧','コレクション');setMenuButton(els.monsterBookBtn,'◇','モンスター図鑑');
    }else if(mode==='crimson'){
      els.titleHero.src='./assets/crimson_hero.png';els.titleEyebrow.textContent='AUTUMN SWORD / THIRD QUEST';els.titleSubtitle.innerHTML='晩秋の山里から月影の山城へ。<br>五つの地を越え、剣聖・玄真との最終決戦へ。';setMenuButton(els.playBtn,'⚔','紅の世界を はじめる');setMenuButton(els.shopBtn,'◆','ショップ');setMenuButton(els.collectionBtn,'✦','コレクション');setMenuButton(els.monsterBookBtn,'◆','モンスター図鑑');
    }else if(mode==='blue'){
      els.titleHero.src='./assets/blue_hero.png';els.titleEyebrow.textContent='BLUE SUMMER / FOURTH QUEST';els.titleSubtitle.innerHTML='青空の下、木の棒を手にひと夏の冒険へ。<br>田舎町から、夏の終わりへ進んでいく。';setMenuButton(els.playBtn,'☀','蒼の世界を はじめる');setMenuButton(els.shopBtn,'◆','ショップ');setMenuButton(els.collectionBtn,'✦','コレクション');setMenuButton(els.monsterBookBtn,'◆','モンスター図鑑');
    }else{
      els.titleHero.src='./assets/silver_hero.png';els.titleEyebrow.textContent='SILVER SNOW / FIFTH QUEST';els.titleSubtitle.innerHTML='永遠の雪に閉ざされた世界。<br>五つの地を越え、世界の果てで自由をつかめ。';setMenuButton(els.playBtn,'❄','銀の世界を はじめる');setMenuButton(els.shopBtn,'◆','ショップ');setMenuButton(els.collectionBtn,'✦','コレクション');setMenuButton(els.monsterBookBtn,'◆','モンスター図鑑');
    }
    if(els.worldWarpBtn){setMenuButton(els.worldWarpBtn,'∞','世界を渡る');els.worldWarpBtn.classList.toggle('has-new-world',hasNewWorldWaiting());els.worldWarpBtn.setAttribute('aria-label',hasNewWorldWaiting()?'世界を渡る・新しい世界があります':'世界を渡る');}
  }

  function renderWorldWarp(){
    if(!els.worldWarpList)return;
    const worlds=[
      {key:'front',name:'光の世界',desc:'剣と魔法が息づく、冒険のはじまりの世界',unlocked:true},
      {key:'back',name:'裏の世界',desc:'時空の裂け目に広がる、もうひとつの世界',unlocked:isBackWorldUnlocked()},
      {key:'crimson',name:'紅の世界',desc:'妖怪と剣客が息づく、晩秋に染まった世界',unlocked:isCrimsonWorldUnlocked()},
      {key:'blue',name:'蒼の世界',desc:'少年のひと夏をたどる、懐かしくも不思議な世界',unlocked:isBlueWorldUnlocked()},
      {key:'silver',name:'銀の世界',desc:'永遠の雪と静寂に閉ざされた、白銀の世界',unlocked:isSilverWorldUnlocked()}
    ];
    els.worldWarpList.innerHTML='';
    worlds.forEach(w=>{
      const isNew=isWorldMarkedNew(w.key);
      const b=document.createElement('button');b.type='button';b.className=`world-warp-card${w.unlocked?'':' locked'}${mode===w.key?' current':''}${isNew?' new-world':''}`;
      b.innerHTML=`<span><small>${w.unlocked?w.desc:'LOCKED'}</small><b>${w.unlocked?w.name:'？？？'}</b></span><strong>${w.unlocked?(mode===w.key?'現在地':(isNew?'NEW · この世界へ':'この世界へ')):'未解放'}</strong>`;
      b.disabled=!w.unlocked||mode===w.key;
      if(w.unlocked&&mode!==w.key)b.onclick=async()=>{markWorldVisited(w.key);mode=w.key;await transitionTo(()=>{renderTitle();showOnly(els.titleScreen);},mode==='back'?'back':'normal',1500);};
      els.worldWarpList.appendChild(b);
    });
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
    if(!isMusicWorldVisible(musicWorld)){musicWorld='front';musicTrackIndex=-1;stopMusicPlayer();}
    els.musicFrontTab.hidden=false;
    els.musicBackTab.hidden=!isMusicWorldVisible('back');
    els.musicFrontTab.classList.toggle('active',musicWorld==='front');
    els.musicBackTab.classList.toggle('active',musicWorld==='back');
    if(els.musicCrimsonTab){els.musicCrimsonTab.hidden=!isMusicWorldVisible('crimson');els.musicCrimsonTab.classList.toggle('active',musicWorld==='crimson');}
    if(els.musicBlueTab){els.musicBlueTab.hidden=!isMusicWorldVisible('blue');els.musicBlueTab.classList.toggle('active',musicWorld==='blue');}
    if(els.musicSilverTab){els.musicSilverTab.hidden=!isMusicWorldVisible('silver');els.musicSilverTab.classList.toggle('active',musicWorld==='silver');}
    els.musicFrontTab.setAttribute('aria-selected',musicWorld==='front'?'true':'false');
    els.musicBackTab.setAttribute('aria-selected',musicWorld==='back'?'true':'false');
    els.musicBackTab.setAttribute('aria-hidden',els.musicBackTab.hidden?'true':'false');
    if(els.musicCrimsonTab){els.musicCrimsonTab.setAttribute('aria-selected',musicWorld==='crimson'?'true':'false');els.musicCrimsonTab.setAttribute('aria-hidden',els.musicCrimsonTab.hidden?'true':'false');}
    if(els.musicBlueTab){els.musicBlueTab.setAttribute('aria-selected',musicWorld==='blue'?'true':'false');els.musicBlueTab.setAttribute('aria-hidden',els.musicBlueTab.hidden?'true':'false');}
    if(els.musicSilverTab){els.musicSilverTab.setAttribute('aria-selected',musicWorld==='silver'?'true':'false');els.musicSilverTab.setAttribute('aria-hidden',els.musicSilverTab.hidden?'true':'false');}
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
      if(opening){musicWorld=isMusicWorldVisible(mode)?mode:'front';musicTrackIndex=-1;stopMusicPlayer();renderMusicPlayer();els.musicOverlay.hidden=false;}
      else{stopMusicPlayer();musicTrackIndex=-1;els.musicOverlay.hidden=true;renderTitle();}
    },mode==='back'?'back':'normal',1450);
    await sleep(70);curtain.className='scene-curtain leaving';await sleep(420);curtain.hidden=true;curtain.className='scene-curtain';
  }
  async function openMusicPlayer(){if(!els.musicOverlay.hidden)return;await transitionMusicOverlay(true);}
  async function closeMusicPlayer(){if(els.musicOverlay.hidden)return;await transitionMusicOverlay(false);}
  function switchMusicWorld(world){
    if(!isMusicWorldVisible(world)||musicWorld===world)return;
    stopMusicPlayer();musicTrackIndex=-1;musicWorld=world;renderMusicPlayer();
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
      for(const world of ['front','back','crimson','blue','silver']){
        const stages=world==='front'?FRONT_STAGES:world==='back'?BACK_STAGES:world==='crimson'?CRIMSON_STAGES:world==='blue'?BLUE_STAGES:SILVER_STAGES;
        stages.forEach((st,i)=>{
          const prefix=world==='front'?'光':world==='back'?'裏':world==='crimson'?'紅':world==='blue'?'蒼':'銀';
          const start=document.createElement('button');start.type='button';start.className=`debug-stage-btn debug-stage-start debug-world-${world}`;
          start.textContent=`${prefix} S${i+1} 最初`;start.title=`${st.name}：ステージ最初から`;
          start.onclick=()=>debugJumpToStage(world,i);els.debugStageGrid.appendChild(start);
          const boss5=document.createElement('button');boss5.type='button';boss5.className=`debug-stage-btn debug-boss5-btn debug-world-${world}`;
          boss5.textContent=`${prefix} S${i+1} ボス5`;boss5.title=`${st.name}：ボス5問目から`;
          boss5.onclick=()=>debugJumpToBossFifth(world,i);els.debugStageGrid.appendChild(boss5);
        });
        // Crimson has an additional LAST BOSS after STAGE 5. Keep those two jump buttons
        // inside the Crimson block so the Silver-world entries never split the Crimson order.
        if(world==='crimson'){
          const lastStart=document.createElement('button');lastStart.type='button';lastStart.className='debug-stage-btn debug-stage-start debug-world-crimson';lastStart.textContent='紅 LAST 最初';lastStart.onclick=()=>debugJumpToCrimsonLast(0);els.debugStageGrid.appendChild(lastStart);
          const last5=document.createElement('button');last5.type='button';last5.className='debug-stage-btn debug-boss5-btn debug-world-crimson';last5.textContent='紅 LAST ボス5';last5.onclick=()=>debugJumpToCrimsonLast(4);els.debugStageGrid.appendChild(last5);
        }
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
      if(mode==='crimson'&&!isCrimsonWorldUnlocked())mode='front';
      if(mode==='blue'&&!isBlueWorldUnlocked())mode='front';
      if(mode==='silver'&&!isSilverWorldUnlocked())mode='front';
    }
    renderTitle();renderDebugPanel();
    if(els.collectionScreen&&!els.collectionScreen.hidden)renderCollection();
    if(els.monsterBookScreen&&!els.monsterBookScreen.hidden)renderMonsterBook();
    if(els.shopScreen&&!els.shopScreen.hidden)renderShop();
    if(els.musicOverlay&&!els.musicOverlay.hidden)renderMusicPlayer();
  }
  async function debugJumpToStage(world,index){
    if(!debugFullUnlock)return;
    closeDebugPanel();resetRun();mode=world;crimsonLastPhase=false;stageIndex=Math.max(0,Math.min(4,index));totalProgress=stageIndex*15;
    primeStageBgm();
    await transitionTo(()=>{showOnly(els.gameScreen);prepareMapOverlay(true);},mode==='back'?'back':'normal',1500);
    await showMapSequence(true,true);
  }
  async function debugJumpToBossFifth(world,index){
    if(!debugFullUnlock)return;
    closeDebugPanel();resetRun();
    mode=world;crimsonLastPhase=false;stageIndex=Math.max(0,Math.min(4,index));stageQuestion=10;bossPhase=true;bossQuestion=4;if(mode==='blue'&&stageIndex===4)blueAdultState=true;
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
  async function debugJumpToCrimsonLast(question=0){
    if(!debugFullUnlock)return;
    closeDebugPanel();resetRun();mode='crimson';crimsonLastPhase=true;stageIndex=4;stageQuestion=10;bossPhase=true;bossQuestion=Math.max(0,Math.min(4,Number(question)||0));totalProgress=75+bossQuestion;lives=3;currentMonster=null;currentQuestion=null;clearBossAction();unlockCurrentBossMusic();primeStageBgm();
    await transitionTo(()=>{showOnly(els.gameScreen);document.body.dataset.mode=mode;document.body.dataset.stage='last';renderGame();clearQuestionUi();enemyVisualToken++;concealEnemyVisual(true);document.querySelector('.battlefield')?.classList.remove('battle-base-enter');},'normal',1250);
    await playStageBgm();await runBattleCountdown();await showBossEntrance(true,bossQuestion);
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
      row.querySelector('button').onclick=()=>{if(debugFullUnlock)return;if(!owned&&save.gold>=it.price){save.gold-=it.price;save.owned.push(it.id);persist();syncSecretRelics();enqueuePendingSecretRelicNotices({showNow:true});renderShop(filter);}};els.shopList.appendChild(row);
    });
  }

  function renderCollection(){
    els.collectionCount.textContent=`${effectiveOwnedCount()} / 100`;els.collectionGrid.innerHTML='';
    ITEMS.forEach(it=>{const owned=isItemOwned(it.id);const c=document.createElement('button');c.className=`collection-cell ${owned?`rarity-${it.rarity}`:'locked'}`;c.innerHTML=`<span class="cell-icon">${owned?it.icon:'?'}</span><small>${owned?String(it.id).padStart(3,'0'):'???'}</small>`;c.title=owned?it.name:'？？？？？？';c.onclick=()=>showItemDetail(it,owned);els.collectionGrid.appendChild(c);});
    SECRET_RELICS.filter(r=>hasSecretRelic(r.id)).forEach(r=>{const c=document.createElement('button');c.className='collection-cell secret-relic';c.innerHTML=`<span class="cell-icon">${r.icon}</span><small>SECRET</small>`;c.title=r.name;c.onclick=()=>showSecretRelicDetail(r);els.collectionGrid.appendChild(c);});
  }
  function showSecretRelicDetail(r){els.collectionDetail.innerHTML=`<div class="detail-no secret-label">SECRET RELIC</div><div class="detail-icon secret-relic-frame">${r.icon}</div><h3>${r.name}</h3><p class="detail-rarity secret-rarity">ひみつのアイテム</p><div class="detail-divider"></div><p>${r.flavor}</p>`;}
  function showItemDetail(it,owned){
    els.collectionDetail.innerHTML=owned?`<div class="detail-no">No.${String(it.id).padStart(3,'0')}</div><div class="detail-icon rarity-frame-${it.rarity}">${it.icon}</div><h3>${it.name}</h3><p class="detail-rarity rarity-${it.rarity}">${rarityLabel[it.rarity]}</p><div class="detail-divider"></div><p>${it.flavor}</p>`:`<div class="detail-no">UNKNOWN</div><div class="detail-icon">?</div><h3>？？？？？？</h3><div class="detail-divider"></div><p>まだ手に入れていないアイテムです。</p>`;
  }
  function monsterBookEntries(){
    const normals=getMonsterCatalog();
    const bosses=getStages().map((_,i)=>{const [name,img]=getStages()[i].boss;return{id:`boss-${mode}-${i+1}`,world:mode,stage:i,rarity:5,name,img,boss:true};});
    if(mode==='crimson')bosses.push({id:'boss-crimson-last',world:'crimson',stage:5,rarity:5,name:CRIMSON_LAST.boss[0],img:CRIMSON_LAST.boss[1],boss:true,lastBoss:true});
    return [...normals,...bosses];
  }
  function monsterFlavor(m){
    if(m.lastBoss)return '紅の世界の最終決戦に立ちはだかる剣聖。小3〜4の総合5問を乗り越えよう。';
    if(m.boss)return `${getStages()[m.stage]?.name||'この地'}に立ちはだかるボスモンスター。5問の勝負を乗り越えよう。`;
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
    // Re-anchor the encyclopedia after opening/filtering/orientation changes so a
    // retained scroll offset cannot make the grid appear vertically misplaced.
    const bookViewport=els.monsterBookGrid.closest('.monster-book-viewport');
    if(bookViewport)bookViewport.scrollTop=0;
    if(els.monsterBookFilters)els.monsterBookFilters.scrollLeft=0;
  }
  function showMonsterCard(m){
    const counts=save.monsterEncounters[mode]||{};
    els.monsterCardRarity.textContent=m.boss?'BOSS':rarityLabelMonster(m.rarity);
    els.monsterCardName.textContent=m.name;
    els.monsterCardImage.onerror=()=>{els.monsterCardImage.onerror=null;els.monsterCardImage.src=monsterPlaceholder(m,!!m.boss);};
    els.monsterCardImage.src=`./assets/${m.img}`;
    els.monsterCardWorld.textContent=mode==='front'?'光の世界':mode==='back'?'裏の世界':mode==='crimson'?'紅の世界':mode==='blue'?'蒼の世界':'銀の世界';
    els.monsterCardStage.textContent=m.lastBoss?'LAST BOSS':`STAGE ${m.stage+1}`;
    els.monsterCardEncounter.textContent=`遭遇 ${effectiveEncounterCount(mode,m.id)||1}`;
    els.monsterCardText.textContent=monsterFlavor(m);
    const slimeLike=!m.boss && m.name.includes('スライム');
    els.monsterCard.className=`monster-card rarity-monster-${m.rarity}${m.boss?' boss-card':''}${slimeLike?' slime-card':''}`;
    els.monsterCardOverlay.hidden=false;
  }
  function closeMonsterCard(){els.monsterCardOverlay.hidden=true;}


  function getStages(){return mode==='front'?FRONT_STAGES:mode==='back'?BACK_STAGES:mode==='crimson'?CRIMSON_STAGES:mode==='blue'?BLUE_STAGES:SILVER_STAGES;}
  function stageStartTotal(idx){return getStages().slice(0,idx).reduce((a,s)=>a+s.count,0);}
  function resetRun(){stageIndex=0;stageQuestion=0;totalProgress=0;lives=3;bossPhase=false;bossQuestion=0;crimsonLastPhase=false;currentMonster=null;bossActionActive=false;bossSpecialSequence=null;currentQuestion=null;paused=false;gameOverActive=false;specialGauge=0;comboStreak=0;specialActive=false;blueSpecialBusy=false;blueMemoryDim=0;blueAdultState=false;document.body.classList.remove('game-paused','game-over-active','battle-countdown-active','special-assist-active','vargas-double-strike','boss-technique-active','boss-shield-active','blue-q10-slow');if(els.pauseOverlay)els.pauseOverlay.hidden=true;if(els.gameOverOverlay)els.gameOverOverlay.hidden=true;if(els.battleCountdownOverlay)els.battleCountdownOverlay.hidden=true;runStageRewards=new Set();stats={mistakes:0,timeouts:0,restarts:0,errors:[],gold:0};const blueDim=$('blueMemoryDimmer');if(blueDim){blueDim.classList.remove('full-black');blueDim.style.opacity='0';}locked=true;updateSpecialHud();syncPauseButton();}

  function getMonsterCatalog(){return mode==='front'?FRONT_MONSTERS:mode==='back'?BACK_MONSTERS:mode==='crimson'?CRIMSON_MONSTERS:mode==='blue'?BLUE_MONSTERS:SILVER_MONSTERS;}
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
    const counts=save.monsterEncounters[mode];counts[monster.id]=(counts[monster.id]||0)+1;persist();syncSecretRelics();
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
  function currentBoss(){const [name,img]=currentStage().boss;return{id:(mode==='crimson'&&crimsonLastPhase)?'boss-crimson-last':`boss-${mode}-${stageIndex+1}`,world:mode,stage:(mode==='crimson'&&crimsonLastPhase)?5:stageIndex,rarity:5,name,img,boss:true,lastBoss:mode==='crimson'&&crimsonLastPhase};}
  function makeBossQuestion(idx){
    if(mode==='crimson'){if(crimsonLastPhase)return makeCrimsonFinalQuestion(true,bossQuestion);if(idx<4)return makeCrimsonQuestion(idx+1);return makeCrimsonFinalQuestion(false,bossQuestion);}
    if(mode==='blue')return makeBlueBossQuestion(idx,bossQuestion);
    if(mode==='silver'){if(idx<4)return makeSilverQuestion(idx+1);return makeSilverFinalBossQuestion(bossQuestion);}
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


  function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const t=a%b;a=b;b=t;}return a||1;}
  function normFraction(n,d){if(d<0){n=-n;d=-d;}const g=gcd(n,d);return{n:n/g,d:d/g};}
  function fractionKey(f){const x=normFraction(f.n,f.d);return `${x.n}/${x.d}`;}
  function parseFractionKey(v){const m=String(v).match(/^(-?\d+)\/(\d+)$/);return m?{n:Number(m[1]),d:Number(m[2])}:null;}
  function fractionHtml(f){return `<span class="fraction-stack" role="img" aria-label="${f.d}分の${f.n}"><span class="fraction-num">${f.n}</span><span class="fraction-bar"></span><span class="fraction-den">${f.d}</span></span>`;}
  function fractionExpressionHtml(a,op,b){return `${fractionHtml(a)}<span class="fraction-op">${op}</span>${fractionHtml(b)}<span class="fraction-op">=</span><span class="fraction-q">?</span>`;}
  function round2(v){return Math.round((v+Number.EPSILON)*100)/100;}
  function normalizeChoiceNumber(v){
    if(typeof v!=='number'||!Number.isFinite(v))return v;
    const n=round2(v);
    return Object.is(n,-0)?0:n;
  }
  function makeDecimalChoices(ans){
    const answer=normalizeChoiceNumber(ans);
    const text=String(answer);
    const dot=text.indexOf('.');
    const places=dot<0?0:Math.min(2,text.length-dot-1);
    const unit=places>=2?.01:.1;
    const candidates=[
      answer-unit,answer+unit,answer-unit*10,answer+unit*10,answer-1,answer+1
    ].map(normalizeChoiceNumber).filter(v=>v>=0&&v!==answer);
    const wrong=[];
    for(const v of candidates){if(!wrong.includes(v))wrong.push(v);if(wrong.length>=2)break;}
    while(wrong.length<2){
      const v=normalizeChoiceNumber(answer+(wrong.length+2)*unit);
      if(v!==answer&&!wrong.includes(v))wrong.push(v);
    }
    return shuffle([answer,...wrong.slice(0,2)]);
  }
  function makeFractionChoices(answerKey){
    const a=parseFractionKey(answerKey);if(!a)return makeChoices(Number(answerKey));
    const candidates=[],preferFraction=a.d!==1;
    const push=(n,d)=>{if(d<=0)return;const k=fractionKey({n,d}),f=parseFractionKey(k);if(k===answerKey||candidates.includes(k))return;if(preferFraction&&f?.d===1)return;candidates.push(k);};
    push(a.n+1,a.d);push(Math.max(1,a.n-1),a.d);push(a.n,a.d+1);push(a.n+2,a.d+1);push(Math.max(1,a.n-2),a.d+1);
    let guard=0;while(candidates.length<2&&guard++<30)push(a.n+rand(1,5),a.d+rand(1,4));
    if(candidates.length<2){const relaxed=(n,d)=>{if(d<=0)return;const k=fractionKey({n,d});if(k!==answerKey&&!candidates.includes(k))candidates.push(k);};relaxed(a.n+a.d,a.d);relaxed(a.d,a.n||1);}
    return shuffle([answerKey,...candidates.slice(0,2)]);
  }
  function compactNumericChoices(answer,candidates=[]){
    const key=answerKey(answer),out=[answer];
    for(const v of candidates){if(v==null||!Number.isFinite(Number(v))||Number(v)<0)continue;if(answerKey(v)===key||out.some(x=>answerKey(x)===answerKey(v)))continue;out.push(normalizeChoiceNumber(Number(v)));if(out.length>=3)break;}
    for(const v of makeChoices(typeof answer==='number'?answer:Number(answer))){if(out.length>=3)break;if(answerKey(v)!==key&&!out.some(x=>answerKey(x)===answerKey(v)))out.push(v);}
    return shuffle(out.slice(0,3));
  }
  function exactDivision(profile='twoByOne'){
    const specs={
      facts:{d:[2,9],q:[2,9],min:4,max:81},
      tens:{d:[2,9],q:[10,30],min:20,max:90,multiple10:true},
      twoByOne:{d:[2,9],q:[3,30],min:10,max:99},
      threeByOne:{d:[2,9],q:[12,99],min:100,max:999},
      twoByTwo:{d:[11,39],q:[2,8],min:22,max:99},
      threeByTwo:{d:[11,39],q:[4,30],min:100,max:999},
      threeByTwoHard:{d:[12,48],q:[8,30],min:180,max:999}
    };
    const sp=specs[profile]||specs.twoByOne;
    for(let i=0;i<2000;i++){
      const d=rand(sp.d[0],sp.d[1]),q=rand(sp.q[0],sp.q[1]),a=d*q;
      if(a<sp.min||a>sp.max)continue;if(sp.multiple10&&a%10!==0)continue;
      return{expression:`${a}÷${d}`,answer:q,choices:compactNumericChoices(q,[q-1,q+1,q+d,q-d])};
    }
    return{expression:'84÷4',answer:21,choices:[20,21,24]};
  }
  function decimalAddSubQuestion(level='mixed'){
    const make=(places,min,max)=>rand(min,max)/(places===2?100:10);
    let a,b,op=Math.random()<.5?'+':'-';
    if(level==='tenths'){a=make(1,11,199);b=make(1,11,99);}
    else if(level==='hundredths'){a=make(2,101,999);b=make(2,11,499);}
    else{a=make(Math.random()<.5?1:2,11,999);b=make(Math.random()<.5?1:2,11,499);}
    if(op==='-'&&b>a)[a,b]=[b,a];
    a=normalizeChoiceNumber(a);b=normalizeChoiceNumber(b);
    const ans=normalizeChoiceNumber(op==='+'?a+b:a-b);
    const unit=(String(ans).split('.')[1]?.length||0)>=2?.01:.1;
    return{expression:`${a}${op}${b}`,answer:ans,choices:compactNumericChoices(ans,[ans+unit,Math.max(0,ans-unit),ans+1,Math.max(0,ans-1)])};
  }
  function decimalIntegerQuestion(op='×',hard=false){
    if(op==='×'){
      const places=hard&&Math.random()<.4?100:10;let a;
      do{a=rand(11,hard?299:199)/places;}while(Number.isInteger(a));
      const b=rand(2,9),ans=normalizeChoiceNumber(a*b);
      return{expression:`${a}×${b}`,answer:ans,choices:compactNumericChoices(ans,[ans+b,Math.max(0,ans-b),ans+1])};
    }
    for(let i=0;i<500;i++){
      const d=rand(2,9),places=hard&&Math.random()<.35?100:10;let q=rand(11,hard?199:99)/places;if(Number.isInteger(q))continue;
      const a=normalizeChoiceNumber(q*d);if(a<=0||a>99)continue;
      return{expression:`${a}÷${d}`,answer:normalizeChoiceNumber(q),choices:compactNumericChoices(q,[q+.1,Math.max(0,q-.1),q+1])};
    }
    return{expression:'8.4÷4',answer:2.1,choices:[2,2.1,2.4]};
  }
  function sameDenominatorFractionQuestion(kind='add',simplify=false,larger=false){
    for(let i=0;i<2000;i++){
      const d=rand(larger?6:3,12),op=kind==='mixed'?(Math.random()<.5?'+':'-'):(kind==='sub'?'-':'+');
      let n1=rand(1,d-1),n2=rand(1,d-1);if(op==='-'&&n2>n1)[n1,n2]=[n2,n1];
      const raw=op==='+'?n1+n2:n1-n2;if(raw<=0)continue;
      const r=normFraction(raw,d);if(r.d===1||r.n>24)continue;
      if(simplify&&gcd(raw,d)===1)continue;
      const a={n:n1,d},b={n:n2,d},answer=fractionKey(r);
      const wrongDirect=fractionKey(normFraction(raw,d*2));
      const wrongNum=fractionKey(normFraction(Math.max(1,raw+(op==='+'?1:-1)),d));
      const wrongs=[wrongDirect,wrongNum].filter((v,i,a)=>v!==answer&&a.indexOf(v)===i&&parseFractionKey(v)?.d!==1);
      for(const v of makeFractionChoices(answer))if(v!==answer&&!wrongs.includes(v))wrongs.push(v);
      const choices=shuffle([answer,...wrongs.slice(0,2)]);
      return{expression:`${n1}/${d}${op}${n2}/${d}`,answer,fraction:true,a,b,op,choices};
    }
    return{expression:'2/7+3/7',answer:'5/7',fraction:true,a:{n:2,d:7},b:{n:3,d:7},op:'+',choices:['5/7','5/14','4/7']};
  }
  function calculationOrderQuestion(step=0){
    const phase=Math.max(0,Math.min(4,Number(step)||0));
    if(phase===0){const a=rand(5,18),b=rand(2,7),c=rand(2,6),ans=a+b*c;return{expression:`${a}+${b}×${c}`,answer:ans,choices:compactNumericChoices(ans,[(a+b)*c,a+b+c])};}
    if(phase===1){const c=rand(2,6),q=rand(2,8),b=c*q,t=rand(2,8),a=b+c*t,ans=a-q;return{expression:`${a}-${b}÷${c}`,answer:ans,choices:compactNumericChoices(ans,[t,a-b+c])};}
    if(phase===2){const a=rand(3,12),b=rand(2,10),c=rand(2,5),ans=(a+b)*c;return{expression:`(${a}+${b})×${c}`,answer:ans,choices:compactNumericChoices(ans,[a+b*c,a+b+c])};}
    if(phase===3){const d=rand(2,6),q=rand(2,9),a=d*q,c=rand(2,7),e=rand(2,6),ans=q+c*e;return{expression:`${a}÷${d}+${c}×${e}`,answer:ans,choices:compactNumericChoices(ans,[(q+c)*e,q+c+e])};}
    for(let i=0;i<500;i++){const a=rand(5,18),b=rand(4,16),c=rand(2,4),ans=100-(a+b)*c;if(ans<=0)continue;return{expression:`100-(${a}+${b})×${c}`,answer:ans,choices:compactNumericChoices(ans,[100-a-b*c,100-(a+b)-c])};}
    return{expression:'100-(12+8)×4',answer:20,choices:[20,60,400]};
  }
  function makeCrimsonQuestion(idx){
    if(idx===0){
      const qn=bossPhase?bossQuestion:stageQuestion;
      if(qn<4)return exactDivision('facts');
      if(qn<6){const d=rand(2,9),q=rand(4,9),a=d*q;return{expression:`${a}÷${d}`,answer:q,choices:compactNumericChoices(q,[q-1,q+1])};}
      if(qn<8)return exactDivision('tens');
      return exactDivision('twoByOne');
    }
    if(idx===1){
      const qn=bossPhase?bossQuestion:stageQuestion;
      if(qn<3)return exactDivision('twoByOne');
      if(qn<6)return exactDivision('threeByOne');
      if(qn<8)return exactDivision('twoByTwo');
      return exactDivision(qn>=9?'threeByTwoHard':'threeByTwo');
    }
    if(idx===2){const qn=bossPhase?bossQuestion:stageQuestion;if(qn<4)return decimalAddSubQuestion('tenths');if(qn<8)return decimalAddSubQuestion('hundredths');return decimalAddSubQuestion('mixed');}
    if(idx===3){
      const qn=bossPhase?bossQuestion:stageQuestion;
      if(bossPhase&&stageIndex===2)return decimalIntegerQuestion(qn<3?'×':'÷',qn===2);
      return decimalIntegerQuestion(qn<5?'×':'÷',qn>=8);
    }
    const qn=bossPhase?bossQuestion:stageQuestion;
    if(bossPhase&&stageIndex===3){if(qn<2)return sameDenominatorFractionQuestion('add');if(qn<4)return sameDenominatorFractionQuestion('sub');return sameDenominatorFractionQuestion('mixed',true);}
    if(qn<3)return sameDenominatorFractionQuestion('add');if(qn<6)return sameDenominatorFractionQuestion('sub');if(qn<8)return sameDenominatorFractionQuestion('mixed',true);return sameDenominatorFractionQuestion('mixed',Math.random()<.5,true);
  }
  function makeCrimsonFinalQuestion(finalBoss=false,step=bossQuestion){
    const phase=Math.max(0,Math.min(4,Number(step)||0));
    if(!finalBoss)return calculationOrderQuestion(phase);
    if(phase===0)return exactDivision('threeByTwo');
    if(phase===1)return decimalAddSubQuestion('mixed');
    if(phase===2)return decimalIntegerQuestion(Math.random()<.5?'×':'÷',true);
    if(phase===3)return sameDenominatorFractionQuestion('mixed',true,true);
    return calculationOrderQuestion(4);
  }

  // 蒼の世界：小5。安全な候補集合から生成し、各問題位置の確定仕様を崩さない。
  function decimalTimesDecimalQuestion(level='tenths'){
    for(let i=0;i<1200;i++){
      let a,b;
      if(level==='hundredths'){a=rand(12,899)/100;b=rand(2,89)/10;}
      else{a=rand(11,99)/10;b=rand(11,99)/10;}
      if(level==='underOne')b=rand(2,9)/10;
      a=normalizeChoiceNumber(a);b=normalizeChoiceNumber(b);
      const answer=normalizeChoiceNumber(a*b);
      if(level==='decimalAnswer'&&Number.isInteger(answer))continue;
      if(answer<=0||answer>999)continue;
      return{expression:`${a}×${b}`,answer,choices:makeDecimalChoices(answer)};
    }
    return{expression:'4.8×0.5',answer:2.4,choices:[2.4,24,.24]};
  }
  function finiteDecimalDivisionQuestion(level='integer'){
    const divisors=level==='underOne'?[.2,.25,.4,.5,.8]:level==='complex'?[.12,.15,.25,.4,.75,1.2,1.25,2.5]:[.2,.4,.5,.8,1.2,1.5,2.4,2.5,3.2,4.5];
    for(let i=0;i<1200;i++){
      const d=pick(divisors);let q;
      if(level==='integer')q=rand(2,12);
      else if(level==='complex')q=pick([1.2,1.5,2.4,2.5,3.2,3.5,4.5,6.4,7.5]);
      else q=pick([1.2,1.5,2.4,2.5,3.2,3.5,4.5,5.5,6.4,7.5]);
      if(level==='underOne'&&Math.random()<.45)q=rand(2,12);
      const a=normalizeChoiceNumber(d*q),answer=normalizeChoiceNumber(q);
      if(a<=0||a>99||Number(String(a).replace('.',''))>9999)continue;
      const wrong=[normalizeChoiceNumber(answer*10),normalizeChoiceNumber(answer/10),normalizeChoiceNumber(answer+d)].filter(v=>v>=0&&v!==answer);
      return{expression:`${a}÷${d}`,answer,choices:compactNumericChoices(answer,wrong)};
    }
    return{expression:'7.2÷2.4',answer:3,choices:[.3,3,30]};
  }
  function unlikeFractionQuestion(level='multiple'){
    for(let i=0;i<4000;i++){
      let d1,d2;
      if(level==='multiple'){
        d1=rand(2,6);const mult=rand(2,Math.max(2,Math.floor(12/d1)));d2=d1*mult;if(d2>12)continue;
      }else{
        d1=rand(2,10);d2=rand(2,12);if(d1===d2||d1%d2===0||d2%d1===0)continue;
        const l=d1*d2/gcd(d1,d2);if(l>36)continue;
      }
      let n1=rand(1,d1-1),n2=rand(1,d2-1),op=(level==='subtract'||level==='simplify')?'-':'+';
      if(level==='lcm'&&Math.random()<.25)op='-';
      let rawN=n1*d2+(op==='+'?1:-1)*n2*d1,rawD=d1*d2;
      if(rawN<=0){[n1,n2,d1,d2]=[n2,n1,d2,d1];rawN=n1*d2+(op==='+'?1:-1)*n2*d1;rawD=d1*d2;}
      if(rawN<=0)continue;
      const answerF=normFraction(rawN,rawD),answer=fractionKey(answerF);
      if(answerF.d===1||answerF.n>99||answerF.d>99)continue;
      if(level==='simplify'&&gcd(rawN,rawD)===1)continue;
      const a={n:n1,d:d1},b={n:n2,d:d2};
      const wrong=[];
      const directN=op==='+'?n1+n2:Math.abs(n1-n2),directD=d1+d2;
      if(directN>0){const k=fractionKey(normFraction(directN,directD));if(k!==answer)wrong.push(k);}
      for(const k of makeFractionChoices(answer))if(k!==answer&&!wrong.includes(k))wrong.push(k);
      return{expression:`${n1}/${d1}${op}${n2}/${d2}`,answer,fraction:true,a,b,op,choices:shuffle([answer,...wrong.slice(0,2)])};
    }
    return{expression:'1/2+1/3',answer:'5/6',fraction:true,a:{n:1,d:2},b:{n:1,d:3},op:'+',choices:['5/6','2/5','1/5']};
  }
  function averageQuestion(count=3){
    const avg=rand(4,30),values=[];let remaining=avg*count;
    for(let i=0;i<count-1;i++){const slots=count-i-1,lo=Math.max(1,remaining-avg*2*slots),hi=Math.max(lo,Math.min(avg*2,remaining-slots));const v=rand(lo,hi);values.push(v);remaining-=v;}
    values.push(remaining);shuffle(values).forEach((v,i)=>values[i]=v);
    const text=`${values.join('、')} の平均は？`;
    return{expression:text,displayExpression:text,answer:avg,choices:compactNumericChoices(avg,[avg-1,avg+1,Math.round(values.reduce((a,b)=>a+b,0)/(count+1))])};
  }
  function averageTotalQuestion(){const avg=rand(4,30),count=rand(3,8),answer=avg*count,text=`平均${avg}点が${count}人。合計は？`;return{expression:text,displayExpression:text,answer,choices:compactNumericChoices(answer,[avg+count,answer-avg,answer+avg])};}
  function perUnitQuestion(kind='item'){
    const count=rand(2,9),unit=rand(3,25),total=count*unit;
    const label=kind==='area'?'㎡':kind==='person'?'人':'こ';
    const what=kind==='area'?'1㎡あたり':kind==='person'?'1人あたり':'1こあたり';
    const text=`${count}${label}で${total}。${what}は？`;
    return{expression:text,displayExpression:text,answer:unit,choices:compactNumericChoices(unit,[total,unit+count,Math.max(1,unit-count)])};
  }
  function unitComparisonQuestion(){
    const u1=rand(4,18),u2=rand(4,18),c1=rand(2,6),c2=rand(2,6),t1=u1*c1,t2=u2*c2,answer=u1===u2?'同じ':u1<u2?'A':'B';
    const text=`A:${c1}こで${t1}円　B:${c2}こで${t2}円　1こあたり安いのは？`;
    return{expression:text,displayExpression:text,answer,choices:['A','B','同じ']};
  }
  function speedQuestion(kind='speed'){
    const speed=pick([30,40,45,50,60,70,80,90]),time=pick([2,3,4,5]);
    if(kind==='speed'){const distance=speed*time,text=`${time}時間で${distance}km。時速は？`;return{expression:text,displayExpression:text,answer:speed,choices:compactNumericChoices(speed,[speed-10,speed+10,distance])};}
    if(kind==='distance'){const text=`時速${speed}kmで${time}時間。道のりは？`;return{expression:text,displayExpression:text,answer:speed*time,choices:compactNumericChoices(speed*time,[speed+time,speed*(time-1),speed*(time+1)])};}
    const distance=speed*time,text=`${distance}kmを時速${speed}km。何時間？`;return{expression:text,displayExpression:text,answer:time,choices:compactNumericChoices(time,[Math.max(1,time-1),time+1,speed])};
  }
  function percentageQuestion(kind='part',{blueFade=false}={}){
    const rates=[10,20,25,30,50],rate=pick(rates),base=pick([40,80,100,120,160,200,240,300,400,500]),part=base*rate/100;
    let q;
    if(kind==='rate')q={expression:`${part}は${base}の何%？`,displayExpression:`${part}は${base}の何%？`,answer:`${rate}%`,choices:shuffle([`${rate}%`,`${pick(rates.filter(r=>r!==rate))}%`,`${pick(rates.filter(r=>r!==rate))}%`]).filter((v,i,a)=>a.indexOf(v)===i)};
    else if(kind==='base')q={expression:`${part}は□の${rate}%です。□は？`,displayExpression:`${part}は□の${rate}%です。□は？`,answer:base,choices:compactNumericChoices(base,[part,base+part,Math.max(1,base-part)])};
    else if(kind==='discount'){
      const price=pick([400,600,800,1000,1200,1600]),r=pick([10,20,25,30]),answer=price*(100-r)/100;q={expression:`${price}円を${r}%引き。代金は？`,displayExpression:`${price}円を${r}%引き。代金は？`,answer,choices:compactNumericChoices(answer,[price*r/100,price,answer+price*r/100])};
    }else if(kind==='increase'){
      const start=pick([100,200,300,400,500]),r=pick([10,20,25,30,50]),answer=start*(100+r)/100;q={expression:`${start}人から${r}%増えた。何人？`,displayExpression:`${start}人から${r}%増えた。何人？`,answer,choices:compactNumericChoices(answer,[start*r/100,start,answer-start*r/100])};
    }else q={expression:`${base}の${rate}%は？`,displayExpression:`${base}の${rate}%は？`,answer:part,choices:compactNumericChoices(part,[base,base-rate,part+rate])};
    if(q.choices.length<3){const answer=q.answer,extra=typeof answer==='string'?[`${Math.max(5,rate-10)}%`,`${Math.min(90,rate+10)}%`]:[Number(answer)+1,Math.max(0,Number(answer)-1)];q.choices=[...new Set([answer,...q.choices,...extra])].slice(0,3);}
    if(blueFade){
      const src=q.displayExpression||q.expression;const tokens=src.split(/(\d+(?:\.\d+)?%?|□)/g).filter(Boolean);q.blueFadeParts=tokens.map(t=>({text:t,fade:/\d|□/.test(t)}));
    }
    if(kind==='part')q.blueRatio={base,rate,part};
    return q;
  }
  function makeBlueQuestion(idx){
    const qn=bossPhase?bossQuestion:stageQuestion;
    if(idx===0){if(qn<3)return decimalTimesDecimalQuestion('tenths');if(qn<6)return decimalTimesDecimalQuestion('decimalAnswer');if(qn<8)return decimalTimesDecimalQuestion('underOne');return decimalTimesDecimalQuestion('hundredths');}
    if(idx===1){if(qn<3)return finiteDecimalDivisionQuestion('integer');if(qn<6)return finiteDecimalDivisionQuestion('finite');if(qn<8)return finiteDecimalDivisionQuestion('underOne');return finiteDecimalDivisionQuestion('complex');}
    if(idx===2){if(qn<3)return unlikeFractionQuestion('multiple');if(qn<6)return unlikeFractionQuestion('lcm');if(qn<8)return unlikeFractionQuestion('subtract');return unlikeFractionQuestion('simplify');}
    if(idx===3){if(qn<3)return averageQuestion(qn===2?4:3);if(qn<6)return perUnitQuestion(qn===4?'person':qn===5?'area':'item');if(qn<8)return unitComparisonQuestion();if(qn===8)return speedQuestion('speed');return speedQuestion(Math.random()<.5?'distance':'time');}
    if(qn<3)return percentageQuestion('part');if(qn<6)return percentageQuestion('rate');if(qn<8)return percentageQuestion('base');if(qn===8)return percentageQuestion('discount');return percentageQuestion('increase');
  }
  function makeBlueBossQuestion(stage,step=bossQuestion){
    const qn=Math.max(0,Math.min(4,Number(step)||0));
    if(stage===0){if(qn<2)return finiteDecimalDivisionQuestion('integer');if(qn<4)return finiteDecimalDivisionQuestion('finite');return finiteDecimalDivisionQuestion('underOne');}
    if(stage===1){if(qn<2)return unlikeFractionQuestion('multiple');return unlikeFractionQuestion(qn>=4?'lcm':'lcm');}
    if(stage===2){if(qn===0)return averageQuestion(3);if(qn===1)return averageQuestion(4);if(qn===2)return averageTotalQuestion();if(qn===3)return perUnitQuestion('item');return perUnitQuestion('area');}
    if(stage===3){if(qn<2)return percentageQuestion('part',{blueFade:true});if(qn===2)return percentageQuestion('rate',{blueFade:true});if(qn===3)return percentageQuestion('base',{blueFade:true});return percentageQuestion('discount',{blueFade:true});}
    return makeBlueFinalBossQuestion(qn);
  }
  function makeBlueFinalBossQuestion(step=bossQuestion){
    const phase=Math.max(0,Math.min(4,Number(step)||0));
    if(phase===0)return decimalTimesDecimalQuestion(Math.random()<.5?'decimalAnswer':'hundredths');
    if(phase===1)return finiteDecimalDivisionQuestion('complex');
    if(phase===2)return unlikeFractionQuestion(Math.random()<.5?'subtract':'simplify');
    if(phase===3)return Math.random()<.5?averageQuestion(4):perUnitQuestion(Math.random()<.5?'item':'area');
    const q=percentageQuestion('part');q.blueEndlessRatio={...q.blueRatio};return q;
  }
  function makeBlueEndlessEchoQuestion(source=currentQuestion){
    const r=source?.blueEndlessRatio||source?.blueRatio;
    if(r){const answer=`${r.rate}%`;return{expression:`${r.part}は${r.base}の何%？`,displayExpression:`${r.part}は${r.base}の何%？`,answer,choices:shuffle([answer,`${Math.max(5,r.rate-10)}%`,`${Math.min(90,r.rate+10)}%`])};}
    return percentageQuestion('rate');
  }

  function fractionProductQuestion(op='×',integerSide=false,hard=false){
    for(let i=0;i<4000;i++){
      const d1=rand(2,12),n1=rand(1,d1-1),a=normFraction(n1,d1);
      if(integerSide){
        const k=rand(2,hard?9:7);let n,d;
        if(op==='×'){n=a.n*k;d=a.d;}else{n=a.n;d=a.d*k;}
        const r=normFraction(n,d);if(r.n>99||r.d>99||r.d===1)continue;
        const expression=`${a.n}/${a.d}${op}${k}`;
        return{expression,displayExpression:`${expression} = ?`,answer:fractionKey(r),choices:makeFractionChoices(fractionKey(r))};
      }
      const d2=rand(2,12),n2=rand(1,d2-1),b=normFraction(n2,d2);let n,d;
      if(op==='×'){n=a.n*b.n;d=a.d*b.d;}else{n=a.n*b.d;d=a.d*b.n;}
      const r=normFraction(n,d);if(r.n>99||r.d>99||r.d===1)continue;
      return{expression:`${a.n}/${a.d}${op}${b.n}/${b.d}`,answer:fractionKey(r),fraction:true,a,b,op,choices:makeFractionChoices(fractionKey(r))};
    }
    return op==='×'?{expression:'2/3×3/5',answer:'2/5',fraction:true,a:{n:2,d:3},b:{n:3,d:5},op:'×'}:{expression:'3/4÷2/5',answer:'15/8',fraction:true,a:{n:3,d:4},b:{n:2,d:5},op:'÷'};
  }
  function ratioQuestion(level='basic'){
    if(level==='equal'){
      const bank=[['6:10','9:15'],['8:12','10:15'],['12:18','2:3'],['10:16','15:24']];const [base,answer]=pick(bank);
      const wrong=answer==='2:3'?['3:4','4:5']:answer==='9:15'?['9:12','12:15']:answer==='10:15'?['12:15','8:10']:['15:20','20:24'];
      return{expression:`${base} と同じ比は？`,answer,choices:shuffle([answer,...wrong])};
    }
    if(level==='missing'){
      for(let i=0;i<500;i++){const a=rand(1,8),b=rand(2,9);if(a===b||gcd(a,b)!==1)continue;const k=rand(2,7);if(Math.random()<.5){const text=`${a*k}:${b*k} = □:${b}`;return{expression:text,displayExpression:text,answer:a,choices:compactNumericChoices(a,[a+1,Math.max(1,a-1),b])};}const text=`${a*k}:${b*k} = ${a}:□`;return{expression:text,displayExpression:text,answer:b,choices:compactNumericChoices(b,[b+1,Math.max(1,b-1),a])};}
    }
    if(level==='oneSide'){
      for(let i=0;i<500;i++){const a=rand(1,5),b=rand(2,7);if(a===b||gcd(a,b)!==1)continue;const unit=rand(2,12),known=a*unit,answer=b*unit;return{expression:`赤:青=${a}:${b}、赤${known}こ。青は？`,answer,choices:compactNumericChoices(answer,[known,answer-unit,answer+unit])};}
    }
    for(let i=0;i<500;i++){const a=rand(1,5),b=rand(2,7);if(a===b||gcd(a,b)!==1)continue;const unit=rand(2,12),total=(a+b)*unit,small=Math.min(a,b)*unit;return{expression:`全部${total}を${a}:${b}に分ける。小さい方は？`,answer:small,choices:compactNumericChoices(small,[Math.max(a,b)*unit,total/(a+b),small+unit])};}
    return{expression:'全部60を2:3に分ける。小さい方は？',answer:24,choices:[20,24,36]};
  }
  function circleQuestion(kind='areaRadius',hard=false){
    if(kind==='circumferenceDiameter'){const d=rand(4,hard?24:20);const text=`直径${d}cmの円周（円周率は3.14）`;const answer=round2(d*3.14);return{expression:text,displayExpression:text,answer,choices:compactNumericChoices(answer,[round2(answer/2),round2(answer+3.14),round2(answer-3.14)])};}
    if(kind==='circumferenceRadius'){const r=rand(2,hard?12:10);const text=`半径${r}cmの円周（円周率は3.14）`;const answer=round2(2*r*3.14);return{expression:text,displayExpression:text,answer,choices:compactNumericChoices(answer,[round2(r*3.14),round2(answer+6.28),round2(answer-6.28)])};}
    if(kind==='areaDiameter'){const r=rand(2,hard?12:10),d=r*2,text=`直径${d}cmの円の面積（円周率は3.14）`;const answer=round2(r*r*3.14);return{expression:text,displayExpression:text,answer,choices:compactNumericChoices(answer,[round2(d*d*3.14),round2(d*3.14),round2(r*3.14)])};}
    const r=rand(2,hard?12:10),text=`半径${r}cmの円の面積（円周率は3.14）`,answer=round2(r*r*3.14);return{expression:text,displayExpression:text,answer,choices:compactNumericChoices(answer,[round2(2*r*3.14),round2(r*3.14),round2((r+1)*(r+1)*3.14)])};
  }
  function proportionalQuestion(type='hole'){
    if(type==='factor'){
      const m=pick([2,3,4]),answer=`${m}倍`;return{expression:`xとyは比例。xが${m}倍になるとyは？`,answer,choices:[`${m}倍`,`1/${m}倍`,'変わらない']};
    }
    if(type==='classify'){
      const k=rand(2,6),x=[2,4,6],y=x.map(v=>v*k),text=`x:${x.join(',')} / y:${y.join(',')}　この関係は？`;return{expression:text,displayExpression:text,answer:'比例',choices:['比例','反比例','どちらでもない']};
    }
    if(type==='use'){
      const count=pick([2,3,4]),unit=pick([40,60,80,120]),target=count*pick([2,3,4]),answer=unit*target;return{expression:`${count}こで${unit*count}円。${target}こでは？`,answer,choices:compactNumericChoices(answer,[unit*count,answer-unit,answer+unit])};
    }
    const k=rand(2,8),x1=rand(1,6),m=pick([2,3,4]),x2=x1*m,text=`比例　x:${x1}→${x2} / y:${k*x1}→□`;return{expression:text,displayExpression:text,answer:k*x2,choices:compactNumericChoices(k*x2,[k*x1,k*x2-k,k*x2+k])};
  }
  function inverseQuestion(type='hole'){
    if(type==='factor'){
      const m=pick([2,3,4]),answer=`1/${m}倍`;return{expression:`xとyは反比例。xが${m}倍になるとyは？`,answer,choices:[`${m}倍`,`1/${m}倍`,'変わらない']};
    }
    if(type==='constant'){
      const x=rand(2,12),y=rand(2,12),answer=x*y;return{expression:`反比例　x=${x}, y=${y}。x×yは？`,answer,choices:compactNumericChoices(answer,[x+y,answer+x,Math.max(1,answer-x)])};
    }
    if(type==='classify'){
      const x=[2,4,8],p=pick([24,32,48]),y=x.map(v=>p/v),text=`x:${x.join(',')} / y:${y.join(',')}　この関係は？`;return{expression:text,displayExpression:text,answer:'反比例',choices:['比例','反比例','どちらでもない']};
    }
    if(type==='use'){
      const total=pick([24,36,48,60,72]),x=pick([3,4,6]),divs=[2,3,4,6,8,9,12].filter(v=>v!==x&&total%v===0),x2=pick(divs),answer=total/x2;return{expression:`${total}こをx人で等分。x=${x2}人なら1人？`,answer,choices:compactNumericChoices(answer,[total/x,answer+1,Math.max(1,answer-1)])};
    }
    for(let i=0;i<500;i++){const x1=rand(2,10),y1=rand(2,12),p=x1*y1,divs=[];for(let x=2;x<=18;x++)if(p%x===0&&x!==x1)divs.push(x);if(!divs.length)continue;const x2=pick(divs),text=`反比例　x:${x1}→${x2} / y:${y1}→□`;return{expression:text,displayExpression:text,answer:p/x2,choices:compactNumericChoices(p/x2,[y1,Math.max(1,p/x2-1),p/x2+1])};}
    return{expression:'反比例　x:3→6 / y:8→□',answer:4,choices:[3,4,8]};
  }
  function makeSilverQuestion(idx){
    if(idx===0){
      const qn=bossPhase?bossQuestion:stageQuestion;
      if(qn<2)return fractionProductQuestion('×',true,false);
      if(qn<5)return fractionProductQuestion('×',false,qn>=4);
      if(qn===5)return fractionProductQuestion('÷',true,false);
      return fractionProductQuestion('÷',false,qn>=9);
    }
    if(idx===1){
      const qn=bossPhase?bossQuestion:stageQuestion;
      if(bossPhase&&stageIndex===0){if(qn<2)return ratioQuestion('equal');if(qn<4)return ratioQuestion('missing');return ratioQuestion('oneSide');}
      if(qn<3)return ratioQuestion('equal');if(qn<6)return ratioQuestion('missing');if(qn<8)return ratioQuestion('oneSide');return ratioQuestion('split');
    }
    if(idx===2){
      const qn=bossPhase?bossQuestion:stageQuestion;
      if(bossPhase&&stageIndex===1){if(qn===0)return circleQuestion('circumferenceDiameter');if(qn===1)return circleQuestion('circumferenceRadius');return circleQuestion(qn===4?'areaDiameter':'areaRadius');}
      if(qn===0)return circleQuestion('circumferenceDiameter');if(qn===1)return circleQuestion('circumferenceRadius');if(qn<6)return circleQuestion('areaRadius');if(qn<8)return circleQuestion('areaDiameter');return circleQuestion(Math.random()<.5?'areaRadius':'areaDiameter',true);
    }
    if(idx===3){
      const qn=bossPhase?bossQuestion:stageQuestion;
      if(bossPhase&&stageIndex===2){if(qn<2)return proportionalQuestion('hole');if(qn===2)return proportionalQuestion('factor');if(qn===3)return proportionalQuestion('use');return proportionalQuestion('hole');}
      if(qn<3)return proportionalQuestion('hole');if(qn<5)return proportionalQuestion('factor');if(qn<7)return proportionalQuestion('classify');return proportionalQuestion('use');
    }
    const qn=bossPhase?bossQuestion:stageQuestion;
    if(bossPhase&&stageIndex===3){if(qn<3)return inverseQuestion('hole');if(qn===3)return inverseQuestion('constant');return inverseQuestion('factor');}
    if(qn<3)return inverseQuestion('hole');if(qn<5)return inverseQuestion('constant');if(qn<7)return inverseQuestion('factor');if(qn===7)return inverseQuestion('classify');return inverseQuestion('use');
  }

  function makeSilverFinalBossQuestion(step=bossQuestion){
    const phase=Math.max(0,Math.min(4,Number(step)||0));
    if(phase===0){
      const bank=[
        {expression:'6:10 と同じ比は？',answer:'9:15',choices:['9:15','9:12','12:15']},
        {expression:'12:18 と同じ比は？',answer:'2:3',choices:['2:3','3:4','4:5']},
        {expression:'8:12 と同じ比は？',answer:'10:15',choices:['10:15','12:15','8:10']},
        {expression:'10:16 と同じ比は？',answer:'15:24',choices:['15:24','15:20','20:24']}
      ];
      const q=pick(bank);return{...q,displayExpression:q.expression};
    }
    if(phase===1){
      if(Math.random()<.5){
        const r=pick([2,3,4,5,6,7,8,9,10]),area=round2(r*r*3.14),wrong=[r*2,r===2?3:r-1,r===10?9:r+1].filter((v,i,a)=>v!==r&&a.indexOf(v)===i),choices=shuffle([r,...wrong]).slice(0,3);if(!choices.includes(r))choices[0]=r;
        return{expression:`面積${area}cm²の円。半径は？（円周率は3.14）`,answer:r,choices,visualType:'mimesis-circle',circleKind:'area',circleValue:`${area}cm²`,circleAsk:'半径は？'};
      }
      const d=pick([4,6,8,10,12,14,16,18,20]),circumference=round2(d*3.14),wrong=[d/2,d+2,d===4?6:d-2].filter((v,i,a)=>v!==d&&a.indexOf(v)===i),choices=shuffle([d,...wrong]).slice(0,3);if(!choices.includes(d))choices[0]=d;
      return{expression:`円周${circumference}cmの円。直径は？（円周率は3.14）`,answer:d,choices,visualType:'mimesis-circle',circleKind:'circumference',circleValue:`${circumference}cm`,circleAsk:'直径は？'};
    }
    if(phase===2){
      const tableBank=[
        {answer:'比例',x:[2,4,8],y:[6,12,24]},{answer:'比例',x:[3,6,12],y:[12,24,48]},{answer:'比例',x:[2,5,10],y:[8,20,40]},
        {answer:'反比例',x:[2,4,8],y:[24,12,6]},{answer:'反比例',x:[3,6,12],y:[24,12,6]},{answer:'反比例',x:[2,5,10],y:[30,12,6]},
        {answer:'どちらでもない',x:[2,4,8],y:[6,10,14]},{answer:'どちらでもない',x:[3,6,12],y:[8,14,20]},{answer:'どちらでもない',x:[2,5,10],y:[7,12,18]}
      ];
      const q=pick(tableBank);return{expression:'この関係は？',answer:q.answer,choices:['比例','反比例','どちらでもない'],visualType:'mimesis-table',tableX:q.x,tableY:q.y};
    }
    if(phase===3){
      const relation=Math.random()<.5?'比例':'反比例',m=pick([2,3,4]),upward=Math.random()<.5,base=rand(2,6),from=upward?base:base*m,to=upward?base*m:base,xFactor=upward?m:1/m,yFactor=relation==='比例'?xFactor:1/xFactor,answer=yFactor>=1?`${m}倍`:`1/${m}倍`;
      return{expression:`xとyは${relation}。x：${from} → ${to}。yは？`,displayExpression:`xとyは${relation}　x：${from} → ${to}　yは？`,answer,choices:[`${m}倍`,`1/${m}倍`,'変わらない']};
    }
    // FINAL only: same conceptual task as agreed, but values are intentionally one step heavier.
    const templates={
      ratio:{label:'比',true:['12:18 = 26:39','14:21 = 22:33','15:24 = 35:56','18:30 = 27:45'],false:['12:18 = 26:36','14:21 = 22:30','15:24 = 35:54','18:30 = 27:42']},
      circle:{label:'円',true:['半径8cm → 面積200.96cm²','半径9cm → 面積254.34cm²','直径18cm → 円周56.52cm','直径24cm → 円周75.36cm'],false:['半径8cm → 面積100.48cm²','半径9cm → 面積56.52cm²','直径18cm → 円周28.26cm','直径24cm → 円周37.68cm']},
      direct:{label:'比例',true:['x 6→18 ｜ y 14→42','x 8→20 ｜ y 12→30','x 9→27 ｜ y 11→33','x 12→30 ｜ y 16→40'],false:['x 6→18 ｜ y 14→40','x 8→20 ｜ y 12→28','x 9→27 ｜ y 11→30','x 12→30 ｜ y 16→36']},
      inverse:{label:'反比例',true:['x 6→18 ｜ y 42→14','x 8→20 ｜ y 45→18','x 9→27 ｜ y 36→12','x 12→30 ｜ y 40→16'],false:['x 6→18 ｜ y 42→16','x 8→20 ｜ y 45→20','x 9→27 ｜ y 36→14','x 12→30 ｜ y 40→18']}
    };
    const fields=shuffle(Object.keys(templates)).slice(0,3),falseField=pick(fields),rows=shuffle(fields.map(key=>{const t=templates[key],isFalse=key===falseField;return{label:t.label,text:pick(isFalse?t.false:t.true),isFalse};})).map((row,i)=>({...row,letter:['A','B','C'][i]})),answer=rows.find(r=>r.isFalse).letter;
    return{expression:'まちがっているものは？',answer,choices:['A','B','C'],visualType:'mimesis-final',mimesisRows:rows,showPi:rows.some(r=>r.label==='円')};
  }

  function currentStage(){return (mode==='crimson'&&crimsonLastPhase)?CRIMSON_LAST:getStages()[stageIndex];}
  function sameDigitLength(a,b){return String(Math.abs(a)).length===String(Math.abs(b)).length;}
  function answerKey(v){return typeof v==='number'?String(v):String(v);}
  function answersEqual(a,b){return answerKey(a)===answerKey(b);}
  function applyDebugAnswerHint(button,value,answer){
    if(!debugFullUnlock||!answersEqual(value,answer))return;
    button.classList.add('debug-answer');
    button.dataset.debugAnswer='正解';
    button.setAttribute('aria-label',`${value}（デバッグ：正解）`);
  }
  function makeChoices(ans){
    if(typeof ans==='string'&&ans.includes('/'))return makeFractionChoices(ans);
    if(typeof ans==='number'&&!Number.isInteger(ans))return makeDecimalChoices(ans);
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
  const BATTLE_SPRITE_SCALE={
    // Genma's formal sprite deliberately carries much larger top/bottom transparent
    // safety margins than the stage bosses. Compensate only at presentation time so
    // the original 1152x1536 PNG remains untouched while his visible figure matches
    // the other bosses in battle.
    'boss_crimson_last.png':1.24
  };
  const BATTLE_SPRITE_OFFSET_Y={
    // The source art extends lower with particles, which makes the knight itself appear
    // unusually high when bottom-aligned. Shift only the battle presentation downward.
    'monster_front_4_2_25.png':'7%',
    // The same source-safe margin leaves the visible feet high above the actor base
    // after scaling, so lower Genma slightly without changing the asset itself.
    'boss_crimson_last.png':'11%'
  };
  function applyEnemyFacing(en){
    if(!els.enemySprite)return;
    const keepOriginal=!!en&&((en.world==='crimson'||en.world==='silver'||en.world==='blue')||BATTLE_KEEP_ORIGINAL_FACING.has(en.img));
    els.enemySprite.classList.toggle('flip-facing',!!en&&!keepOriginal);
    els.enemySprite.classList.toggle('bottom-safe-knight',!!en&&en.img==='monster_front_4_2_25.png');
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


  function isBlueStage5(){return mode==='blue'&&stageIndex===4;}
  function isBlueAdultPhase(){return isBlueStage5()&&blueAdultState;}
  function ensureBlueMemoryDimmer(){
    const battlefield=document.querySelector('.battlefield');if(!battlefield)return null;
    let layer=$('blueMemoryDimmer');
    if(!layer){layer=document.createElement('div');layer.id='blueMemoryDimmer';layer.className='blue-memory-dimmer';layer.setAttribute('aria-hidden','true');battlefield.appendChild(layer);}
    return layer;
  }
  function setBlueMemoryDim(value,{full=false,immediate=false}={}){
    const layer=ensureBlueMemoryDimmer();if(!layer)return;
    blueMemoryDim=Math.max(0,Math.min(1,Number(value)||0));
    layer.classList.toggle('full-black',!!full);
    layer.classList.toggle('no-transition',!!immediate);
    layer.style.opacity=String(blueMemoryDim);
    if(immediate){void layer.offsetWidth;layer.classList.remove('no-transition');}
  }
  function blueStage5NormalDimTarget(){
    if(!isBlueStage5()||bossPhase)return 0;
    const levels=[0,0,0,0,.35,.42,.50,.62,.73,.83];
    return levels[Math.max(0,Math.min(9,stageQuestion))]||0;
  }
  function updateBlueStage5Dimming({immediate=false}={}){
    if(!isBlueStage5()){
      const layer=$('blueMemoryDimmer');if(layer){layer.classList.remove('full-black');layer.style.opacity='0';blueMemoryDim=0;}
      return;
    }
    if(blueAdultState||bossPhase)return;
    setBlueMemoryDim(blueStage5NormalDimTarget(),{full:false,immediate});
  }
  async function blueStage5BossBlackout(){
    if(!isBlueStage5())return;
    setBlueMemoryDim(1,{full:true});
    await sleep(1350);
  }
  function revealBlueStage5BossWorld(){
    if(!isBlueStage5())return;
    blueAdultState=true;
    renderGame();
  }
  async function releaseBlueStage5Blackout(){
    if(!isBlueStage5())return;
    const layer=ensureBlueMemoryDimmer();if(!layer)return;
    layer.classList.add('full-black');layer.style.opacity='0';blueMemoryDim=0;
    await sleep(1450);layer.classList.remove('full-black');
  }


  function stageDisplayProgress(){
    return Math.max(0,Math.min(15,totalProgress-stageIndex*15));
  }
  function renderGame(){
    const s=currentStage(),stageProgress=stageDisplayProgress();document.body.dataset.mode=mode;document.body.dataset.stage=stageIndex;
    if(mode==='crimson'&&crimsonLastPhase){els.progressText.textContent=`${Math.min(80,totalProgress)} / 80`;els.progressFill.style.width=`${Math.min(100,(totalProgress-75)/5*100)}%`;els.stageLabel.textContent='LAST BOSS';els.stageName.textContent=s.name;}else{els.progressText.textContent=`${stageProgress} / 15`;els.progressFill.style.width=`${stageProgress/15*100}%`;els.stageLabel.textContent=`STAGE ${stageIndex+1}`;els.stageName.textContent=s.name;}els.lifeDisplay.textContent=[0,1,2].map(i=>i<lives?'♥':'♡').join(' ');els.timerText.textContent=timeLeft;
    fitSingleLineText(els.stageName,{maxWidthRatio:.42,minPx:10});
    const blueAdult=isBlueAdultPhase();const battleBgFile=isBlueStage5()?(blueAdult?'blue_stage5_after.png':'blue_stage5_before.png'):s.bg;
    els.battleBg.style.backgroundImage=`url('./assets/${battleBgFile}')`;els.heroImage.src=mode==='front'?'./assets/hero.png':mode==='back'?'./assets/back_hero.png':mode==='crimson'?'./assets/crimson_hero.png':mode==='blue'?(blueAdult?'./assets/blue_hero_adult.png':'./assets/blue_hero.png'):'./assets/silver_hero.png';els.heroName.textContent=mode==='front'?'ゆうしゃ':mode==='back'?'魔法少女':mode==='crimson'?'流浪の剣士':mode==='blue'?(blueAdult?'青年':'少年'):'銀狼の少女';
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
    const playable=!els.gameScreen.hidden&&!paused&&!gameOverActive&&!locked&&!silverSpecialBusy&&!crimsonMoonShiftBusy&&!blueSpecialBusy&&!specialActive&&!!timerId&&!!currentQuestion;
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
    const a=mode==='back'?magicSE:swordSE;
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
    const magicVisual=mode==='back'||(mode==='blue'&&isBlueAdultPhase());
    els.heroActor.classList.add(magicVisual?'attack-back':'attack-front');
    els.attackEffect.classList.add(magicVisual?'back-hit':'front-hit');
    els.enemyActor.classList.add('hit');
    playAttackSE();
  }
  function playFinisherSE(){
    if(!soundOn)return;
    const a=mode==='back'?backFinisherSE:frontFinisherSE;
    try{a.currentTime=0;a.play().catch(()=>playAttackSE());}catch{playAttackSE();}
  }
  function runFinisherMotion(){
    els.heroActor.classList.remove('attack-front','attack-back','finisher-front','finisher-back');
    els.enemyActor.classList.remove('hit','finisher-hit');
    els.attackEffect.className='attack-effect';
    void els.heroActor.offsetWidth;void els.attackEffect.offsetWidth;
    const magicVisual=mode==='back'||(mode==='blue'&&isBlueAdultPhase());
    els.heroActor.classList.add(magicVisual?'finisher-back':'finisher-front');
    els.attackEffect.classList.add(magicVisual?'finisher-back-fx':'finisher-front-fx');
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


const MAP_TIPS=[
  {key:'gold-1',category:'アイテムと G',text:'ステージをクリアすると G が手に入るよ。G はショップで使えるよ！'},
  {key:'gold-2',category:'アイテムと G',text:'ショップでは G を使ってアイテムを買えるよ。まだ持っていないものを集めよう！'},
  {key:'gold-3',category:'アイテムと G',text:'G をためてショップをのぞいてみよう。コレクションをふやすチャンス！'},
  {key:'collection-1',category:'コレクション',text:'手に入れたアイテムは「コレクション」で見ることができるよ。めざせ 100しゅるい！'},
  {key:'collection-2',category:'コレクション',text:'コレクションのアイテムをタップすると、名前やせつめいを見ることができるよ。'},
  {key:'collection-3',category:'コレクション',text:'ショップやゲームクリアでアイテムを集めて、100 / 100をめざそう！'},
  {key:'book-1',category:'モンスター図鑑',text:'一度でも出会ったモンスターは「モンスター図鑑」にとうろくされるよ！'},
  {key:'book-2',category:'モンスター図鑑',text:'★が多いモンスターほど めずらしい！ ★5に出会えたら、とてもラッキー！'},
  {key:'book-3',category:'モンスター図鑑',text:'ステージをすすめると、出会えるモンスターのしゅるいもふえていくよ。'},
  {key:'book-4',category:'モンスター図鑑',text:'★4は 4%、★5は 1%！ めずらしいモンスターを見つけてみよう。'},
  {key:'special-1',category:'必殺技',text:'せいかいすると、ひっさつゲージが 20% たまるよ。MAXで「必殺技！」が使える！'},
  {key:'special-2',category:'必殺技',text:'必殺技を使うと、まちがいのこたえを 1つ消すことができるよ！'},
  {key:'special-3',category:'必殺技',text:'まちがえたり、時間切れになると、ひっさつゲージが 20% へるので注意！'},
  {key:'special-4',category:'必殺技',text:'ひっさつゲージは、通常バトルからボスバトルへ持ちこせるよ。'},
  {key:'bgm-1',category:'BGMページ',text:'タイトル画面の「♫」から、ゲームで流れる曲を聞くことができるよ。'},
  {key:'bgm-2',category:'BGMページ',text:'ステージをすすめると、BGMページで聞ける曲もふえていくよ！'},
  {key:'bgm-3',category:'BGMページ',text:'BGMページでは、曲をもどしたり、つぎへ送ったり、くり返して聞いたりできるよ。'},
  {key:'secret-shop',category:'ひみつのアイテム',text:'ショップに並ばないアイテムも、この世界には存在するらしい……。',minTier:0},
  {key:'secret-road',category:'ひみつのアイテム',text:'コレクションを完成に近づけることで、新しい道が開くこともあるかもしれない。',minTier:0},
  {key:'secret-rarity',category:'ひみつのアイテム',text:'同じレアリティのアイテムを集め続けると、特別なものが現れることがあるらしい……。',minTier:1},
  {key:'secret-book',category:'ひみつのアイテム',text:'図鑑を埋めることにも、戦いとは別の意味があるようだ。',minTier:1},
  {key:'secret-high',category:'ひみつのアイテム',text:'★4や★5のモンスターには、すべて出会ってみる価値があるかもしれない。',minTier:2},
  {key:'secret-key',category:'ひみつのアイテム',text:'世界を渡るための鍵は、必ずしも鍵の形をしているとは限らない。',minTier:3}
];
const MAP_TIP_INTRO_KEYS=['special-1','book-1','gold-1','collection-1','bgm-1','secret-shop'];
const MAP_SECRET_TIER_HINTS={1:'secret-rarity',2:'secret-high',3:'secret-key'};
let lastMapTipKey='';
function currentMapSecretTipTier(){
  if(save.secretRelics?.includes('uncommon_master')||save.silverClears>0)return 3;
  if(save.secretRelics?.includes('common_master')||save.crimsonClears>0)return 2;
  if(save.backUnlocked||save.frontClears>0)return 1;
  return 0;
}
function chooseMapTip(){
  let tip=null;
  const tier=currentMapSecretTipTier();
  if(!debugFullUnlock&&save.mapTipIntroIndex<MAP_TIP_INTRO_KEYS.length){
    const key=MAP_TIP_INTRO_KEYS[save.mapTipIntroIndex++];tip=MAP_TIPS.find(t=>t.key===key)||MAP_TIPS[0];persistQuietly();
  }else if(!debugFullUnlock&&tier>(save.mapSecretTipTierSeen||0)){
    save.mapSecretTipTierSeen=tier;const key=MAP_SECRET_TIER_HINTS[tier]||MAP_SECRET_TIER_HINTS[1];tip=MAP_TIPS.find(t=>t.key===key)||MAP_TIPS[0];persistQuietly();
  }else{
    const pool=MAP_TIPS.filter(t=>(t.minTier??0)<=tier&&t.key!==lastMapTipKey);tip=pick(pool.length?pool:MAP_TIPS);
  }
  lastMapTipKey=tip.key;return tip;
}
let mapAdvanceResolve=null,mapAdvanceTimer=null;
function armMapAdvance(){
  if(mapAdvanceTimer)clearTimeout(mapAdvanceTimer);
  if(els.mapVisual)els.mapVisual.disabled=true;if(els.mapNextBtn)els.mapNextBtn.disabled=true;
  mapAdvanceTimer=setTimeout(()=>{if(!els.mapOverlay.hidden){if(els.mapVisual)els.mapVisual.disabled=false;if(els.mapNextBtn)els.mapNextBtn.disabled=false;}},550);
}
function advanceMapFromInput(){
  if(!mapAdvanceResolve||els.mapOverlay.hidden||els.mapNextBtn?.disabled)return;
  if(mapAdvanceTimer){clearTimeout(mapAdvanceTimer);mapAdvanceTimer=null;}
  if(els.mapVisual)els.mapVisual.disabled=true;if(els.mapNextBtn)els.mapNextBtn.disabled=true;
  const resolve=mapAdvanceResolve;mapAdvanceResolve=null;resolve();
}
function waitForMapAdvance(){armMapAdvance();return new Promise(resolve=>{mapAdvanceResolve=resolve;});}

  function prepareMapOverlay(initial=false){
    els.mapModeLabel.textContent=mode==='front'?'WORLD MAP':mode==='back'?'BACK WORLD':mode==='crimson'?'CRIMSON WORLD':mode==='blue'?'BLUE WORLD':'SILVER WORLD';
    els.mapTitle.textContent=mode==='front'?'ぼうけんの ちず':mode==='back'?'ウラのせかい':mode==='crimson'?'紅の世界':mode==='blue'?'蒼の世界':'銀の世界';
    els.mapImage.src=mode==='front'?'./assets/world_map_v3_clean.png':mode==='back'?'./assets/back_map.png':mode==='crimson'?'./assets/crimson_map.png':mode==='blue'?'./assets/blue_map.svg':'./assets/silver_map.png';
    const mapLinesFront=['森を抜けて、つぎの地へ。','洞くつの先へ進みます…','塔へ向かっています…','まおうの城へ進軍中…','決戦の部屋へ向かいます…'];
    const mapLinesBack=['渋谷の裂け目へ移動中…','浅草の夜へ向かいます…','スカイツリー方面へ移動中…','都庁前へ急行中…','時空の最深部へ向かいます…'];
    const mapLinesCrimson=['実りの里へ向かいます…','紅葉隠れの社へ進みます…','湯煙の古宿へ向かいます…','錦秋の城下へ進みます…','月影の山城へ向かいます…'];
    const mapLinesBlue=['昔ながらの田舎町へ向かいます…','山の秘密基地へ進みます…','夏祭りの灯りへ向かいます…','夕暮れの公園へ進みます…','あの家へ帰ります…'];
    const mapLinesSilver=['孤独の雪原へ踏み出します…','氷鏡の美術館へ向かいます…','天穹の雪嶺を登ります…','白夜の大天幕へ進みます…','世界の果てへ向かいます…'];
    const lines=mode==='front'?mapLinesFront:mode==='back'?mapLinesBack:mode==='crimson'?mapLinesCrimson:mode==='blue'?mapLinesBlue:mapLinesSilver;
    els.mapMessage.textContent=lines[stageIndex] || (initial?'最初のエリアへ向かっています…':'次のエリアへ移動しています…');
    const tip=chooseMapTip();if(els.mapTipCategory)els.mapTipCategory.textContent=tip.category;if(els.mapTipText)els.mapTipText.textContent=tip.text;
    if(mapAdvanceResolve)mapAdvanceResolve=null;if(mapAdvanceTimer){clearTimeout(mapAdvanceTimer);mapAdvanceTimer=null;}
    if(els.mapVisual)els.mapVisual.disabled=true;if(els.mapNextBtn)els.mapNextBtn.disabled=true;
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
    const canUse=value>=100&&!specialActive&&!crimsonMoonShiftBusy&&!silverSpecialBusy&&!blueSpecialBusy&&!paused&&!gameOverActive&&!locked&&!!currentQuestion&&!!timerId&&!els.gameScreen.hidden;
    els.specialBtn.hidden=value<100||!currentQuestion||!timerId||paused||gameOverActive||specialActive;
    els.specialBtn.disabled=!canUse;
    els.specialBtn.setAttribute('aria-disabled',canUse?'false':'true');
  }
  function restoreChoiceInteractivity(){
    if(!els.choices)return;
    const buttons=[...els.choices.children];
    const globallyLocked=paused||specialActive||locked||silverSpecialBusy||crimsonMoonShiftBusy||blueSpecialBusy;
    if(globallyLocked){buttons.forEach(b=>b.disabled=true);return;}

    const viable=b=>b.dataset.eliminated!=='true'&&!b.classList.contains('mirror-vanished');
    if(document.body.classList.contains('silver-spotlight-active')){
      const active=buttons.filter(viable);
      // A choice removed by the hero special can still carry the old spotlight class.
      // Normalize the visual state first so exactly one viable choice is lit/enabled.
      buttons.forEach(b=>{if(!viable(b))b.classList.remove('silver-spotlit');});
      let lit=active.find(b=>b.classList.contains('silver-spotlit'));
      if(!lit&&active.length)lit=active[0];
      buttons.forEach(b=>{
        const on=!!lit&&b===lit;
        b.classList.toggle('silver-spotlit',on);
        b.disabled=!viable(b)||!on;
      });
      return;
    }

    buttons.forEach(b=>{
      b.disabled=!viable(b)
        ||b.classList.contains('silver-beast-blocked')
        ||b.classList.contains('crimson-tengu-blown')
        ||b.classList.contains('blue-trail-blocked');
    });
  }
  function adjustSpecialGauge(delta){
    specialGauge=Math.max(0,Math.min(100,specialGauge+delta));
    updateSpecialHud();
  }
  function resetSpecialGauge(){specialGauge=0;comboStreak=0;specialActive=false;document.body.classList.remove('special-assist-active');updateSpecialHud();}
  async function activateSpecialMove(){
    if(specialActive||crimsonMoonShiftBusy||silverSpecialBusy||blueSpecialBusy||paused||gameOverActive||locked||specialGauge<100||!currentQuestion||!timerId)return;
    const wrongButtons=[...els.choices.children].filter(b=>b.dataset.eliminated!=='true'&&b.dataset.mirrorFake!=='true'&&!answersEqual(b.dataset.answerValue??b.textContent,currentQuestion.answer));
    if(!wrongButtons.length)return;
    specialActive=true;locked=true;
    const resumeTime=timeLeft;
    stopTimer();updateSpecialHud();syncPauseButton();
    [...els.choices.children].forEach(b=>b.disabled=true);
    document.body.classList.add('special-assist-active');
    specialGauge=0;updateSpecialHud();
    const heroFile=mode==='front'?'hero.png':mode==='back'?'back_hero.png':mode==='crimson'?'crimson_hero.png':'silver_hero.png';
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
    restoreChoiceInteractivity();
    updateSpecialHud();syncPauseButton();
    if(currentQuestion&&timeLeft>0&&!paused&&!gameOverActive)startTimer(resumeTime,{preserveCountCue:true});
  }

  function setFractionQuestionLayout(active){
    const panel=els.mathProblem.closest('.question-panel');
    if(panel)panel.classList.toggle('fraction-question',!!active);
  }
  function setMimesisQuestionLayout(type='',activeBoss=false){
    const panel=els.mathProblem?.closest('.question-panel');
    if(!panel)return;
    panel.classList.remove('mimesis-boss-question','mimesis-circle-question','mimesis-table-question','mimesis-final-question');
    if(activeBoss)panel.classList.add('mimesis-boss-question');
    if(type==='mimesis-circle')panel.classList.add('mimesis-circle-question');
    if(type==='mimesis-table')panel.classList.add('mimesis-table-question');
    if(type==='mimesis-final')panel.classList.add('mimesis-final-question');
  }
  function renderMimesisVisual(q){
    const el=els.mathProblem;
    if(!el)return false;
    if(q?.visualType==='mimesis-circle'){
      el.innerHTML='';
      const wrap=document.createElement('div');wrap.className='mimesis-circle-view';
      const value=document.createElement('strong');value.textContent=`${q.circleKind==='area'?'面積':'円周'} ${q.circleValue}`;
      const arrow=document.createElement('span');arrow.className='mimesis-arrow';arrow.textContent='↓';
      const ask=document.createElement('b');ask.textContent=q.circleAsk;
      const pi=document.createElement('small');pi.textContent='円周率は3.14';
      wrap.append(value,arrow,ask,pi);el.appendChild(wrap);return true;
    }
    if(q?.visualType==='mimesis-table'){
      el.innerHTML='';
      const wrap=document.createElement('div');wrap.className='mimesis-table-view';
      const ask=document.createElement('strong');ask.textContent='この関係は？';wrap.appendChild(ask);
      const table=document.createElement('table');table.setAttribute('aria-label','xとyの関係を表す表');
      [['x',q.tableX],['y',q.tableY]].forEach(([label,values])=>{
        const tr=document.createElement('tr');const th=document.createElement('th');th.scope='row';th.textContent=label;tr.appendChild(th);
        values.forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.appendChild(td);});table.appendChild(tr);
      });
      wrap.appendChild(table);el.appendChild(wrap);return true;
    }
    if(q?.visualType==='mimesis-final'){
      el.innerHTML='';
      const wrap=document.createElement('div');wrap.className='mimesis-final-view';
      const head=document.createElement('div');head.className='mimesis-final-head';
      const ask=document.createElement('strong');ask.textContent='まちがっているものは？';head.appendChild(ask);
      if(q.showPi){const pi=document.createElement('small');pi.textContent='円周率は3.14';head.appendChild(pi);}wrap.appendChild(head);
      const list=document.createElement('div');list.className='mimesis-final-list';
      q.mimesisRows.forEach(row=>{
        const item=document.createElement('div');item.className='mimesis-final-row';
        const letter=document.createElement('b');letter.className='mimesis-row-letter';letter.textContent=row.letter;
        const field=document.createElement('span');field.className='mimesis-row-field';field.textContent=row.label;
        const text=document.createElement('strong');text.className='mimesis-row-text';text.textContent=row.text;
        item.append(letter,field,text);list.appendChild(item);
      });
      wrap.appendChild(list);el.appendChild(wrap);return true;
    }
    return false;
  }
  function resetMathProblemFit(){
    if(!els.mathProblem)return;
    for(const prop of ['font-size','max-width','width','white-space','line-height','overflow-wrap','word-break','display','text-align'])els.mathProblem.style.removeProperty(prop);
  }
  function fitMathProblemToBox(q=currentQuestion){
    const el=els.mathProblem,box=el?.closest('.equation-box');
    if(!el||!box)return;
    resetMathProblemFit();
    if(q?.fraction||q?.visualType||(mode!=='silver'&&mode!=='blue'))return;
    const maxWidth=Math.max(100,box.clientWidth-18);
    const maxHeight=Math.max(42,box.clientHeight-10);
    el.style.maxWidth=`${maxWidth}px`;
    el.style.whiteSpace='nowrap';
    const base=parseFloat(getComputedStyle(el).fontSize)||32;
    const portrait=window.matchMedia?.('(orientation:portrait)').matches;
    const minSingle=portrait?21:(window.innerHeight<=500?20:24);
    let size=base;
    while(el.scrollWidth>maxWidth&&size>minSingle){size=Math.max(minSingle,size-1);el.style.fontSize=`${size}px`;}
    if(el.scrollWidth>maxWidth){
      el.style.width=`${maxWidth}px`;
      el.style.maxWidth=`${maxWidth}px`;
      el.style.whiteSpace='normal';
      el.style.display='block';
      el.style.textAlign='center';
      el.style.lineHeight='1.15';
      el.style.overflowWrap='anywhere';
      el.style.wordBreak='normal';
      size=minSingle;el.style.fontSize=`${size}px`;
      while(el.scrollHeight>maxHeight&&size>16){size--;el.style.fontSize=`${size}px`;}
    }
  }
  function renderBlueFadeParts(q){
    if(!q?.blueFadeParts)return false;
    els.mathProblem.replaceChildren();
    const wrap=document.createElement('span');wrap.className='blue-fade-problem';
    q.blueFadeParts.forEach(part=>{const span=document.createElement('span');span.textContent=part.text;span.className=part.fade?'blue-fade-fragment':'blue-fade-static';wrap.appendChild(span);});
    els.mathProblem.appendChild(wrap);return true;
  }
  function renderQuestionContent(q){
    setFractionQuestionLayout(!!q?.fraction);setMimesisQuestionLayout(q?.visualType||'',mode==='silver'&&bossPhase&&stageIndex===4);resetMathProblemFit();
    if(renderMimesisVisual(q))return;
    if(renderBlueFadeParts(q)){fitMathProblemToBox(q);return;}
    if(q?.fraction){els.mathProblem.innerHTML=fractionExpressionHtml(q.a,q.op,q.b);}else els.mathProblem.textContent=q?.displayExpression||`${q.expression}=?`;
    fitMathProblemToBox(q);
  }
  function renderChoiceButton(b,v,answer){
    b.dataset.answerValue=answerKey(v);
    const f=parseFractionKey(v);if(f)b.innerHTML=fractionHtml(f);else b.textContent=v;
    if(typeof v==='string'&&!f&&!/^[-+]?\d+(?:\.\d+)?$/.test(v)&&!/^\d+:\d+$/.test(v))b.classList.add('text-choice');
    applyDebugAnswerHint(b,v,answer);b.onclick=()=>resolveAnswer(v,false);
  }
  function choicesForQuestion(q){return Array.isArray(q?.choices)&&q.choices.length?shuffle(q.choices):makeChoices(q.answer);}
  function prepareQuestion(){
    clearMonsterAnnouncement();locked=true;clearBattleFx();renderGame();
    currentQuestion=bossPhase?makeBossQuestion(stageIndex):(mode==='front'?makeFrontQuestion(stageIndex):mode==='back'?makeBackQuestion(stageIndex):mode==='crimson'?makeCrimsonQuestion(stageIndex):mode==='blue'?makeBlueQuestion(stageIndex):makeSilverQuestion(stageIndex));
    renderQuestionContent(currentQuestion);els.feedbackText.textContent='';els.choices.innerHTML='';
    choicesForQuestion(currentQuestion).forEach(v=>{const b=document.createElement('button');renderChoiceButton(b,v,currentQuestion.answer);els.choices.appendChild(b);});
    updateBlueStage5Dimming();locked=false;syncPauseButton();updateSpecialHud();
  }

  function clearQuestionUi(){setFractionQuestionLayout(false);setMimesisQuestionLayout('',false);resetMathProblemFit();els.mathProblem.textContent='';els.feedbackText.textContent='';els.choices.innerHTML='';updateSpecialHud();}
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
      const originalFacing=side==='enemy'&&(imgFile.includes('_crimson_')||BATTLE_KEEP_ORIGINAL_FACING.has(imgFile));
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
    if(isBlueStage5()&&!retry){revealBlueStage5BossWorld();await sleep(180);}
    els.enemyActor.classList.add('spawn-boss');void els.enemyActor.offsetWidth;els.enemyActor.style.opacity='1';
    if(isBlueStage5()&&!retry)await Promise.all([sleep(1400),releaseBlueStage5Blackout()]);else await sleep(1400);
    els.enemyActor.classList.remove('spawn-boss');clearMonsterAnnouncement();updateBossHpHud();
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
    ],
    crimson:[
      {type:'crimson-straw',name:'稲穂隠し',time:60},
      {type:'crimson-gust',name:'天狗颪',time:60},
      {type:'crimson-steam',name:'湯煙隠し',time:60},
      {type:'crimson-time',name:'刻限算盤',time:20},
      {type:'crimson-moon-shift',name:'月影転位',time:60}
    ],
    blue:[
      {type:'blue-sumo',name:'甲王大相撲',time:60},
      {type:'blue-trail-block',name:'獣道封鎖',time:60},
      {type:'blue-lantern-out',name:'宵祭りの灯落とし',time:60},
      {type:'blue-return-bell',name:'帰刻の鐘',time:60},
      {type:'blue-endless-summer',name:'終わらない夏休み',time:60}
    ],
    silver:[
      {type:'silver-snowball',name:'剛腕雪崩',time:60},
      {type:'silver-mirror',name:'鏡界大奇術',time:60},
      {type:'silver-beast-ring',name:'驚獣大火輪',time:60},
      {type:'silver-spotlight',name:'白夜大演目',time:60},
      {type:'silver-mimesis',name:'逆相鏡界',time:60}
    ]
  };
  const CRIMSON_LAST_SPECIAL={type:'crimson-genma',name:'無明の一閃',time:15};
  function currentBossSpecial(){
    if(mode==='crimson'&&crimsonLastPhase)return CRIMSON_LAST_SPECIAL;
    return BOSS_SPECIALS[mode]?.[stageIndex]||null;
  }
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
  const MULTI_PHASE_BOSS_SPECIALS=new Set(['shield','double','shield-reverse','reconstruct','shield-double','reverse-reconstruct','crimson-steam','silver-beast-ring','blue-endless-summer']);
  function bossTechniqueChipLabel(phase=''){
    const spec=currentBossSpecial();
    const name=spec?.name||'';
    const detail=String(phase||'').trim();
    if(!name)return detail;
    if(!detail||detail===name||!MULTI_PHASE_BOSS_SPECIALS.has(spec.type))return name;
    return `${name}｜${detail}`;
  }
  function setBossStepChip(text='',step=1){
    const label=bossTechniqueChipLabel(text);
    if(!label){$('bossStrikeChip')?.remove();return;}
    let chip=$('bossStrikeChip');
    if(!chip){chip=document.createElement('span');chip.id='bossStrikeChip';chip.className='boss-strike-chip';document.querySelector('.question-panel')?.appendChild(chip);}
    chip.textContent=label;chip.dataset.step=String(step);
  }
  function populateSpecialQuestion(q,{chip='',step=1}={}){
    clearMonsterAnnouncement();locked=true;clearBattleFx();renderGame();
    currentQuestion=q;
    renderQuestionContent(q);els.feedbackText.textContent='';els.choices.innerHTML='';
    choicesForQuestion(q).forEach(v=>{const b=document.createElement('button');renderChoiceButton(b,v,q.answer);els.choices.appendChild(b);});
    if(chip)setBossStepChip(chip,step);else{$('bossStrikeChip')?.remove();}
    locked=false;syncPauseButton();updateSpecialHud();
  }
  async function showBossPhaseTransition(kicker='SECOND STRIKE',title='第二撃',variant='slash'){
    ensureBossSpecialFxLayer();const fx=$('bossStrikeTransition');if(!fx)return;
    clearQuestionUi();locked=true;hideSpecialHudForCutin();document.body.classList.add('boss-technique-active');
    try{
      $('bossStrikeKicker').textContent=kicker;$('bossStrikeTitle').textContent=title;
      fx.hidden=false;fx.className=`boss-strike-transition ${variant}`;void fx.offsetWidth;
      if(variant==='slash')playSE(cutinSE);
      fx.classList.add('active');
      await sleep(760);fx.classList.remove('active');await sleep(120);fx.hidden=true;
    }finally{document.body.classList.remove('boss-technique-active');restoreSpecialHudAfterCutin();}
  }
  async function showShieldForm(){
    ensureBossSpecialFxLayer();const shield=$('bossShieldFx');if(!shield)return;
    shield.hidden=false;shield.classList.remove('breaking');shield.classList.add('active');await sleep(620);
  }
  async function showShieldBreak(){
    const shield=$('bossShieldFx');if(!shield)return;
    playSE(breakSE);
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
    const w=$('rarityWarning');w.className='rarity-warning time-warning';w.textContent=`${seconds}びょう！`;w.hidden=false;await sleep(760);w.hidden=true;w.textContent='';
  }
  function trackCrimsonInterval(id){crimsonSpecialIntervals.push(id);return id;}
  function trackCrimsonTimeout(id){crimsonSpecialTimeouts.push(id);return id;}
  // Silver-world short penalties/blocks must freeze while PAUSE or the hero cut-in is active.
  // A normal setTimeout would keep counting behind the pause overlay and silently change the
  // boss state before the player returns, so measure only active battle time instead.
  function scheduleSilverActiveTimeout(fn,activeMs){
    let remaining=Math.max(0,Number(activeMs)||0),last=performance.now(),cancelled=false;
    const tick=()=>{
      if(cancelled)return;
      const now=performance.now();
      if(!paused&&!specialActive)remaining-=Math.max(0,now-last);
      last=now;
      if(remaining<=0){cancelled=true;fn();return;}
      const id=setTimeout(tick,Math.min(80,Math.max(20,remaining)));
      trackCrimsonTimeout(id);
    };
    const id=setTimeout(tick,Math.min(80,Math.max(20,remaining)));
    trackCrimsonTimeout(id);
    return()=>{cancelled=true;};
  }
  function clearCrimsonSpecialEffects(){
    crimsonSpecialIntervals.forEach(id=>clearInterval(id));crimsonSpecialIntervals=[];
    crimsonSpecialTimeouts.forEach(id=>clearTimeout(id));crimsonSpecialTimeouts=[];
    crimsonMoonShiftBusy=false;silverSpecialBusy=false;blueSpecialBusy=false;silverSnowballCycleToken++;silverBeastCycleToken++;
    document.body.classList.remove('crimson-straw-active','crimson-tengu-gust','crimson-steam-active','crimson-moon-shift-active','crimson-moon-shifting','crimson-genma-dim','crimson-genma-ready','crimson-genma-reveal','blue-sumo-active','blue-trail-block-active','blue-lantern-active','blue-lantern-dark','blue-return-bell-active','blue-endless-active','blue-endless-rewind','silver-snowball-active','silver-snowball-moving','silver-mirror-active','silver-beast-ring-active','silver-beast-ring-moving','silver-spotlight-active','silver-mimesis-active','silver-mimesis-flipping');
    // Cancel any in-flight FLIP animations from Vargas's snowball attack when a question ends,
    // a retry begins, or the battle scene is rebuilt. This prevents a stale animation from
    // re-enabling choices after the boss state has already changed.
    [...els.choices.children].forEach(b=>{try{b.getAnimations?.().forEach(a=>a.cancel());}catch{}b.style.removeProperty('z-index');b.style.removeProperty('will-change');});
    const panel=document.querySelector('.question-panel');if(panel)panel.classList.remove('crimson-special-panel','blue-special-panel','silver-special-panel');
    ['crimsonStrawLayer','crimsonSteamLayer','crimsonMoonFlash','blueClockEcho','silverBeastRingLayer','silverMimesisFlash'].forEach(id=>$(id)?.remove());
    document.querySelectorAll('.crimson-tengu-blown,.blue-trail-blocked,.blue-sumo-holding,.silver-beast-blocked,.silver-spotlit').forEach(b=>{b.classList.remove('crimson-tengu-blown','blue-trail-blocked','blue-sumo-holding','silver-beast-blocked','silver-spotlit');});
    document.querySelectorAll('[data-mirror-fake="true"]').forEach(b=>b.remove());
    [...els.choices.children].forEach(b=>{b.disabled=b.dataset.eliminated==='true';b.onpointerdown=null;b.onpointerup=null;b.onpointercancel=null;b.onpointerleave=null;b.oncontextmenu=null;});
    if(els.mathProblem){els.mathProblem.style.removeProperty('opacity');els.mathProblem.style.removeProperty('filter');}
  }
  function activeWrongChoiceButtons(){
    if(!currentQuestion)return[];
    return[...els.choices.children].filter(b=>b.dataset.eliminated!=='true'&&!answersEqual(b.dataset.answerValue??b.textContent,currentQuestion.answer));
  }
  function ensureCrimsonStrawLayer(){
    const panel=document.querySelector('.question-panel');if(!panel)return null;
    let layer=$('crimsonStrawLayer');if(layer)return layer;
    layer=document.createElement('div');layer.id='crimsonStrawLayer';layer.className='crimson-straw-layer';layer.setAttribute('aria-hidden','true');
    layer.innerHTML='<div class="crimson-straw-obscurer"><i></i><i></i><i></i><i></i><i></i><b></b></div>';
    panel.appendChild(layer);return layer;
  }
  function positionCrimsonStraw(target,visible=true){
    const layer=ensureCrimsonStrawLayer(),panel=document.querySelector('.question-panel'),cover=layer?.querySelector('.crimson-straw-obscurer');
    if(!layer||!panel||!cover)return;
    if(!target||!visible){cover.classList.remove('is-visible');return;}
    const pr=panel.getBoundingClientRect(),tr=target.getBoundingClientRect();
    const pad=Math.max(4,Math.min(10,tr.height*.08));
    cover.style.left=`${tr.left-pr.left-pad}px`;cover.style.top=`${tr.top-pr.top-pad}px`;
    cover.style.width=`${tr.width+pad*2}px`;cover.style.height=`${tr.height+pad*2}px`;
    cover.classList.add('is-visible');
  }
  function activeChoiceButtons(){
    return[...els.choices.children].filter(b=>b.dataset.eliminated!=='true');
  }
  function startCrimsonStrawCycle(){
    document.body.classList.add('crimson-straw-active');document.querySelector('.question-panel')?.classList.add('crimson-special-panel');
    let idx=0,soloCovered=true;
    const update=()=>{
      if(paused||specialActive||locked)return;
      const candidates=activeChoiceButtons();
      if(!candidates.length){positionCrimsonStraw(null,false);return;}
      if(candidates.length===1){soloCovered=!soloCovered;positionCrimsonStraw(candidates[0],soloCovered);return;}
      idx=(idx+1)%candidates.length;positionCrimsonStraw(candidates[idx],true);
    };
    const initial=activeChoiceButtons();if(initial.length)positionCrimsonStraw(initial[0],true);
    trackCrimsonInterval(setInterval(update,1750));
  }
  function startCrimsonTenguGust(){
    document.body.classList.add('crimson-tengu-gust');document.querySelector('.question-panel')?.classList.add('crimson-special-panel');
    let idx=-1;
    const blow=()=>{
      if(paused||specialActive||locked)return;
      const candidates=activeChoiceButtons();if(!candidates.length)return;
      document.querySelectorAll('.crimson-tengu-blown').forEach(b=>{b.classList.remove('crimson-tengu-blown');b.disabled=b.dataset.eliminated==='true';});
      idx=(idx+1)%candidates.length;const target=candidates[idx];
      target.classList.add('crimson-tengu-blown');target.disabled=true;
      trackCrimsonTimeout(setTimeout(()=>{
        target.classList.remove('crimson-tengu-blown');
        if(!locked&&!paused&&!specialActive&&target.dataset.eliminated!=='true')target.disabled=false;
      },900));
    };
    blow();trackCrimsonInterval(setInterval(blow,1450));
  }
  function ensureCrimsonSteamLayer(){
    const host=els.gameScreen||document.querySelector('.game-screen');if(!host)return null;
    let layer=$('crimsonSteamLayer');if(layer)return layer;
    layer=document.createElement('div');layer.id='crimsonSteamLayer';layer.className='crimson-steam-layer';layer.setAttribute('aria-hidden','true');
    layer.innerHTML='<i class="steam-a"></i><i class="steam-b"></i><i class="steam-c"></i><i class="steam-d"></i><i class="steam-e"></i><i class="steam-f"></i>';
    host.appendChild(layer);return layer;
  }
  function startCrimsonSteam(){ensureCrimsonSteamLayer();document.body.classList.add('crimson-steam-active');document.querySelector('.question-panel')?.classList.add('crimson-special-panel');}
  function ensureCrimsonMoonFlash(){
    const panel=document.querySelector('.question-panel');if(!panel)return null;
    let fx=$('crimsonMoonFlash');if(fx)return fx;
    fx=document.createElement('div');fx.id='crimsonMoonFlash';fx.className='crimson-moon-flash';fx.setAttribute('aria-hidden','true');panel.appendChild(fx);return fx;
  }
  async function rotateCrimsonChoices(){
    if(crimsonMoonShiftBusy||paused||specialActive||locked||!currentQuestion)return;
    const buttons=[...els.choices.children];if(buttons.length<2)return;
    crimsonMoonShiftBusy=true;document.body.classList.add('crimson-moon-shifting');
    buttons.forEach(b=>b.disabled=true);const fx=ensureCrimsonMoonFlash();if(fx){fx.classList.remove('active');void fx.offsetWidth;fx.classList.add('active');}
    await sleep(180);
    const first=els.choices.firstElementChild;if(first)els.choices.appendChild(first);
    await sleep(260);
    document.body.classList.remove('crimson-moon-shifting');
    if(fx)fx.classList.remove('active');
    [...els.choices.children].forEach(b=>{b.disabled=b.dataset.eliminated==='true';});
    crimsonMoonShiftBusy=false;updateSpecialHud();
  }
  function startCrimsonMoonShift(){
    ensureCrimsonMoonFlash();document.body.classList.add('crimson-moon-shift-active');document.querySelector('.question-panel')?.classList.add('crimson-special-panel');
    trackCrimsonInterval(setInterval(()=>{rotateCrimsonChoices();},1450));
  }
  async function showCrimsonGenmaSlash(){
    ensureBossSpecialFxLayer();const fx=$('bossStrikeTransition');if(!fx)return;
    hideSpecialHudForCutin();document.body.classList.add('boss-technique-active');
    try{
      $('bossStrikeKicker').textContent='FINAL STRIKE';$('bossStrikeTitle').textContent='無明の一閃';
      fx.hidden=false;fx.className='boss-strike-transition slash crimson-genma-slash';void fx.offsetWidth;playSE(cutinSE);fx.classList.add('active');
      await sleep(620);fx.classList.remove('active');await sleep(100);fx.hidden=true;
    }finally{document.body.classList.remove('boss-technique-active');restoreSpecialHudAfterCutin();}
  }
  async function startCrimsonGenmaFinal(){
    prepareQuestion();setBossStepChip(CRIMSON_LAST_SPECIAL.name,1);locked=true;[...els.choices.children].forEach(b=>b.disabled=true);updateSpecialHud();syncPauseButton();
    document.querySelector('.question-panel')?.classList.add('crimson-special-panel');
    document.body.classList.add('crimson-genma-ready');
    await sleep(520);await showCrimsonGenmaSlash();
    document.body.classList.add('boss-time-pressure');
    await announceTimeLimit(15);
    document.body.classList.remove('crimson-genma-ready','crimson-genma-dim');
    document.body.classList.add('crimson-genma-reveal');
    locked=false;[...els.choices.children].forEach(b=>{b.disabled=b.dataset.eliminated==='true';});syncPauseButton();updateSpecialHud();
    startTimer(15);
  }
  function nextSilverSnowballOrder(buttons){
    // With three answers, always use a cyclic permutation instead of a random shuffle that
    // can accidentally return the same order. Every cycle therefore produces visible travel.
    if(buttons.length===3)return Math.random()<.5?[buttons[1],buttons[2],buttons[0]]:[buttons[2],buttons[0],buttons[1]];
    let order=shuffle(buttons),same=order.every((b,i)=>b===buttons[i]);
    if(same&&order.length>1)order=[...order.slice(1),order[0]];
    return order;
  }
  function silverSnowballKeyframes(before,after,panel,index){
    const dx=before.left-after.left,dy=before.top-after.top;
    const horizontal=Math.abs(dx)>=Math.abs(dy);
    // Add a small arc perpendicular to the main travel direction. The amount is bounded by
    // the question panel's real spare space, so portrait phones do not throw a snowball out
    // of the GUI while desktop/tablet layouts still get a conspicuous crossing trajectory.
    let arcX=0,arcY=0;
    if(horizontal){
      const up=Math.max(0,Math.min(before.top,after.top)-panel.top-4);
      const down=Math.max(0,panel.bottom-Math.max(before.bottom,after.bottom)-4);
      const room=Math.max(up,down),sign=down>=up?1:-1;
      arcY=sign*Math.min(34,room*.72,Math.max(10,Math.abs(dx)*.13));
    }else{
      const left=Math.max(0,Math.min(before.left,after.left)-panel.left-4);
      const right=Math.max(0,panel.right-Math.max(before.right,after.right)-4);
      const room=Math.max(left,right),sign=(index%2===0?(right>=left?1:-1):(left>=right?-1:1));
      arcX=sign*Math.min(30,room*.72,Math.max(8,Math.abs(dy)*.09));
    }
    const spin=(index%2===0?1:-1)*360;
    return[
      {transform:`translate(${dx}px,${dy}px) rotate(0deg) scale(1)`,offset:0},
      {transform:`translate(${dx*.70+arcX}px,${dy*.70+arcY}px) rotate(${spin*.42}deg) scale(1.04)`,offset:.38},
      {transform:`translate(${dx*.30-arcX*.35}px,${dy*.30-arcY*.28}px) rotate(${spin*.78}deg) scale(.97)`,offset:.72},
      {transform:`translate(0px,0px) rotate(${spin}deg) scale(1)`,offset:1}
    ];
  }
  async function shuffleSilverChoices(){
    if(silverSpecialBusy||paused||specialActive||locked||!currentQuestion||!document.body.classList.contains('silver-snowball-active'))return;
    const buttons=[...els.choices.children].filter(b=>b.dataset.mirrorFake!=='true'&&b.dataset.eliminated!=='true');if(buttons.length<2)return;
    const token=silverSnowballCycleToken;
    const before=new Map(buttons.map(b=>[b,b.getBoundingClientRect()]));
    const order=nextSilverSnowballOrder(buttons);
    silverSpecialBusy=true;document.body.classList.add('silver-snowball-moving');buttons.forEach(b=>b.disabled=true);syncPauseButton();updateSpecialHud();
    // Move the real DOM nodes to their destination slots, then visually animate each one from
    // its previous slot to the new slot (FLIP). Because input is locked during the travel,
    // the clickable geometry can safely live at the destination while the snowball crosses it.
    order.forEach(b=>els.choices.appendChild(b));
    const panelRect=(document.querySelector('.question-panel')||els.choices).getBoundingClientRect();
    const animations=buttons.map((b,index)=>{
      const after=b.getBoundingClientRect(),from=before.get(b);
      b.style.willChange='transform';b.style.zIndex=String(10+index);
      try{return b.animate(silverSnowballKeyframes(from,after,panelRect,index),{duration:1750,easing:'cubic-bezier(.22,.72,.18,1)',fill:'none'});}catch{return null;}
    }).filter(Boolean);
    if(animations.length){
      await Promise.all(animations.map(a=>a.finished.catch(()=>{})));
    }else{
      await sleep(1750);
    }
    buttons.forEach(b=>{b.style.removeProperty('z-index');b.style.removeProperty('will-change');});
    if(token!==silverSnowballCycleToken||!document.body.classList.contains('silver-snowball-active'))return;
    document.body.classList.remove('silver-snowball-moving');silverSpecialBusy=false;restoreChoiceInteractivity();updateSpecialHud();syncPauseButton();
  }
  function startSilverSnowball(){
    silverSnowballCycleToken++;
    document.body.classList.add('silver-snowball-active');document.querySelector('.question-panel')?.classList.add('silver-special-panel');
    // About 1 second of stable tapping time follows each 1.75-second roll.
    trackCrimsonInterval(setInterval(()=>{shuffleSilverChoices();},2750));
  }
  function mirrorPenaltyButton(real){
    const fake=document.createElement('button');fake.type='button';fake.className='silver-mirror-fake';fake.dataset.mirrorFake='true';fake.dataset.answerValue=real.dataset.answerValue||'';fake.innerHTML=real.innerHTML;fake.setAttribute('aria-label','鏡像の偽物');
    fake.onclick=()=>{
      if(locked||paused||specialActive||fake.disabled)return;
      timeLeft=Math.max(1,timeLeft-3);els.timerText.textContent=timeLeft;updateTimerUrgency();
      fake.disabled=true;fake.classList.remove('mirror-shatter','mirror-vanished');void fake.offsetWidth;fake.classList.add('mirror-shatter');
      scheduleSilverActiveTimeout(()=>fake.classList.add('mirror-vanished'),360);
      scheduleSilverActiveTimeout(()=>{if(!fake.isConnected)return;fake.classList.remove('mirror-shatter','mirror-vanished');restoreChoiceInteractivity();},1180);
    };
    return fake;
  }
  function startSilverMirror(){
    document.body.classList.add('silver-mirror-active');document.querySelector('.question-panel')?.classList.add('silver-special-panel');
    const originals=[...els.choices.children];for(const b of originals)els.choices.appendChild(mirrorPenaltyButton(b));
    const mix=()=>{if(paused||specialActive||locked)return;const all=[...els.choices.children];for(const b of shuffle(all))els.choices.appendChild(b);};
    trackCrimsonInterval(setInterval(mix,2200));
  }
  function ensureSilverBeastRing(){
    const panel=document.querySelector('.question-panel');if(!panel)return null;let layer=$('silverBeastRingLayer');if(layer)return layer;
    layer=document.createElement('div');layer.id='silverBeastRingLayer';layer.className='silver-beast-ring-layer';layer.setAttribute('aria-hidden','true');
    layer.innerHTML='<i class="silver-ring fire-ring-a"></i><i class="silver-ring fire-ring-b"></i><span class="beast-shadow"></span><span class="beast-eyes"><i></i><i></i></span><span class="beast-claw"><i></i><i></i><i></i></span>';
    panel.appendChild(layer);return layer;
  }
  async function rotateSilverBeastRingChoices(){
    if(silverSpecialBusy||paused||specialActive||locked||!currentQuestion||!document.body.classList.contains('silver-beast-ring-active'))return;
    const buttons=[...els.choices.children].filter(b=>b.dataset.mirrorFake!=='true'&&b.dataset.eliminated!=='true');
    if(buttons.length<2)return;
    const token=silverBeastCycleToken;
    const before=new Map(buttons.map(b=>[b,b.getBoundingClientRect()]));
    // Always move the answers to a genuinely different position. Three choices rotate
    // cyclically; after the hero assist leaves two choices, swap those two.
    const order=buttons.length===3
      ? (Math.random()<.5?[buttons[1],buttons[2],buttons[0]]:[buttons[2],buttons[0],buttons[1]])
      : [...buttons.slice(1),buttons[0]];
    silverSpecialBusy=true;
    document.body.classList.add('silver-beast-ring-moving');
    buttons.forEach(b=>{b.disabled=true;b.style.willChange='transform';});
    for(const b of order)els.choices.appendChild(b);
    const animations=order.map((b,i)=>{
      const first=before.get(b),last=b.getBoundingClientRect();
      const dx=first.left-last.left,dy=first.top-last.top;
      const arc=(i%2===0?-1:1)*Math.min(30,Math.max(14,Math.abs(dx)*.10+8));
      return b.animate([
        {transform:`translate(${dx}px,${dy}px) rotate(0deg) scale(1)`,offset:0},
        {transform:`translate(${dx*.58}px,${dy*.58+arc}px) rotate(${i%2===0?-7:7}deg) scale(1.07)`,offset:.48},
        {transform:'translate(0px,0px) rotate(0deg) scale(1)',offset:1}
      ],{duration:900,easing:'cubic-bezier(.16,.78,.2,1)',fill:'both'});
    });
    const shadow=$('silverBeastRingLayer')?.querySelector('.beast-shadow');
    if(shadow){shadow.classList.remove('sweep');void shadow.offsetWidth;shadow.classList.add('sweep');}
    await Promise.allSettled(animations.map(a=>a.finished));
    if(token!==silverBeastCycleToken)return;
    buttons.forEach(b=>b.style.removeProperty('will-change'));
    if(shadow)shadow.classList.remove('sweep');
    document.body.classList.remove('silver-beast-ring-moving');
    silverSpecialBusy=false;
    restoreChoiceInteractivity();syncPauseButton();updateSpecialHud();
  }
  function startSilverBeastRing(){
    ensureSilverBeastRing();
    document.body.classList.add('silver-beast-ring-active');
    document.querySelector('.question-panel')?.classList.add('silver-special-panel');
    // The two shields are the defensive layer; the answer rotation remains the
    // distinctive circus trick so this does not become a recolored Crimson STAGE 3.
    trackCrimsonTimeout(setTimeout(()=>{rotateSilverBeastRingChoices();},900));
    trackCrimsonInterval(setInterval(()=>{rotateSilverBeastRingChoices();},2500));
  }
  function startSilverSpotlight(){
    document.body.classList.add('silver-spotlight-active');document.querySelector('.question-panel')?.classList.add('silver-special-panel');let idx=-1;
    const light=()=>{if(paused||specialActive||locked)return;const buttons=[...els.choices.children].filter(b=>b.dataset.eliminated!=='true');if(!buttons.length)return;idx=(idx+1)%buttons.length;buttons.forEach((b,i)=>{const on=i===idx;b.classList.toggle('silver-spotlit',on);b.disabled=!on;});};
    light();trackCrimsonInterval(setInterval(light,1050));
  }
  async function flipSilverMimesisChoices(demo=false){
    if(silverSpecialBusy||paused||specialActive||!currentQuestion)return;const buttons=[...els.choices.children];if(buttons.length<2)return;silverSpecialBusy=true;locked=true;buttons.forEach(b=>b.disabled=true);document.body.classList.add('silver-mimesis-flipping');
    let fx=$('silverMimesisFlash');if(!fx){fx=document.createElement('div');fx.id='silverMimesisFlash';fx.className='silver-mimesis-flash';document.querySelector('.question-panel')?.appendChild(fx);}fx.classList.remove('active');void fx.offsetWidth;fx.classList.add('active');
    await sleep(demo?520:300);for(const b of [...buttons].reverse())els.choices.appendChild(b);await sleep(demo?520:260);document.body.classList.remove('silver-mimesis-flipping');fx.classList.remove('active');locked=false;silverSpecialBusy=false;restoreChoiceInteractivity();updateSpecialHud();syncPauseButton();
  }
  async function startSilverMimesis(){
    document.body.classList.add('silver-mimesis-active');document.querySelector('.question-panel')?.classList.add('silver-special-panel');await flipSilverMimesisChoices(true);trackCrimsonInterval(setInterval(()=>{flipSilverMimesisChoices(false);},2400));
  }


  function startBlueSumo(){
    document.body.classList.add('blue-sumo-active');document.querySelector('.question-panel')?.classList.add('blue-special-panel');
    const HOLD_MS=800;
    [...els.choices.children].forEach(b=>{
      let holdId=null;
      const cancel=()=>{if(holdId){clearTimeout(holdId);holdId=null;}b.classList.remove('blue-sumo-holding');};
      b.onclick=null;
      b.oncontextmenu=e=>{e.preventDefault();return false;};
      b.onpointerdown=e=>{
        if(b.disabled||locked||paused||specialActive||blueSpecialBusy||!timerId)return;
        e.preventDefault();cancel();b.classList.add('blue-sumo-holding');
        holdId=setTimeout(()=>{
          holdId=null;b.classList.remove('blue-sumo-holding');
          if(b.disabled||locked||paused||specialActive||!timerId||!currentQuestion)return;
          resolveAnswer(b.dataset.answerValue??b.textContent,false);
        },HOLD_MS);
      };
      b.onpointerup=cancel;b.onpointercancel=cancel;b.onpointerleave=cancel;
    });
  }
  function startBlueTrailBlock(){
    document.body.classList.add('blue-trail-block-active');document.querySelector('.question-panel')?.classList.add('blue-special-panel');
    let idx=-1;
    const block=()=>{
      if(paused||specialActive||locked)return;
      const candidates=activeChoiceButtons();if(!candidates.length)return;
      document.querySelectorAll('.blue-trail-blocked').forEach(b=>b.classList.remove('blue-trail-blocked'));
      idx=(idx+1)%candidates.length;const target=candidates[idx];target.classList.add('blue-trail-blocked');restoreChoiceInteractivity();
      scheduleSilverActiveTimeout(()=>{target.classList.remove('blue-trail-blocked');restoreChoiceInteractivity();},1050);
    };
    block();trackCrimsonInterval(setInterval(block,1420));
  }
  async function pulseBlueLanternOut(){
    if(blueSpecialBusy||paused||specialActive||locked||!currentQuestion||!document.body.classList.contains('blue-lantern-active'))return;
    blueSpecialBusy=true;locked=true;const resume=timeLeft;stopTimer();document.body.classList.add('blue-lantern-dark');
    [...els.choices.children].forEach(b=>b.disabled=true);syncPauseButton();updateSpecialHud();
    await sleep(900);
    document.body.classList.remove('blue-lantern-dark');locked=false;blueSpecialBusy=false;restoreChoiceInteractivity();
    if(resume>0&&currentQuestion&&!gameOverActive)startTimer(resume,{preserveCountCue:true});else{syncPauseButton();updateSpecialHud();}
  }
  function startBlueLanternOut(){
    document.body.classList.add('blue-lantern-active');document.querySelector('.question-panel')?.classList.add('blue-special-panel');
    trackCrimsonTimeout(setTimeout(()=>{pulseBlueLanternOut();trackCrimsonInterval(setInterval(()=>{pulseBlueLanternOut();},4200));},2700));
  }
  function ensureBlueClockEcho(){
    const panel=document.querySelector('.question-panel');if(!panel)return null;let el=$('blueClockEcho');if(el)return el;
    el=document.createElement('div');el.id='blueClockEcho';el.className='blue-clock-echo';el.setAttribute('aria-hidden','true');panel.appendChild(el);return el;
  }
  function pulseBlueReturnBell(){
    if(paused||specialActive||locked||!currentQuestion||!document.body.classList.contains('blue-return-bell-active'))return;
    const parts=[...els.mathProblem.querySelectorAll('.blue-fade-fragment')];if(!parts.length)return;
    const visible=parts.filter(p=>!p.classList.contains('blue-fragment-gone'));const target=pick(visible.length?visible:parts);
    target.classList.add('blue-fragment-gone');
    const clock=ensureBlueClockEcho();if(clock){clock.textContent=pick(['17:00','17:30','18:00']);clock.classList.remove('active');void clock.offsetWidth;clock.classList.add('active');}
    scheduleSilverActiveTimeout(()=>{target.classList.remove('blue-fragment-gone');clock?.classList.remove('active');},1150);
  }
  function startBlueReturnBell(){
    document.body.classList.add('blue-return-bell-active');document.querySelector('.question-panel')?.classList.add('blue-special-panel');ensureBlueClockEcho();
    trackCrimsonTimeout(setTimeout(()=>{pulseBlueReturnBell();trackCrimsonInterval(setInterval(()=>{pulseBlueReturnBell();},4300));},2800));
  }
  async function showBlueEndlessReset(){
    document.body.classList.add('blue-endless-rewind');
    await showBossPhaseTransition('SUMMER REPEATS','まだ、おわらない','impact');
    document.body.classList.remove('blue-endless-rewind');
  }
  function startBlueEndlessSummer(){
    document.body.classList.add('blue-endless-active');document.querySelector('.question-panel')?.classList.add('blue-special-panel');
  }

  async function runBossFifthAction(){
    const spec=currentBossSpecial();
    ensureMonsterFx();ensureBossSpecialFxLayer();clearBossAction();locked=true;stopTimer();clearQuestionUi();
    if(!spec){await showActionCutin('enemy',currentBoss().img,{variant:'finisher',duration:1100});bossActionActive=false;bossSpecialSequence=null;prepareQuestion();startTimer(60);return;}
    // All boss techniques begin only after the existing enemy cut-in has fully finished.
    await showActionCutin('enemy',currentBoss().img,{variant:'finisher',duration:1480});
    bossActionActive=true;bossSpecialSequence={type:spec.type,step:'start'};
    await showBossTechnique(spec.name);
    switch(spec.type){
      case'obscure':{
        bossSpecialSequence={type:'obscure',step:'final'};
        configureBossObscurers(bossObscurerCount());document.body.classList.add('boss-obscure-active');
        prepareQuestion();setBossStepChip(spec.name,1);startTimer(60);break;
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
      case'crimson-straw':{
        bossSpecialSequence={type:'crimson-straw',step:'final'};prepareQuestion();setBossStepChip(spec.name,1);startCrimsonStrawCycle();startTimer(60);break;
      }
      case'crimson-gust':{
        bossSpecialSequence={type:'crimson-gust',step:'final'};prepareQuestion();setBossStepChip(spec.name,1);startCrimsonTenguGust();startTimer(60);break;
      }
      case'crimson-steam':{
        startCrimsonSteam();bossSpecialSequence={type:'crimson-steam',step:'shield1'};await showShieldForm();
        populateSpecialQuestion(makeBossQuestion(stageIndex),{chip:'湯煙結界・壱',step:1});startTimer(60);break;
      }
      case'crimson-time':{
        bossSpecialSequence={type:'crimson-time',step:'final'};document.body.classList.add('boss-time-pressure');await announceTimeLimit(spec.time);prepareQuestion();setBossStepChip(spec.name,1);startTimer(spec.time);break;
      }
      case'crimson-moon-shift':{
        bossSpecialSequence={type:'crimson-moon-shift',step:'final'};prepareQuestion();setBossStepChip(spec.name,1);startCrimsonMoonShift();startTimer(60);break;
      }
      case'silver-snowball':{
        bossSpecialSequence={type:'silver-snowball',step:'final'};prepareQuestion();setBossStepChip(spec.name,1);startSilverSnowball();startTimer(60);break;
      }
      case'silver-mirror':{
        bossSpecialSequence={type:'silver-mirror',step:'final'};prepareQuestion();setBossStepChip(spec.name,1);startSilverMirror();startTimer(60);break;
      }
      case'silver-beast-ring':{
        startSilverBeastRing();bossSpecialSequence={type:'silver-beast-ring',step:'shield1'};await showShieldForm();
        populateSpecialQuestion(makeBossQuestion(stageIndex),{chip:'火輪結界・壱',step:1});startTimer(60);break;
      }
      case'silver-spotlight':{
        bossSpecialSequence={type:'silver-spotlight',step:'final'};prepareQuestion();setBossStepChip(spec.name,1);startSilverSpotlight();startTimer(60);break;
      }
      case'silver-mimesis':{
        bossSpecialSequence={type:'silver-mimesis',step:'final'};prepareQuestion();setBossStepChip(spec.name,1);await startSilverMimesis();startTimer(60);break;
      }
      case'blue-sumo':{
        bossSpecialSequence={type:'blue-sumo',step:'final'};prepareQuestion();setBossStepChip(spec.name,1);startBlueSumo();startTimer(60);break;
      }
      case'blue-trail-block':{
        bossSpecialSequence={type:'blue-trail-block',step:'final'};prepareQuestion();setBossStepChip(spec.name,1);startBlueTrailBlock();startTimer(60);break;
      }
      case'blue-lantern-out':{
        bossSpecialSequence={type:'blue-lantern-out',step:'final'};prepareQuestion();setBossStepChip(spec.name,1);startBlueLanternOut();startTimer(60);break;
      }
      case'blue-return-bell':{
        bossSpecialSequence={type:'blue-return-bell',step:'final'};prepareQuestion();setBossStepChip(spec.name,1);startBlueReturnBell();startTimer(60);break;
      }
      case'blue-endless-summer':{
        bossSpecialSequence={type:'blue-endless-summer',step:'first',source:null};prepareQuestion();bossSpecialSequence.source=currentQuestion;setBossStepChip(spec.name,1);startBlueEndlessSummer();startTimer(60);break;
      }
      case'crimson-genma':{
        bossSpecialSequence={type:'crimson-genma',step:'final'};await startCrimsonGenmaFinal();break;
      }
    }
  }
  function clearBossAction(){
    clearCrimsonSpecialEffects();
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
    // The map is a preparation screen. A 0.55s guard prevents the press that opened
    // it from skipping it; after that, either the map itself or NEXT advances.
    await waitForMapAdvance();
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
    stopSE(sirenSE);stopSE(cutinSE);stopSE(breakSE);stopSE(frontFinisherSE);stopSE(backFinisherSE);stopSE(countSE);stopSE(start321SE);stopSE(start0SE);stopSE(clearSE);stopSE(cancelSE);resetRun();
    await transitionTo(()=>{showOnly(els.titleScreen);renderTitle();},mode==='back'?'back':'normal',1050);enqueuePendingSecretRelicNotices({showNow:true});
  }

  function showPauseMenu(){els.pauseMenu.hidden=false;els.pauseConfirm.hidden=true;}
  function showPauseConfirm(){els.pauseMenu.hidden=true;els.pauseConfirm.hidden=false;}
  function pauseGame(){
    if(paused||locked||silverSpecialBusy||crimsonMoonShiftBusy||blueSpecialBusy||specialActive||els.gameScreen.hidden||!timerId||!currentQuestion)return;
    pauseRestoreLocked=locked;pauseBgmShouldResume=!!(soundOn&&currentBgm&&!currentBgm.paused);
    paused=true;locked=true;stopTimer();
    if(currentBgm)try{currentBgm.pause();}catch{}
    [...els.choices.children].forEach(b=>b.disabled=true);
    document.body.classList.add('game-paused');showPauseMenu();els.pauseOverlay.hidden=false;syncPauseButton();
  }
  function resumeGame(){
    if(!paused)return;
    els.pauseOverlay.hidden=true;document.body.classList.remove('game-paused');paused=false;locked=pauseRestoreLocked;
    restoreChoiceInteractivity();
    if(pauseBgmShouldResume&&soundOn&&currentBgm)currentBgm.play().catch(()=>{});
    if(!locked&&currentQuestion&&timeLeft>0)startTimer(timeLeft,{preserveCountCue:true});else syncPauseButton();
    updateSpecialHud();
  }
  async function returnTitleFromPause(){
    if(!paused)return;
    els.pauseOverlay.hidden=true;document.body.classList.remove('game-paused');paused=false;locked=true;stopTimer();
    clearBossAction();clearMonsterAnnouncement();clearBattleFx();
    try{stageBgmPlayer.pause();stageBgmPlayer.currentTime=0;}catch{}currentBgm=null;
    stopSE(sirenSE);stopSE(cutinSE);stopSE(breakSE);stopSE(frontFinisherSE);stopSE(backFinisherSE);stopSE(countSE);stopSE(start321SE);stopSE(start0SE);stopSE(clearSE);stopSE(cancelSE);resetRun();
    await transitionTo(()=>{showOnly(els.titleScreen);renderTitle();},mode==='back'?'back':'normal',1050);enqueuePendingSecretRelicNotices({showNow:true});
  }

  async function startAdventure(){resetRun();primeStageBgm();await transitionTo(()=>{showOnly(els.gameScreen);prepareMapOverlay(true);},mode==='back'?'back':'normal',1500);await showMapSequence(true,true);}
  async function nextQuestion(){if(bossPhase){prepareQuestion();const spec=currentBossSpecial();startTimer(bossQuestion===4&&spec?.time?spec.time:60);}else{await beginNormalEncounter();}}

  async function resolveAnswer(value,timeout=false){
    if(locked)return;locked=true;stopTimer();updateSpecialHud();[...els.choices.children].forEach(b=>{b.disabled=true;const bv=b.dataset.answerValue??b.textContent;if(answersEqual(bv,currentQuestion.answer))b.classList.add('correct');if(value!==null&&answersEqual(bv,value)&&!answersEqual(value,currentQuestion.answer))b.classList.add('wrong');});
    const ok=!timeout&&answersEqual(value,currentQuestion.answer);
    if(ok&&bossPhase&&bossQuestion===4&&bossSpecialSequence){
      const seq=bossSpecialSequence;
      const intermediate=async(message)=>{els.feedbackText.textContent=message;showAnswerMark(true);playSE(correctSE);await sleep(520);};
      if(seq.type==='blue-endless-summer'&&seq.step==='first'){
        const first=seq.source||currentQuestion;
        els.feedbackText.textContent='せいかい！';showAnswerMark(true);
        runAttackMotion();await sleep(180);playSE(correctSE);await sleep(720);
        bossQuestion=5;renderGame();updateBossHpHud();
        await sleep(460);
        bossQuestion=4;renderGame();updateBossHpHud();
        await showBlueEndlessReset();
        bossSpecialSequence={type:'blue-endless-summer',step:'echo',source:first};
        populateSpecialQuestion(makeBlueEndlessEchoQuestion(first),{chip:'まだ、おわらない',step:2});
        startTimer(60,{preserveCountCue:true});return;
      }
      if(seq.type==='crimson-steam'&&seq.step==='shield1'){
        await intermediate('第一の湯煙結界を破壊！');await showShieldBreak();await sleep(120);await showShieldForm();
        bossSpecialSequence={type:'crimson-steam',step:'shield2'};populateSpecialQuestion(makeBossQuestion(stageIndex),{chip:'湯煙結界・弐',step:2});startTimer(60,{preserveCountCue:true});return;
      }
      if(seq.type==='crimson-steam'&&seq.step==='shield2'){
        await intermediate('第二の湯煙結界を破壊！');
        await showShieldBreak();
        await showBossPhaseTransition('CORE EXPOSED','コア露出','impact');
        bossSpecialSequence={type:'crimson-steam',step:'final'};
        populateSpecialQuestion(makeBossQuestion(stageIndex),{chip:'本撃',step:3});startTimer(60,{preserveCountCue:true});return;
      }
      if(seq.type==='silver-beast-ring'&&seq.step==='shield1'){
        await intermediate('第一の火輪結界を破壊！');await showShieldBreak();await sleep(120);await showShieldForm();
        bossSpecialSequence={type:'silver-beast-ring',step:'shield2'};
        populateSpecialQuestion(makeBossQuestion(stageIndex),{chip:'火輪結界・弐',step:2});startTimer(60,{preserveCountCue:true});return;
      }
      if(seq.type==='silver-beast-ring'&&seq.step==='shield2'){
        await intermediate('第二の火輪結界を破壊！');
        await showShieldBreak();
        await showBossPhaseTransition('CORE EXPOSED','コア露出','impact');
        bossSpecialSequence={type:'silver-beast-ring',step:'final'};
        populateSpecialQuestion(makeBossQuestion(stageIndex),{chip:'本撃',step:3});startTimer(60,{preserveCountCue:true});return;
      }
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
      const blueQ10Slow=mode==='blue'&&stageIndex===4&&!bossPhase&&stageQuestion===9;
      if(blueQ10Slow)els.heroActor.classList.add('blue-q10-slow');
      runAttackMotion();await sleep(180);playSE(correctSE);await sleep(blueQ10Slow?1370:720);els.heroActor.classList.remove('blue-q10-slow');totalProgress++;
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
    locked=true;stopTimer();clearQuestionUi();enemyVisualToken++;concealEnemyVisual(true);await stopBgmFade(900);
    if(isBlueStage5()){els.answerMark.hidden=true;await blueStage5BossBlackout();}
    bossPhase=true;bossQuestion=0;currentMonster=null;clearBossAction();unlockCurrentBossMusic();await showBossEntrance(false);
  }
  async function restartBossCheckpoint(){
    stopTimer();await stopBgmFade(600);clearBossAction();lives=3;bossPhase=true;bossQuestion=0;if(isBlueStage5())blueAdultState=true;totalProgress=stageIndex*15+10;unlockCurrentBossMusic();
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
    await showActionCutin('hero',mode==='front'?'hero.png':mode==='back'?'back_hero.png':mode==='crimson'?'crimson_hero.png':mode==='blue'?(isBlueAdultPhase()?'blue_hero_adult.png':'blue_hero.png'):'silver_hero.png');
    runFinisherMotion();
    await sleep(980);
    els.enemyActor.classList.add('boss-defeat');
    await sleep(2100);
    if(mode==='crimson'&&crimsonLastPhase){enemyVisualToken++;concealEnemyVisual(true);}
    els.enemyActor.classList.remove('boss-defeat','finisher-hit');
    els.heroActor.classList.remove('finisher-front','finisher-back');
    els.attackEffect.className='attack-effect';
    if(mode==='crimson'&&crimsonLastPhase){grantStageClearGold('crimson-last',15);await finishRun();return;}
    await clearStage();
  }

  function currentStageClearGold(){
    if(mode==='front')return stageIndex===4?10:3;
    if(mode==='back')return stageIndex===4?15:5;
    if(mode==='crimson')return 5;
    if(mode==='silver')return stageIndex===4?20:5;
    return 5;
  }
  function grantStageClearGold(key,reward){
    const amount=Math.max(0,Number(reward)||0);
    if(runStageRewards.has(key))return 0;
    runStageRewards.add(key);stats.gold+=amount;
    if(!debugFullUnlock){save.gold+=amount;persist();}
    return amount;
  }

  async function clearStage(){
    resetSpecialGauge();
    const stageGold=currentStageClearGold();
    grantStageClearGold(stageIndex,stageGold);
    const stageClearGold=$('stageClearGold');if(stageClearGold)stageClearGold.textContent=`＋${stageGold} G`;
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
      if(mode==='crimson'){await beginCrimsonLastBoss();return;}
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

  async function beginCrimsonLastBoss(){
    crimsonLastPhase=true;bossPhase=true;bossQuestion=0;currentMonster=null;currentQuestion=null;lives=3;clearBossAction();unlockCurrentBossMusic();
    await sceneBlackout(async()=>{showOnly(els.gameScreen);document.body.dataset.mode='crimson';document.body.dataset.stage='last';renderGame();clearQuestionUi();enemyVisualToken++;concealEnemyVisual(true);},{fadeIn:520,hold:220,fadeOut:700});
    await playStageBgm();await runBattleCountdown();await showBossEntrance(true,0);
  }
  async function finishRun(){
    stopTimer();await stopBgmFade(500);let reward=null;
    if(!debugFullUnlock){
      if(mode==='front'){save.frontClears++;if(!save.backUnlocked){save.backUnlocked=true;if(!save.owned.includes(100))save.owned.push(100);reward=ITEMS.find(i=>i.id===100);}else reward=randomReward();}
      else if(mode==='back'){save.backClears++;reward=randomReward();}
      else if(mode==='crimson'){save.crimsonClears=(save.crimsonClears||0)+1;reward=randomReward();}
      else if(mode==='blue'){save.blueClears=(save.blueClears||0)+1;reward=randomReward();}
      else{save.silverClears=(save.silverClears||0)+1;reward=randomReward();}
      persist();syncSecretRelics();
    }else renderTitle();
    renderResult();els.resultOverlay.hidden=false;
    if(reward){await sleep(600);presentRewardNotice({icon:reward.icon,name:reward.name,text:reward.id===100?'特別なアイテムを手に入れた！':'ゲームクリア報酬として、新しいコレクションアイテムを手に入れた！'});enqueuePendingSecretRelicNotices({showNow:false});}
    else enqueuePendingSecretRelicNotices({showNow:true});
  }
  function randomReward(){const unowned=ITEMS.filter(i=>!save.owned.includes(i.id)&&i.id!==100);if(!unowned.length)return null;const roll=Math.random(),rar=roll<.6?'common':roll<.9?'uncommon':'rare';let pool=unowned.filter(i=>i.rarity===rar);if(!pool.length)pool=unowned;const r=pick(pool);save.owned.push(r.id);persist();return r;}
  function renderResult(){els.resultMistakes.textContent=stats.mistakes;els.resultTimeouts.textContent=stats.timeouts;els.resultRestarts.textContent=stats.restarts;els.resultGold.textContent=`${stats.gold} G`;els.resultErrors.innerHTML=stats.errors.length?stats.errors.map(e=>`<div class="error-row"><b>${e.q}=?</b>　あなた: ${e.selected}　正解: ${e.answer}</div>`).join(''):'<div class="error-row">ミスはありませんでした！</div>';}

  if(els.mapVisual)els.mapVisual.onclick=advanceMapFromInput;
  if(els.mapNextBtn)els.mapNextBtn.onclick=advanceMapFromInput;

  els.musicBtn.onclick=()=>openMusicPlayer();
  els.musicCloseBtn.onclick=()=>closeMusicPlayer();
  els.musicOverlay.onclick=e=>{if(e.target===els.musicOverlay){playSE(cancelSE);closeMusicPlayer();}};
  els.musicFrontTab.onclick=()=>switchMusicWorld('front');
  els.musicBackTab.onclick=()=>{if(isMusicWorldVisible('back'))switchMusicWorld('back');};
  if(els.musicCrimsonTab)els.musicCrimsonTab.onclick=()=>{if(isCrimsonWorldUnlocked())switchMusicWorld('crimson');};
  if(els.musicBlueTab)els.musicBlueTab.onclick=()=>{if(isBlueWorldUnlocked())switchMusicWorld('blue');};
  if(els.musicSilverTab)els.musicSilverTab.onclick=()=>{if(isSilverWorldUnlocked())switchMusicWorld('silver');};
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
  if(els.worldWarpBtn)els.worldWarpBtn.onclick=async()=>{if(!canWorldWarp())return;await transitionTo(()=>{renderWorldWarp();showOnly(els.worldWarpScreen);},mode==='back'?'back':'normal',1300);};
  if(els.worldWarpBackBtn)els.worldWarpBackBtn.onclick=async()=>{await transitionTo(()=>{showOnly(els.titleScreen);renderTitle();},mode==='back'?'back':'normal',1200);};
  els.backWorldBtn.onclick=async()=>{await transitionTo(()=>{mode='back';renderTitle();showOnly(els.titleScreen);},'back',1700);};
  els.frontWorldBtn.onclick=async()=>{await transitionTo(()=>{mode='front';renderTitle();showOnly(els.titleScreen);},'normal',1700);};
  els.soundBtn.onclick=()=>{soundOn=!soundOn;els.soundBtn.textContent=`♪ ${soundOn?'ON':'OFF'}`;if(!soundOn){if(currentBgm)currentBgm.pause();[sirenSE,cutinSE,breakSE,frontFinisherSE,backFinisherSE,countSE,buttonSE,cancelSE,start321SE,start0SE,clearSE].forEach(stopSE);}else{playSE(buttonSE);if(currentBgm)currentBgm.play().catch(()=>{});}};
  els.pauseBtn.onclick=pauseGame;
  if(els.specialBtn)els.specialBtn.onclick=activateSpecialMove;
  els.pauseResumeBtn.onclick=resumeGame;
  els.pauseTitleBtn.onclick=showPauseConfirm;
  els.pauseCancelTitleBtn.onclick=showPauseMenu;
  els.pauseConfirmTitleBtn.onclick=returnTitleFromPause;
  els.gameOverRetryBtn.onclick=retryFromGameOver;
  els.gameOverTitleBtn.onclick=returnTitleFromGameOver;
  els.replayBtn.onclick=async()=>{resetRun();primeStageBgm();await transitionTo(()=>{els.resultOverlay.hidden=true;els.rewardOverlay.hidden=true;showOnly(els.gameScreen);prepareMapOverlay(true);},mode==='back'?'back':'normal',1500);await showMapSequence(true,true);};
  els.toTitleBtn.onclick=async()=>{await transitionTo(()=>{els.resultOverlay.hidden=true;els.rewardOverlay.hidden=true;showOnly(els.titleScreen);renderTitle();},mode==='back'?'back':'normal',1500);enqueuePendingSecretRelicNotices({showNow:true});};
  els.rewardOkBtn.onclick=()=>{els.rewardOverlay.hidden=true;const next=rewardFollowupQueue.shift();if(next)setTimeout(()=>presentRewardNotice(next),180);};

  const CANCEL_BUTTON_IDS=new Set([
    'shopBackBtn','collectionBackBtn','monsterBookBackBtn','monsterCardClose','musicCloseBtn','debugCloseBtn','frontWorldBtn','worldWarpBackBtn',
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
    setSpecialGauge(v){specialGauge=Math.max(0,Math.min(100,Number(v)||0));updateSpecialHud();},
    registerMonster,hasSecretRelic,syncSecretRelics,enqueuePendingSecretRelicNotices,enqueuePendingWorldUnlockNotices,isWorldActuallyUnlocked,isWorldMarkedNew,markWorldVisited,get save(){return save;},get debugFullUnlock(){return debugFullUnlock;},setDebugFullUnlock,openDebugPanel,debugJumpToStage,debugJumpToBossFifth,debugJumpToCrimsonLast,FRONT_MONSTERS,BACK_MONSTERS,CRIMSON_MONSTERS,BLUE_MONSTERS,SILVER_MONSTERS,FRONT_STAGES,BACK_STAGES,CRIMSON_STAGES,BLUE_STAGES,SILVER_STAGES,CRIMSON_LAST,makeCrimsonQuestion,makeBlueQuestion,makeBlueBossQuestion,makeBlueFinalBossQuestion,makeBlueEndlessEchoQuestion,makeSilverQuestion,makeSilverFinalBossQuestion,makeCrimsonFinalQuestion,musicTracks,renderMusicPlayer,MAP_TIPS,chooseMapTip,BOSS_SPECIALS,CRIMSON_LAST_SPECIAL,currentBossSpecial,clearCrimsonSpecialEffects,rotateCrimsonChoices,shuffleSilverChoices,rotateSilverBeastRingChoices,fitMathProblemToBox,restoreChoiceInteractivity,
    async beginNormal(){await beginNormalEncounter();},async enterBoss(){await enterBossPhase();},async bossAction(){await runBossFifthAction();},async restartBoss(){await restartBossCheckpoint();},async resolve(v,t=false){await resolveAnswer(v,t);},stop(){stopTimer();},setProgress(sq,tp,bq=0,bp=false){stageQuestion=sq;totalProgress=tp;bossQuestion=bq;bossPhase=bp;renderGame();}
  };

  window.addEventListener('resize',()=>requestAnimationFrame(()=>{fitVisibleNames();if(currentQuestion&&!els.gameScreen.hidden)fitMathProblemToBox(currentQuestion);}),{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(()=>{fitVisibleNames();if(currentQuestion&&!els.gameScreen.hidden)fitMathProblemToBox(currentQuestion);},80),{passive:true});
  if(document.fonts?.ready)document.fonts.ready.then(()=>fitVisibleNames()).catch(()=>{});

  initializeSecretRelics();
  initializeWorldUnlockState();
  installDebugSecretGesture();
  renderTitle();showOnly(els.titleScreen);enqueuePendingSecretRelicNotices({showNow:true});
})();
