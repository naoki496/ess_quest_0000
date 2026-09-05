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
  const SAVE_BACKUP_KEY='sansuQuestSave_v10_backup';
  const SAVE_CORRUPT_KEY='sansuQuestSave_v10_corrupt';
  const DEBUG_SESSION_KEY='sansuQuestDebugFullUnlock_v1';
  let debugFullUnlock=false;
  try{debugFullUnlock=sessionStorage.getItem(DEBUG_SESSION_KEY)==='1';}catch{}
  const DEFAULT_SAVE={gold:0,owned:[],frontClears:0,backClears:0,crimsonClears:0,blueClears:0,silverClears:0,midoriClears:0,endClears:0,whiteBestQuestions:0,whiteBestDepth:0,whiteAttempts:0,whiteTotalCorrect:0,whiteBeyondSeen:0,whiteBeyondCorrect:0,backUnlocked:false,monsterBook:{front:[],back:[],crimson:[],blue:[],silver:[],midori:[],end:[]},monsterEncounters:{front:{},back:{},crimson:{},blue:{},silver:{},midori:{},end:{}},musicUnlocked:{front:[],back:[],crimson:[],blue:[],silver:[],midori:[],end:[]},secretRelics:[],secretRelicNotified:[],secretRelicVersion:0,mapTipIntroIndex:0,mapSecretTipTierSeen:0,worldUnlockNotified:[],worldUnlockNew:[],worldUnlockVersion:0};
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
    {name:'都庁屋上',key:'backboss',count:15,normalCount:10,bossCount:5,bgm:'FUSE.mp3',bossBgm:'DUEL.mp3',bg:'back_boss.png',boss:['星晶魔導騎・アステリア','boss_back_5.png']}
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
    {name:'山と秘密基地',key:'blue2',count:15,normalCount:10,bossCount:5,bgm:'あの頃の秘密基地.mp3',bossBgm:'残夏.mp3',bg:'blue_stage2.png',boss:['秘密基地の蜂王・オオスズメ','boss_blue_2.png']},
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


  // 翠の世界：BGMと銃撃SEを実装済み。ボス固有技は後続実装。
  const MIDORI_STAGES=[
    {name:'出航の港島',key:'midori1',count:15,normalCount:10,bossCount:5,bgm:'departure.mp3',bossBgm:'Hard a starboard..mp3',bg:'midori_stage1_departure_port.png',boss:['港砦総督・ガレオン','boss_midori_1.png']},
    {name:'翠海の群島',key:'midori2',count:15,normalCount:10,bossCount:5,bgm:'Smooth sailing.mp3',bossBgm:'Hard a starboard..mp3',bg:'midori_stage2_emerald_archipelago.png',boss:['群島喰らい・アビスホエール','boss_midori_2.png']},
    {name:'翠深の遺跡島',key:'midori3',count:15,normalCount:10,bossCount:5,bgm:'LostItem.mp3',bossBgm:'Hard a starboard..mp3',bg:'midori_stage3_deep_ruins_island.png',boss:['翠刻巨像・オルディア','boss_midori_3.png']},
    {name:'黒帆大船団',key:'midori4',count:15,normalCount:10,bossCount:5,bgm:'fleet action.mp3',bossBgm:'Hard a starboard..mp3',bg:'midori_stage4_black_sail_fleet.png',boss:['黒帆大提督・ヴァルドレイク','boss_midori_4.png']},
    {name:'大渦の秘宝島',key:'midori5',count:15,normalCount:10,bossCount:5,bgm:'Enigma.mp3',bossBgm:'Poseidon.mp3',bg:'midori_stage5_maelstrom_treasure_island.png',boss:['渦海王・ネレイディオン','boss_midori_5.png']}
  ];

  // ---------- 終の世界 ----------
  // 正式背景・終版特殊技・専用主人公素材を使用。終専用BGM本体はassets配置前提。
  // 道中は各世界の既存ボス素材を通常敵として再利用し、本格特殊行動は発動しない。
  const END_REGION_CONFIG={
    midori:{name:'大時空支流',bg:'end_bg_time_river.png',bgm:'Hard a starboard..mp3',bossBgm:'BOSS CRASHER.mp3',boss:['終潮冥王・ネレイディオン',MIDORI_STAGES[4].boss[1]],baseBossName:MIDORI_STAGES[4].boss[0],bossEnglish:'ENDTIDE NETHER SOVEREIGN — NEREIDION',roadBosses:MIDORI_STAGES.slice(0,4).map(s=>s.boss)},
    crimson:{name:'浮遊黒曜要塞',bg:'end_bg_crimson.png',bgm:'乾坤一擲.mp3',bossBgm:'BOSS ASSAULT.mp3',boss:['終剣無明・玄真',CRIMSON_LAST.boss[1]],baseBossName:CRIMSON_LAST.boss[0],bossEnglish:'END-BLADE OF THE VOID — GENSHIN',roadBosses:CRIMSON_STAGES.map(s=>s.boss)},
    silver:{name:'銀鏡極彩色舞台',bg:'end_bg_silver.png',bgm:'CRAZY.mp3',bossBgm:'BOSS DAWN.mp3',boss:['終鏡模倣体・ミメシス',SILVER_STAGES[4].boss[1]],baseBossName:SILVER_STAGES[4].boss[0],bossEnglish:'END-MIRROR MIMETIC ENTITY — MIMESIS',roadBosses:SILVER_STAGES.slice(0,4).map(s=>s.boss)},
    back:{name:'儀式祭殿裏東京',bg:'end_bg_back.png',bgm:'boss.mp3',bossBgm:'BOSS DEFEAT.mp3',boss:['終星魔導皇・アステリア',BACK_STAGES[4].boss[1]],baseBossName:BACK_STAGES[4].boss[0],bossEnglish:'ENDSTAR ARCANE SOVEREIGN — ASTERIA',roadBosses:BACK_STAGES.slice(0,4).map(s=>s.boss)},
    blue:{name:'永劫夏界大迷宮',bg:'end_bg_blue.png',bgm:'残夏.mp3',bossBgm:'BOSS IGNITE.mp3',boss:['終劫残夏・トコナツ',BLUE_STAGES[4].boss[1]],baseBossName:BLUE_STAGES[4].boss[0],bossEnglish:'END-AEON SUMMER REMNANT — TOKONATSU',roadBosses:BLUE_STAGES.slice(0,4).map(s=>s.boss)}
  };
  const END_FINAL={name:'まおうの へや',key:'end-final',count:5,normalCount:0,bossCount:5,bgm:'BOSS EXTERMINATE.mp3',bossBgm:'BOSS EXTERMINATE.mp3',bg:'end_bg_final.png',boss:['ゆうしゃ','end_final_yuusha.png'],bossEnglish:'THE HERO',sourceWorld:'front',final:true};
  const END_HERO_FILES={front:'hero.png',back:'end_back_hero.png',crimson:'end_crimson_hero.png',blue:'end_blue_hero_adult.png',silver:'end_silver_hero.png',midori:'end_midori_hero.png'};
  const END_HERO_NAMES={front:'ゆうしゃ',back:'魔法少女',crimson:'流浪の剣士',blue:'青年',silver:'銀狼の少女',midori:'海賊船長'};
  const END_FINAL_HERO_ORDER=['back','crimson','blue','silver','midori'];
  let endFinalHeroOrder=[...END_FINAL_HERO_ORDER];
  let endRunRoute=['midori','crimson','silver','back','blue'],endHeroWorld='midori',endFinalPhase=false,endStageWarningIndex=-1;
  function newEndRoute(){return ['midori',...shuffle(['crimson','silver','back','blue'])];}
  function buildEndStages(route=endRunRoute){return route.map((sourceWorld,i)=>{const c=END_REGION_CONFIG[sourceWorld];return{name:c.name,key:`end-${sourceWorld}`,count:15,normalCount:10,bossCount:5,bgm:c.bgm,bossBgm:c.bossBgm,bg:c.bg,boss:c.boss,roadBosses:c.roadBosses,sourceWorld,endStage:i};});}
  function currentEndSource(){return endFinalPhase?'front':(endRunRoute[stageIndex]||'midori');}
  function currentEndHeroWorld(){return endFinalPhase?(endFinalHeroOrder[Math.max(0,Math.min(4,bossQuestion))]||'midori'):endHeroWorld;}
  function endRoadEntriesFor(sourceWorld,stage=0){const c=END_REGION_CONFIG[sourceWorld];return(c?.roadBosses||[]).map(([name,img],i)=>({id:`end-${sourceWorld}-road-${i+1}`,world:'end',sourceWorld,stage,rarity:5,name,img,boss:true,endPastBoss:true}));}
  function allEndMonsterEntries(){
    const entries=[];
    for(const sourceWorld of ['midori','crimson','silver','back','blue']){
      entries.push(...endRoadEntriesFor(sourceWorld,0));
      const c=END_REGION_CONFIG[sourceWorld];entries.push({id:`boss-end-${sourceWorld}`,world:'end',sourceWorld,stage:0,rarity:5,name:c.boss[0],img:c.boss[1],baseName:c.baseBossName||c.boss[0],english:c.bossEnglish||'',boss:true,endRegionBoss:true});
    }
    entries.push({id:'boss-end-final',world:'end',sourceWorld:'front',stage:5,rarity:5,name:'ゆうしゃ',img:END_FINAL.boss[1],boss:true,lastBoss:true,endFinalBoss:true});
    return entries;
  }
  const END_MONSTERS=allEndMonsterEntries();

  // ---------- 白の世界 ----------
  // ストーリー終了後のENDLESS CHALLENGE。既存6世界の記憶を背景/BGM/ボスとして再構成する。
  // 終の世界の敵・BGMは抽選対象外。通常9問 + Q10のランダムボスを1 DEPTHとする。
  const WHITE_BACKGROUND_POOL=[
    ...FRONT_STAGES.map(s=>s.bg),...BACK_STAGES.map(s=>s.bg),...CRIMSON_STAGES.map(s=>s.bg),CRIMSON_LAST.bg,
    ...BLUE_STAGES.map(s=>s.bg),...SILVER_STAGES.map(s=>s.bg),...MIDORI_STAGES.map(s=>s.bg)
  ];
  const WHITE_NORMAL_BGM_POOL=[...new Set([
    ...FRONT_STAGES.map(s=>s.bgm),...BACK_STAGES.map(s=>s.bgm),...CRIMSON_STAGES.map(s=>s.bgm),
    ...BLUE_STAGES.map(s=>s.bgm),...SILVER_STAGES.map(s=>s.bgm),...MIDORI_STAGES.map(s=>s.bgm)
  ])];
  const WHITE_BOSS_BGM_POOL=[...new Set([
    ...FRONT_STAGES.map(s=>s.bossBgm),...BACK_STAGES.map(s=>s.bossBgm),...CRIMSON_STAGES.map(s=>s.bossBgm),CRIMSON_LAST.bossBgm,
    ...BLUE_STAGES.map(s=>s.bossBgm),...SILVER_STAGES.map(s=>s.bossBgm),...MIDORI_STAGES.map(s=>s.bossBgm)
  ])];
  function whiteBossPool(){
    const result=[];
    const pushWorld=(world,stages)=>stages.forEach((st,i)=>result.push({id:`white-${world}-${i+1}`,world:'white',sourceWorld:world,sourceStage:i,name:st.boss[0],img:st.boss[1],boss:true,rarity:5,originalFinal:i===stages.length-1}));
    pushWorld('front',FRONT_STAGES);pushWorld('back',BACK_STAGES);pushWorld('crimson',CRIMSON_STAGES);pushWorld('blue',BLUE_STAGES);pushWorld('silver',SILVER_STAGES);pushWorld('midori',MIDORI_STAGES);
    result.push({id:'white-crimson-last',world:'white',sourceWorld:'crimson',sourceStage:5,name:CRIMSON_LAST.boss[0],img:CRIMSON_LAST.boss[1],boss:true,rarity:5,originalFinal:true,lastBoss:true});
    return result;
  }
  const WHITE_BOSS_POOL=whiteBossPool();
  let whiteDepth=1,whiteQuestionInDepth=0,whiteTotalCorrect=0,whiteCurrentBg=WHITE_BACKGROUND_POOL[0],whiteCurrentNormalBgm=WHITE_NORMAL_BGM_POOL[0],whiteCurrentBossBgm=WHITE_BOSS_BGM_POOL[0],whiteBoss=null;
  let whiteRecentBossIds=[],whiteRecentMonsterIds=[],whiteLastBg='',whiteLastNormalBgm='',whiteLastBossBgm='',whiteLastCategory='',whiteRecentTemplates=[];
  let whiteBeyondActive=false,whiteBeyondSeenRun=0,whiteBeyondCorrectRun=0,whiteBeyondUnlockShown=false;
  function pickNotSame(pool,last){const candidates=pool.filter(v=>v!==last);return pick(candidates.length?candidates:pool);}
  function chooseWhiteEnvironment(){
    whiteCurrentBg=pickNotSame(WHITE_BACKGROUND_POOL,whiteLastBg);whiteLastBg=whiteCurrentBg;
    whiteCurrentNormalBgm=pickNotSame(WHITE_NORMAL_BGM_POOL,whiteLastNormalBgm);whiteLastNormalBgm=whiteCurrentNormalBgm;
    whiteCurrentBossBgm=pickNotSame(WHITE_BOSS_BGM_POOL,whiteLastBossBgm);whiteLastBossBgm=whiteCurrentBossBgm;
  }
  function chooseWhiteBoss(){
    let pool=WHITE_BOSS_POOL.filter(b=>!whiteRecentBossIds.includes(b.id));if(!pool.length)pool=WHITE_BOSS_POOL;
    whiteBoss={...pick(pool)};whiteRecentBossIds.push(whiteBoss.id);if(whiteRecentBossIds.length>3)whiteRecentBossIds.shift();return whiteBoss;
  }
  function whiteCurrentStage(){return{name:`DEPTH ${whiteDepth}`,key:`white-${whiteDepth}`,count:10,normalCount:9,bossCount:1,bgm:whiteCurrentNormalBgm,bossBgm:whiteCurrentBossBgm,bg:whiteCurrentBg,boss:[whiteBoss?.name||'MEMORY BOSS',whiteBoss?.img||FRONT_STAGES[0].boss[1]]};}
  function whiteQuestionTime(depth=whiteDepth){if(depth<=2)return 60;if(depth===3)return 55;if(depth<=5)return 50;return 45;}
  function whiteBeyondRate(){if(whiteTotalCorrect<=50)return 0;if(whiteTotalCorrect<=70)return .05;if(whiteTotalCorrect<=90)return .10;return .15;}

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
    [['くろがねカブリン',1],['おおあごクワガタ',1],['そうげんトビトンボ',2],['ぴょこんアマガエル',2],['せせらぎザリガニ',3],['すすきのバッタ将',4],['天翔けるオニヤンマ',5]],
    [['ぶんぶんスズバチ',1],['いわかげアオヘビ',1],['からみ糸グモ',2],['じめりムカデラ',2],['猪突の山牙',3],['鎌脚のカマギリ',4],['翠羽のヤママユ',5]],
    [['きつね面こぞう',1],['ゆらぎ金魚灯',1],['提灯ぐも',2],['ぬけがら浴衣',2],['お面喰らい',3],['花火くらい',4],['祭囃子の面神',5]],
    [['ひとりブランコ',1],['すべり台こぞう',1],['かえり道の影ぼうし',2],['こくばん文字霊',2],['カチコチ時計霊',3],['夕暮れ遊具の影',4],['黄昏の帰宅者',5]],
    [['帰れない玄関',1],['だれもいない食卓',1],['ねむれぬ布団塚',2],['うすれた家族写真',2],['とざしたカーテン影',3],['終わらない宿題机',4],['散らかり部屋のヌシ',5]]
  ];
  const SILVER_MONSTER_NAMES=[
    [['ゆきころがし',1],['こおりツノウサギ',1],['しろがねオオカミ',2],['雪灯りの精',2],['氷牙トナカイ',3],['吹雪の白梟',4],['永久凍土の巨獣',5]],
    [['額縁こぞう',1],['雪像ネズミ',1],['絵具の亡霊',2],['氷像の兵士',2],['鏡写しの少女',3],['白磁の獣',4],['未完の名画',5]],
    [['ゆきつばめ',1],['氷柱コウモリ',1],['雪崩ヤギ',2],['霜羽ワシ',2],['氷壁の山霊',3],['吹雪竜',4],['白嶺の巨鳥',5]],
    [['玉乗りペンギン',1],['ラッパ雪だるま',1],['ジャグリングモンキー',2],['一輪車ゴブリン',2],['双子の道化',3],['白獅子の曲芸王',4],['凍れる象王',5]],
    [['壊れたマリオネット',1],['忘却の仮面',1],['空席の影',2],['糸繰り人形',2],['捨てられた道化師',3],['銀糸の操者',4],['終幕の獣',5]]
  ];


  const MIDORI_MONSTER_NAMES=[
    [['ころころタルン',1],['ロープスネーク',1],['はまべヤドカリ',2],['カモメの略奪兵',2],['錨喰らい',3],['波止場の用心棒',4],['金貨袋の怪盗',5]],
    [['ぷかぷかクラゲ',1],['とびうおランナー',1],['コーラルクラブ',2],['リーフマンタ',2],['渦巻きタコ兵',3],['岩礁の牙鮫',4],['翠潮の大海亀',5]],
    [['苔石コロリン',1],['ツタツタ人形',1],['遺跡翼獣ガルーダ',2],['翠紋ゴーレム',2],['千年石猿',3],['翠晶の祭壇守',4],['石碑の番虫',5]],
    [['黒帆甲板員',1],['砲撃手ガンナー',1],['火薬樽ボマー',2],['黒帆航海士',2],['双剣副長',3],['鉤爪水兵',4],['黒鉄砲撃長',5]],
    [['うずしおミミック',1],['深翠ヒトデ',1],['海底鎧兵',2],['宝珠クラゲ',2],['沈没船の船首像',3],['深海宝物守',4],['七海の亡霊船長',5]]
  ];
  function buildMonsterCatalog(raw,world){
    let id=0;return raw.flatMap((stageArr,stage)=>stageArr.map(([name,rarity])=>({id:`${world}-${++id}`,world,stage,rarity,name,img:`monster_${world}_${stage+1}_${rarity}_${id}.png`})));
  }
  const FRONT_MONSTERS=buildMonsterCatalog(FRONT_MONSTER_NAMES,'front');
  const BACK_MONSTERS=buildMonsterCatalog(BACK_MONSTER_NAMES,'back');
  const CRIMSON_MONSTERS=buildMonsterCatalog(CRIMSON_MONSTER_NAMES,'crimson');
  const BLUE_MONSTERS=buildMonsterCatalog(BLUE_MONSTER_NAMES,'blue');
  const SILVER_MONSTERS=buildMonsterCatalog(SILVER_MONSTER_NAMES,'silver');
  const MIDORI_MONSTERS=buildMonsterCatalog(MIDORI_MONSTER_NAMES,'midori');
  const WHITE_NORMAL_SOURCE_CATALOGS={
    front:FRONT_MONSTERS,back:BACK_MONSTERS,crimson:CRIMSON_MONSTERS,
    blue:BLUE_MONSTERS,silver:SILVER_MONSTERS,midori:MIDORI_MONSTERS
  };
  function chooseWhiteNormalMonster(rng=Math.random){
    const worlds=Object.keys(WHITE_NORMAL_SOURCE_CATALOGS);
    const sourceWorld=worlds[Math.floor(rng()*worlds.length)]||'front';
    const catalog=WHITE_NORMAL_SOURCE_CATALOGS[sourceWorld]||FRONT_MONSTERS;
    const rarity=rarityRoll(rng());
    let pool=catalog.filter(m=>m.rarity===rarity&&!whiteRecentMonsterIds.includes(m.id));
    if(!pool.length)pool=catalog.filter(m=>m.rarity===rarity);
    if(!pool.length)pool=catalog.filter(m=>!whiteRecentMonsterIds.includes(m.id));
    if(!pool.length)pool=catalog;
    const base=pool[Math.floor(rng()*pool.length)]||catalog[0];
    whiteRecentMonsterIds.push(base.id);
    if(whiteRecentMonsterIds.length>5)whiteRecentMonsterIds.shift();
    return{...base,id:`white-memory-${base.id}`,world:'white',sourceWorld,sourceMonsterId:base.id,whiteMemoryMonster:true};
  }
  const RARITY_WEIGHTS=[[1,.50],[2,.30],[3,.15],[4,.04],[5,.01]];


  const els={
    titleScreen:$('titleScreen'),shopScreen:$('shopScreen'),collectionScreen:$('collectionScreen'),monsterBookScreen:$('monsterBookScreen'),worldWarpScreen:$('worldWarpScreen'),gameScreen:$('gameScreen'),
    titleHero:$('titleHero'),titleSubtitle:$('titleSubtitle'),titleEyebrow:$('titleEyebrow'),titleGold:$('titleGold'),titleModeName:$('titleModeName'),titleTrackName:$('titleTrackName'),titleGradeGuide:$('titleGradeGuide'),
    playBtn:$('playBtn'),shopBtn:$('shopBtn'),collectionBtn:$('collectionBtn'),monsterBookBtn:$('monsterBookBtn'),worldWarpBtn:$('worldWarpBtn'),backWorldBtn:$('backWorldBtn'),frontWorldBtn:$('frontWorldBtn'),musicBtn:$('musicBtn'),debugBadge:$('debugBadge'),titleQuestionCount:$('titleQuestionCount'),
    musicOverlay:$('musicOverlay'),musicCloseBtn:$('musicCloseBtn'),musicWorldTabs:$('musicWorldTabs'),musicWorldStatus:$('musicWorldStatus'),musicWorldTitle:$('musicWorldTitle'),musicUnlockCount:$('musicUnlockCount'),musicUnlockFill:$('musicUnlockFill'),musicTrackList:$('musicTrackList'),musicNowTitle:$('musicNowTitle'),musicNowWhere:$('musicNowWhere'),musicElapsed:$('musicElapsed'),musicDuration:$('musicDuration'),musicSeek:$('musicSeek'),musicPrevBtn:$('musicPrevBtn'),musicPlayBtn:$('musicPlayBtn'),musicNextBtn:$('musicNextBtn'),musicStopBtn:$('musicStopBtn'),
    debugOverlay:$('debugOverlay'),debugStatus:$('debugStatus'),debugToggleBtn:$('debugToggleBtn'),debugStagePanel:$('debugStagePanel'),debugStageGrid:$('debugStageGrid'),debugCloseBtn:$('debugCloseBtn'),
    worldWarpList:$('worldWarpList'),worldWarpBackBtn:$('worldWarpBackBtn'),
    dataManagementScreen:$('dataManagementScreen'),dataManagementBtn:$('dataManagementBtn'),dataManagementBackBtn:$('dataManagementBackBtn'),dataStatusMain:$('dataStatusMain'),dataStatusBackup:$('dataStatusBackup'),dataStatusCorrupt:$('dataStatusCorrupt'),dataManagementNotice:$('dataManagementNotice'),dataDeleteBtn:$('dataDeleteBtn'),dataDeleteConfirm:$('dataDeleteConfirm'),dataDeleteCancelBtn:$('dataDeleteCancelBtn'),dataDeleteConfirmBtn:$('dataDeleteConfirmBtn'),
    shopGold:$('shopGold'),shopFilters:$('shopFilters'),shopList:$('shopList'),shopBackBtn:$('shopBackBtn'),
    collectionCount:$('collectionCount'),collectionGrid:$('collectionGrid'),collectionDetail:$('collectionDetail'),collectionBackBtn:$('collectionBackBtn'),
    monsterBookCount:$('monsterBookCount'),monsterBookFilters:$('monsterBookFilters'),monsterBookGrid:$('monsterBookGrid'),monsterBookBackBtn:$('monsterBookBackBtn'),monsterCardOverlay:$('monsterCardOverlay'),monsterCard:$('monsterCard'),monsterCardClose:$('monsterCardClose'),monsterCardRarity:$('monsterCardRarity'),monsterCardName:$('monsterCardName'),monsterCardImage:$('monsterCardImage'),monsterCardWorld:$('monsterCardWorld'),monsterCardStage:$('monsterCardStage'),monsterCardEncounter:$('monsterCardEncounter'),monsterCardText:$('monsterCardText'),
    progressText:$('progressText'),progressFill:$('progressFill'),stageLabel:$('stageLabel'),stageName:$('stageName'),lifeDisplay:$('lifeDisplay'),timerText:$('timerText'),soundBtn:$('soundBtn'),pauseBtn:$('pauseBtn'),hudModeToggleBtn:$('hudModeToggleBtn'),
    battleBg:$('battleBg'),heroActor:$('heroActor'),heroName:$('heroName'),heroImage:$('heroImage'),attackEffect:$('attackEffect'),heroLifeHud:$('heroLifeHud'),enemyRingHud:$('enemyRingHud'),enemyRingSegments:$('enemyRingSegments'),enemyRingText:$('enemyRingText'),enemyRingLabel:$('enemyRingLabel'),questionTimerHud:$('questionTimerHud'),questionTimerText:$('questionTimerText'),specialHud:$('specialHud'),specialBtn:$('specialBtn'),specialFill:$('specialFill'),bossHpHud:$('bossHpHud'),bossHpFill:$('bossHpFill'),enemyActor:$('enemyActor'),enemySprite:$('enemySprite'),enemyName:$('enemyName'),enemyImage:$('enemyImage'),answerMark:$('answerMark'),mathProblem:$('mathProblem'),feedbackText:$('feedbackText'),choices:$('choices'),
    mapOverlay:$('mapOverlay'),mapModeLabel:$('mapModeLabel'),mapTitle:$('mapTitle'),mapVisual:$('mapVisual'),mapImage:$('mapImage'),mapTipCategory:$('mapTipCategory'),mapTipText:$('mapTipText'),mapMessage:$('mapMessage'),mapNextBtn:$('mapNextBtn'),
    stageOverlay:$('stageOverlay'),stagePreview:$('stagePreview'),stageOverlayLabel:$('stageOverlayLabel'),stageOverlayName:$('stageOverlayName'),
    stageClearOverlay:$('stageClearOverlay'),stageClearName:$('stageClearName'),
    resultOverlay:$('resultOverlay'),resultMistakes:$('resultMistakes'),resultTimeouts:$('resultTimeouts'),resultRestarts:$('resultRestarts'),resultGold:$('resultGold'),resultErrors:$('resultErrors'),replayBtn:$('replayBtn'),toTitleBtn:$('toTitleBtn'),
    rewardOverlay:$('rewardOverlay'),rewardCard:$('rewardCard'),rewardKicker:$('rewardKicker'),rewardIcon:$('rewardIcon'),rewardName:$('rewardName'),rewardText:$('rewardText'),rewardOkBtn:$('rewardOkBtn'),transitionFx:$('transitionFx'),pauseOverlay:$('pauseOverlay'),pauseMenu:$('pauseMenu'),pauseConfirm:$('pauseConfirm'),pauseResumeBtn:$('pauseResumeBtn'),pauseTitleBtn:$('pauseTitleBtn'),pauseCancelTitleBtn:$('pauseCancelTitleBtn'),pauseConfirmTitleBtn:$('pauseConfirmTitleBtn'),battleCountdownOverlay:$('battleCountdownOverlay'),battleCountdownText:$('battleCountdownText'),gameOverOverlay:$('gameOverOverlay'),gameOverMessage:$('gameOverMessage'),gameOverReviewList:$('gameOverReviewList'),gameOverRetryBtn:$('gameOverRetryBtn'),gameOverTitleBtn:$('gameOverTitleBtn')
  };

  let mode='front',stageIndex=0,stageQuestion=0,totalProgress=0,lives=3,timeLeft=60,timerLimit=60,timerId=null,locked=true,soundOn=true,bossPhase=false,bossQuestion=0,currentMonster=null,bossActionActive=false,bossSpecialSequence=null,paused=false,pauseRestoreLocked=false,pauseBgmShouldResume=false,countCuePlayed=false,gameOverActive=false,specialGauge=0,comboStreak=0,specialActive=false,crimsonLastPhase=false;
  let crimsonSpecialIntervals=[],crimsonSpecialTimeouts=[],crimsonMoonShiftBusy=false,silverSpecialBusy=false,blueSpecialBusy=false,silverSnowballCycleToken=0,silverBeastCycleToken=0,blueMemoryDim=0,blueAdultState=false;
  let midoriSpecialState=null;
  let endSpecialTimers=[],endSpecialState=null,endFinalModifierTimer=null;
  let runStageRewards=new Set(),stats={mistakes:0,timeouts:0,restarts:0,errors:[],gold:0};
  let currentQuestion=null,currentBgm=null;
  const stageBgmPlayer=new Audio();
  stageBgmPlayer.loop=true;
  stageBgmPlayer.preload='auto';
  const musicPlayer=new Audio();
  musicPlayer.loop=true;
  musicPlayer.preload='auto';
  musicPlayer.volume=.38;
  let musicWorld='front',musicSelectedWorld='front',musicTrackIndex=-1;
  const correctSE=new Audio('./assets/correct.mp3'),wrongSE=new Audio('./assets/wrong.mp3');
  const swordSE=new Audio('./assets/sword_a.mp3'),magicSE=new Audio('./assets/mahou_a.mp3'),gunSE=new Audio('./assets/gun.mp3');
  // 翠の通常射撃は gun.mp3、ボス最終撃破時だけ bom.mp3 を使用する。
  // bom.mp3 は既存 GitHub assets を参照し、差分ZIPへ重複収録しない。
  const midoriFinisherSE=new Audio('./assets/bom.mp3');
  const sirenSE=new Audio('./assets/siren.mp3'),cutinSE=new Audio('./assets/cutin.mp3');
  const endCorruptionNoiseSE=new Audio('./assets/end_corruption_noise.mp3');endCorruptionNoiseSE.volume=.56;
  const breakSE=new Audio('./assets/break.mp3');
  const frontFinisherSE=new Audio('./assets/omote_h.mp3'),backFinisherSE=new Audio('./assets/ura_h.mp3');
  const countSE=new Audio('./assets/count.mp3'),buttonSE=new Audio('./assets/button.mp3');
  const cancelSE=new Audio('./assets/cancel.mp3'),start321SE=new Audio('./assets/start_321.mp3'),start0SE=new Audio('./assets/start_0.mp3'),clearSE=new Audio('./assets/clear.mp3');
  gunSE.preload='auto';midoriFinisherSE.preload='auto';
  [sirenSE,cutinSE,endCorruptionNoiseSE,breakSE,frontFinisherSE,backFinisherSE,countSE,buttonSE,cancelSE,start321SE,start0SE,clearSE].forEach(a=>a.preload='auto');

  // BGM collection: only tracks already used by the current game are listed.
  // Title-screen tracks are deliberately excluded until the title BGM issue is resolved.
  function musicTracks(world){
    if(world==='end'){
      // 終の世界では、道中旧ボス曲は元世界のBGMページで聴けるため重複掲載しない。
      // ここでは終専用の領域ボス5曲＋FINALだけを独立した音楽集として扱う。
      const defs=[
        ['midori-boss','翠・終界ボス','BOSS CRASHER.mp3','大時空支流の終界ボス戦。'],
        ['crimson-boss','紅・終界ボス','BOSS ASSAULT.mp3','浮遊黒曜要塞の終界ボス戦。'],
        ['blue-boss','蒼・終界ボス','BOSS IGNITE.mp3','永劫夏界大迷宮の終界ボス戦。'],
        ['silver-boss','銀・終界ボス','BOSS DAWN.mp3','銀鏡極彩色舞台の終界ボス戦。'],
        ['back-boss','裏・終界ボス','BOSS DEFEAT.mp3','儀式祭殿裏東京の終界ボス戦。'],
        ['final','FINAL','BOSS EXTERMINATE.mp3','FINAL「まおうの へや」のラスボス戦。']
      ];
      return defs.map(([id,label,file,where])=>({id,file,label,title:file.replace(/\.mp3$/i,''),where:`終の世界 ${where}`}));
    }
    const stages=world==='front'?FRONT_STAGES:world==='back'?BACK_STAGES:world==='crimson'?CRIMSON_STAGES:world==='blue'?BLUE_STAGES:world==='silver'?SILVER_STAGES:MIDORI_STAGES;
    const worldLabel=world==='front'?'光の世界':world==='back'?'裏の世界':world==='crimson'?'紅の世界':world==='blue'?'蒼の世界':world==='silver'?'銀の世界':'翠の世界';
    const normal=stages.map((st,i)=>({id:`stage-${i+1}`,file:st.bgm,label:`STAGE ${i+1}`,title:st.bgm.replace(/\.mp3$/i,''),where:`${worldLabel} STAGE ${i+1}「${st.name}」の通常戦闘で流れるBGM。`}));
    const bossWhere=world==='front'?'光の世界 STAGE 1～4のボス戦で流れる共通BGM。':world==='back'?'裏の世界 STAGE 1～4のボス戦で流れる共通BGM。':world==='crimson'?'紅の世界 STAGE 1～5のボス戦で流れる共通BGM。':world==='blue'?'蒼の世界 STAGE 1～4のボス戦で流れる共通BGM。':world==='silver'?'銀の世界 STAGE 1～4のボス戦で流れる共通BGM。':'翠の世界 STAGE 1～4のボス戦で流れる共通BGM。';
    const finalStage=stages[4];
    return [...normal,{id:'boss',file:stages[0].bossBgm,label:'BOSS',title:stages[0].bossBgm.replace(/\.mp3$/i,''),where:bossWhere},{id:'final',file:world==='crimson'?CRIMSON_LAST.bossBgm:finalStage.bossBgm,label:'LAST BOSS',title:(world==='crimson'?CRIMSON_LAST.bossBgm:finalStage.bossBgm).replace(/\.mp3$/i,''),where:world==='crimson'?'紅の世界 LAST BOSS「秋尽の剣聖・玄真」で流れるBGM。':`${worldLabel} STAGE 5「${finalStage.name}」の最終ボス戦で流れるBGM。`}];
  }
  function inferMusicUnlocksFromSave(target){
    target.musicUnlocked=target.musicUnlocked||{front:[],back:[],crimson:[],blue:[],silver:[],midori:[],end:[]};
    for(const world of ['front','back','crimson','blue','silver','midori','end']){
      const list=Array.isArray(target.musicUnlocked[world])?target.musicUnlocked[world]:[];
      const set=new Set(list);
      const book=target.monsterBook?.[world]||[];
      if(world==='end'){
        for(const id of book){const m=id.match(/^end-(midori|crimson|silver|back|blue)-road-/);if(m)set.add(`${m[1]}-normal`);const b=id.match(/^boss-end-(midori|crimson|silver|back|blue)$/);if(b)set.add(`${b[1]}-boss`);if(id==='boss-end-final')set.add('final');}
        if((target.endClears||0)>0)for(const t of musicTracks('end'))set.add(t.id);target.musicUnlocked.end=[...set];continue;
      }
      for(const id of book){
        const normal=id.match(new RegExp(`^${world}-(\\d+)$`));
        if(normal){const n=Number(normal[1]);const stage=Math.floor((n-1)/7)+1;if(stage>=1&&stage<=5)set.add(`stage-${stage}`);}
        const boss=id.match(new RegExp(`^boss-${world}-(\\d+)$`));
        if(boss){const stage=Number(boss[1]);set.add(`stage-${stage}`);set.add(world==='crimson'?'boss':(stage===5?'final':'boss'));}
        if(world==='crimson'&&id==='boss-crimson-last')set.add('final');
      }
      if((world==='front'&&(target.frontClears>0||target.backUnlocked))||(world==='back'&&target.backClears>0)||(world==='crimson'&&target.crimsonClears>0)||(world==='blue'&&target.blueClears>0)||(world==='silver'&&target.silverClears>0)||(world==='midori'&&target.midoriClears>0)){
        for(let i=1;i<=5;i++)set.add(`stage-${i}`);set.add('boss');set.add('final');
      }
      target.musicUnlocked[world]=[...set];
    }
  }
  function isMusicUnlocked(world,id){return debugFullUnlock||!!save.musicUnlocked?.[world]?.includes(id);}
  function unlockMusic(world,id){
    if(debugFullUnlock)return false;
    if(!save.musicUnlocked)save.musicUnlocked={front:[],back:[],crimson:[],blue:[],silver:[],midori:[],end:[]};
    if(!Array.isArray(save.musicUnlocked[world]))save.musicUnlocked[world]=[];
    if(save.musicUnlocked[world].includes(id))return false;
    save.musicUnlocked[world].push(id);
    persistQuietly();
    return true;
  }
  function unlockCurrentStageMusic(){return mode==='end'?false:unlockMusic(mode,`stage-${stageIndex+1}`);}
  function unlockCurrentBossMusic(){if(mode==='end')return unlockMusic('end',endFinalPhase?'final':`${currentEndSource()}-boss`);return unlockMusic(mode,mode==='crimson'?(crimsonLastPhase?'final':'boss'):(stageIndex===4?'final':'boss'));}

  // The hit effect belongs to the battlefield, not to the hero actor.  Keeping it
  // outside the hero's coordinate system lets sword/magic impacts land on the enemy.
  const battlefield=document.querySelector('.battlefield');
  if(battlefield&&els.attackEffect?.parentElement!==battlefield)battlefield.appendChild(els.attackEffect);

  function normalizeSave(raw={}){
    const merged={...DEFAULT_SAVE,...raw};
    merged.owned=Array.isArray(raw.owned)?raw.owned:[100];
    merged.monsterBook={front:Array.isArray(raw.monsterBook?.front)?raw.monsterBook.front:[],back:Array.isArray(raw.monsterBook?.back)?raw.monsterBook.back:[],crimson:Array.isArray(raw.monsterBook?.crimson)?raw.monsterBook.crimson:[],blue:Array.isArray(raw.monsterBook?.blue)?raw.monsterBook.blue:[],silver:Array.isArray(raw.monsterBook?.silver)?raw.monsterBook.silver:[],midori:Array.isArray(raw.monsterBook?.midori)?raw.monsterBook.midori:[],end:Array.isArray(raw.monsterBook?.end)?raw.monsterBook.end:[]};
    merged.monsterEncounters={front:{...(raw.monsterEncounters?.front||{})},back:{...(raw.monsterEncounters?.back||{})},crimson:{...(raw.monsterEncounters?.crimson||{})},blue:{...(raw.monsterEncounters?.blue||{})},silver:{...(raw.monsterEncounters?.silver||{})},midori:{...(raw.monsterEncounters?.midori||{})},end:{...(raw.monsterEncounters?.end||{})}};
    merged.musicUnlocked={front:Array.isArray(raw.musicUnlocked?.front)?raw.musicUnlocked.front:[],back:Array.isArray(raw.musicUnlocked?.back)?raw.musicUnlocked.back:[],crimson:Array.isArray(raw.musicUnlocked?.crimson)?raw.musicUnlocked.crimson:[],blue:Array.isArray(raw.musicUnlocked?.blue)?raw.musicUnlocked.blue:[],silver:Array.isArray(raw.musicUnlocked?.silver)?raw.musicUnlocked.silver:[],midori:Array.isArray(raw.musicUnlocked?.midori)?raw.musicUnlocked.midori:[],end:Array.isArray(raw.musicUnlocked?.end)?raw.musicUnlocked.end:[]};
    merged.secretRelics=Array.isArray(raw.secretRelics)?raw.secretRelics:[];
    merged.secretRelicNotified=Array.isArray(raw.secretRelicNotified)?raw.secretRelicNotified:[];
    merged.secretRelicVersion=Number.isFinite(Number(raw.secretRelicVersion))?Number(raw.secretRelicVersion):0;
    merged.mapTipIntroIndex=Math.max(0,Number(raw.mapTipIntroIndex)||0);
    merged.mapSecretTipTierSeen=Math.max(0,Number(raw.mapSecretTipTierSeen)||0);
    merged.worldUnlockNotified=Array.isArray(raw.worldUnlockNotified)?raw.worldUnlockNotified:[];
    merged.worldUnlockNew=Array.isArray(raw.worldUnlockNew)?raw.worldUnlockNew:[];
    merged.worldUnlockVersion=Math.max(0,Number(raw.worldUnlockVersion)||0);
    merged.whiteBestQuestions=Math.max(0,Number(raw.whiteBestQuestions)||0);
    merged.whiteBestDepth=Math.max(0,Number(raw.whiteBestDepth)||0);
    merged.whiteAttempts=Math.max(0,Number(raw.whiteAttempts)||0);
    merged.whiteTotalCorrect=Math.max(0,Number(raw.whiteTotalCorrect)||0);
    merged.whiteBeyondSeen=Math.max(0,Number(raw.whiteBeyondSeen)||0);
    merged.whiteBeyondCorrect=Math.max(0,Number(raw.whiteBeyondCorrect)||0);
    inferMusicUnlocksFromSave(merged);
    return merged;
  }
  function parseStoredSave(raw){
    if(typeof raw!=='string'||!raw.trim())return null;
    try{const value=JSON.parse(raw);return value&&typeof value==='object'&&!Array.isArray(value)?value:null;}catch{return null;}
  }
  function freshSave(){return normalizeSave({});}
  function loadSave(){
    try{
      const mainRaw=localStorage.getItem(STORAGE_KEY),main=parseStoredSave(mainRaw);
      if(main){
        const backupRaw=localStorage.getItem(SAVE_BACKUP_KEY);
        if(!parseStoredSave(backupRaw))try{localStorage.setItem(SAVE_BACKUP_KEY,mainRaw);}catch{}
        return normalizeSave(main);
      }
      if(mainRaw!==null){
        try{localStorage.setItem(SAVE_CORRUPT_KEY,mainRaw);}catch{}
        const backupRaw=localStorage.getItem(SAVE_BACKUP_KEY),backup=parseStoredSave(backupRaw);
        if(backup){try{localStorage.setItem(STORAGE_KEY,backupRaw);}catch{}return normalizeSave(backup);}
      }
      const backupRaw=localStorage.getItem(SAVE_BACKUP_KEY),backup=parseStoredSave(backupRaw);
      if(backup){try{localStorage.setItem(STORAGE_KEY,backupRaw);}catch{}return normalizeSave(backup);}
    }catch{}
    return freshSave();
  }
  function writeSaveSnapshot(){
    if(debugFullUnlock)return;
    try{
      const existing=localStorage.getItem(STORAGE_KEY);
      if(parseStoredSave(existing))localStorage.setItem(SAVE_BACKUP_KEY,existing);
      localStorage.setItem(STORAGE_KEY,JSON.stringify(save));
    }catch{}
  }
  function persist(){writeSaveSnapshot();renderTitle();}
  function persistQuietly(){writeSaveSnapshot();}
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
    if(world==='midori')return isMidoriWorldUnlocked();
    if(world==='end')return isEndWorldUnlocked();
    if(world==='white')return isWorldActuallyUnlocked('white');
    return false;
  }
  function isCrimsonWorldUnlocked(){return debugFullUnlock||hasSecretRelic('common_master');}
  function isBlueWorldUnlocked(){return debugFullUnlock||(hasSecretRelic('front_sr_master')&&hasSecretRelic('world3_sr_master'));}
  function isSilverWorldUnlocked(){return debugFullUnlock||(hasSecretRelic('uncommon_master')&&hasSecretRelic('front_ssr_master'));}
  function isMidoriWorldUnlocked(){return debugFullUnlock||(hasSecretRelic('back_sr_master')&&hasSecretRelic('world4_sr_master')&&hasSecretRelic('blue_sr_master'));}
  function isEndWorldUnlocked(){return debugFullUnlock||(['rare_master','back_ssr_master','world3_ssr_master','midori_sr_arcenciel'].every(hasSecretRelic));}
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
  {id:'world4_ssr_master',name:'コランダムギア',icon:'⚙️',flavor:'銀の世界の SSRモンスターを すべて見つけた証。',notice:'銀の世界の SSRモンスターを すべて見つけた証。'},
  // 翠で新規に得る将来解放用SECRET。既存IDを流用・意味変更しない。
  {id:'midori_sr_arcenciel',name:'アルカンシェル',icon:'🌈',flavor:'翠の世界の SRモンスターを すべて見つけた証。',notice:'翠の世界の SRモンスターを すべて見つけた証。'},
  {id:'midori_ssr_singularity',name:'特異点座標',icon:'⌖',flavor:'翠の世界の SSRモンスターを すべて見つけた証。',notice:'翠の世界の SSRモンスターを すべて見つけた証。'},
  {id:'end_clear_broken_sword',name:'折れた聖剣',icon:'⚔️',flavor:'時空河の最深部で「ゆうしゃ」を退けたあとに残された、砕けた聖剣。白の世界へ至るための証のひとつ。',notice:'終の世界を踏破した証。玉座に残された「折れた聖剣」を手に入れた。'},
  {id:'end_book_graduation',name:'卒業証書',icon:'📜',flavor:'終の世界に現れるすべての強敵と出会い、時空河の図鑑を完成させた証。',notice:'終の世界のモンスター図鑑を完成させた証。'}
];
const SECRET_RELIC_VERSION=6;
const WORLD_UNLOCK_VERSION=6;
const WORLD_UNLOCKS=[
  {world:'back',sourceId:'item-100',sourceName:'時空の鍵',name:'裏の世界',desc:'時空の裂け目に広がる、もうひとつの世界'},
  {world:'crimson',sourceId:'common_master',sourceName:'妖刀マサムネ',name:'紅の世界',desc:'妖怪と剣客が息づく、晩秋に染まった世界'},
  {world:'blue',sourceIds:['front_sr_master','world3_sr_master'],sourceName:'蒼穹の縁結びと黄泉の供物',name:'蒼の世界',desc:'ひと夏の記憶をたどる、蒼い夏の世界'},
  {world:'silver',sourceIds:['uncommon_master','front_ssr_master'],sourceName:'白銀の首輪と時空羅針盤',name:'銀の世界',desc:'永遠の雪と静寂に閉ざされた、白銀の世界'},
  {world:'midori',sourceIds:['back_sr_master','world4_sr_master','blue_sr_master'],sourceName:'クリプティック・コード、未来の結晶、鋼の黙示録',name:'翠の世界',desc:'島々と大船団を越えて進む、翠の海の世界'},
  {world:'end',sourceIds:['rare_master','back_ssr_master','world3_ssr_master','midori_sr_arcenciel'],sourceName:'オブシディアンコア、旅立ちを祝すハルシオン、黒曜城、アルカンシェル',name:'終の世界',desc:'すべての支流が再び集まる、時空河の根源'},
  {world:'white',sourceIds:['world4_ssr_master','blue_ssr_master','midori_ssr_singularity','end_clear_broken_sword'],sourceName:'コランダムギア、トータルイクリプス、特異点座標、折れた聖剣',name:'白の世界',desc:'物語のその先で、自分の限界へ挑み続ける白い試練'}
];
const secretRelicById=id=>SECRET_RELICS.find(r=>r.id===id);
function hasSecretRelic(id){return debugFullUnlock||!!save.secretRelics?.includes(id);}
function isWorldActuallyUnlocked(world){
  if(debugFullUnlock)return true;
  if(world==='front')return true;
  if(world==='back')return !!save.backUnlocked;
  if(world==='crimson')return !!save.secretRelics?.includes('common_master');
  if(world==='blue')return !!save.secretRelics?.includes('front_sr_master')&&!!save.secretRelics?.includes('world3_sr_master');
  if(world==='silver')return !!save.secretRelics?.includes('uncommon_master')&&!!save.secretRelics?.includes('front_ssr_master');
  if(world==='midori')return !!save.secretRelics?.includes('back_sr_master')&&!!save.secretRelics?.includes('world4_sr_master')&&!!save.secretRelics?.includes('blue_sr_master');
  if(world==='end')return ['rare_master','back_ssr_master','world3_ssr_master','midori_sr_arcenciel'].every(id=>!!save.secretRelics?.includes(id));
  if(world==='white')return ['world4_ssr_master','blue_ssr_master','midori_ssr_singularity','end_clear_broken_sword'].every(id=>!!save.secretRelics?.includes(id));
  return false;
}
function worldUnlockByKey(world){return WORLD_UNLOCKS.find(w=>w.world===world);}
function ownsItemRange(from,to){for(let id=from;id<=to;id++)if(!save.owned.includes(id))return false;return true;}
function ownsMonsterRaritySet(world,rarity){
  const catalog=world==='front'?FRONT_MONSTERS:world==='back'?BACK_MONSTERS:world==='crimson'?CRIMSON_MONSTERS:world==='blue'?BLUE_MONSTERS:world==='silver'?SILVER_MONSTERS:MIDORI_MONSTERS;
  const targets=catalog.filter(m=>m.rarity===rarity);
  const seen=new Set(save.monsterBook?.[world]||[]);
  return targets.length>0&&targets.every(m=>seen.has(m.id));
}
function isEndMonsterBookComplete(){
  const seen=new Set(save.monsterBook?.end||[]);
  return END_MONSTERS.length>0&&END_MONSTERS.every(m=>seen.has(m.id));
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
  if(ownsMonsterRaritySet('midori',4))ids.push('midori_sr_arcenciel');
  if(ownsMonsterRaritySet('midori',5))ids.push('midori_ssr_singularity');
  if((save.endClears||0)>0)ids.push('end_clear_broken_sword');
  if(isEndMonsterBookComplete())ids.push('end_book_graduation');
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
    for(const w of WORLD_UNLOCKS)if(!['blue','midori','end','white'].includes(w.world)&&isWorldActuallyUnlocked(w.world)&&!save.worldUnlockNotified.includes(w.world))save.worldUnlockNotified.push(w.world);
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
    if(!file){try{stageBgmPlayer.pause();}catch{}currentBgm=null;return;}
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

  function showOnly(el){[els.titleScreen,els.shopScreen,els.collectionScreen,els.monsterBookScreen,els.worldWarpScreen,els.dataManagementScreen,els.gameScreen].filter(Boolean).forEach(x=>x.hidden=x!==el);syncPauseButton();}
  function setMenuButton(btn,glyph,label){btn.innerHTML=`<span class="menu-glyph" aria-hidden="true">${glyph}</span><span class="menu-label">${label}</span>`;}
  function renderTitle(){
    document.body.dataset.mode=mode;
    els.titleGold.textContent=`${effectiveGold()} G`;
    els.titleModeName.textContent=mode==='front'?'光の世界':mode==='back'?'裏の世界':mode==='crimson'?'紅の世界':mode==='blue'?'蒼の世界':mode==='silver'?'銀の世界':mode==='midori'?'翠の世界':mode==='end'?'終の世界':'白の世界';
    els.titleTrackName.textContent=titleTrackLabel();
    if(els.titleGradeGuide)els.titleGradeGuide.textContent=mode==='front'?'小学1年生対象':mode==='back'?'小学2年生対象':mode==='crimson'?'小学3〜4年生対象':mode==='blue'?'小学5年生対象':mode==='silver'?'小学6年生対象':mode==='midori'?'小学4年生以降・思考問題':mode==='end'?'既習算数を統合した発展問題':'小学校算数・ENDLESS CHALLENGE';
    const longRun=mode==='crimson'||mode==='end';
    if(els.titleQuestionCount)els.titleQuestionCount.textContent=mode==='white'?'∞':longRun?'80':'75';
    const titleRuleNote=$('titleQuestionRuleNote');if(titleRuleNote)titleRuleNote.textContent=mode==='crimson'?'5ステージ＋最終決戦':mode==='end'?'5領域＋FINAL':mode==='white'?'10問ごとにDEPTH':'全5ステージ';
    const restartTotal=mode==='white'?'∞':longRun?'80':'75';document.querySelectorAll('[data-run-total]').forEach(el=>el.textContent=restartTotal);
    const ruleCells=[...document.querySelectorAll('.rule-grid>div')];
    if(ruleCells.length>=4){
      const t=ruleCells[0].querySelector('strong'),ts=ruleCells[0].querySelector('small'),life=ruleCells[2].querySelector('small');
      if(t)t.textContent=mode==='white'?'60→45':'60';if(ts)ts.textContent=mode==='white'?'DEPTHで変化':'1もんの制限時間';if(life)life.textContent=mode==='white'?'回復なし':'3ミスでステージ再挑戦';
    }
    if(els.debugBadge)els.debugBadge.hidden=!debugFullUnlock;if(els.musicBtn)els.musicBtn.hidden=false;
    els.backWorldBtn.hidden=true;els.frontWorldBtn.hidden=true;els.shopBtn.hidden=false;els.collectionBtn.hidden=false;els.monsterBookBtn.hidden=false;if(els.worldWarpBtn)els.worldWarpBtn.hidden=!canWorldWarp();
    if(mode==='front'){els.titleHero.src='./assets/hero.png';els.titleEyebrow.textContent='MATH FANTASY ADVENTURE';els.titleSubtitle.innerHTML='計算で道をひらき、5つのエリアを進む。<br>最後に待つ魔王を倒せ。';setMenuButton(els.playBtn,'⚔','ぼうけんを はじめる');setMenuButton(els.shopBtn,'◆','ショップ');setMenuButton(els.collectionBtn,'✦','コレクション');setMenuButton(els.monsterBookBtn,'◆','モンスター図鑑');}
    else if(mode==='back'){els.titleHero.src='./assets/back_hero.png';els.titleEyebrow.textContent='BACK WORLD / ANOTHER QUEST';els.titleSubtitle.innerHTML='裏の世界を巡り、時空の裂け目の先へ。<br>魔法少女のもう一つの冒険。';setMenuButton(els.playBtn,'✦','ウラ面を はじめる');setMenuButton(els.shopBtn,'◆','ショップ');setMenuButton(els.collectionBtn,'✧','コレクション');setMenuButton(els.monsterBookBtn,'◇','モンスター図鑑');}
    else if(mode==='crimson'){els.titleHero.src='./assets/crimson_hero.png';els.titleEyebrow.textContent='AUTUMN SWORD / THIRD QUEST';els.titleSubtitle.innerHTML='晩秋の山里から月影の山城へ。<br>五つの地を越え、剣聖・玄真との最終決戦へ。';setMenuButton(els.playBtn,'⚔','紅の世界を はじめる');setMenuButton(els.shopBtn,'◆','ショップ');setMenuButton(els.collectionBtn,'✦','コレクション');setMenuButton(els.monsterBookBtn,'◆','モンスター図鑑');}
    else if(mode==='blue'){els.titleHero.src='./assets/blue_hero.png';els.titleEyebrow.textContent='BLUE SUMMER / FOURTH QUEST';els.titleSubtitle.innerHTML='青空の下、少年はひと夏の冒険へ。<br>ミステリーが潜む夏の終わりへ進んでいく。';setMenuButton(els.playBtn,'☀','蒼の世界を はじめる');setMenuButton(els.shopBtn,'◆','ショップ');setMenuButton(els.collectionBtn,'✦','コレクション');setMenuButton(els.monsterBookBtn,'◆','モンスター図鑑');}
    else if(mode==='silver'){els.titleHero.src='./assets/silver_hero.png';els.titleEyebrow.textContent='SILVER SNOW / FIFTH QUEST';els.titleSubtitle.innerHTML='永遠の雪に閉ざされた世界。<br>五つの地を越え、世界の果てで自由をつかめ。';setMenuButton(els.playBtn,'❄','銀の世界を はじめる');setMenuButton(els.shopBtn,'◆','ショップ');setMenuButton(els.collectionBtn,'✦','コレクション');setMenuButton(els.monsterBookBtn,'◆','モンスター図鑑');}
    else if(mode==='midori'){els.titleHero.src='./assets/midori_hero_pirate_captain.png';els.titleEyebrow.textContent='EMERALD SEAS / SIXTH QUEST';els.titleSubtitle.innerHTML='島々を巡り、航路を切りひらけ。<br>知恵と判断で、翠の海の最深部へ。';setMenuButton(els.playBtn,'⚓','翠の世界を はじめる');setMenuButton(els.shopBtn,'◆','ショップ');setMenuButton(els.collectionBtn,'✦','コレクション');setMenuButton(els.monsterBookBtn,'◆','モンスター図鑑');}
    else if(mode==='end'){els.titleHero.src='./assets/end_title_party.png';els.titleEyebrow.textContent='TIME RIVER / SEVENTH QUEST';els.titleSubtitle.innerHTML='枝分かれした世界が、時空河へ還っていく。<br>過去の強敵を越え、すべての支流の最深部へ。';setMenuButton(els.playBtn,'∞','終の世界へ');setMenuButton(els.shopBtn,'◆','ショップ');setMenuButton(els.collectionBtn,'✦','コレクション');setMenuButton(els.monsterBookBtn,'◆','モンスター図鑑');}
    else{els.titleHero.src='./assets/hero.png';els.titleEyebrow.textContent='WHITE LIMIT / ENDLESS CHALLENGE';els.titleSubtitle.innerHTML='物語は終わった。ここから先は、自分自身への挑戦。<br>ライフが尽きるまで、算数を解き続けよう。';setMenuButton(els.playBtn,'◇','白の世界へ');els.shopBtn.hidden=true;setMenuButton(els.collectionBtn,'✦','コレクション');els.monsterBookBtn.hidden=true;}
    if(els.worldWarpBtn){setMenuButton(els.worldWarpBtn,'∞','世界を渡る');els.worldWarpBtn.classList.toggle('has-new-world',hasNewWorldWaiting());els.worldWarpBtn.setAttribute('aria-label',hasNewWorldWaiting()?'世界を渡る・新しい世界があります':'世界を渡る');}
  }

  function renderWorldWarp(){
    if(!els.worldWarpList)return;
    // The world crossing UI is data-driven. Adding 翠・終・白 later only requires
    // appending their world records; angular placement and compact sizing adapt to N.
    const worlds=[
      {key:'front',name:'光の世界',short:'光',desc:'剣と魔法が息づく、冒険のはじまりの世界',image:'bg_forest.png',unlocked:true},
      {key:'back',name:'裏の世界',short:'裏',desc:'時空の裂け目に広がる、もうひとつの世界',image:'back_map.png',unlocked:isBackWorldUnlocked()},
      {key:'crimson',name:'紅の世界',short:'紅',desc:'妖怪と剣客が息づく、晩秋に染まった世界',image:'crimson_stage1.png',unlocked:isCrimsonWorldUnlocked()},
      {key:'blue',name:'蒼の世界',short:'蒼',desc:'あの日の影に隠された、夏の世界',image:'blue_stage1.png',unlocked:isBlueWorldUnlocked()},
      {key:'silver',name:'銀の世界',short:'銀',desc:'永遠の雪と静寂に閉ざされた、白銀の世界',image:'silver_stage1.png',unlocked:isSilverWorldUnlocked()},
      {key:'midori',name:'翠の世界',short:'翠',desc:'島々と大船団を越えて進む、翠の海の世界',image:'midori_stage1_departure_port.png',unlocked:isMidoriWorldUnlocked()},
      {key:'end',name:'終の世界',short:'終',desc:'すべての支流が再び集まる、時空河の根源',image:'bg_boss.png',unlocked:isEndWorldUnlocked()},
      {key:'white',name:'白の世界',short:'白',desc:'物語のその先で、自分の限界へ挑み続ける白い試練',image:'bg_forest.png',unlocked:isWorldActuallyUnlocked('white')}
    ];
    let selectedIndex=Math.max(0,worlds.findIndex(w=>w.key===mode));
    els.worldWarpList.innerHTML=`
      <div class="world-gate-layout">
        <div class="world-ring-stage" role="group" aria-label="世界環">
          <div class="world-ring-orbit orbit-outer" aria-hidden="true"></div>
          <div class="world-ring-orbit orbit-inner" aria-hidden="true"></div>
          <div class="world-gate-core" aria-hidden="true"><i></i><span>WORLD<br>GATE</span></div>
          <div class="world-ring-nodes"></div>
        </div>
        <section class="world-gate-detail" aria-live="polite">
          <small id="worldGateStatus">CURRENT WORLD</small>
          <h3 id="worldGateName">世界を選択</h3>
          <p id="worldGateDesc"></p>
          <button id="worldGateTravelBtn" class="world-gate-travel" type="button">この世界へ渡る</button>
          <div class="world-gate-hint">世界を選ぶと、環がその世界へ回転します</div>
        </section>
      </div>`;
    const stage=els.worldWarpList.querySelector('.world-ring-stage');
    const nodeLayer=els.worldWarpList.querySelector('.world-ring-nodes');
    const status=els.worldWarpList.querySelector('#worldGateStatus');
    const name=els.worldWarpList.querySelector('#worldGateName');
    const desc=els.worldWarpList.querySelector('#worldGateDesc');
    const travel=els.worldWarpList.querySelector('#worldGateTravelBtn');
    const nodes=[];
    stage.style.setProperty('--world-count',String(worlds.length));
    stage.classList.toggle('dense-world-ring',worlds.length>=7);

    worlds.forEach((w,i)=>{
      const b=document.createElement('button');
      b.type='button';
      const isNew=isWorldMarkedNew(w.key);
      b.className=`world-ring-node${w.unlocked?'':' locked'}${mode===w.key?' current':''}${isNew?' new-world':''}`;
      b.dataset.world=w.key;
      b.style.setProperty('--portal-image',`url('./assets/${w.image}')`);
      b.innerHTML=`<span class="world-portal-art" aria-hidden="true"></span><span class="world-portal-rim" aria-hidden="true"></span><b>${w.unlocked?w.short:'?'}</b><em>${w.unlocked?w.name:'？？？'}</em>${isNew&&w.unlocked?'<strong>NEW</strong>':''}`;
      b.setAttribute('aria-label',w.unlocked?`${w.name}${mode===w.key?'、現在地':''}`:'未解放の世界');
      b.onclick=()=>{selectedIndex=i;updateSelection();};
      nodeLayer.appendChild(b);nodes.push(b);
    });

    const positionNodes=()=>{
      const n=worlds.length;
      const step=360/n;
      const box=stage.getBoundingClientRect();
      const portal=Math.max(0,...nodes.map(n=>n.getBoundingClientRect().width))||78;
      const measurable=box.width>40&&box.height>40;
      // Reserve room for the largest (selected) portal and its caption.
      const rx=measurable?Math.max(28,box.width/2-portal/2-18):0;
      const ry=measurable?Math.max(24,box.height/2-portal/2-12):0;
      nodes.forEach((b,i)=>{
        // Put the selected portal at 12 o'clock and rotate the rest around it.
        const deg=-90+(i-selectedIndex)*step;
        const rad=deg*Math.PI/180;
        if(measurable){
          b.style.setProperty('--node-x',`${(box.width/2+Math.cos(rad)*rx).toFixed(2)}px`);
          b.style.setProperty('--node-y',`${(box.height/2+Math.sin(rad)*ry).toFixed(2)}px`);
        }else{
          b.style.setProperty('--node-x',`${(50+Math.cos(rad)*37).toFixed(4)}%`);
          b.style.setProperty('--node-y',`${(50+Math.sin(rad)*28).toFixed(4)}%`);
        }
        b.style.setProperty('--node-angle',`${deg.toFixed(3)}deg`);
      });
    };
    const updateSelection=()=>{
      const w=worlds[selectedIndex];
      const isCurrent=w.key===mode;
      const isNew=isWorldMarkedNew(w.key);
      nodes.forEach((b,i)=>b.classList.toggle('selected',i===selectedIndex));
      positionNodes();
      status.textContent=!w.unlocked?'LOCKED WORLD':isCurrent?'CURRENT WORLD':isNew?'NEW WORLD':'DESTINATION';
      name.textContent=w.unlocked?w.name:'？？？';
      desc.textContent=w.unlocked?w.desc:'この世界はまだ解放されていません。';
      travel.hidden=!w.unlocked;
      travel.disabled=!w.unlocked||isCurrent;
      travel.textContent=isCurrent?'現在いる世界':isNew?'新しい世界へ渡る':'この世界へ渡る';
      travel.onclick=async()=>{
        if(!w.unlocked||w.key===mode)return;
        travel.disabled=true;
        stage.classList.add('world-gate-warping');
        nodes[selectedIndex].classList.add('departing');
        await sleep(430);
        markWorldVisited(w.key);mode=w.key;
        await transitionTo(()=>{renderTitle();showOnly(els.titleScreen);},mode,1500);
      };
    };
    els.worldWarpList.onkeydown=e=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
      e.preventDefault();
      const dir=(e.key==='ArrowLeft'||e.key==='ArrowUp')?-1:1;
      selectedIndex=(selectedIndex+dir+worlds.length)%worlds.length;
      updateSelection();nodes[selectedIndex].focus({preventScroll:true});
    };
    updateSelection();
    requestAnimationFrame(positionNodes);
    if(typeof ResizeObserver!=='undefined'){const ro=new ResizeObserver(()=>positionNodes());ro.observe(stage);}
  }

  const MUSIC_WORLD_SLOTS=[
    {key:'front',short:'光',name:'光の世界'},
    {key:'back',short:'裏',name:'裏の世界'},
    {key:'crimson',short:'紅',name:'紅の世界'},
    {key:'blue',short:'蒼',name:'蒼の世界'},
    {key:'silver',short:'銀',name:'銀の世界'},
    {key:'midori',short:'翠',name:'翠の世界'},
    {key:'end',short:'終',name:'終の世界'},
    {key:'white',short:'白',name:'白の世界'}
  ];
  function musicWorldSlot(key){return MUSIC_WORLD_SLOTS.find(w=>w.key===key)||MUSIC_WORLD_SLOTS[0];}
  function isKnownMusicWorld(key){return ['front','back','crimson','blue','silver','midori','end','white'].includes(key);}
  function isMusicSlotUnlocked(key){return isKnownMusicWorld(key)&&isMusicWorldVisible(key);}
  function formatMusicTime(seconds){
    const n=Number(seconds);if(!Number.isFinite(n)||n<0)return'--:--';
    const total=Math.floor(n),m=Math.floor(total/60),sec=total%60;return`${m}:${String(sec).padStart(2,'0')}`;
  }
  function whiteMusicShufflePool(){
    const worlds=['front','back','crimson','blue','silver','midori','end'];
    const labels={front:'光',back:'裏',crimson:'紅',blue:'蒼',silver:'銀',midori:'翠',end:'終'};
    const byFile=new Map();
    for(const world of worlds){
      for(const track of musicTracks(world)){
        if(!isMusicUnlocked(world,track.id))continue;
        const existing=byFile.get(track.file);
        if(existing){if(!existing.sources.includes(labels[world]))existing.sources.push(labels[world]);continue;}
        byFile.set(track.file,{...track,sourceWorld:world,sources:[labels[world]]});
      }
    }
    return [...byFile.values()].map((track,i)=>({...track,shuffleIndex:i}));
  }
  async function playWhiteRandomTrack(forceDifferent=true){
    if(musicWorld!=='white')return;
    const pool=whiteMusicShufflePool();if(!pool.length)return;
    let index=0;
    if(pool.length>1){
      const choices=pool.map((_,i)=>i).filter(i=>!forceDifferent||i!==musicTrackIndex);
      index=pick(choices.length?choices:pool.map((_,i)=>i));
    }
    const track=pool[index],src=`./assets/${track.file}`;
    try{
      musicPlayer.pause();musicPlayer.loop=false;musicPlayer.src=src;musicPlayer.load();musicTrackIndex=index;musicPlayer.volume=.38;musicPlayer.currentTime=0;await musicPlayer.play();
    }catch{}
    renderMusicPlayer();
  }
  function updateMusicSeek(){
    if(!els.musicSeek)return;
    const duration=Number(musicPlayer.duration),current=Number(musicPlayer.currentTime);
    const valid=Number.isFinite(duration)&&duration>0&&musicTrackIndex>=0;
    els.musicSeek.disabled=!valid;
    els.musicSeek.value=valid?String(Math.round(Math.max(0,Math.min(1,current/duration))*1000)):'0';
    if(els.musicElapsed)els.musicElapsed.textContent=musicTrackIndex>=0&&Number.isFinite(current)?formatMusicTime(current):'0:00';
    if(els.musicDuration)els.musicDuration.textContent=valid?formatMusicTime(duration):'--:--';
  }
  function stopMusicPlayer(){
    musicPlayer.pause();
    try{musicPlayer.currentTime=0;}catch{}
    if(els.musicPlayBtn)els.musicPlayBtn.textContent='▶';
    document.querySelectorAll('.music-track-row.playing').forEach(x=>x.classList.remove('playing'));
    updateMusicSeek();
  }
  function renderMusicWorldTabs(){
    if(!els.musicWorldTabs)return;
    els.musicWorldTabs.innerHTML='';
    for(const slot of MUSIC_WORLD_SLOTS){
      const unlocked=isMusicSlotUnlocked(slot.key);
      const selected=musicSelectedWorld===slot.key;
      const b=document.createElement('button');b.type='button';b.role='tab';b.dataset.musicWorld=slot.key;
      b.className=`music-world-tab${selected?' active':''}${unlocked?'':' locked'}`;
      b.textContent=unlocked?slot.short:'?';
      b.setAttribute('aria-selected',selected?'true':'false');
      b.setAttribute('aria-label',unlocked?slot.name:'未解放の世界');
      b.title=unlocked?slot.name:'？？？';
      b.onclick=()=>selectMusicWorldSlot(slot.key);
      els.musicWorldTabs.appendChild(b);
    }
  }
  function renderMusicPlayer(){
    if(!els.musicTrackList)return;
    if(!MUSIC_WORLD_SLOTS.some(w=>w.key===musicSelectedWorld))musicSelectedWorld='front';
    const selected=musicWorldSlot(musicSelectedWorld);
    const selectedUnlocked=isMusicSlotUnlocked(selected.key);
    if(selectedUnlocked&&musicWorld!==selected.key){musicWorld=selected.key;musicTrackIndex=-1;stopMusicPlayer();}
    if(!isMusicWorldVisible(musicWorld)){musicWorld='front';musicSelectedWorld='front';musicTrackIndex=-1;stopMusicPlayer();}
    renderMusicWorldTabs();
    const card=els.musicOverlay?.querySelector('.music-card');if(card)card.dataset.musicWorld=selectedUnlocked?selected.key:'locked';
    if(els.musicWorldStatus)els.musicWorldStatus.textContent=selectedUnlocked?(selected.key==='white'?'RANDOM JUKEBOX':'WORLD LIBRARY'):'LOCKED WORLD';
    if(els.musicWorldTitle)els.musicWorldTitle.textContent=selectedUnlocked?selected.name:'？？？';
    const musicNote=els.musicOverlay?.querySelector('.music-note');
    if(musicNote)musicNote.textContent=selectedUnlocked&&selected.key==='end'?'終の世界では専用ボス曲のみ収録。道中曲は元の世界のBGMページで聴くことができます。':selectedUnlocked&&selected.key==='white'?'解禁済みの光～終のBGMを横断して、曲が終わるたびに完全ランダムで次の1曲へ。直前と同じ曲は連続しません。':'一度到達したステージやボス戦のBGMが解禁されます。';
    els.musicTrackList.innerHTML='';
    if(!selectedUnlocked){
      if(els.musicUnlockCount)els.musicUnlockCount.textContent='この世界の音楽はまだ解放されていません。';
      if(els.musicUnlockFill)els.musicUnlockFill.style.width='0%';
      els.musicTrackList.innerHTML='<div class="music-locked-world-message"><strong>？？？</strong><span>冒険を進めると、この世界の音楽が姿を現します。</span></div>';
      els.musicNowTitle.textContent='曲を選んでください';els.musicNowWhere.textContent='解放済みの世界からBGMを選択できます。';
      els.musicPrevBtn.disabled=true;els.musicPlayBtn.disabled=true;els.musicNextBtn.disabled=true;els.musicStopBtn.disabled=true;updateMusicSeek();return;
    }
    if(selected.key==='white'){
      const pool=whiteMusicShufflePool(),current=pool[musicTrackIndex];
      if(els.musicUnlockCount)els.musicUnlockCount.textContent=`${pool.length} TRACKS IN RANDOM POOL`;
      if(els.musicUnlockFill)els.musicUnlockFill.style.width=pool.length?'100%':'0%';
      els.musicTrackList.innerHTML=`<div class="music-white-shuffle-panel"><small>WHITE WORLD / ALL TRACK SHUFFLE</small><strong>RANDOM PLAY</strong><p>光・裏・紅・蒼・銀・翠・終で解禁したBGMを、世界の区別なくランダム連続再生します。</p><button type="button" class="music-white-random-btn" ${pool.length?'':'disabled'}>${musicTrackIndex>=0?'NEXT RANDOM':'RANDOM PLAY'}</button></div>`;
      const randomBtn=els.musicTrackList.querySelector('.music-white-random-btn');if(randomBtn)randomBtn.onclick=()=>playWhiteRandomTrack(true);
      if(current){els.musicNowTitle.textContent=current.title;els.musicNowWhere.textContent=`${current.sources.join('・')}の世界`;}
      else{els.musicNowTitle.textContent='RANDOM PLAY';els.musicNowWhere.textContent=pool.length?'ボタンを押すと完全ランダム連続再生を開始します。':'解禁済みBGMがありません。';}
      const has=pool.length>0;els.musicPrevBtn.disabled=true;els.musicPlayBtn.disabled=!has;els.musicNextBtn.disabled=!has;els.musicStopBtn.disabled=musicTrackIndex<0;els.musicPlayBtn.textContent=musicTrackIndex>=0&&!musicPlayer.paused?'Ⅱ':'▶';els.musicNextBtn.setAttribute('aria-label','次のランダム曲');updateMusicSeek();return;
    }
    els.musicNextBtn.setAttribute('aria-label','次の曲');
    const tracks=musicTracks(musicWorld);
    const unlockedIndices=tracks.map((t,i)=>isMusicUnlocked(musicWorld,t.id)?i:-1).filter(i=>i>=0);
    const unlockedCount=unlockedIndices.length;
    if(els.musicUnlockCount)els.musicUnlockCount.textContent=`${unlockedCount} / ${tracks.length} TRACKS UNLOCKED`;
    if(els.musicUnlockFill)els.musicUnlockFill.style.width=`${tracks.length?unlockedCount/tracks.length*100:0}%`;
    tracks.forEach((track,i)=>{
      const unlocked=isMusicUnlocked(musicWorld,track.id);
      const row=document.createElement('button');
      row.type='button';row.className=`music-track-row${unlocked?'':' locked'}${i===musicTrackIndex&&!musicPlayer.paused?' playing':''}`;
      row.disabled=!unlocked;
      row.innerHTML=`<span class="music-order">${track.label}</span><span class="music-track-copy"><b>${unlocked?track.title:'？？？？？？'}</b><small>${unlocked?track.where:'未解放'}</small></span><span class="music-track-state">${unlocked?'▶':'LOCK'}</span>`;
      if(unlocked)row.onclick=()=>playMusicTrack(i,true);
      els.musicTrackList.appendChild(row);
    });
    const current=tracks[musicTrackIndex];
    if(current&&isMusicUnlocked(musicWorld,current.id)){
      els.musicNowTitle.textContent=current.title;els.musicNowWhere.textContent=current.where;
    }else{
      els.musicNowTitle.textContent='曲を選んでください';els.musicNowWhere.textContent='解禁済みの曲をタップすると再生します。';
    }
    const has=unlockedIndices.length>0;
    els.musicPrevBtn.disabled=!has;els.musicPlayBtn.disabled=!has;els.musicNextBtn.disabled=!has;els.musicStopBtn.disabled=musicTrackIndex<0;
    els.musicPlayBtn.textContent=musicTrackIndex>=0&&!musicPlayer.paused?'Ⅱ':'▶';
    updateMusicSeek();
  }
  async function playMusicTrack(index,restart=false){
    const tracks=musicTracks(musicWorld),track=tracks[index];
    if(!track||!isMusicUnlocked(musicWorld,track.id))return;
    musicSelectedWorld=musicWorld;
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
    if(!isMusicSlotUnlocked(musicSelectedWorld))return;
    if(musicWorld==='white'){if(direction>0)playWhiteRandomTrack(true);return;}
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
      if(opening){musicWorld=isMusicWorldVisible(mode)?mode:'front';musicSelectedWorld=musicWorld;musicTrackIndex=-1;stopMusicPlayer();renderMusicPlayer();els.musicOverlay.hidden=false;document.body.classList.add('music-overlay-open');}
      else{stopMusicPlayer();musicTrackIndex=-1;musicSelectedWorld=musicWorld;els.musicOverlay.hidden=true;document.body.classList.remove('music-overlay-open');renderTitle();}
    },mode,1450);
    await sleep(70);curtain.className='scene-curtain leaving';await sleep(420);curtain.hidden=true;curtain.className='scene-curtain';
  }
  async function openMusicPlayer(){if(!els.musicOverlay.hidden)return;await transitionMusicOverlay(true);}
  async function closeMusicPlayer(){if(els.musicOverlay.hidden)return;await transitionMusicOverlay(false);}
  function selectMusicWorldSlot(world){
    if(musicSelectedWorld===world)return;
    stopMusicPlayer();musicTrackIndex=-1;musicSelectedWorld=world;
    if(isMusicSlotUnlocked(world))musicWorld=world;
    renderMusicPlayer();
  }
  function switchMusicWorld(world){if(isMusicSlotUnlocked(world))selectMusicWorldSlot(world);}

  function renderDebugPanel(){
    if(!els.debugOverlay)return;
    els.debugStatus.textContent=debugFullUnlock?'ON':'OFF';
    els.debugStatus.classList.toggle('on',debugFullUnlock);
    els.debugToggleBtn.textContent=debugFullUnlock?'全解放を解除':'仮想全解放をON';
    els.debugToggleBtn.classList.toggle('danger',debugFullUnlock);
    els.debugStagePanel.hidden=!debugFullUnlock;
    if(els.debugStageGrid){
      els.debugStageGrid.innerHTML='';
      for(const world of ['front','back','crimson','blue','silver','midori','end']){
        const stages=world==='front'?FRONT_STAGES:world==='back'?BACK_STAGES:world==='crimson'?CRIMSON_STAGES:world==='blue'?BLUE_STAGES:world==='silver'?SILVER_STAGES:world==='midori'?MIDORI_STAGES:buildEndStages(['midori','crimson','silver','back','blue']);
        stages.forEach((st,i)=>{
          const prefix=world==='front'?'光':world==='back'?'裏':world==='crimson'?'紅':world==='blue'?'蒼':world==='silver'?'銀':world==='midori'?'翠':'終';
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
        if(world==='end'){
          const lastStart=document.createElement('button');lastStart.type='button';lastStart.className='debug-stage-btn debug-stage-start debug-world-end';lastStart.textContent='終 FINAL 最初';lastStart.onclick=()=>debugJumpToEndFinal(0);els.debugStageGrid.appendChild(lastStart);
          const last5=document.createElement('button');last5.type='button';last5.className='debug-stage-btn debug-boss5-btn debug-world-end';last5.textContent='終 FINAL ボス5';last5.onclick=()=>debugJumpToEndFinal(4);els.debugStageGrid.appendChild(last5);
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
      if(mode==='midori'&&!isMidoriWorldUnlocked())mode='front';
      if(mode==='end'&&!isEndWorldUnlocked())mode='front';
    }
    renderTitle();renderDebugPanel();
    if(els.collectionScreen&&!els.collectionScreen.hidden)renderCollection();
    if(els.monsterBookScreen&&!els.monsterBookScreen.hidden)renderMonsterBook();
    if(els.shopScreen&&!els.shopScreen.hidden)renderShop();
    if(els.musicOverlay&&!els.musicOverlay.hidden)renderMusicPlayer();
  }
  async function debugJumpToStage(world,index){
    if(!debugFullUnlock)return;
    closeDebugPanel();mode=world;resetRun();if(world==='end')endRunRoute=['midori','crimson','silver','back','blue'];crimsonLastPhase=false;endFinalPhase=false;stageIndex=Math.max(0,Math.min(4,index));totalProgress=stageStartTotal(stageIndex);
    primeStageBgm();await transitionTo(()=>{showOnly(els.gameScreen);prepareMapOverlay(true);},mode,1500);await showMapSequence(true,true);
  }
  async function debugJumpToBossFifth(world,index){
    if(!debugFullUnlock)return;
    closeDebugPanel();mode=world;resetRun();if(world==='end')endRunRoute=['midori','crimson','silver','back','blue'];crimsonLastPhase=false;endFinalPhase=false;stageIndex=Math.max(0,Math.min(4,index));stageQuestion=10;bossPhase=true;bossQuestion=4;if(mode==='blue'&&stageIndex===4)blueAdultState=true;
    totalProgress=stageStartTotal(stageIndex)+stageNormalCount(stageIndex)+4;lives=3;currentMonster=null;currentQuestion=null;clearBossAction();unlockCurrentBossMusic();primeStageBgm();
    await transitionTo(()=>{showOnly(els.gameScreen);document.body.dataset.mode=mode;document.body.dataset.stage=stageIndex;bossPhase=true;bossQuestion=4;currentMonster=null;renderGame();clearQuestionUi();enemyVisualToken++;concealEnemyVisual(true);document.querySelector('.battlefield')?.classList.remove('battle-base-enter');},mode,1250);
    await playStageBgm();await runBattleCountdown();await showBossEntrance(true,4);
  }
  async function debugJumpToCrimsonLast(question=0){
    if(!debugFullUnlock)return;
    closeDebugPanel();resetRun();mode='crimson';crimsonLastPhase=true;stageIndex=4;stageQuestion=10;bossPhase=true;bossQuestion=Math.max(0,Math.min(4,Number(question)||0));totalProgress=75+bossQuestion;lives=3;currentMonster=null;currentQuestion=null;clearBossAction();unlockCurrentBossMusic();primeStageBgm();
    await transitionTo(()=>{showOnly(els.gameScreen);document.body.dataset.mode=mode;document.body.dataset.stage='last';renderGame();clearQuestionUi();enemyVisualToken++;concealEnemyVisual(true);document.querySelector('.battlefield')?.classList.remove('battle-base-enter');},mode,1250);
    await playStageBgm();await runBattleCountdown();await showBossEntrance(true,bossQuestion);
  }
  async function debugJumpToEndFinal(question=0){
    if(!debugFullUnlock)return;
    closeDebugPanel();mode='end';resetRun();endFinalHeroOrder=shuffle(END_FINAL_HERO_ORDER);endFinalPhase=true;stageIndex=4;stageQuestion=10;bossPhase=true;bossQuestion=Math.max(0,Math.min(4,Number(question)||0));totalProgress=75+bossQuestion;lives=3;currentMonster=null;currentQuestion=null;clearBossAction();unlockCurrentBossMusic();primeStageBgm();
    await transitionTo(()=>{showOnly(els.gameScreen);document.body.dataset.mode='end';document.body.dataset.stage='final';renderGame();clearQuestionUi();enemyVisualToken++;concealEnemyVisual(true);document.querySelector('.battlefield')?.classList.remove('battle-base-enter');},'normal',1250);
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
    const duration=Math.max(ms,1400),coverAt=Math.round(duration*0.46),themes=['front','back','crimson','blue','silver','midori','end','white'];
    els.transitionFx.style.setProperty('--transition-ms',`${duration}ms`);
    els.transitionFx.classList.remove('active',...themes);
    const theme=themes.includes(kind)?kind:(themes.includes(mode)?mode:'front');els.transitionFx.classList.add(theme);
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

  function saveStorageStatus(key){
    try{const raw=localStorage.getItem(key);if(raw===null)return{present:false,valid:false};return{present:true,valid:!!parseStoredSave(raw)};}catch{return{present:false,valid:false};}
  }
  function renderDataManagement(){
    const main=saveStorageStatus(STORAGE_KEY),backup=saveStorageStatus(SAVE_BACKUP_KEY);
    let corrupt=false;try{corrupt=localStorage.getItem(SAVE_CORRUPT_KEY)!==null;}catch{}
    if(els.dataStatusMain)els.dataStatusMain.textContent=main.present?(main.valid?'保存あり':'破損を検出'):'保存なし';
    if(els.dataStatusBackup)els.dataStatusBackup.textContent=backup.present?(backup.valid?'復旧用あり':'使用不可'):'なし';
    if(els.dataStatusCorrupt){els.dataStatusCorrupt.textContent=corrupt?'退避あり':'なし';els.dataStatusCorrupt.closest('div')?.toggleAttribute('hidden',!corrupt);}
  }
  async function openDataManagement(){
    renderDataManagement();if(els.dataManagementNotice){els.dataManagementNotice.hidden=true;els.dataManagementNotice.textContent='';}
    await transitionTo(()=>showOnly(els.dataManagementScreen),mode,1250);
  }
  async function closeDataManagement(){await transitionTo(()=>{showOnly(els.titleScreen);renderTitle();},mode,1200);}
  function openDataDeleteConfirm(){if(els.dataDeleteConfirm)els.dataDeleteConfirm.hidden=false;}
  function closeDataDeleteConfirm(){if(els.dataDeleteConfirm)els.dataDeleteConfirm.hidden=true;}
  async function deleteAllSaveData(){
    try{localStorage.removeItem(STORAGE_KEY);localStorage.removeItem(SAVE_BACKUP_KEY);localStorage.removeItem(SAVE_CORRUPT_KEY);}catch{}
    save=freshSave();syncSecretRelics();closeDataDeleteConfirm();renderDataManagement();
    if(els.dataManagementNotice){els.dataManagementNotice.textContent='このブラウザ内のセーブデータをすべて削除しました。';els.dataManagementNotice.hidden=false;}
  }

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
    if(mode==='end')return END_MONSTERS;
    const normals=getMonsterCatalog();
    const bosses=getStages().map((_,i)=>{const [name,img]=getStages()[i].boss;return{id:`boss-${mode}-${i+1}`,world:mode,stage:i,rarity:5,name,img,boss:true};});
    if(mode==='crimson')bosses.push({id:'boss-crimson-last',world:'crimson',stage:5,rarity:5,name:CRIMSON_LAST.boss[0],img:CRIMSON_LAST.boss[1],boss:true,lastBoss:true});
    return [...normals,...bosses];
  }
  const END_MONSTER_FLAVOR={
    'end-midori-road-1':'翠の港を守った総督が、時空河の流れに引き寄せられて再び砲門を向ける。かつての威圧感を残したまま、大時空支流の入口を塞ぐ。',
    'end-midori-road-2':'群島を呑み込んだ巨獣。時空河では海そのものが境界を失い、その巨体だけが濁流の記憶として漂着した。',
    'end-midori-road-3':'翠深の遺跡を守っていた巨像。失われた航路の記憶を刻んだまま、時空河の底から再起動した。',
    'end-midori-road-4':'黒帆大船団を率いた大提督。船団を失ってなお、その覇気だけは衰えず、時空河を新たな戦場として立ちはだかる。',
    'boss-end-midori':'翠の海を支配した渦海王が、終界侵食によって時空河の潮そのものを従える姿へ変質した。幾重もの潮界が、その核へ至る道を閉ざす。',
    'end-crimson-road-1':'実りの里を守った大入道。晩秋の土と稲穂の記憶をまとい、浮遊黒曜要塞へ流れ着いた。',
    'end-crimson-road-2':'深山を駆けた烏天狗。時空の裂け目を風路のように渡り、黒曜の空で再び翼を広げる。',
    'end-crimson-road-3':'古宿を取り仕切った妖異の支配人。湯煙の代わりに時空の靄をまとい、静かに客人を試す。',
    'end-crimson-road-4':'算盤と刃を操った鬼武者。崩れた城下の記憶を背負い、終の戦場でも一分の隙なく構える。',
    'end-crimson-road-5':'月影の山城を守った天守守。主なき要塞に残った忠義だけが、時空河でなお剣を振るわせる。',
    'boss-end-crimson':'秋尽の剣聖・玄真が、終界侵食の果てに「無明」そのものへ近づいた姿。三界を断つ連続の斬撃は、計算する時間さえ切り詰めてくる。',
    'end-silver-road-1':'雪原を揺らした怪力道化。砕けた鏡面世界でも、その豪腕と笑い声だけは鮮明に残っている。',
    'end-silver-road-2':'氷鏡の美術館を彩った奇術師。無数の鏡像を渡り歩き、どれが本物か分からぬまま再び舞台へ現れる。',
    'end-silver-road-3':'雪嶺の猛獣を従えた使い手。銀鏡の破片に獣たちの気配を映し、静かな狩場を作り出す。',
    'end-silver-road-4':'白夜の大天幕を統べた団長。終幕を迎えたはずの舞台を、時空河の上でもう一度開演させようとしている。',
    'boss-end-silver':'終幕の写し身が、終界侵食によってあらゆる形を写し取る模倣体へ変質した姿。鏡面は姿だけでなく、数や式の意味まで映し替える。',
    'end-back-road-1':'渋谷のネオンに潜んだ王。都市の残光をまとったまま、儀式祭殿裏東京の入口を駆け回る。',
    'end-back-road-2':'浅草の百灯を束ねた鬼。消えたはずの灯火を時空の残響から呼び戻し、夜の祭殿を照らす。',
    'end-back-road-3':'電波と雑音を喰らった竜。途切れた信号を翼に変え、反転した都市上空を旋回する。',
    'end-back-road-4':'都庁を守った機甲騎将。時空河に漂う都市情報を装甲へ取り込み、なお命令を遂行し続けている。',
    'boss-end-back':'星晶魔導騎・アステリアが、終界侵食によって星晶術式の頂点へ押し上げられた姿。幾重もの星環と再演算が、因果そのものを組み替える。',
    'end-blue-road-1':'夏草の王者。遠い夏休みの記憶から抜け出し、永劫夏界の草むらで再び角を構える。',
    'end-blue-road-2':'秘密基地を脅かした蜂王。戻れないはずの夏の一日を巣に変え、同じ空を何度も飛び続ける。',
    'end-blue-road-3':'夏祭りに取り残された祭主。消えた灯籠と囃子の残響を連れ、終わらない宵をさまよう。',
    'end-blue-road-4':'夕暮れの境目を守った時守。昼と夜の狭間が崩れた迷宮で、止まった時計を見つめ続ける。',
    'boss-end-blue':'永夏の残像が、終界侵食によって夏そのものを終わらせない存在へ変質した姿。打ち破っても時間を巻き戻し、同じ季節へ引き戻してくる。',
    'boss-end-final':'すべての支流が行き着く玉座で待つ「ゆうしゃ」。その名だけが最初の冒険の記憶を残し、完全な時空輪の中心で五つの世界の力を迎え撃つ。'
  };
  function monsterFlavor(m){
    if(mode==='end'||m.world==='end')return END_MONSTER_FLAVOR[m.id]||'時空河に流れ着いた、過去世界の強敵。かつての記憶を残したまま、終の世界で再び行く手を阻む。';
    if(m.lastBoss)return '紅の世界の最終決戦に立ちはだかる剣聖。小3〜4の総合5問を乗り越えよう。';
    if(m.boss)return `${getStages()[m.stage]?.name||'この地'}に立ちはだかるボスモンスター。5問の勝負を乗り越えよう。`;
    const labels=['','身近な姿をしたモンスター。','少し珍しい力を持つモンスター。','めったに姿を見せないレアモンスター。','強い魔力を宿したスーパーレア。','遭遇そのものが特別なSSRモンスター。'];return labels[m.rarity]||'未知のモンスター。';
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
    els.monsterCardRarity.textContent=m.boss?'BOSS':rarityLabelMonster(m.rarity);els.monsterCardName.textContent=m.name;
    els.monsterCardImage.onerror=()=>{els.monsterCardImage.onerror=null;els.monsterCardImage.src=monsterPlaceholder(m,!!m.boss);};els.monsterCardImage.src=`./assets/${m.img}`;
    els.monsterCardWorld.textContent=mode==='front'?'光の世界':mode==='back'?'裏の世界':mode==='crimson'?'紅の世界':mode==='blue'?'蒼の世界':mode==='silver'?'銀の世界':mode==='midori'?'翠の世界':'終の世界';
    els.monsterCardStage.textContent=m.endFinalBoss?'FINAL':m.lastBoss?'LAST BOSS':m.sourceWorld?`${END_REGION_CONFIG[m.sourceWorld]?.name||'終の領域'}`:`STAGE ${m.stage+1}`;
    els.monsterCardEncounter.textContent=`遭遇 ${effectiveEncounterCount(mode,m.id)||1}`;els.monsterCardText.textContent=monsterFlavor(m);
    const slimeLike=!m.boss&&m.name.includes('スライム');els.monsterCard.className=`monster-card rarity-monster-${m.rarity}${m.boss?' boss-card':''}${slimeLike?' slime-card':''}`;els.monsterCardOverlay.hidden=false;
  }
  function closeMonsterCard(){els.monsterCardOverlay.hidden=true;}


  function getStages(){return mode==='front'?FRONT_STAGES:mode==='back'?BACK_STAGES:mode==='crimson'?CRIMSON_STAGES:mode==='blue'?BLUE_STAGES:mode==='silver'?SILVER_STAGES:mode==='midori'?MIDORI_STAGES:mode==='end'?buildEndStages():[whiteCurrentStage()];}
  function stageStartTotal(idx){return getStages().slice(0,idx).reduce((a,s)=>a+s.count,0);}
  function stageRunTotal(){return getStages().reduce((a,s)=>a+s.count,0);}
  function stageNormalCount(idx=stageIndex){return Math.max(0,Number(getStages()[idx]?.normalCount)||0);}
  function bossCheckpointTotal(){
    if((mode==='crimson'&&crimsonLastPhase)||(mode==='end'&&endFinalPhase))return stageRunTotal();
    return stageStartTotal(stageIndex)+stageNormalCount(stageIndex);
  }
  function resetRun(){
    clearEndSpecialEffects();
    stageIndex=0;stageQuestion=0;totalProgress=0;lives=3;bossPhase=false;bossQuestion=0;crimsonLastPhase=false;endFinalPhase=false;endStageWarningIndex=-1;currentMonster=null;bossActionActive=false;bossSpecialSequence=null;currentQuestion=null;paused=false;gameOverActive=false;specialGauge=0;comboStreak=0;specialActive=false;blueSpecialBusy=false;blueMemoryDim=0;blueAdultState=false;
    if(mode==='end'){endRunRoute=newEndRoute();endHeroWorld='midori';}
    if(mode==='white'){whiteDepth=1;whiteQuestionInDepth=0;whiteTotalCorrect=0;whiteBoss=null;whiteRecentBossIds=[];whiteRecentMonsterIds=[];whiteLastCategory='';whiteRecentTemplates=[];whiteBeyondActive=false;whiteBeyondSeenRun=0;whiteBeyondCorrectRun=0;whiteBeyondUnlockShown=false;chooseWhiteEnvironment();}
    document.body.removeAttribute('data-hero-world');document.body.removeAttribute('data-end-boss-world');document.body.removeAttribute('data-final-boss-world');document.body.removeAttribute('data-boss-aura-world');document.body.removeAttribute('data-boss-aura-tier');document.body.classList.remove('world-boss-aura-active','world-final-aura-active','end-final-postclear-active','game-paused','game-over-active','battle-countdown-active','special-assist-active','vargas-double-strike','boss-technique-active','boss-shield-active','blue-q10-slow','blue-boss-intro-enemy-front','blue-adult-hero-hidden','blue-adult-hero-silhouette','blue-adult-hero-reveal','end-rescue-active','end-boss-corruption-active','end-tide-judgment-active','end-genma-triple-active','end-mimesis-equivalent-active','end-blue-loop-active','end-back-causal-active','end-final-convergence-active','end-final-blue-rewrite','end-final-silver-equivalent','white-challenge-active','white-beyond-active');
    if(els.pauseOverlay)els.pauseOverlay.hidden=true;if(els.gameOverOverlay)els.gameOverOverlay.hidden=true;if(els.battleCountdownOverlay)els.battleCountdownOverlay.hidden=true;runStageRewards=new Set();stats={mistakes:0,timeouts:0,restarts:0,errors:[],gold:0};pendingReviewTip=null;const blueDim=$('blueMemoryDimmer');if(blueDim){blueDim.classList.remove('full-black');blueDim.style.opacity='0';}locked=true;updateSpecialHud();syncPauseButton();
  }

  function getMonsterCatalog(){return mode==='front'?FRONT_MONSTERS:mode==='back'?BACK_MONSTERS:mode==='crimson'?CRIMSON_MONSTERS:mode==='blue'?BLUE_MONSTERS:mode==='silver'?SILVER_MONSTERS:mode==='midori'?MIDORI_MONSTERS:END_MONSTERS;}
  function rarityRoll(r=Math.random()){
    let acc=0;for(const [rarity,w] of RARITY_WEIGHTS){acc+=w;if(r<acc)return rarity;}return 5;
  }
  function unlockedMonsters(rarity){return getMonsterCatalog().filter(m=>m.stage<=stageIndex&&m.rarity===rarity);}
  function selectMonster(rng=Math.random){
    if(mode==='end'){
      const pool=endRoadEntriesFor(currentEndSource(),stageIndex);if(!pool.length)return END_MONSTERS[0];
      const unseen=pool.filter(m=>!isMonsterSeen('end',m.id)),source=unseen.length&&rng()<.58?unseen:pool;return source[Math.floor(rng()*source.length)]||pool[0];
    }
    const rarity=rarityRoll(rng());let pool=unlockedMonsters(rarity);if(!pool.length)pool=getMonsterCatalog().filter(m=>m.stage<=stageIndex);const unowned=pool.filter(m=>!isMonsterSeen(mode,m.id));const source=unowned.length&&rng()<.58?unowned:pool;return source[Math.floor(rng()*source.length)]||pool[0];
  }
  function registerMonster(monster){
    if(!monster||debugFullUnlock||mode==='white')return;
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
    const totalHp=mode==='white'?1:5;
    const remaining=mode==='white'?Math.max(0,1-bossQuestion):Math.max(0,Math.min(5,5-bossQuestion));
    const pct=remaining/totalHp*100;
    els.bossHpFill.style.width=`${pct}%`;els.bossHpHud.style.setProperty('--meter-pct',pct);
    els.bossHpHud.classList.toggle('critical',remaining===1);
    els.bossHpHud.classList.toggle('empty',remaining===0);
    els.bossHpHud.setAttribute('aria-label',`ボスHP ${remaining} / ${totalHp}`);
  }
  function monsterPlaceholder(monster,boss=false){
    const palette=boss?['#180008','#7e0923','#ff355f']:monster.rarity===5?['#1a0934','#ffbf27','#f44dff']:monster.rarity===4?['#180d32','#914cff','#6eeaff']:monster.rarity===3?['#10264b','#d9b64b','#fff1a6']:monster.rarity===2?['#09243b','#45bfff','#ddfaff']:['#20252c','#cfd7e0','#ffffff'];
    const label=(boss?'BOSS':rarityLabelMonster(monster.rarity)).replace(/&/g,'');
    const name=(monster.name||'MONSTER').replace(/[&<>"']/g,'');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 620"><defs><radialGradient id="g"><stop stop-color="${palette[2]}"/><stop offset="1" stop-color="${palette[0]}"/></radialGradient></defs><ellipse cx="240" cy="315" rx="180" ry="220" fill="url(#g)" opacity=".28"/><path d="M240 80c90 0 150 90 145 190 55 40 55 135-10 172-42 72-228 72-270 0-65-37-65-132-10-172-5-100 55-190 145-190z" fill="${palette[1]}" stroke="${palette[2]}" stroke-width="12"/><circle cx="180" cy="280" r="26" fill="#080b14"/><circle cx="300" cy="280" r="26" fill="#080b14"/><path d="M175 365q65 55 130 0" fill="none" stroke="#080b14" stroke-width="16" stroke-linecap="round"/><text x="240" y="525" text-anchor="middle" font-size="36" font-family="sans-serif" fill="white">${label}</text><text x="240" y="575" text-anchor="middle" font-size="24" font-family="sans-serif" fill="white">${name}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  }
  function currentBoss(){
    if(mode==='white')return whiteBoss||chooseWhiteBoss();
    if(mode==='end'){
      if(endFinalPhase)return{id:'boss-end-final',world:'end',sourceWorld:'front',stage:5,rarity:5,name:'ゆうしゃ',english:END_FINAL.bossEnglish||'THE HERO',img:END_FINAL.boss[1],boss:true,lastBoss:true,endFinalBoss:true};
      const source=currentEndSource(),c=END_REGION_CONFIG[source],[name,img]=currentStage().boss;return{id:`boss-end-${source}`,world:'end',sourceWorld:source,stage:stageIndex,rarity:5,name,img,baseName:c?.baseBossName||name,english:c?.bossEnglish||'',boss:true,endRegionBoss:true};
    }
    const [name,img]=currentStage().boss;return{id:(mode==='crimson'&&crimsonLastPhase)?'boss-crimson-last':`boss-${mode}-${stageIndex+1}`,world:mode,stage:(mode==='crimson'&&crimsonLastPhase)?5:stageIndex,rarity:5,name,img,boss:true,lastBoss:mode==='crimson'&&crimsonLastPhase};
  }
  function endNumericQuestion(expression,answer,wrongs=[],extra={}){
    return{expression,answer,choices:compactNumericChoices(answer,wrongs),...extra};
  }
  function endFractionQuestion(parts,answerFraction,wrongFractions=[],extra={}){
    const answer=fractionKey(answerFraction),wrong=[];
    const addWrong=v=>{const key=typeof v==='string'?v:fractionKey(v);if(key!==answer&&!wrong.includes(key))wrong.push(key);};
    wrongFractions.forEach(addWrong);
    makeFractionChoices(answer).forEach(addWrong);
    let guard=0;while(wrong.length<2&&guard++<40){const a=parseFractionKey(answer);addWrong(normFraction(Math.max(1,a.n+rand(-2,3)),Math.max(2,a.d+rand(-1,3))));}
    const choices=shuffle([answer,...wrong.slice(0,2)]);
    return{expression:parts.text,displayExpression:parts.display||parts.text,htmlExpression:parts.html,answer,choices,...extra};
  }
  function makeEndMidoriQuestion(step=stageQuestion){
    const raw=Math.max(0,Number(step)||0),hard=raw>=10,k=raw%10;
    if(k===0){
      const cup=pick(hard?[250,300,400,500]:[300,400,500]),count=pick(hard?[8,10,12,15,16]:[6,8,10,12]),totalMl=cup*count,l=normalizeChoiceNumber(totalMl/1000);
      return endNumericQuestion(`${l}Lの水を${cup}mLずつ分ける。何本分？`,count,[totalMl/cup+1,Math.max(1,count-1),totalMl/100]);
    }
    if(k===1){
      const km=pick(hard?[4.2,5.6,6.4,7.5]:[2.4,3.6,4.8,5.2]),m=pick([650,750,850,950]),answer=Math.round(km*1000-m);
      return endNumericQuestion(`${km}kmの道のうち${m}m進んだ。残りは？m`,answer,[Math.round(km*1000+m),Math.round(km*100-m),Math.max(0,answer-100)]);
    }
    if(k===2){
      const w=pick(hard?[14,16,18]:[10,12,14]),h=pick(hard?[10,12,14]:[8,10,12]),cw=pick([2,3,4]),ch=pick([3,4,5]),answer=w*h-cw*ch;
      return endNumericQuestion(`たて${h}cm、横${w}cmの長方形から${ch}cm×${cw}cmを切り取った。面積は？cm²`,answer,[w*h,cw*ch,w*h+cw*ch]);
    }
    if(k===3){
      const a=pick(hard?[12,14,16]:[8,10,12]),b=pick([5,6,7]),c=pick(hard?[8,10,12]:[5,6,8]),d=pick([3,4,5]),answer=a*b+c*d;
      return endNumericQuestion(`${a}×${b}cmの長方形と${c}×${d}cmの長方形を重ねずにつないだ。面積は？cm²`,answer,[a*b,c*d,a*b-c*d]);
    }
    if(k===4){
      const first=pick([2,3,4,5]),diff=pick(hard?[4,5,6]:[2,3,4]),n=pick(hard?[18,20,24,25]:[12,15,16,18]),answer=first+(n-1)*diff;
      return endNumericQuestion(`${first}, ${first+diff}, ${first+2*diff}, … の${n}番目は？`,answer,[first+n*diff,first+(n-2)*diff,n*diff]);
    }
    if(k===5){
      const n=pick(hard?[12,14,16,18]:[8,9,10,12]),answer=n*(n+1)/2;
      return endNumericQuestion(`1番目1個、2番目2個…${n}番目${n}個。全部で何個？`,answer,[n*n,n*(n-1)/2,answer-n]);
    }
    if(k===6){
      const n=pick(hard?[7,8,9]:[5,6,7]),all=n*(n-1)/2,forbidden=hard?2:1,answer=all-forbidden;
      const condition=hard?'AとB、CとDの2組は同時に選べない':'AとBは同時に選べない';
      return endNumericQuestion(`${n}人から2人を選ぶ。${condition}。何通り？`,answer,[all,n*(n-1),Math.max(1,answer-1)]);
    }
    if(k===7){
      const right=hard?pick([3,4,5]):pick([2,3,4]),up=hard?pick([3,4]):pick([2,3]),answer=combination(right+up,right);
      return endNumericQuestion(`右に${right}回、上に${up}回動く最短経路は何通り？`,answer,[right*up,Math.max(1,answer-right),answer+up]);
    }
    if(k===8){
      const lo=hard?40:20,hi=hard?70:40,mul=hard?6:4,candidates=[];for(let x=lo+1;x<hi;x++)if(x%2===0&&x%mul===0)candidates.push(x);
      const answer=pick(candidates);let wrong1=answer+2<hi?answer+2:answer-2;if(wrong1%mul===0)wrong1+=(wrong1+2<hi?2:-2);let wrong2=answer+1<hi?answer+1:answer-1;if(wrong2%2===0)wrong2+=(wrong2+1<hi?1:-1);
      return{expression:`偶数で、${lo}より大きく${hi}より小さく、${mul}の倍数。どれ？`,answer,choices:shuffle([answer,wrong1,wrong2])};
    }
    if(Math.random()<.5){
      const labels=shuffle(hard?['A','B','C','D']:['A','B','C']);
      if(hard){const[a,b,c,d]=labels,answer=`${a}→${c}→${b}→${d}`;return{expression:`${a}は${b}より先。${c}は${a}より後で${b}より先。${d}は${c}より後。正しい順は？`,answer,choices:shuffle([answer,`${c}→${a}→${b}→${d}`,`${a}→${b}→${c}→${d}`])};}
      const[a,b,c]=labels,answer=`${a}→${c}→${b}`;return{expression:`${a}は${b}より前。${c}は${a}より後で${b}より前。正しい順は？`,answer,choices:shuffle([answer,`${c}→${a}→${b}`,`${b}→${c}→${a}`])};
    }
    const colors=shuffle(['赤','青','緑']),answer=colors[2];
    return{expression:hard?`${colors[0]}・${colors[1]}・${colors[2]}の箱。宝は${colors[0]}ではない。${colors[1]}には鍵があり、宝と鍵は別。宝は？`:`${colors[0]}・${colors[1]}・${colors[2]}の箱。宝は${colors[0]}でも${colors[1]}でもない。宝は？`,answer,choices:shuffle(colors)};
  }
  function makeEndCrimsonQuestion(step=stageQuestion){
    const raw=Math.max(0,Number(step)||0),hard=raw>=10,k=raw%10;
    if(k===0)return exactDivision(hard?'threeByTwoHard':'threeByTwo');
    if(k===1){
      const a=pick(hard?[18.6,24.8,35.7,42.6]:[12.4,16.8,21.5,28.6]),b=pick([3.7,4.8,5.6,6.9]),c=pick([1.5,2.4,3.2,4.5]),answer=normalizeChoiceNumber(a+b-c);
      return endNumericQuestion(`${a} + ${b} − ${c}`,answer,[normalizeChoiceNumber(a+b+c),normalizeChoiceNumber(a-b-c),normalizeChoiceNumber(answer+1)]);
    }
    if(k===2){
      const a=pick(hard?[4.8,6.4,7.5,8.4]:[2.4,3.6,4.5,5.2]),m=pick(hard?[8,9,12]:[4,5,6,8]),c=pick([1.2,2.4,3.6,4.8]),answer=normalizeChoiceNumber(a*m+c);
      return endNumericQuestion(`${a} × ${m} + ${c}`,answer,[normalizeChoiceNumber((a+c)*m),normalizeChoiceNumber(a+m+c),normalizeChoiceNumber(a*m-c)]);
    }
    if(k===3||k===7){
      const d=pick(hard?[10,12,15,16]:[8,10,12]),n1=pick([3,4,5,6]),n2=pick([1,2,3]),n3=pick([1,2]),minus=k===7;
      let num=minus?n1+n2-n3:n1+n2+n3;if(num<=0||num===d)num+=1;const ans=normFraction(num,d);
      const op2=minus?'−':'+';const text=`${n1}/${d} + ${n2}/${d} ${op2} ${n3}/${d}`;
      const html=`${fractionHtml({n:n1,d})}<span class="fraction-op">+</span>${fractionHtml({n:n2,d})}<span class="fraction-op">${op2}</span>${fractionHtml({n:n3,d})}<span class="fraction-op">=</span><span class="fraction-q">?</span>`;
      return endFractionQuestion({text,html},ans,[normFraction(Math.max(1,num-1),d)]);
    }
    if(k===4){
      const a=pick(hard?[480,640,720,840]:[240,360,480,600]),b=pick([12,15,18,24]),c=pick([6,8,10,12]),answer=a-b*c;
      return endNumericQuestion(`${a} − ${b} × ${c}`,answer,[(a-b)*c,a-(b+c),a-b]);
    }
    if(k===5){
      const d=pick(hard?[18,24,32,36]:[12,15,18,20]),q=pick(hard?[14,16,18,20]:[8,10,12,14]),total=d*q,extra=pick([15,20,25,30]),answer=q+extra;
      return endNumericQuestion(`${total} ÷ ${d} + ${extra}`,answer,[total/(d+extra),q,answer+d]);
    }
    if(k===6){
      const a=pick([2.4,3.2,4.8,6.4]),m=pick(hard?[10,12,15]:[5,6,8,10]),d=pick([2,4,5]),answer=normalizeChoiceNumber(a*m/d);
      return endNumericQuestion(`${a} × ${m} ÷ ${d}`,answer,[normalizeChoiceNumber(a*(m/d+1)),normalizeChoiceNumber(a*m),normalizeChoiceNumber(answer*10)]);
    }
    if(k===8){
      const a=pick(hard?[900,1200,1500]:[480,600,720]),d=pick([6,8,10,12]),q=a/d,c=pick([24,36,48,60]),m=pick([2,3,4]),answer=q+c*m;
      return endNumericQuestion(`${a} ÷ ${d} + ${c} × ${m}`,answer,[(a/d+c)*m,a/(d+c)*m,q+c+m]);
    }
    const a=pick([12.5,18.4,24.6,32.8]),b=pick([2,4,5,8]),c=pick([1.2,2.4,3.6]),answer=normalizeChoiceNumber(a+c*b);
    return endNumericQuestion(`${a} + ${c} × ${b}`,answer,[normalizeChoiceNumber((a+c)*b),normalizeChoiceNumber(a+c+b),normalizeChoiceNumber(answer-c)]);
  }
  function makeEndSilverQuestion(step=stageQuestion){
    const raw=Math.max(0,Number(step)||0),hard=raw>=10,k=raw%10;
    if(k===0)return fractionProductQuestion('×',true,hard);
    if(k===1)return fractionProductQuestion('×',false,hard);
    if(k===2)return fractionProductQuestion('÷',true,hard);
    if(k===3)return fractionProductQuestion('÷',false,hard);
    if(k===4)return ratioQuestion(hard?'split':'missing');
    if(k===5)return ratioQuestion('split');
    if(k===6)return circleQuestion(Math.random()<.5?'areaDiameter':'areaRadius',hard);
    if(k===7)return proportionalQuestion(hard?'use':'hole');
    if(k===8)return inverseQuestion(hard?'use':'hole');
    const a=pick(hard?[48,60,72,84]:[30,36,42,48]),r1=pick([2,3,4]),r2=pick([3,4,5]),sum=r1+r2,unit=a/sum;
    if(Number.isInteger(unit))return endNumericQuestion(`${a}個を ${r1}:${r2} に分ける。多い方は何個？`,unit*Math.max(r1,r2),[unit*Math.min(r1,r2),a/sum,a-Math.max(r1,r2)]);
    return ratioQuestion('split');
  }
  function makeEndBlueQuestion(step=stageQuestion){
    const raw=Math.max(0,Number(step)||0),hard=raw>=10,k=raw%10;
    if(k===0)return decimalTimesDecimalQuestion(hard?'hundredths':'decimalAnswer');
    if(k===1)return finiteDecimalDivisionQuestion(hard?'complex':'finite');
    if(k===2)return unlikeFractionQuestion(hard?'simplify':'multiple');
    if(k===3)return unlikeFractionQuestion('subtract');
    if(k===4)return hard?averageTotalQuestion():averageQuestion(4);
    if(k===5)return perUnitQuestion(hard?'area':'item');
    if(k===6)return speedQuestion(hard?(Math.random()<.5?'distance':'time'):'speed');
    if(k===7)return percentageQuestion(hard?'rate':'part');
    if(k===8)return percentageQuestion('base');
    return percentageQuestion(Math.random()<.5?'discount':'increase');
  }
  function makeEndBackQuestion(step=stageQuestion){
    const raw=Math.max(0,Number(step)||0),hard=raw>=10,k=raw%10;
    if(k===0){const x=rand(hard?40:20,hard?120:80),a=rand(12,35),m=pick(hard?[4,5,6]:[2,3,4]),total=(x+a)*m;return endNumericQuestion(`ある数に${a}を足し、${m}倍すると${total}。元の数は？`,x,[total/m,x+a,Math.max(1,x-a)]);}
    if(k===1){const x=rand(hard?30:12,hard?90:60),m=pick(hard?[7,8,9]:[4,5,6]),c=rand(15,60),total=x*m+c;return endNumericQuestion(`□ × ${m} + ${c} = ${total}。□は？`,x,[Math.floor(total/m),x+c,x*m]);}
    if(k===2){const a=rand(hard?300:120,hard?900:480),b=rand(12,36),c=rand(8,24),answer=a+b*c;return endNumericQuestion(`${a} + ${b} × ${c}`,answer,[(a+b)*c,a+b+c,a+b]);}
    if(k===3){const a=rand(hard?40:20,hard?100:70),b=rand(10,45),c=pick([3,4,5,6]),d=rand(5,30),answer=(a+b)*c-d;return endNumericQuestion(`(${a} + ${b}) × ${c} − ${d}`,answer,[a+b*c-d,(a+b)*(c-d),answer+d]);}
    if(k===4){const x=rand(hard?40:15,hard?140:80),m=pick([4,5,6,8,10]),total=x*m;return endNumericQuestion(`□ × ${m} = ${total}。□は？`,x,[total-m,x+m,total/m+1]);}
    if(k===5){const x=pick(hard?[240,300,360,420,480]:[120,160,200,240,280]),d=pick([4,5,8,10]),c=rand(15,45),total=x/d+c;return endNumericQuestion(`□ ÷ ${d} + ${c} = ${total}。□は？`,x,[(total-c)/d,total*d,x+c*d]);}
    if(k===6){const a=rand(20,80),b=rand(10,50),c=pick([3,4,5]),answer=`${a} + ${b*c}`,wrong1=`${a+b} × ${c}`,wrong2=`${a+b} + ${c}`;return{expression:`${a} + ${b} × ${c} と同じ値になる式は？`,answer,choices:shuffle([answer,wrong1,wrong2])};}
    if(k===7){const x=rand(hard?50:20,hard?150:90),a=rand(15,45),m=pick([3,4,5]),total=x+a,answer=x*m;return endNumericQuestion(`ある数に${a}を足すと${total}。その元の数の${m}倍は？`,answer,[total*m,(x+a)*m-a,x+a*m]);}
    if(k===8){const a=rand(hard?500:200,hard?1200:800),b=rand(20,90),c=pick([3,4,5,6]),d=rand(10,50),answer=a-(b-d)*c;return endNumericQuestion(`${a} − (${b} − ${d}) × ${c}`,answer,[(a-b+d)*c,a-b-d*c,a-(b+d)*c]);}
    const x=rand(hard?30:12,hard?100:60),a=pick([4,5,6,8]),b=rand(10,40),total=x*a-b,answer=x;return endNumericQuestion(`ある数を${a}倍して${b}引くと${total}。元の数は？`,answer,[(total+b)/a+1,total/a,(total-b)/a]);
  }
  function endRouteDifficultyRank(){return mode==='end'&&!endFinalPhase?Math.max(0,Math.min(4,stageIndex)):0;}
  function endEffectiveStep(step,boss=false,rank=endRouteDifficultyRank()){
    const q=Math.max(0,Number(step)||0)%10,r=Math.max(0,Math.min(4,Number(rank)||0));
    if(boss){const bossOrder=[[4,5,6,7,8],[5,6,7,8,9],[6,7,8,9,8],[7,8,9,8,9],[8,9,7,8,9]][r];return 10+bossOrder[Math.max(0,Math.min(4,Number(step)||0))];}
    if(r===0)return q;
    if(r===1)return q<5?q:10+q;
    if(r===2)return 10+q;
    const order=r===3?[2,3,4,5,6,7,8,9,8,9]:[4,5,6,7,8,9,6,7,8,9];
    return 10+order[q];
  }
  function makeEndQuestion(sourceWorld=currentEndSource(),step=(bossPhase?bossQuestion:stageQuestion)){
    const effective=endEffectiveStep(step,bossPhase,endRouteDifficultyRank());
    if(sourceWorld==='midori')return makeEndMidoriQuestion(effective);
    if(sourceWorld==='silver')return makeEndSilverQuestion(effective);
    if(sourceWorld==='blue')return makeEndBlueQuestion(effective);
    if(sourceWorld==='crimson')return makeEndCrimsonQuestion(effective);
    return makeEndBackQuestion(effective);
  }
  function makeEndFinalQuestion(step=bossQuestion){
    const phase=Math.max(0,Math.min(4,Number(step)||0));
    if(phase===0){
      const dec=pick([1.2,1.5,1.6,2.4,2.5]),b=pick([200,250,300,400,500]),product=normalizeChoiceNumber(dec*b),a=pick([2400,3000,3600,4200,4800,5400]),c=pick([120,240,360,480,600]),answer=normalizeChoiceNumber(a-product+c);
      if(answer<=0)return makeEndFinalQuestion(phase);
      return endNumericQuestion(`${a} − ${dec} × ${b} + ${c}`,answer,[normalizeChoiceNumber(a-dec*(b+c)),normalizeChoiceNumber(a-product),normalizeChoiceNumber(a-product-c)],{endFinal:true});
    }
    if(phase===1){
      const div=pick([1.2,1.5,2.4,2.5]),q=pick([1200,1500,1800,2000,2400]),a=normalizeChoiceNumber(div*q),d=pick([4,5,8,10]),n=pick([1,2,3]),mult=pick([800,1000,1200,1600,2000]),fracTerm=mult*n/d;if(!Number.isInteger(fracTerm))return makeEndFinalQuestion(phase);const answer=normalizeChoiceNumber(q-fracTerm);if(answer<=0)return makeEndFinalQuestion(phase);
      const text=`${a} ÷ ${div} − ${n}/${d} × ${mult}`,html=`${a} ÷ ${div} − ${fractionHtml({n,d})} × ${mult} = ?`;
      return endNumericQuestion(text,answer,[normalizeChoiceNumber(q-mult),normalizeChoiceNumber(q-n*mult),normalizeChoiceNumber(q-fracTerm/10)],{displayExpression:`${text} = ?`,htmlExpression:html,endFinal:true});
    }
    if(phase===2){
      const a=pick([1200,1600,2000,2400,2800]),b=pick([200,300,400,500]),dec=pick([1.2,1.5,2.4,2.5]),d=pick([4,5,8]),n=pick([1,2,3]),mult=pick([800,1200,1600,2000]),fracTerm=mult*n/d;if(!Number.isInteger(fracTerm))return makeEndFinalQuestion(phase);const answer=normalizeChoiceNumber((a-b)*dec+fracTerm);if(answer<=0)return makeEndFinalQuestion(phase);
      const text=`(${a} − ${b}) × ${dec} + ${n}/${d} × ${mult}`,html=`(${a} − ${b}) × ${dec} + ${fractionHtml({n,d})} × ${mult} = ?`;
      return endNumericQuestion(text,answer,[normalizeChoiceNumber(a-b*dec+fracTerm),normalizeChoiceNumber((a-b)*dec+mult),normalizeChoiceNumber((a-b)+dec+fracTerm)],{displayExpression:`${text} = ?`,htmlExpression:html,endFinal:true});
    }
    if(phase===3){
      const a=pick([3600,4200,4800,5400,6000]),d=pick([4,5,8]),n=pick([1,2,3]),mult=pick([800,1200,1600,2000,2400]),fracTerm=mult*n/d;if(!Number.isInteger(fracTerm))return makeEndFinalQuestion(phase);const dec=pick([0.8,1.2,1.5,2.4]),m=pick([200,300,400,500]),decTerm=normalizeChoiceNumber(dec*m),answer=normalizeChoiceNumber(a-fracTerm+decTerm);if(answer<=0)return makeEndFinalQuestion(phase);
      const text=`${a} − ${n}/${d} × ${mult} + ${dec} × ${m}`,html=`${a} − ${fractionHtml({n,d})} × ${mult} + ${dec} × ${m} = ?`;
      return endNumericQuestion(text,answer,[normalizeChoiceNumber(a-mult+decTerm),normalizeChoiceNumber(a-fracTerm+dec),normalizeChoiceNumber(a-fracTerm-decTerm)],{displayExpression:`${text} = ?`,htmlExpression:html,endFinal:true});
    }
    const a=pick([4800,5400,6000,6600,7200,7800]),dec=pick([1.2,1.25,1.5,2.4]),b=pick([800,1000,1200,1600,2000]),decTerm=normalizeChoiceNumber(dec*b),d=pick([4,5,8,10]),n=pick([1,2,3,5]),mult=pick([800,1200,1600,2000,2400]),fracTerm=mult*n/d;if(!Number.isInteger(fracTerm))return makeEndFinalQuestion(phase);const e=pick([4,5,8,10]),q=pick([40,60,80,100,120]),last=q,dividend=e*q,answer=normalizeChoiceNumber(a-decTerm+fracTerm-last);if(answer<=0)return makeEndFinalQuestion(phase);
    const text=`${a} − ${dec} × ${b} + ${n}/${d} × ${mult} − ${dividend} ÷ ${e}`,html=`${a} − ${dec} × ${b} + ${fractionHtml({n,d})} × ${mult} − ${dividend} ÷ ${e} = ?`;
    return endNumericQuestion(text,answer,[normalizeChoiceNumber(a-decTerm+mult-last),normalizeChoiceNumber(a-decTerm+fracTerm-dividend),normalizeChoiceNumber(a-decTerm-fracTerm-last)],{displayExpression:`${text} = ?`,htmlExpression:html,endFinal:true});
  }

  function makeBossQuestion(idx){
    if(mode==='end')return endFinalPhase?makeEndFinalQuestion(bossQuestion):makeEndQuestion(currentEndSource(),bossQuestion);
    if(mode==='crimson'){if(crimsonLastPhase)return makeCrimsonFinalQuestion(true,bossQuestion);if(idx<4)return makeCrimsonQuestion(idx+1);return makeCrimsonFinalQuestion(false,bossQuestion);}
    if(mode==='blue')return makeBlueBossQuestion(idx,bossQuestion);if(mode==='silver'){if(idx<4)return makeSilverQuestion(idx+1);return makeSilverFinalBossQuestion(bossQuestion);}if(mode==='midori'){if(idx<4)return makeMidoriQuestion(idx+1);return makeMidoriFinalBossQuestion(bossQuestion);}if(idx<4)return mode==='front'?makeFrontQuestion(idx+1):makeBackQuestion(idx+1);if(mode==='front')return makeFrontFinalBossQuestion();return makeBackFinalBossQuestion();
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
  function combination(n,k){k=Math.min(k,n-k);let v=1;for(let i=1;i<=k;i++)v=v*(n-k+i)/i;return Math.round(v);}
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
  function makeBlueEndlessFinalQuestion(source=currentQuestion){
    const r=source?.blueEndlessRatio||source?.blueRatio;
    if(r){
      const answer=r.base;
      const text=`${r.part}は□の${r.rate}%です。□は？`;
      return{expression:text,displayExpression:text,answer,choices:compactNumericChoices(answer,[r.part,r.base+r.part,Math.max(1,r.base-r.part)])};
    }
    return percentageQuestion('base');
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
      for(let i=0;i<300;i++){
        const a=rand(2,9),b=rand(3,12);if(a===b||gcd(a,b)!==1)continue;
        const baseScale=rand(2,5),answerScale=rand(2,6);if(baseScale===answerScale)continue;
        const base=`${a*baseScale}:${b*baseScale}`,answer=`${a*answerScale}:${b*answerScale}`;
        const wrong1=`${a*answerScale}:${b*answerScale+answerScale}`;
        const wrong2=`${a*answerScale+answerScale}:${b*answerScale}`;
        return{expression:`${base} と同じ比は？`,answer,choices:shuffle([answer,wrong1,wrong2])};
      }
      return ratioQuestion('missing');
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

  // ---------- 翠の世界：問題構成 ----------
  // 難しさを巨大数ではなく、換算・分割・規則発見・場合分け・条件整理で作る。
  function midoriUnitQuestion(qn=0){
    const k=((Number(qn)||0)%10+10)%10;
    if(k===0){const km=pick([1.2,1.5,1.8,2.4,2.7,3.5]);return{expression:`${km}km = ?m`,answer:Math.round(km*1000)};}
    if(k===1){const kg=pick([1.5,2.4,3.2,4.5,5.6]);return{expression:`${kg}kg = ?g`,answer:Math.round(kg*1000)};}
    if(k===2){const l=pick([1.2,1.5,2.5,3.4]);return{expression:`${l}L = ?mL`,answer:Math.round(l*1000)};}
    if(k===3){const m=pick([2,3,4,5,6]),cm=pick([15,25,40,60,75]);return{expression:`${m}m${cm}cm = ?cm`,answer:m*100+cm};}
    if(k===4){const h=pick([1,2,3]),min=pick([15,20,30,45]);return{expression:`${h}時間${min}分 = ?分`,answer:h*60+min};}
    if(k===5){const mins=pick([90,120,150,180,210]);return{expression:`${mins}分 = ?時間`,answer:mins/60,choices:makeDecimalChoices(mins/60)};}
    if(k===6){const sqm=pick([1,2,3,4]);return{expression:`${sqm}m² = ?cm²`,answer:sqm*10000,choices:compactNumericChoices(sqm*10000,[sqm*100,sqm*1000,sqm*100000])};}
    if(k===7){const cm2=pick([10000,20000,30000,50000]);return{expression:`${cm2}cm² = ?m²`,answer:cm2/10000,choices:compactNumericChoices(cm2/10000,[cm2/1000,cm2/100,Math.max(0,cm2/10000-1)])};}
    if(k===8){const km=pick([1.5,1.8,2.2,2.4]),walk=pick([350,450,650,750]);const total=Math.round(km*1000);if(walk>=total)return midoriUnitQuestion(0);return{expression:`${km}kmの道を${walk}m進んだ。残りは？m`,answer:total-walk};}
    const l=pick([2.4,3.2,4.5]),used=pick([450,600,750]);const ml=Math.round(l*1000);if(used>=ml)return midoriUnitQuestion(2);return{expression:`${l}Lから${used}mL使った。残りは？mL`,answer:ml-used};
  }
  function midoriAreaQuestion(qn=0){
    const k=((Number(qn)||0)%10+10)%10;
    if(k<=1){const a=rand(4,14),b=rand(3,10);return{expression:`たて${a}cm、よこ${b}cmの長方形の面積は？cm²`,answer:a*b,choices:compactNumericChoices(a*b,[a+b,2*(a+b),a*b+b])};}
    if(k<=3){const base=pick([4,6,8,10,12]),h=pick([3,4,5,6,8]);const ans=base*h/2;return{expression:`底辺${base}cm、高さ${h}cmの三角形の面積は？cm²`,answer:ans,choices:compactNumericChoices(ans,[base*h,base+h,Math.max(1,ans-h)])};}
    if(k===4){const base=pick([5,6,8,10,12]),h=pick([3,4,5,6,7]);return{expression:`底辺${base}cm、高さ${h}cmの平行四辺形の面積は？cm²`,answer:base*h,choices:compactNumericChoices(base*h,[base*h/2,base+h,2*(base+h)])};}
    if(k===5){const a=pick([4,6,8]),b=pick([8,10,12]),h=pick([3,4,5,6]);const ans=(a+b)*h/2;return{expression:`上底${a}cm、下底${b}cm、高さ${h}cmの台形の面積は？cm²`,answer:ans,choices:compactNumericChoices(ans,[(a+b)*h,a*b*h/2,(b-a)*h])};}
    if(k<=7){const a=pick([6,8,10]),b=pick([4,5,6]),c=pick([3,4,5]),d=pick([2,3,4]);const ans=a*b+c*d;return{expression:`長方形${a}×${b}cmと${c}×${d}cmを重ねずにつないだ。面積は？cm²`,answer:ans,choices:compactNumericChoices(ans,[a*b,c*d,a*b-c*d])};}
    const bigW=pick([10,12,14]),bigH=pick([8,10,12]),cutW=pick([2,3,4]),cutH=pick([2,3,4]),ans=bigW*bigH-cutW*cutH;
    return{expression:`${bigW}×${bigH}cmの長方形から${cutW}×${cutH}cmを切り取る。残りは？cm²`,answer:ans,choices:compactNumericChoices(ans,[bigW*bigH,cutW*cutH,bigW*bigH+cutW*cutH])};
  }
  function midoriPatternQuestion(qn=0){
    const k=((Number(qn)||0)%10+10)%10;
    if(k<=2){const start=rand(1,8),step=pick([2,3,4,5]),seq=[0,1,2,3].map(i=>start+i*step),ans=start+4*step;return{expression:`${seq.join('、')}、□　□は？`,answer:ans,choices:compactNumericChoices(ans,[ans-step,ans+step,ans+1])};}
    if(k<=4){const start=pick([40,50,60,72]),step=pick([3,4,5,6]),seq=[0,1,2,3].map(i=>start-i*step),ans=start-4*step;return{expression:`${seq.join('、')}、□　□は？`,answer:ans,choices:compactNumericChoices(ans,[ans+step,Math.max(0,ans-step),ans+1])};}
    if(k<=6){const cycle=pick([3,4,5]),n=pick([8,9,11,13,14,17]),ans=((n-1)%cycle)+1,wrong=shuffle([1,2,3,4,5].filter(v=>v<=cycle&&v!==ans)).slice(0,2);return{expression:`1から${cycle}をくり返して並べる。${n}番目の数は？`,answer:ans,choices:shuffle([ans,...wrong])};}
    if(k===7){const n=pick([6,8,10,12]),ans=2*n-1;return{expression:`1番目1個、2番目3個、3番目5個… ${n}番目は何個？`,answer:ans,choices:compactNumericChoices(ans,[2*n,n+2,ans-2])};}
    if(k===8){const target=pick([15,19,23,27]),ans=(target+1)/2;return{expression:`1,3,5,7… ${target}は何番目？`,answer:ans,choices:compactNumericChoices(ans,[ans-1,ans+1,target/2])};}
    const n=pick([5,6,7,8]),ans=n*(n+1)/2;return{expression:`1番目1個、2番目は2個増える、3番目は3個増える… ${n}番目までの合計は？`,answer:ans,choices:compactNumericChoices(ans,[n*n,ans-n,ans+n])};
  }
  function midoriCountingQuestion(qn=0){
    const k=((Number(qn)||0)%10+10)%10;
    if(k<=2){const hats=pick([2,3,4,5]),shoes=pick([2,3,4]);const ans=hats*shoes;return{expression:`帽子${hats}種類と靴${shoes}種類。1つずつ選ぶ組合せは？通り`,answer:ans,choices:compactNumericChoices(ans,[hats+shoes,Math.max(hats,shoes),ans-1])};}
    if(k<=4){const n=pick([3,4,5]);const ans=[1,1,2,6,24,120][n];return{expression:`${n}人を1列に並べる。並び方は？通り`,answer:ans,choices:compactNumericChoices(ans,[n*n,n*(n-1),Math.max(1,ans/2)])};}
    if(k<=6){const n=pick([4,5,6,7]),ans=combination(n,2);return{expression:`${n}人から2人を選ぶ。選び方は？通り`,answer:ans,choices:compactNumericChoices(ans,[n*2,n*(n-1),ans+1])};}
    if(k===7){const right=pick([2,3,4]),up=pick([2,3,4]),ans=combination(right+up,right);return{expression:`右に${right}回、上に${up}回動く最短の道順は？通り`,answer:ans,choices:compactNumericChoices(ans,[right*up,ans-(right>2?right:1),ans+(up>2?up:2)])};}
    if(k===8){const n=pick([4,5,6,7,8,9]),all=combination(n,2),ans=all-1;return{expression:`${n}人から2人選ぶ。ただし指定された1組は同時に選べない。何通り？`,answer:ans,choices:compactNumericChoices(ans,[all,Math.max(1,all-2),n])};}
    const colors=pick([3,4,5,6,7,8]),ans=combination(colors,2);return{expression:`${colors}色から2色を選ぶ。順番は考えない。何通り？`,answer:ans,choices:compactNumericChoices(ans,[colors*2,colors*(colors-1),Math.max(1,ans-1)])};
  }
  function midoriLogicQuestion(qn=0){
    const k=((Number(qn)||0)%10+10)%10;
    if(k===0){
      const names=shuffle(['アキラ','ユウタ','ミキ','ソラ','レイ']).slice(0,3),[a,b,c]=names,answer=`${a}→${c}→${b}`;
      return{expression:`${a}は${b}より前。${c}は${a}より後で${b}より前。正しい順は？`,answer,choices:shuffle([answer,`${c}→${a}→${b}`,`${a}→${b}→${c}`])};
    }
    if(k===1){
      for(let i=0;i<200;i++){const div=pick([3,4,5,6,8]),reject=pick([4,6,7,9,10]);if(div===reject)continue;const lo=pick([20,30,40,50]),hi=lo+pick([20,24,30]),cand=[];for(let x=lo+1;x<hi;x++)if(x%div===0&&x%reject!==0)cand.push(x);if(!cand.length)continue;const answer=pick(cand),wrong=shuffle([...Array(hi-lo-1)].map((_,j)=>lo+1+j).filter(x=>x!==answer&&(x%div!==0||x%reject===0))).slice(0,2);if(wrong.length===2)return{expression:`${lo}より大きく${hi}より小さい。${div}で割り切れ、${reject}では割り切れない数は？`,answer,choices:shuffle([answer,...wrong])};}
    }
    if(k===2){const labels=shuffle(['A','B','C']),[a,b,c]=labels;return{expression:`${a}は${b}より高い。${c}は${a}より高い。いちばん高いのは？`,answer:c,choices:shuffle(labels)};}
    if(k===3){const colors=shuffle(['赤','青','緑']),[only,notColor,answer]=colors;return{expression:`箱Aは${only}。箱Bは${notColor}ではない。${only}は1箱だけ。箱Bの色は？`,answer,choices:shuffle(colors)};}
    if(k===4){
      for(let i=0;i<300;i++){const multiple=pick([3,4,5,6,8]),lo=pick([12,18,20,24,30,36]),hi=lo+pick([10,12,14,18]),cand=[];for(let x=lo+1;x<hi;x++)if(x%2===0&&x%multiple===0)cand.push(x);if(cand.length!==1)continue;const answer=cand[0],wrong=shuffle([...Array(hi-lo-1)].map((_,j)=>lo+1+j).filter(x=>x!==answer)).slice(0,2);const conditions=['偶数である',`${lo}より大きく${hi}より小さい`,`${multiple}の倍数である`];return{expression:`偶数で、${lo}より大きく${hi}より小さく、${multiple}の倍数。どれ？`,answer,choices:shuffle([answer,...wrong]),conditions};}
    }
    if(k===5){const direct=rand(5,18),extra=rand(2,8),answer=direct+extra;return{expression:`A→Cより、A→B→Cの方が${extra}km長い。A→Cが${direct}kmならA→B→Cは？km`,answer,choices:compactNumericChoices(answer,[direct,Math.max(1,direct-extra),answer+extra])};}
    if(k===6){const colors=shuffle(['赤','青','緑']),answer=colors[2];return{expression:`3つの箱。宝は「${colors[0]}ではない」「${colors[1]}でもない」。宝の箱は？`,answer,choices:shuffle(colors)};}
    if(k===7){const days=shuffle(['月','火','水']),sunny=days[0],notRain=days[1],answer=days[2];return{expression:`月・火・水の3日。雨は${notRain}ではない。晴れは${sunny}。雨の日は？`,answer,choices:shuffle(['月','火','水'])};}
    if(k===8){const order=shuffle(['A','B','C','D']),[first,second,third,fourth]=order,target=pick([second,third,fourth]),rank=order.indexOf(target)+1,answer=`${rank}位`;return{expression:`${first}が1位。${second}は${third}より前、${third}は${fourth}より前。${target}は何位？`,answer,choices:shuffle(['2位','3位','4位'])};}
    const x=rand(5,24),add=rand(3,12),mult=pick([2,3,4]),answer=(x+add)*mult;return{expression:`ある数に${add}を足すと${x+add}。さらに${mult}倍すると？`,answer,choices:compactNumericChoices(answer,[x*mult,(x+add)+mult,answer-mult])};
  }
  function makeMidoriQuestion(idx){
    const qn=bossPhase?bossQuestion:stageQuestion;
    if(idx===0)return midoriUnitQuestion(qn);
    if(idx===1)return midoriAreaQuestion(qn);
    if(idx===2)return midoriPatternQuestion(qn);
    if(idx===3)return midoriCountingQuestion(qn);
    return midoriLogicQuestion(qn);
  }
  function makeMidoriFinalBossQuestion(step=bossQuestion){
    const phase=Math.max(0,Math.min(4,Number(step)||0));
    if(phase===0)return midoriUnitQuestion(8);
    if(phase===1)return midoriAreaQuestion(9);
    if(phase===2)return midoriPatternQuestion(8);
    if(phase===3)return midoriCountingQuestion(8);
    return midoriLogicQuestion(4);
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
      for(let i=0;i<300;i++){
        const a=rand(2,9),b=rand(3,12);if(a===b||gcd(a,b)!==1)continue;const s1=rand(2,5),s2=rand(2,6);if(s1===s2)continue;
        const expression=`${a*s1}:${b*s1} と同じ比は？`,answer=`${a*s2}:${b*s2}`,wrong1=`${a*s2}:${b*s2+s2}`,wrong2=`${a*s2+s2}:${b*s2}`;
        return{expression,displayExpression:expression,answer,choices:shuffle([answer,wrong1,wrong2])};
      }
      return ratioQuestion('equal');
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
      const answer=pick(['比例','反比例','どちらでもない']),base=pick([2,3,4]),m1=pick([2,3]),m2=pick([2,3]),x=[base,base*m1,base*m1*m2];let y;
      if(answer==='比例'){const k=pick([2,3,4,5]);y=x.map(v=>v*k);}
      else if(answer==='反比例'){const product=x[2]*pick([6,8,10,12]);y=x.map(v=>product/v);if(y.some(v=>!Number.isInteger(v)))return makeSilverFinalBossQuestion(phase);}
      else{const k=pick([2,3,4]),offset=pick([1,2,5]);y=x.map((v,i)=>v*k+offset*(i+1));}
      return{expression:'この関係は？',answer,choices:['比例','反比例','どちらでもない'],visualType:'mimesis-table',tableX:x,tableY:y};
    }
    if(phase===3){
      const relation=Math.random()<.5?'比例':'反比例',m=pick([2,3,4]),upward=Math.random()<.5,base=rand(2,6),from=upward?base:base*m,to=upward?base*m:base,xFactor=upward?m:1/m,yFactor=relation==='比例'?xFactor:1/xFactor,answer=yFactor>=1?`${m}倍`:`1/${m}倍`;
      return{expression:`xとyは${relation}。x：${from} → ${to}。yは？`,displayExpression:`xとyは${relation}　x：${from} → ${to}　yは？`,answer,choices:[`${m}倍`,`1/${m}倍`,'変わらない']};
    }
    // FINAL only: same conceptual task, but each statement is generated anew so repeated clears do not expose a finite bank.
    const makers={
      ratio(isFalse){for(let i=0;i<100;i++){const a=rand(2,9),b=rand(a+1,14),m=rand(2,5),left=`${a}:${b}`,rb=b*m+(isFalse?pick([-2,-1,1,2]):0);if(rb<=0||(!isFalse&&rb!==b*m)||(isFalse&&a*m* b===a*rb))continue;return{label:'比',text:`${left} = ${a*m}:${rb}`};}return{label:'比',text:isFalse?'12:18 = 26:36':'12:18 = 26:39'};},
      circle(isFalse){if(Math.random()<.5){const r=rand(5,12),area=round2(r*r*3.14),shown=isFalse?round2(area+pick([3.14,6.28,9.42])):area;return{label:'円',text:`半径${r}cm → 面積${shown}cm²`};}const d=pick([10,12,14,16,18,20,22,24]),circ=round2(d*3.14),shown=isFalse?round2(circ+pick([3.14,6.28,9.42])):circ;return{label:'円',text:`直径${d}cm → 円周${shown}cm`};},
      direct(isFalse){const x1=rand(4,12),m=pick([2,3,4]),x2=x1*m,y1=rand(6,20),correct=y1*m,y2=isFalse?correct+pick([-3,-2,-1,1,2,3]):correct;return{label:'比例',text:`x ${x1}→${x2} ｜ y ${y1}→${y2}`};},
      inverse(isFalse){const x1=pick([3,4,5,6,8,10]),m=pick([2,3,4]),x2=x1*m,y2=rand(4,15),y1=y2*m,shown=isFalse?Math.max(1,y2+pick([-2,-1,1,2])):y2;return{label:'反比例',text:`x ${x1}→${x2} ｜ y ${y1}→${shown}`};}
    };
    const fields=shuffle(Object.keys(makers)).slice(0,3),falseField=pick(fields),rows=shuffle(fields.map(key=>({...makers[key](key===falseField),isFalse:key===falseField}))).map((row,i)=>({...row,letter:['A','B','C'][i]})),answer=rows.find(r=>r.isFalse).letter;
    return{expression:'まちがっているものは？',answer,choices:['A','B','C'],visualType:'mimesis-final',mimesisRows:rows,showPi:rows.some(r=>r.label==='円')};
  }


  const WHITE_CATEGORY_INFO={
    arithmetic:{group:'calc',label:'四則総合',advice:'計算の順序と途中の値を一つずつ確認しよう。'},
    decimal:{group:'calc',label:'小数',advice:'小数点の位置をそろえ、何倍・何分の一になったか確認しよう。'},
    fraction:{group:'calc',label:'分数',advice:'分母が違うときは通分し、約分できるか最後に確認しよう。'},
    divisor:{group:'quantity',label:'倍数・約数',advice:'倍数と約数のどちらを探しているか、条件を先に整理しよう。'},
    percent:{group:'quantity',label:'割合',advice:'「もとにする量」「比べる量」「割合」のどれを求めるか確認しよう。'},
    ratio:{group:'quantity',label:'比',advice:'比の両方を同じ倍率で変えることを意識しよう。'},
    speed:{group:'quantity',label:'速さ',advice:'速さ・時間・道のりのどれを求めるか確認し、時間の単位もそろえよう。'},
    geometry:{group:'visual',label:'図形',advice:'半径と直径、面積と周りの長さなど、求める量を取り違えないようにしよう。'},
    units:{group:'visual',label:'単位・縮尺',advice:'計算する前に単位をそろえよう。縮尺では地図上と実際の長さを区別しよう。'},
    data:{group:'visual',label:'データ',advice:'平均は「合計÷個数」。欠けた値は先に必要な合計を求めよう。'},
    pattern:{group:'think',label:'規則・場合の数',advice:'並び方の規則を見つけ、同じ数え方を重複していないか確認しよう。'},
    logic:{group:'think',label:'条件整理',advice:'条件を一つずつ使い、当てはまらない候補を消していこう。'}
  };
  const WHITE_CATEGORIES=Object.keys(WHITE_CATEGORY_INFO);
  function whiteLevel(depth=whiteDepth,boss=false){
    const r=Math.random();let level;
    if(depth<=1)level=r<.8?'basic':'standard';
    else if(depth===2)level=r<.35?'basic':r<.90?'standard':'mixed';
    else if(depth===3)level=r<.10?'basic':r<.60?'standard':'mixed';
    else if(depth===4)level=r<.30?'standard':r<.85?'mixed':'master';
    else if(depth===5)level=r<.10?'standard':r<.65?'mixed':'master';
    else if(depth===6)level=r<.45?'mixed':'master';
    else if(depth===7)level=r<.30?'mixed':'master';
    else level=r<(depth===8?.20:.15)?'mixed':'master';
    if(boss){const order=['basic','standard','mixed','master'];level=order[Math.min(3,order.indexOf(level)+1)];}
    return level;
  }
  function whiteCategory(depth=whiteDepth){
    const weights=depth<=2?{calc:35,quantity:30,visual:25,think:10}:depth<=4?{calc:25,quantity:35,visual:25,think:15}:depth<=6?{calc:20,quantity:35,visual:25,think:20}:{calc:20,quantity:30,visual:25,think:25};
    const groupPick=()=>{let r=Math.random()*100;for(const g of ['calc','quantity','visual','think']){r-=weights[g];if(r<=0)return g;}return'think';};
    for(let i=0;i<12;i++){const g=groupPick(),pool=WHITE_CATEGORIES.filter(c=>WHITE_CATEGORY_INFO[c].group===g&&c!==whiteLastCategory);if(pool.length){const c=pick(pool);whiteLastCategory=c;return c;}}
    const c=pick(WHITE_CATEGORIES.filter(x=>x!==whiteLastCategory));whiteLastCategory=c;return c;
  }
  function whiteChoices(answer,wrongs=[]){
    const vals=[];const add=v=>{if(v===undefined||v===null)return;if(typeof v==='number'&&!Number.isFinite(v))return;if(typeof answer==='number'&&answer>=0&&typeof v==='number'&&v<0)return;const key=String(v);if(key!==String(answer)&&!vals.some(x=>String(x)===key))vals.push(v);};wrongs.forEach(add);
    if(typeof answer==='number'){
      const delta=Math.max(1,Math.round(Math.abs(answer)*.1));[answer+1,answer-1,answer+delta,Math.max(0,answer-delta),answer*2,answer/2].forEach(v=>add(Number.isInteger(answer)?Math.round(v):normalizeChoiceNumber(v)));
    }
    if(typeof answer==='string'&&answer.includes('/'))makeFractionChoices(answer).forEach(add);
    while(vals.length<2)add(typeof answer==='number'?answer+vals.length+2:`${answer}?${vals.length+1}`);
    return shuffle([answer,...vals.slice(0,2)]);
  }
  function whiteQuestion(expression,answer,wrongs,meta={}){return{expression,answer,choices:whiteChoices(answer,wrongs),...meta};}
  function wfrac(n,d){const g=gcd(Math.abs(n),Math.abs(d));n/=g;d/=g;return d===1?n:`${n}/${d}`;}
  function whiteArithmetic(level){
    const t=pick(level==='basic'?['add','sub','mul']:level==='standard'?['div','order','reverse']:level==='mixed'?['order2','reverse2','three']:['order3','reverse3','multi']);
    if(t==='add'){const a=rand(18,96),b=rand(7,68),ans=a+b;return whiteQuestion(`${a}+${b}`,ans,[a-b,ans-10],{templateId:'arith-add'});}
    if(t==='sub'){const a=rand(45,160),b=rand(8,a-5),ans=a-b;return whiteQuestion(`${a}−${b}`,ans,[a+b,ans+10],{templateId:'arith-sub'});}
    if(t==='mul'){const a=rand(3,12),b=rand(3,12),ans=a*b;return whiteQuestion(`${a}×${b}`,ans,[a+b,(a-1)*b],{templateId:'arith-mul'});}
    if(t==='div'){const b=rand(3,12),q=rand(4,18),a=b*q;return whiteQuestion(`${a}÷${b}`,q,[b,a-b],{templateId:'arith-div'});}
    if(t==='order'){const a=rand(8,20),b=rand(2,8),c=rand(2,9),ans=a+b*c;return whiteQuestion(`${a}+${b}×${c}`,ans,[(a+b)*c,a+b+c],{templateId:'arith-order'});}
    if(t==='reverse'){const x=rand(12,45),a=rand(6,20),sum=x+a;return whiteQuestion(`□+${a}=${sum}　□は？`,x,[sum+a,sum-a-1],{templateId:'arith-reverse'});}
    if(t==='order2'){const b=rand(2,7),c=rand(4,12),ans=rand(8,55),a=b*c+ans;return whiteQuestion(`${a}−${b}×${c}`,ans,[(a-b)*c,a-b-c],{templateId:'arith-order2'});}
    if(t==='reverse2'){const x=rand(8,30),m=rand(2,6),add=rand(4,18),total=x*m+add;return whiteQuestion(`□×${m}+${add}=${total}　□は？`,x,[(total-add),Math.floor(total/m)],{templateId:'arith-reverse2'});}
    if(t==='three'){const a=rand(15,45),b=rand(6,20),c=rand(4,16),ans=a+b-c;return whiteQuestion(`${a}+${b}−${c}`,ans,[a+b+c,a-b+c],{templateId:'arith-three'});}
    if(t==='order3'){const a=rand(3,9),c=rand(2,6),q=rand(4,12),b=c*q,d=rand(5,20),ans=a*q+d;return whiteQuestion(`${a}×(${b}÷${c})+${d}`,ans,[a*q-d,(a*b)/(c+d)],{templateId:'arith-order3'});}
    if(t==='reverse3'){const x=rand(10,40),m=rand(2,5),sub=rand(5,20),total=x*m-sub;return whiteQuestion(`${m}×□−${sub}=${total}　□は？`,x,[(total+sub)/m+1,total/m],{templateId:'arith-reverse3'});}
    const b=rand(2,6),q=rand(25,90),a=b*q,c=rand(15,60),ans=q+c;return whiteQuestion(`${a}÷${b}+${c}`,ans,[a/(b+c),q-c],{templateId:'arith-multi'});
  }
  function whiteDecimal(level){
    const t=pick(level==='basic'?['add','sub']:level==='standard'?['mul','div','unit']:level==='mixed'?['multi','unit2','reverse']:['multi2','percentBridge','reverse2']);
    if(t==='add'){const a=rand(12,95)/10,b=rand(11,89)/10,ans=normalizeChoiceNumber(a+b);return whiteQuestion(`${a}+${b}`,ans,[normalizeChoiceNumber(ans+.1),normalizeChoiceNumber(a+b*10)],{templateId:'dec-add'});}
    if(t==='sub'){const b=rand(11,49)/10,a=normalizeChoiceNumber(b+rand(12,70)/10),ans=normalizeChoiceNumber(a-b);return whiteQuestion(`${a}−${b}`,ans,[normalizeChoiceNumber(ans+.1),normalizeChoiceNumber(a+b)],{templateId:'dec-sub'});}
    if(t==='mul'){const a=rand(12,75)/10,b=pick([.2,.4,.5,.8,1.2,1.5]),ans=normalizeChoiceNumber(a*b);return whiteQuestion(`${a}×${b}`,ans,[normalizeChoiceNumber(ans*10),normalizeChoiceNumber(ans/10)],{templateId:'dec-mul'});}
    if(t==='div'){const d=pick([.2,.4,.5,.8,1.2,1.5]),q=pick([2,3,4,5,6,8,10]),a=normalizeChoiceNumber(d*q);return whiteQuestion(`${a}÷${d}`,q,[normalizeChoiceNumber(q/10),q*10],{templateId:'dec-div'});}
    if(t==='unit'){const l=rand(12,48)/10,used=rand(2,9)/10,ans=Math.round((l-used)*1000);return whiteQuestion(`${l}Lから${used}L使った。残りは何mL？`,ans,[Math.round((l+used)*1000),normalizeChoiceNumber(l-used)],{templateId:'dec-unit'});}
    if(t==='multi'){const a=rand(12,48)/10,b=rand(11,39)/10,c=pick([.5,1.5,2.5]),ans=normalizeChoiceNumber((a+b)*c);return whiteQuestion(`(${a}+${b})×${c}`,ans,[normalizeChoiceNumber(a+b*c),normalizeChoiceNumber((a+b)/c)],{templateId:'dec-multi'});}
    if(t==='unit2'){const km=rand(12,48)/10,m=rand(150,950),ans=Math.round(km*1000-m);return whiteQuestion(`${km}kmの道を${m}m進んだ。残りは何m？`,ans,[Math.round(km*1000+m),Math.round(km*100-m)],{templateId:'dec-unit2'});}
    if(t==='reverse'){const x=rand(12,65)/10,a=rand(11,45)/10,total=normalizeChoiceNumber(x+a);return whiteQuestion(`□+${a}=${total}　□は？`,x,[normalizeChoiceNumber(total+a),normalizeChoiceNumber(x+.1)],{templateId:'dec-reverse'});}
    if(t==='multi2'){const a=rand(12,55)/10,b=pick([.25,.5,.75,1.25]),c=rand(10,40)/10,ans=normalizeChoiceNumber(a*b+c);return whiteQuestion(`${a}×${b}+${c}`,ans,[normalizeChoiceNumber((a+c)*b),normalizeChoiceNumber(a*(b+c))],{templateId:'dec-multi2'});}
    if(t==='percentBridge'){const l=pick([1.2,1.5,1.8,2.4,2.5]),p=pick([20,25,40,50,60,75]),ans=Math.round(l*1000*p/100);return whiteQuestion(`${l}Lの${p}%は何mL？`,ans,[Math.round(l*1000-p),Math.round(l*10*p)],{templateId:'dec-percent-bridge'});}
    const x=rand(12,45)/10,m=pick([1.5,2.5,4]),add=rand(5,25)/10,total=normalizeChoiceNumber(x*m+add);return whiteQuestion(`□×${m}+${add}=${total}　□は？`,x,[normalizeChoiceNumber(total/m),normalizeChoiceNumber((total-add)/m+.1)],{templateId:'dec-reverse2'});
  }
  function whiteFraction(level){
    const t=pick(level==='basic'?['same','amount']:level==='standard'?['unlike','amount','compare']:level==='mixed'?['unlike2','remain','ratioBridge']:['combo','reverse','percentBridge']);
    if(t==='same'){const d=pick([5,6,7,8,9,10]),a=rand(1,d-2),b=rand(1,d-a-1),ans=wfrac(a+b,d);return whiteQuestion(`${a}/${d}+${b}/${d}`,ans,[`${a+b}/${d+1}`,wfrac(Math.abs(a-b)||1,d)],{templateId:'frac-same'});}
    if(t==='amount'){const d=pick([3,4,5,6,8]),n=rand(1,d-1),unit=pick([24,30,36,40,48,60,72]),base=unit-(unit%d),ans=base*n/d;return whiteQuestion(`${base}の${n}/${d}は？`,ans,[base/d,base*n],{templateId:'frac-amount'});}
    if(t==='unlike'){const d1=pick([2,3,4,5,6]),d2=pick([3,4,5,6,8,10]);if(d1===d2)return whiteFraction(level);const n1=1,n2=1,ans=wfrac(n1*d2+n2*d1,d1*d2);return whiteQuestion(`1/${d1}+1/${d2}`,ans,[`2/${d1+d2}`,wfrac(Math.abs(d2-d1),d1*d2)],{templateId:'frac-unlike'});}
    if(t==='compare'){const a=pick(['2/3','3/4','4/5']),b=pick(['5/8','7/10','5/6']);const [an,ad]=a.split('/').map(Number),[bn,bd]=b.split('/').map(Number),ans=an/ad>bn/bd?a:b;return{expression:`${a} と ${b}。大きい方は？`,answer:ans,choices:shuffle([a,b,'同じ']),templateId:'frac-compare'};}
    if(t==='unlike2'){const a=pick([[2,3],[3,4],[5,6]]),b=pick([[1,4],[2,5],[3,8]]),ans=wfrac(a[0]*b[1]-b[0]*a[1],a[1]*b[1]);if(String(ans).startsWith('-')||ans===0)return whiteFraction(level);return whiteQuestion(`${a[0]}/${a[1]}−${b[0]}/${b[1]}`,ans,[wfrac(Math.abs(a[0]-b[0])||1,a[1]+b[1]),wfrac(a[0]*b[1]+b[0]*a[1],a[1]*b[1])],{templateId:'frac-unlike2'});}
    if(t==='remain'){const total=pick([48,60,72,80,96]),f=pick([[3,8],[5,12],[2,5],[3,4]]),used=total*f[0]/f[1];if(!Number.isInteger(used))return whiteFraction(level);return whiteQuestion(`${total}個の${f[0]}/${f[1]}を使った。残りは？`,total-used,[used,total*f[1]/f[0]],{templateId:'frac-remain'});}
    if(t==='ratioBridge'){const total=pick([60,72,84,96]),f=pick([[2,3],[3,4],[5,6]]),ans=total*f[0]/f[1];if(!Number.isInteger(ans))return whiteFraction(level);return whiteQuestion(`全体${total}のうち${f[0]}/${f[1]}。その個数は？`,ans,[total-ans,total/f[1]],{templateId:'frac-ratio-bridge'});}
    if(t==='combo'){const d=pick([6,8,10,12]),a=rand(1,2),b=rand(1,2),c=1;const ans=wfrac(a+b-c,d);return whiteQuestion(`${a}/${d}+${b}/${d}−${c}/${d}`,ans,[wfrac(a+b+c,d),wfrac(Math.abs(a-b)+c,d)],{templateId:'frac-combo'});}
    if(t==='reverse'){const d=pick([3,4,5,6,8]),n=rand(1,d-1),ans=pick([24,30,36,40,48,60,72]),part=ans*n/d;if(!Number.isInteger(part))return whiteFraction(level);return whiteQuestion(`ある数の${n}/${d}が${part}。ある数は？`,ans,[part*d,part/n],{templateId:'frac-reverse'});}
    if(t==='percentBridge'){const f=pick([[1,4,25],[1,2,50],[3,4,75],[1,5,20],[2,5,40]]);return whiteQuestion(`${f[0]}/${f[1]}を百分率で表すと？`,`${f[2]}%`,[`${f[2]/10}%`,`${100-f[2]}%`],{templateId:'frac-percent-bridge'});}
    const d=pick([6,8,10,12]),a=rand(1,Math.max(1,d/2-1)),b=rand(1,Math.max(1,d/2-1)),c=rand(1,Math.max(1,d-a-b));const ans=wfrac(a+b-c,d);if(String(ans).startsWith('-')||ans===0)return whiteFraction(level);return whiteQuestion(`${a}/${d}+${b}/${d}−${c}/${d}`,ans,[wfrac(a+b+c,d),wfrac(a-b+c,d)],{templateId:'frac-combo'});
  }
  function whiteDivisor(level){
    const t=pick(level==='basic'?['factor','multiple']:level==='standard'?['gcd','lcm','count']:level==='mixed'?['cycle','divide','condition']:['cycle2','packing','condition2']);
    const G=(a,b)=>gcd(a,b),L=(a,b)=>a*b/G(a,b);
    if(t==='factor'){const n=pick([18,20,24,28,30,36,40,42]),f=[];for(let i=1;i<=n;i++)if(n%i===0)f.push(i);const ans=f.length;return whiteQuestion(`${n}の約数は全部で何個？`,ans,[ans-1,ans+2],{templateId:'div-factor'});}
    if(t==='multiple'){const n=pick([4,6,8,9,12]),k=rand(5,12),ans=n*k;return whiteQuestion(`${n}の${k}番目の倍数は？`,ans,[n*(k-1),n+k],{templateId:'div-multiple'});}
    if(t==='gcd'){const a=pick([18,24,30,36,42,48]),b=pick([24,30,36,54,60,72]),ans=G(a,b);return whiteQuestion(`${a}と${b}の最大公約数は？`,ans,[Math.min(a,b),G(a,b)+1],{templateId:'div-gcd'});}
    if(t==='lcm'){const a=pick([4,6,8,9,10,12]),b=pick([6,8,12,15,18]),ans=L(a,b);return whiteQuestion(`${a}と${b}の最小公倍数は？`,ans,[a*b,G(a,b)],{templateId:'div-lcm'});}
    if(t==='count'){const n=pick([3,4,5,6,8]),limit=pick([60,72,90,100,120]),ans=Math.floor(limit/n);return whiteQuestion(`1から${limit}までに${n}の倍数はいくつ？`,ans,[ans-1,n],{templateId:'div-count'});}
    if(t==='cycle'){const a=pick([4,6,8,10]),b=pick([6,9,12,15]),ans=L(a,b);return whiteQuestion(`Aは${a}分ごと、Bは${b}分ごと。同時のあと次に同時になるのは何分後？`,ans,[G(a,b),a+b],{templateId:'div-cycle'});}
    if(t==='divide'){const n=pick([24,36,48,60,72]),a=pick([18,30,42,54]),ans=G(n,a);return whiteQuestion(`${n}個と${a}個を余りなく同じ数ずつ最大の組に分ける。組数は？`,ans,[L(n,a),ans+1],{templateId:'div-divide'});}
    if(t==='condition'){const lo=20,hi=80,m1=pick([4,6,8]),m2=pick([3,5,7]),valid=[],invalid=[];for(let x=lo;x<=hi;x++){if(x%m1===0&&x%m2===0)valid.push(x);else invalid.push(x);}const ans=pick(valid),wrong=shuffle(invalid.filter(v=>Math.abs(v-ans)<=Math.max(m1,m2)*3)).slice(0,2);return{expression:`${lo}〜${hi}で、${m1}と${m2}の両方の倍数はどれ？`,answer:ans,choices:shuffle([ans,...(wrong.length===2?wrong:shuffle(invalid).slice(0,2))]),templateId:'div-condition'};}
    if(t==='cycle2'){const a=pick([6,8,10,12]),b=pick([9,12,15,18]),c=pick([4,5,6]),ans=L(L(a,b),c);return whiteQuestion(`Aは${a}分、Bは${b}分、Cは${c}分ごと。次に3つが同時になるのは何分後？`,ans,[L(a,b),a+b+c],{templateId:'div-cycle2'});}
    if(t==='packing'){const a=pick([48,60,72,84]),b=pick([36,54,66,90]),g=G(a,b);return whiteQuestion(`${a}個と${b}個を、どちらも余らない同じ数の袋に最大何袋に分けられる？`,g,[L(a,b),g-1],{templateId:'div-packing'});}
    const a=pick([6,8,9,12]),b=pick([10,14,15,18]),l=L(a,b);return whiteQuestion(`${a}の倍数でも${b}の倍数でもある最小の数は？`,l,[a*b,G(a,b)],{templateId:'div-condition2'});
  }
  function whitePercent(level){
    const t=pick(level==='basic'?['part','rate']:level==='standard'?['discount','whole','increase']:level==='mixed'?['remain','discount2','unit']:['successive','reverseDiscount','mixed']);
    if(t==='part'){const base=pick([80,120,160,200,240,300,400]),p=pick([10,20,25,40,50,75]),ans=base*p/100;return whiteQuestion(`${base}の${p}%は？`,ans,[p,base-ans],{templateId:'pct-part'});}
    if(t==='rate'){const base=pick([40,50,80,120]),p=pick([20,25,40,50,60,75]),part=base*p/100;return whiteQuestion(`${base}のうち${part}。何%？`,`${p}%`,[`${part}%`,`${100-p}%`],{templateId:'pct-rate'});}
    if(t==='discount'){const price=pick([800,1200,1600,2000,2400,3000]),p=pick([10,20,25,30,40]),ans=price*(100-p)/100;return whiteQuestion(`${price}円の${p}%引き。支払う金額は？`,ans,[price*p/100,price-p],{templateId:'pct-discount'});}
    if(t==='whole'){const p=pick([20,25,40,50,60,75]),whole=pick([80,120,160,200,240,300]),part=whole*p/100;return whiteQuestion(`全体の${p}%が${part}。全体は？`,whole,[part*100/p+10,part],{templateId:'pct-whole'});}
    if(t==='increase'){const base=pick([200,400,600,800,1000]),p=pick([10,20,25,50]),ans=base*(100+p)/100;return whiteQuestion(`${base}を${p}%増やすと？`,ans,[base*p/100,base-p],{templateId:'pct-increase'});}
    if(t==='remain'){const total=pick([120,160,200,240,300]),p=pick([25,40,60,75]),used=total*p/100,ans=total-used;return whiteQuestion(`${total}個の${p}%を使った。残りは？`,ans,[used,total-p],{templateId:'pct-remain'});}
    if(t==='discount2'){const price=pick([1200,1600,2000,2400,3200]),p=pick([20,25,30]),ans=price-price*p/100;return whiteQuestion(`${price}円の商品を${p}%引き。値引き額ではなく支払額は？`,ans,[price*p/100,price-p],{templateId:'pct-discount2'});}
    if(t==='unit'){const l=pick([1.2,1.5,1.8,2.4]),p=pick([25,40,50,75]),ans=Math.round(l*1000*p/100);return whiteQuestion(`${l}Lの${p}%は何mL？`,ans,[Math.round(l*1000)-p,Math.round(l*10*p)],{templateId:'pct-unit'});}
    if(t==='successive'){const price=pick([1000,2000,3000,4000]),p1=pick([10,20,25]),p2=pick([10,20]),ans=price*(100-p1)/100*(100-p2)/100;return whiteQuestion(`${price}円を${p1}%引き、その後さらに${p2}%引き。支払額は？`,ans,[price*(100-p1-p2)/100,price*(100-p1)/100],{templateId:'pct-successive'});}
    if(t==='reverseDiscount'){const p=pick([20,25,40]),original=pick([1200,1600,2000,2400,3000]),sale=original*(100-p)/100;return whiteQuestion(`${p}%引きで${sale}円。元の値段は？`,original,[sale*100/p,sale+p],{templateId:'pct-reverse-discount'});}
    const total=pick([1200,1600,2000,2400]),p=pick([25,40,60]),part=total*p/100,used=part/2;return whiteQuestion(`${total}mLの${p}%を取り分け、その半分を使った。使った量は？mL`,used,[part,total-used],{templateId:'pct-mixed'});
  }
  function whiteRatio(level){
    const t=pick(level==='basic'?['equal','missing']:level==='standard'?['split','one']:level==='mixed'?['chain','split2','scale']:['chain2','three','mixed']);
    if(t==='equal'){const a=rand(2,8),b=rand(a+1,12),m=rand(2,5);return{expression:`${a}:${b} と同じ比は？`,answer:`${a*m}:${b*m}`,choices:shuffle([`${a*m}:${b*m}`,`${a*m}:${b+m}`,`${a*m}:${b*m+1}`]),templateId:'ratio-equal'};}
    if(t==='missing'){const a=rand(2,8),b=rand(a+1,12),m=rand(2,5),ans=b*m;return whiteQuestion(`${a}:${b}=${a*m}:□　□は？`,ans,[b+m,a*m],{templateId:'ratio-missing'});}
    if(t==='split'){const a=pick([2,3,4]),b=pick([5,6,7,8].filter(v=>v>a)),unit=pick([6,8,10,12]),total=(a+b)*unit,ans=a*unit;return whiteQuestion(`${total}を${a}:${b}に分ける。小さい方は？`,ans,[b*unit,total/(a+b)],{templateId:'ratio-split'});}
    if(t==='one'){const a=pick([2,3,4,5]),b=pick([3,5,6,7]),left=pick([12,18,20,24,30]),m=left/a;if(!Number.isInteger(m))return whiteRatio(level);return whiteQuestion(`${a}:${b}で、${a}にあたる量が${left}。${b}にあたる量は？`,b*m,[left+b,left/a],{templateId:'ratio-one'});}
    if(t==='chain'){const a=rand(2,5),b=rand(a+1,8),scale=pick([2,3]),b2=b*scale,c=rand(3,10),an=a*scale,g=gcd(an,c),answer=`${an/g}:${c/g}`;return{expression:`A:B=${a}:${b}、B:C=${b2}:${c}。A:Cは？`,answer,choices:shuffle([answer,`${a}:${c}`,`${an}:${c+1}`]),templateId:'ratio-chain'};}
    if(t==='split2'){const r1=pick([3,4]),r2=pick([5,7]),total=pick([160,240,320,480]),unit=total/(r1+r2);if(!Number.isInteger(unit))return whiteRatio(level);return whiteQuestion(`${total}mLを${r1}:${r2}に分ける。多い方は？mL`,r2*unit,[r1*unit,unit],{templateId:'ratio-split2'});}
    if(t==='scale'){const scale=pick([2,3,4]),a=rand(4,10),b=rand(5,12);return{expression:`${a}:${b}を両方${scale}倍した比は？`,answer:`${a*scale}:${b*scale}`,choices:[`${a*scale}:${b*scale}`,`${a+scale}:${b+scale}`,`${a*scale}:${b}`],templateId:'ratio-scale'};}
    if(t==='chain2'){const a=rand(2,6),b=rand(a+1,9),scale=pick([2,3,4]),b2=b*scale,c=rand(3,12),an=a*scale,g=gcd(an,c),answer=`${an/g}:${c/g}`;return{expression:`A:B=${a}:${b}、B:C=${b2}:${c}。A:Cは？`,answer,choices:shuffle([answer,`${a}:${c}`,`${an}:${c+scale}`]),templateId:'ratio-chain2'};}
    if(t==='three'){const unit=pick([6,8,10]),total=9*unit;return whiteQuestion(`${total}を2:3:4に分ける。最大の量は？`,4*unit,[3*unit,2*unit],{templateId:'ratio-three'});}
    const a=rand(2,6),b=rand(a+1,9),scale=pick([2,3,4]),b2=b*scale,c=rand(3,12),an=a*scale,g=gcd(an,c),answer=`${an/g}:${c/g}`;return{expression:`赤:青=${a}:${b}。青:黄=${b2}:${c}。赤:黄は？`,answer,choices:shuffle([answer,`${a}:${c}`,`${an}:${c+scale}`]),templateId:'ratio-mixed'};
  }
  function whiteSpeed(level){
    const t=pick(level==='basic'?['distance','speed']:level==='standard'?['minutes','time','remain']:level==='mixed'?['convert','twoStep','averageLike']:['fractionTime','percentRemain','roundTrip']);
    if(t==='distance'){const v=pick([30,40,50,60,70,80]),h=pick([2,3,4]),ans=v*h;return whiteQuestion(`時速${v}kmで${h}時間。何km進む？`,ans,[v+h,v],{templateId:'speed-distance'});}
    if(t==='speed'){const h=pick([2,3,4]),v=pick([30,40,50,60]),d=v*h;return whiteQuestion(`${d}kmを${h}時間。時速何km？`,v,[d*h,d-h],{templateId:'speed-speed'});}
    if(t==='minutes'){const v=pick([40,48,60,72,80]),min=pick([15,30,45]),ans=v*min/60;return whiteQuestion(`時速${v}kmで${min}分。何km進む？`,ans,[v*min,ans*2],{templateId:'speed-minutes'});}
    if(t==='time'){const v=pick([30,40,50,60]),h=pick([2,3,4]),d=v*h;return whiteQuestion(`${d}kmを時速${v}kmで進む。何時間？`,h,[d/v*60,v/d],{templateId:'speed-time'});}
    if(t==='remain'){const v=pick([40,60,80]),min=30,total=pick([50,70,90,110]),gone=v*min/60,ans=total-gone;if(ans<=0)return whiteSpeed(level);return whiteQuestion(`全体${total}km。時速${v}kmで${min}分進んだ。残りは？km`,ans,[gone,total+gone],{templateId:'speed-remain'});}
    if(t==='convert'){const mpm=pick([80,100,120,150]),min=pick([12,15,20,25]),ans=mpm*min/1000;return whiteQuestion(`分速${mpm}mで${min}分。何km進む？`,ans,[mpm*min,ans*100],{templateId:'speed-convert'});}
    if(t==='twoStep'){const d=pick([1.8,2.4,3.0,3.6]),min=pick([12,15,20]),target=pick([30,40,45]),ans=normalizeChoiceNumber(d/min*target);return whiteQuestion(`${d}kmを${min}分で進む。同じ速さで${target}分なら何km？`,ans,[normalizeChoiceNumber(d*target),normalizeChoiceNumber(d/min)],{templateId:'speed-two-step'});}
    if(t==='averageLike'){const v=pick([60,72,80]),m=45,ans=v*m/60;return whiteQuestion(`時速${v}kmで45分進んだ。道のりは？km`,ans,[v,ans*60],{templateId:'speed-45'});}
    if(t==='fractionTime'){const v=pick([48,60,72]),f=pick([[1,4],[1,2],[3,4]]),ans=v*f[0]/f[1];return whiteQuestion(`時速${v}kmで${f[0]}/${f[1]}時間。何km？`,ans,[v*f[1]/f[0],v-ans],{templateId:'speed-fraction-time'});}
    if(t==='percentRemain'){const total=pick([80,100,120]),p=pick([25,40,50]),travel=total*p/100,ans=total-travel;return whiteQuestion(`全体${total}kmの${p}%を進んだ。残りは？km`,ans,[travel,total-p],{templateId:'speed-percent-remain'});}
    const one=pick([30,40,50]),out=pick([2,3]),back=pick([2,3]),ans=one*out+one*back;return whiteQuestion(`時速${one}kmで${out}時間進み、同じ速さで${back}時間戻った。移動した道のりの合計は？km`,ans,[one*Math.abs(out-back),one*(out+back+1)],{templateId:'speed-roundtrip'});
  }
  function whiteGeometry(level){
    const t=pick(level==='basic'?['rect','triangle','angle']:level==='standard'?['circle','volume','missingAngle']:level==='mixed'?['cut','circleRemain','box']:['compound','scaleArea','angle2']);
    if(t==='rect'){const w=rand(6,18),h=rand(4,14),ans=w*h;return whiteQuestion(`たて${h}cm、横${w}cmの長方形。面積は？cm²`,ans,[2*(w+h),w+h],{templateId:'geo-rect'});}
    if(t==='triangle'){const b=pick([8,10,12,14,16]),h=pick([6,8,10,12]),ans=b*h/2;return whiteQuestion(`底辺${b}cm、高さ${h}cmの三角形。面積は？cm²`,ans,[b*h,b+h],{templateId:'geo-triangle'});}
    if(t==='angle'){const a=rand(30,80),b=rand(30,80),ans=180-a-b;if(ans<=0)return whiteGeometry(level);return whiteQuestion(`三角形の2つの角が${a}°と${b}°。残りは？`,ans,[360-a-b,180-a+b],{templateId:'geo-angle'});}
    if(t==='circle'){const r=pick([3,4,5,6,8,10]),ans=normalizeChoiceNumber(r*r*3.14);return whiteQuestion(`半径${r}cmの円。面積は？cm²（円周率3.14）`,ans,[normalizeChoiceNumber(2*r*3.14),normalizeChoiceNumber(r*3.14)],{templateId:'geo-circle'});}
    if(t==='volume'){const a=rand(3,10),b=rand(3,10),c=rand(3,8),ans=a*b*c;return whiteQuestion(`${a}cm×${b}cm×${c}cmの直方体。体積は？cm³`,ans,[a*b+c,2*(a*b+b*c+c*a)],{templateId:'geo-volume'});}
    if(t==='missingAngle'){const a=rand(50,120),ans=180-a;return whiteQuestion(`一直線上の2つの角の一方が${a}°。もう一方は？`,ans,[a,Math.min(179,ans+20)],{templateId:'geo-line-angle'});}
    if(t==='cut'){const w=pick([12,14,16,18]),h=pick([8,10,12]),cw=pick([2,3,4]),ch=pick([2,3,4]),ans=w*h-cw*ch;return whiteQuestion(`${w}×${h}cmの長方形から${cw}×${ch}cmを切り取る。残りの面積は？cm²`,ans,[w*h,cw*ch],{templateId:'geo-cut'});}
    if(t==='circleRemain'){const r=pick([4,5,6]),side=r*2,square=side*side,circle=normalizeChoiceNumber(r*r*3.14),ans=normalizeChoiceNumber(square-circle);return whiteQuestion(`一辺${side}cmの正方形から半径${r}cmの円を切り取る。残りは？cm²`,ans,[circle,square],{templateId:'geo-circle-remain'});}
    if(t==='box'){const a=pick([8,10,12]),b=pick([6,8,10]),h=pick([4,5,6]),ans=a*b*h;return whiteQuestion(`底面${a}cm×${b}cm、高さ${h}cmの直方体。体積は？cm³`,ans,[a*b,a*b+h],{templateId:'geo-box'});}
    if(t==='compound'){const a=pick([12,16,18]),b=pick([8,10,12]),c=pick([4,6]),d=pick([3,5]),ans=a*b+c*d;return whiteQuestion(`${a}×${b}cmと${c}×${d}cmの長方形を重ねずにつなぐ。面積は？cm²`,ans,[a*b-c*d,a*b],{templateId:'geo-compound'});}
    if(t==='scaleArea'){const w=pick([4,5,6]),h=pick([3,4,5]),m=pick([2,3]),ans=w*h*m*m;return whiteQuestion(`${w}×${h}cmの長方形を縦横とも${m}倍に拡大。面積は？cm²`,ans,[w*h*m,w*h+m],{templateId:'geo-scale-area'});}
    const a=pick([70,80,95,110]),b=pick([40,55,65]),ans=360-a*2-b;if(ans<=0)return whiteGeometry(level);return whiteQuestion(`四角形の角が${a}°、${a}°、${b}°。残りは？`,ans,[180-a-b,360-a-b],{templateId:'geo-angle2'});
  }
  function whiteUnits(level){
    const t=pick(level==='basic'?['km','liter','mass']:level==='standard'?['time','area','scale']:level==='mixed'?['scale2','volume','mixed']:['mapSpeed','areaScale','multiUnit']);
    if(t==='km'){const km=rand(12,75)/10,ans=Math.round(km*1000);return whiteQuestion(`${km}kmは何m？`,ans,[Math.round(km*100),km],{templateId:'unit-km'});}
    if(t==='liter'){const l=rand(12,48)/10,ans=Math.round(l*1000);return whiteQuestion(`${l}Lは何mL？`,ans,[Math.round(l*100),l],{templateId:'unit-liter'});}
    if(t==='mass'){const kg=rand(12,65)/10,ans=Math.round(kg*1000);return whiteQuestion(`${kg}kgは何g？`,ans,[Math.round(kg*100),kg],{templateId:'unit-mass'});}
    if(t==='time'){const h=pick([1.5,2.25,2.5,3.5]),ans=h*60;return whiteQuestion(`${h}時間は何分？`,ans,[h*100,h*60+10],{templateId:'unit-time'});}
    if(t==='area'){const m2=pick([1,2,3,4,5]),ans=m2*10000;return whiteQuestion(`${m2}m²は何cm²？`,ans,[m2*100,m2*1000],{templateId:'unit-area'});}
    if(t==='scale'){const cm=pick([2,3,4,5,6]),per=pick([100,200,500]),ans=cm*per;return whiteQuestion(`地図1cmが実際${per}m。地図${cm}cmは実際何m？`,ans,[cm+per,cm*per/10],{templateId:'unit-scale'});}
    if(t==='scale2'){const actual=pick([600,800,1000,1200,1500]),per=pick([100,200,300]),ans=actual/per;if(!Number.isInteger(ans))return whiteUnits(level);return whiteQuestion(`地図1cmが実際${per}m。実際${actual}mは地図で何cm？`,ans,[ans*10,normalizeChoiceNumber(ans/10)],{templateId:'unit-scale2'});}
    if(t==='volume'){const l=pick([1.2,1.5,2,2.4,3]),ans=l*1000;return whiteQuestion(`${l}Lの容器は何cm³？`,ans,[l*100,l],{templateId:'unit-volume'});}
    if(t==='mixed'){const km=pick([1.2,1.5,1.8,2.4]),m=pick([200,300,450,600]),ans=Math.round(km*1000+m);return whiteQuestion(`${km}km+${m}mは合計何m？`,ans,[Math.round(km*1000-m),Math.round(km*100+m)],{templateId:'unit-mixed'});}
    if(t==='mapSpeed'){const cm=pick([3,4,5]),per=pick([200,300,400]),actual=cm*per,mins=[10,12,15,20,25].filter(v=>actual%v===0);if(!mins.length)return whiteUnits(level);const min=pick(mins),ans=actual/min;return whiteQuestion(`地図1cm=${per}m。${cm}cmの道を${min}分で進む。分速何m？`,ans,[actual,ans*10],{templateId:'unit-map-speed'});}
    if(t==='areaScale'){const cm=pick([2,3,4]),per=pick([10,20,50]),ans=(cm*per)**2;return whiteQuestion(`地図上の一辺${cm}cm、1cm=${per}mの正方形。実際の面積は？m²`,ans,[(cm*cm)*per,cm*per],{templateId:'unit-area-scale'});}
    const l=pick([1.5,2.4,3.2]),used=pick([250,400,600]),ans=Math.round(l*1000-used);return whiteQuestion(`${l}Lから${used}mL使った。残りは何mL？`,ans,[Math.round(l*1000+used),Math.round(l*100-used)],{templateId:'unit-multi'});
  }
  function whiteData(level){
    const t=pick(level==='basic'?['avg','range']:level==='standard'?['missing','add']:level==='mixed'?['remove','weighted','table']:['target','combine','change']);
    if(t==='avg'){const a=rand(10,30),b=rand(10,30),c=rand(10,30),sum=a+b+c,adj=(3-sum%3)%3,c2=c+adj,ans=(a+b+c2)/3;return whiteQuestion(`${a}, ${b}, ${c2} の平均は？`,ans,[a+b+c2,ans+1],{templateId:'data-avg'});}
    if(t==='range'){const vals=shuffle([rand(8,15),rand(16,22),rand(23,30),rand(31,40)]),ans=Math.max(...vals)-Math.min(...vals);return whiteQuestion(`${vals.join('、')} の最大と最小の差は？`,ans,[Math.max(...vals),Math.min(...vals)],{templateId:'data-range'});}
    if(t==='missing'){const avg=pick([15,18,20,24]),vals=[rand(10,25),rand(10,25),rand(10,25)],ans=avg*4-vals.reduce((a,b)=>a+b,0);if(ans<5||ans>40)return whiteData(level);return whiteQuestion(`4人の平均${avg}点。3人が${vals.join('、')}点。残り1人は？`,ans,[avg*4,avg],{templateId:'data-missing'});}
    if(t==='add'){const n=4,avg=pick([15,18,20,24]),newVal=pick([20,25,30,35]),ans=(n*avg+newVal)/(n+1);if(!Number.isInteger(ans))return whiteData(level);return whiteQuestion(`${n}人の平均${avg}点。${newVal}点の1人を加えると平均は？`,ans,[avg+newVal,ans+1],{templateId:'data-add'});}
    if(t==='remove'){const avg=pick([18,20,22,24]),n=5,removed=pick([10,15,20,25,30]),ans=(avg*n-removed)/(n-1);if(!Number.isInteger(ans)||ans<0)return whiteData(level);return whiteQuestion(`${n}人の平均${avg}点。${removed}点の1人を除くと残りの平均は？`,ans,[avg,avg*n-removed],{templateId:'data-remove'});}
    if(t==='weighted'){const aN=2,bN=3,aAvg=pick([15,20,25]),bAvg=pick([20,25,30]),ans=(aN*aAvg+bN*bAvg)/(aN+bN);if(!Number.isInteger(ans))return whiteData(level);return whiteQuestion(`2人の平均${aAvg}点と3人の平均${bAvg}点。5人全体の平均は？`,ans,[(aAvg+bAvg)/2,aN*aAvg+bN*bAvg],{templateId:'data-weighted'});}
    if(t==='table'){const mon=rand(12,20),tue=rand(18,28),wed=rand(22,32),ans=Math.max(mon,tue,wed)-Math.min(mon,tue,wed);return whiteQuestion(`月${mon}、火${tue}、水${wed}。最も多い日と少ない日の差は？`,ans,[Math.max(mon,tue,wed),Math.min(mon,tue,wed)],{templateId:'data-table'});}
    if(t==='target'){const target=pick([20,24,25,30]),vals=[rand(15,30),rand(15,30),rand(15,30),rand(15,30)],ans=target*5-vals.reduce((a,b)=>a+b,0);if(ans<0||ans>50)return whiteData(level);return whiteQuestion(`5回の平均を${target}にしたい。4回が${vals.join('、')}。5回目は？`,ans,[target*5,target],{templateId:'data-target'});}
    if(t==='combine'){const aN=3,bN=2,aAvg=pick([18,20,24,26]),bAvg=pick([15,25,30]),ans=(aN*aAvg+bN*bAvg)/5;if(!Number.isInteger(ans))return whiteData(level);return whiteQuestion(`3人平均${aAvg}点と2人平均${bAvg}点。全体平均は？`,ans,[(aAvg+bAvg)/2,aN*aAvg+bN*bAvg],{templateId:'data-combine'});}
    const n=5,avg=pick([18,20,22]),plus=pick([5,10]),ans=avg+plus/n;return whiteQuestion(`5人の合計点が${plus}点増えた。平均は元の${avg}点から何点になる？`,ans,[avg+plus,plus/n],{templateId:'data-change'});
  }
  function whitePattern(level){
    const t=pick(level==='basic'?['seq','sum']:level==='standard'?['nth','pairs','path']:level==='mixed'?['period','path2','choose']:['nth2','period2','choose2']);
    if(t==='seq'){const a=rand(2,8),d=rand(2,6),ans=a+3*d;return whiteQuestion(`${a}, ${a+d}, ${a+2*d}, □　□は？`,ans,[a+4*d,ans-1],{templateId:'pat-seq'});}
    if(t==='sum'){const n=pick([6,8,10,12]),ans=n*(n+1)/2;return whiteQuestion(`1+2+…+${n} は？`,ans,[n*n,n*(n-1)/2],{templateId:'pat-sum'});}
    if(t==='nth'){const a=rand(2,6),d=rand(2,5),n=pick([10,12,15,18]),ans=a+(n-1)*d;return whiteQuestion(`${a}, ${a+d}, ${a+2*d}, … の${n}番目は？`,ans,[a+n*d,n*d],{templateId:'pat-nth'});}
    if(t==='pairs'){const n=pick([5,6,7,8]),ans=n*(n-1)/2;return whiteQuestion(`${n}人から2人組を1組選ぶ。何通り？`,ans,[n*2,n*(n-1)],{templateId:'pat-pairs'});}
    if(t==='path'){const r=pick([2,3,4]),u=pick([2,3]),ans=combination(r+u,r);return whiteQuestion(`右に${r}回、上に${u}回動く最短経路は何通り？`,ans,[r*u,Math.max(1,ans-r)],{templateId:'pat-path'});}
    if(t==='period'){const p=pick([3,4,5,6]),n=pick([20,25,32,41]),ans=((n-1)%p)+1;return whiteQuestion(`${p}個の色を順に繰り返す。${n}番目は何番目の色？`,ans,[n%p||p,p],{templateId:'pat-period'});}
    if(t==='path2'){const r=pick([3,4,5]),u=pick([3,4]),ans=combination(r+u,r);return whiteQuestion(`右に${r}回、上に${u}回動く最短経路は何通り？`,ans,[r*u,Math.max(1,ans-u)],{templateId:'pat-path2'});}
    if(t==='choose'){const n=pick([6,7,8]),all=n*(n-1)/2,ans=all-1;return whiteQuestion(`${n}人から2人を選ぶ。ただしAとBの組は選べない。何通り？`,ans,[all,all-2],{templateId:'pat-choose'});}
    if(t==='nth2'){const a=pick([3,5,7]),d=pick([4,5,6]),n=pick([20,24,30]),ans=a+(n-1)*d;return whiteQuestion(`${a}, ${a+d}, ${a+2*d}, … の${n}番目は？`,ans,[a+n*d,(n-1)*d],{templateId:'pat-nth2'});}
    if(t==='period2'){const p1=pick([4,6,8]),p2=pick([6,9,12]),ans=p1*p2/gcd(p1,p2);return whiteQuestion(`${p1}回ごとの印と${p2}回ごとの印。次に重なるのは何回目？`,ans,[gcd(p1,p2),p1+p2],{templateId:'pat-period2'});}
    const n=pick([7,8,9]),all=n*(n-1)/2,ans=all-2;return whiteQuestion(`${n}人から2人を選ぶ。指定された2組だけ選べない。何通り？`,ans,[all,all-1],{templateId:'pat-choose2'});
  }
  function whiteLogic(level){
    const t=pick(level==='basic'?['box','order']:level==='standard'?['condition','reverse']:level==='mixed'?['order2','condition2','twoEq']:['logic3','reverse2','eliminate']);
    if(t==='box'){const x=rand(10,40),a=rand(5,20),sum=x+a;return whiteQuestion(`□+${a}=${sum}。□は？`,x,[sum+a,x+1],{templateId:'logic-box'});}
    if(t==='order'){const labels=shuffle(['A','B','C']),[a,b,c]=labels,answer=`${a}→${b}→${c}`;return{expression:`${a}は${b}より先、${c}は${b}より後。正しい順は？`,answer,choices:shuffle([answer,`${b}→${a}→${c}`,`${a}→${c}→${b}`]),templateId:'logic-order'};}
    if(t==='condition'){
      for(let i=0;i<200;i++){const m1=pick([4,5,6,8]),m2=pick([3,5,7,9]);if(m1===m2)continue;const lo=pick([20,30,40]),hi=lo+pick([20,24,30]),c=[];for(let x=lo+1;x<hi;x++)if(x%m1===0&&x%m2===0)c.push(x);if(c.length!==1)continue;const ans=c[0],wrong=shuffle([...Array(hi-lo-1)].map((_,j)=>lo+1+j).filter(v=>v!==ans)).slice(0,2);return{expression:`${lo}より大きく${hi}より小さい、${m1}と${m2}の両方の倍数は？`,answer:ans,choices:shuffle([ans,...wrong]),templateId:'logic-condition'};}
      return whiteLogic('basic');
    }
    if(t==='reverse'){const x=rand(8,30),m=pick([2,3,4]),add=rand(4,15),total=x*m+add;return whiteQuestion(`□×${m}+${add}=${total}。□は？`,x,[(total-add),Math.floor(total/m)],{templateId:'logic-reverse'});}
    if(t==='order2'){const labels=shuffle(['A','B','C']),[a,b,c]=labels,answer=`${a}→${b}→${c}`;return{expression:`${a}は${c}より前。${b}は${a}より後で${c}より前。正しい順は？`,answer,choices:shuffle([answer,`${b}→${a}→${c}`,`${a}→${c}→${b}`]),templateId:'logic-order2'};}
    if(t==='condition2'){const m=pick([6,7,8,9,12]),base=rand(4,8)*m,lo=base-rand(4,9),hi=base+rand(4,9),ans=base,wrong=shuffle([...Array(hi-lo-1)].map((_,j)=>lo+1+j).filter(v=>v!==ans)).slice(0,2);return{expression:`${lo}より大きく${hi}より小さい、${m}の倍数は？`,answer:ans,choices:shuffle([ans,...wrong]),templateId:'logic-condition2'};}
    if(t==='twoEq'){const x=rand(5,15),y=x+rand(3,8),sum=x+y,diff=y-x;return whiteQuestion(`2つの数の和が${sum}、差が${diff}。大きい方は？`,y,[x,sum],{templateId:'logic-twoeq'});}
    if(t==='logic3'){const labels=shuffle(['A','B','C','D']),[a,b,c,d]=labels,answer=`${a}→${c}→${b}→${d}`;return{expression:`${a}は${b}より先。${c}は${a}より後で${b}より先。${d}は${c}より後。正しい順は？`,answer,choices:shuffle([answer,`${c}→${a}→${b}→${d}`,`${a}→${b}→${c}→${d}`]),templateId:'logic-logic3'};}
    if(t==='reverse2'){const x=rand(12,40),m=pick([2,3,4]),sub=rand(5,20),total=x*m-sub;return whiteQuestion(`${m}×□−${sub}=${total}。□は？`,x,[total/m,(total+sub)/m+1],{templateId:'logic-reverse2'});}
    for(let i=0;i<200;i++){const multiple=pick([3,4,5,6,8]),lo=pick([20,24,30,36,40]),hi=lo+pick([10,12,14,18]),c=[];for(let x=lo+1;x<hi;x++)if(x%2===0&&x%multiple===0)c.push(x);if(c.length!==1)continue;const ans=c[0],wrong=shuffle([...Array(hi-lo-1)].map((_,j)=>lo+1+j).filter(v=>v!==ans)).slice(0,2);return{expression:`「偶数」「${lo}より大きい」「${multiple}の倍数」「${hi}より小さい」をすべて満たすのは？`,answer:ans,choices:shuffle([ans,...wrong]),templateId:'logic-eliminate'};}
    return whiteLogic('standard');
  }
  function makeWhiteCategoryQuestion(category,level){
    const map={arithmetic:whiteArithmetic,decimal:whiteDecimal,fraction:whiteFraction,divisor:whiteDivisor,percent:whitePercent,ratio:whiteRatio,speed:whiteSpeed,geometry:whiteGeometry,units:whiteUnits,data:whiteData,pattern:whitePattern,logic:whiteLogic};
    const q=(map[category]||whiteArithmetic)(level);q.category=category;q.level=level;q.advice=q.advice||WHITE_CATEGORY_INFO[category]?.advice||'問題の条件を一つずつ確認しよう。';return q;
  }
  function makeWhiteQuestion(depth=whiteDepth,{boss=false}={}){
    const level=whiteLevel(depth,boss);let q=null;
    for(let i=0;i<10;i++){const category=whiteCategory(depth);q=makeWhiteCategoryQuestion(category,level);if(!whiteRecentTemplates.includes(q.templateId))break;}
    if(q?.templateId){whiteRecentTemplates.push(q.templateId);if(whiteRecentTemplates.length>10)whiteRecentTemplates.shift();}
    if(boss)q={...q,bossQuestion:true,advice:`ボス問題でも基本は同じ。${q.advice}`};return q;
  }
  function makeWhiteBeyondQuestion(){
    const type=pick(['negative','letter','equation','bridge']);
    if(type==='negative'){const a=rand(-9,-2),b=rand(3,12),ans=a+b;return whiteQuestion(`${a}+${b}`,ans,[b-a,Math.abs(ans)],{templateId:'beyond-negative',category:'beyond',advice:'負の数は0より小さい数。数直線上の位置を思い浮かべよう。',beyond:true});}
    if(type==='letter'){const a=rand(2,7),x=rand(2,8),c=rand(1,9),ans=a*x+c;return whiteQuestion(`x=${x} のとき、${a}x+${c} は？`,ans,[a+x+c,ans-c],{templateId:'beyond-letter',category:'beyond',advice:'文字に入る数が分かっているときは、その数を代入して計算しよう。',beyond:true});}
    if(type==='equation'){const x=rand(3,15),a=rand(4,12),total=x+a;return whiteQuestion(`x+${a}=${total}　xは？`,x,[total+a,total-a-1],{templateId:'beyond-equation',category:'beyond',advice:'小学校の「□」がxに変わっただけ。逆算して考えよう。',beyond:true});}
    const x=rand(3,12),m=pick([2,3,4]),total=x*m;return whiteQuestion(`${m}x=${total}　xは？`,x,[total-m,total],{templateId:'beyond-bridge',category:'beyond',advice:'3×□=12と同じ考え方で、文字を□だと思って逆算しよう。',beyond:true});
  }

  function currentStage(){if(mode==='white')return whiteCurrentStage();if(mode==='end'&&endFinalPhase)return END_FINAL;return (mode==='crimson'&&crimsonLastPhase)?CRIMSON_LAST:getStages()[stageIndex];}

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
  // Default is ALWAYS the source artwork's original facing. Only a sprite that has been
  // visually confirmed to face away from the hero is explicitly opted into mirroring.
  // This prevents frontal/already-correct/asymmetric art from being mirrored merely because
  // it belongs to the Light/Back world. Add future corrections here by exact asset filename.
  const BATTLE_FLIP_FACING=new Set([
    'monster_back_4_1_22.png' // ケーブルワーム: source art faces away from the hero.
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
    if(!els.enemySprite)return;const shouldFlip=!!en&&BATTLE_FLIP_FACING.has(String(en.img||''));els.enemySprite.classList.toggle('flip-facing',shouldFlip);els.enemySprite.classList.toggle('bottom-safe-knight',!!en&&en.img==='monster_front_4_2_25.png');els.enemySprite.style.setProperty('--enemy-scale',String(en?(BATTLE_SPRITE_SCALE[en.img]||1):1));els.enemySprite.style.setProperty('--enemy-y',en?(BATTLE_SPRITE_OFFSET_Y[en.img]||'0%'):'0%');
  }

  // Enemy image lifecycle: never replace a visible enemy's src in place.  The old
  // sprite is first hidden and detached, the next PNG is decoded off-screen, and only
  // then is the prepared image committed while the actor is still invisible.  This
  // prevents a previous normal enemy/boss flashing for a frame after stage changes.
  let enemyVisualToken=0;
  function concealEnemyVisual(clearSource=true){
    els.enemyActor.style.opacity='0';
    els.enemyActor.style.transform='';
    els.enemyActor.classList.remove('hit','finisher-hit','spawn-boss','boss-defeat','end-final-defeat','world-boss-aura','world-final-boss-aura','spawn-r1','spawn-r2','spawn-r3','spawn-r4','spawn-r5');
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
  function prepareBlueStage5BossReveal(){
    if(!isBlueStage5())return;
    blueAdultState=true;
    renderGame();
    document.body.classList.add('blue-boss-intro-enemy-front','blue-adult-hero-hidden');
  }
  async function revealBlueStage5BossRoomAndHero(){
    if(!isBlueStage5())return;
    const layer=ensureBlueMemoryDimmer();if(!layer)return;
    // First reveal only the apartment from the black screen. The boss remains visible above
    // the blackout while the hero is kept hidden so the two reveals do not happen together.
    layer.classList.add('full-black','blue-room-reveal');
    layer.style.opacity='0';blueMemoryDim=0;
    await sleep(1950);
    layer.classList.remove('full-black','blue-room-reveal');
    // Then introduce the adult protagonist as a pure silhouette and slowly restore the art.
    document.body.classList.add('blue-adult-hero-silhouette');
    document.body.classList.remove('blue-adult-hero-hidden');
    void els.heroActor?.offsetWidth;
    await sleep(420);
    document.body.classList.add('blue-adult-hero-reveal');
    await sleep(1900);
    document.body.classList.remove('blue-adult-hero-silhouette','blue-adult-hero-reveal','blue-boss-intro-enemy-front');
  }


  function stageDisplayProgress(){
    const count=Math.max(1,Number(currentStage()?.count)||1);
    return Math.max(0,Math.min(count,totalProgress-stageStartTotal(stageIndex)));
  }
  function currentWorldBossAuraTier(){
    // End-world road bosses intentionally carry no ordinary-world aura.  Their region
    // bosses use the separate corruption system instead.  In Crimson, STAGE 1-5 are
    // ordinary stage bosses and the independent Genma encounter is the true final boss.
    if(!bossPhase||mode==='end')return '';
    if(mode==='white')return whiteBoss?.originalFinal?'final':'regular';
    if(mode==='crimson')return crimsonLastPhase?'final':'regular';
    if(!['front','back','blue','silver','midori'].includes(mode))return '';
    return stageIndex===4?'final':'regular';
  }
  function syncWorldBossAura(){
    const tier=currentWorldBossAuraTier(),active=!!tier;
    document.body.classList.toggle('world-boss-aura-active',active);
    document.body.classList.toggle('world-final-aura-active',tier==='final');
    els.enemyActor.classList.toggle('world-boss-aura',active);
    els.enemyActor.classList.toggle('world-final-boss-aura',tier==='final');
    if(active){
      document.body.dataset.bossAuraWorld=mode==='white'?(whiteBoss?.sourceWorld||'front'):mode;
      document.body.dataset.bossAuraTier=tier;
    }else{
      document.body.removeAttribute('data-boss-aura-world');
      document.body.removeAttribute('data-boss-aura-tier');
    }
    // Keep the old final-world dataset only as a compatibility hook for any older CSS.
    if(tier==='final')document.body.dataset.finalBossWorld=mode;else document.body.removeAttribute('data-final-boss-world');
  }
  const HUD_MODE_KEY='sansuQuestHudMode_v1';
  let hudMode='modern';
  function readHudMode(){
    try{return localStorage.getItem(HUD_MODE_KEY)==='classic'?'classic':'modern';}catch{return 'modern';}
  }
  function writeHudMode(value){try{localStorage.setItem(HUD_MODE_KEY,value);}catch{}}
  function syncHudModeButton(){
    if(!els.hudModeToggleBtn)return;
    const modern=hudMode==='modern';
    els.hudModeToggleBtn.textContent=`HUD表示：${modern?'新':'従来'}`;
    els.hudModeToggleBtn.setAttribute('aria-pressed',modern?'true':'false');
    els.hudModeToggleBtn.title=modern?'現在は新HUDです。押すと従来HUDへ切り替えます。':'現在は従来HUDです。押すと新HUDへ切り替えます。';
  }
  function applyHudMode(value,{persist=true}={}){
    hudMode=value==='classic'?'classic':'modern';
    document.body.classList.toggle('hud-modern',hudMode==='modern');
    document.body.classList.toggle('hud-classic',hudMode==='classic');
    if(persist)writeHudMode(hudMode);
    syncHudModeButton();
    updateModernBattleHud();
    updateSpecialHud();
    updateBossHpHud();updateModernBattleHud();
  }
  function toggleHudMode(){applyHudMode(hudMode==='modern'?'classic':'modern');}
  function modernNormalProgress(){
    if(mode==='white')return Math.max(0,Math.min(9,whiteQuestionInDepth));
    return Math.max(0,Math.min(10,stageQuestion));
  }
  function rebuildEnemyRing(total){
    if(!els.enemyRingSegments)return;
    total=Math.max(1,Number(total)||1);
    if(Number(els.enemyRingSegments.dataset.total)===total)return;
    els.enemyRingSegments.dataset.total=String(total);els.enemyRingSegments.replaceChildren();
    const span=total===1?0:280/(total-1);
    for(let i=0;i<total;i++){
      const seg=document.createElement('i');seg.style.setProperty('--seg-angle',`${-140+i*span}deg`);els.enemyRingSegments.appendChild(seg);
    }
  }
  function updateModernBattleHud(){
    if(!els.heroLifeHud||!els.enemyRingHud)return;
    const lifePips=[...els.heroLifeHud.children];lifePips.forEach((p,i)=>p.classList.toggle('active',i<lives));
    els.heroLifeHud.setAttribute('aria-label',`ライフ ${Math.max(0,lives)} / 3`);
    let total=10,value=modernNormalProgress(),label='PROGRESS',aria=`通常問題 ${value} / ${total}`,critical=false;
    if(bossPhase){
      total=mode==='white'?1:5;value=mode==='white'?Math.max(0,1-bossQuestion):Math.max(0,Math.min(5,5-bossQuestion));label='BOSS HP';aria=`ボスHP ${value} / ${total}`;critical=value===1;
    }
    rebuildEnemyRing(total);
    const segments=[...els.enemyRingSegments.children];
    segments.forEach((seg,i)=>{
      const active=bossPhase?i<value:i<value;
      seg.classList.toggle('active',active);seg.classList.toggle('cleared',!bossPhase&&active);seg.classList.toggle('lost',bossPhase&&!active);
    });
    els.enemyRingHud.classList.toggle('boss-mode',bossPhase);
    els.enemyRingHud.classList.toggle('critical',bossPhase&&critical);
    els.enemyRingHud.classList.toggle('empty',bossPhase&&value<=0);
    if(els.enemyRingText)els.enemyRingText.textContent=`${value} / ${total}`;
    if(els.enemyRingLabel)els.enemyRingLabel.textContent=label;
    els.enemyRingHud.setAttribute('aria-label',aria);
    syncModernTimerHud();
  }
  function syncModernTimerHud(){
    if(!els.questionTimerHud||!els.questionTimerText)return;
    const limit=Math.max(1,Number(timerLimit)||1),left=Math.max(0,Number(timeLeft)||0),pct=Math.max(0,Math.min(100,left/limit*100));
    els.questionTimerText.textContent=left;
    els.questionTimerHud.style.setProperty('--timer-pct',pct.toFixed(3));
    els.questionTimerHud.classList.toggle('time-pressure',left<=30);
    els.questionTimerHud.classList.toggle('time-critical',left<=10);
    els.questionTimerHud.setAttribute('aria-label',`残り${left}秒`);
  }

  function renderGame(){
    const s=currentStage(),stageProgress=stageDisplayProgress();document.body.dataset.mode=mode;document.body.dataset.stage=mode==='white'?`depth-${whiteDepth}`:(mode==='end'&&endFinalPhase)?'final':stageIndex;
    if(mode==='white'){els.progressText.textContent=`${whiteQuestionInDepth} / 10`;els.progressFill.style.width=`${Math.min(100,whiteQuestionInDepth/10*100)}%`;els.stageLabel.textContent=`DEPTH ${whiteDepth}`;els.stageName.textContent=bossPhase?'BOSS QUESTION':'ENDLESS CHALLENGE';}
    else if((mode==='crimson'&&crimsonLastPhase)||(mode==='end'&&endFinalPhase)){const finalStart=stageRunTotal(),finalTotal=finalStart+Math.max(1,Number(s.count)||5);els.progressText.textContent=`${Math.min(finalTotal,totalProgress)} / ${finalTotal}`;els.progressFill.style.width=`${Math.min(100,Math.max(0,(totalProgress-finalStart)/Math.max(1,Number(s.count)||5)*100))}%`;els.stageLabel.textContent=mode==='end'?'FINAL':'LAST BOSS';els.stageName.textContent=s.name;}else{const stageCount=Math.max(1,Number(s.count)||1);els.progressText.textContent=`${stageProgress} / ${stageCount}`;els.progressFill.style.width=`${stageProgress/stageCount*100}%`;els.stageLabel.textContent=`STAGE ${stageIndex+1}`;els.stageName.textContent=s.name;}
    els.lifeDisplay.textContent=[0,1,2].map(i=>i<lives?'◆':'◇').join(' ');els.lifeDisplay.setAttribute('aria-label',`ライフ ${Math.max(0,lives)} / 3`);els.timerText.textContent=timeLeft;fitSingleLineText(els.stageName,{maxWidthRatio:.42,minPx:10});
    const blueAdult=isBlueAdultPhase();const battleBgFile=isBlueStage5()?(blueAdult?'blue_stage5_after.png':'blue_stage5_before.png'):s.bg;els.battleBg.style.backgroundImage=`url('./assets/${battleBgFile}')`;
    let heroWorld=mode;if(mode==='end')heroWorld=currentEndHeroWorld();if(mode==='white')heroWorld='front';document.body.dataset.heroWorld=heroWorld;
    els.heroImage.src=mode==='white'?'./assets/hero.png':mode==='end'?`./assets/${END_HERO_FILES[heroWorld]}`:mode==='front'?'./assets/hero.png':mode==='back'?'./assets/back_hero.png':mode==='crimson'?'./assets/crimson_hero.png':mode==='blue'?(blueAdult?'./assets/blue_hero_adult.png':'./assets/blue_hero.png'):mode==='silver'?'./assets/silver_hero.png':'./assets/midori_hero_pirate_captain.png';
    els.heroName.textContent=mode==='white'?'ゆうしゃ':mode==='end'?END_HERO_NAMES[heroWorld]:mode==='front'?'ゆうしゃ':mode==='back'?'魔法少女':mode==='crimson'?'流浪の剣士':mode==='blue'?(blueAdult?'青年':'少年'):mode==='silver'?'銀狼の少女':'海賊船長';
    const en=bossPhase?currentBoss():currentMonster;if(en){applyEnemyFacing(en);setEnemyNameDisplay(en);fitSingleLineText(els.enemyName,{maxWidthRatio:.31,minPx:9});}else setEnemyNameDisplay(null);
    const endCorrupted=mode==='end'&&bossPhase&&!!en?.boss;if(endCorrupted){document.body.classList.add('end-boss-corruption-active');document.body.dataset.endBossWorld=en.sourceWorld||'front';els.enemyActor.classList.add('end-corrupted-boss');}else{document.body.classList.remove('end-boss-corruption-active');document.body.removeAttribute('data-end-boss-world');els.enemyActor.classList.remove('end-corrupted-boss');}
    syncWorldBossAura();
    const choiceCaption=document.querySelector('.question-panel .choice-caption');
    if(choiceCaption)choiceCaption.textContent=['crimson','blue','silver','midori','end','white'].includes(mode)?'答えを選ぼう':'こたえを えらぼう';
    updateBossHpHud();updateModernBattleHud();
  }

  function syncPauseButton(){
    if(!els.pauseBtn)return;
    const playable=!els.gameScreen.hidden&&!paused&&!gameOverActive&&!locked&&!silverSpecialBusy&&!crimsonMoonShiftBusy&&!blueSpecialBusy&&!specialActive&&!!timerId&&!!currentQuestion;
    els.pauseBtn.disabled=!playable;
    els.pauseBtn.setAttribute('aria-disabled',playable?'false':'true');
    syncMidoriSpecialControls();
  }
  function stopTimer(){clearInterval(timerId);timerId=null;syncPauseButton();}
  function updateTimerUrgency(){
    const timer=els.timerText?.closest('.timer');
    if(timer){
      // The last 30 seconds are visually urgent for every question, not only boss actions.
      timer.classList.toggle('time-pressure',timeLeft<=30);
      timer.classList.toggle('time-critical',timeLeft<=10);
    }
    syncModernTimerHud();
  }
  function playCountCueOnce(){
    if(countCuePlayed)return;
    countCuePlayed=true;
    playSE(countSE);
  }
  function startTimer(seconds=60,{preserveCountCue=false,preserveLimit=false}={}){
    stopTimer();if(!preserveCountCue)countCuePlayed=false;if(!preserveLimit)timerLimit=Math.max(1,Number(seconds)||60);timeLeft=seconds;els.timerText.textContent=timeLeft;updateTimerUrgency();
    // Boss STAGE3+ fifth actions start directly at 30 seconds, so cue immediately there.
    if(timeLeft<=30)playCountCueOnce();
    timerId=setInterval(()=>{timeLeft--;els.timerText.textContent=timeLeft;updateTimerUrgency();if(timeLeft===30)playCountCueOnce();if(timeLeft<=0){stopTimer();resolveAnswer(null,true);}},1000);syncPauseButton();updateSpecialHud();
    if(document.hidden)setTimeout(()=>pauseGame('visibility'),0);
  }
  function playSE(a){if(!soundOn)return;try{a.currentTime=0;a.play().catch(()=>{});}catch{}}
  function stopSE(a){try{a.pause();a.currentTime=0;}catch{}}
  function activeHeroWorld(){return mode==='end'?currentEndHeroWorld():mode==='white'?'front':mode;}
  function playAttackSE(){
    if(!soundOn)return;
    const hw=activeHeroWorld();
    const a=mode==='end'?(hw==='back'?magicSE:swordSE):(mode==='midori'?gunSE:mode==='back'?magicSE:swordSE);
    try{a.currentTime=0;a.play().catch(()=>playSE(correctSE));}catch{playSE(correctSE);}
  }
  function clearBattleFx(){
    els.heroActor.classList.remove('attack-front','attack-back','finisher-front','finisher-back');
    els.enemyActor.classList.remove('hit','finisher-hit','finisher-midori-hit');
    document.querySelector('.battlefield')?.classList.remove('midori-finisher-impact');
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
    els.heroActor.classList.remove('attack-front','attack-back','finisher-front','finisher-back');els.enemyActor.classList.remove('hit','finisher-hit');els.attackEffect.className='attack-effect';void els.heroActor.offsetWidth;void els.attackEffect.offsetWidth;const hw=activeHeroWorld();
    if(mode==='end'){
      const magic=hw==='back';els.heroActor.classList.add(magic?'attack-back':'attack-front');els.attackEffect.classList.add(`end-hit-${hw}`);els.enemyActor.classList.add('hit');playAttackSE();return;
    }
    const magicVisual=hw==='back'||hw==='blue';els.heroActor.classList.add(magicVisual?'attack-back':'attack-front');els.attackEffect.classList.add(magicVisual?'back-hit':'front-hit');els.enemyActor.classList.add('hit');playAttackSE();
  }
  function playFinisherSE(){
    if(!soundOn)return;const hw=activeHeroWorld();const a=mode==='end'?(hw==='back'?backFinisherSE:frontFinisherSE):(hw==='midori'?midoriFinisherSE:hw==='back'?backFinisherSE:frontFinisherSE);try{a.currentTime=0;const promise=a.play();if(promise&&typeof promise.catch==='function')promise.catch(()=>playAttackSE());}catch{playAttackSE();}
  }
  function runFinisherMotion(){
    els.heroActor.classList.remove('attack-front','attack-back','finisher-front','finisher-back');els.enemyActor.classList.remove('hit','finisher-hit','finisher-midori-hit');const battlefield=document.querySelector('.battlefield');battlefield?.classList.remove('midori-finisher-impact');els.attackEffect.className='attack-effect';void els.heroActor.offsetWidth;void els.attackEffect.offsetWidth;const hw=activeHeroWorld();
    if(mode==='end'){
      const magic=hw==='back';els.heroActor.classList.add(magic?'finisher-back':'finisher-front');els.attackEffect.classList.add(`end-finisher-${hw}`);els.enemyActor.classList.add('finisher-hit');playFinisherSE();return;
    }
    if(hw==='midori'){els.heroActor.classList.add('finisher-front');els.attackEffect.classList.add('finisher-midori-fx');els.enemyActor.classList.add('finisher-midori-hit');battlefield?.classList.add('midori-finisher-impact');playFinisherSE();return;}
    const magicVisual=hw==='back'||hw==='blue';els.heroActor.classList.add(magicVisual?'finisher-back':'finisher-front');els.attackEffect.classList.add(magicVisual?'finisher-back-fx':'finisher-front-fx');els.enemyActor.classList.add('finisher-hit');playFinisherSE();
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
  function showBgmTitleToast(file){
    if(!file)return;const battlefield=document.querySelector('.battlefield');if(!battlefield)return;let toast=$('bgmTitleToast');
    if(!toast){toast=document.createElement('div');toast.id='bgmTitleToast';toast.className='bgm-title-toast';battlefield.appendChild(toast);}
    const title=String(file).replace(/\.mp3$/i,'');toast.innerHTML=`<small>NOW PLAYING</small><strong>♪ ${title}</strong>`;toast.classList.remove('show');void toast.offsetWidth;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2300);
  }
  function currentStageBgmFile(){
    const s=currentStage();return bossPhase?s?.bossBgm:s?.bgm;
  }
  function stageBgmPlayerMatches(file){
    if(!file||!stageBgmPlayer.src)return false;
    try{return decodeURIComponent(stageBgmPlayer.src).endsWith(`/assets/${file}`);}catch{return stageBgmPlayer.src.endsWith(`/assets/${file}`);}
  }
  async function resumeStageBgmForCurrentState(){
    if(!soundOn||paused||gameOverActive||els.gameScreen.hidden)return;
    const file=currentStageBgmFile();
    if(!file)return;
    if(stageBgmPlayerMatches(file)){
      try{stageBgmPlayer.loop=true;stageBgmPlayer.muted=false;stageBgmPlayer.volume=.32;await stageBgmPlayer.play();currentBgm=stageBgmPlayer;return;}catch{}
    }
    await playStageBgm();
  }
  async function playStageBgm(){
    if(!soundOn)return;
    const file=currentStageBgmFile();
    if(!file){try{stageBgmPlayer.pause();}catch{}currentBgm=null;return;}
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
      currentBgm=player;showBgmTitleToast(file);
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
// 紅以降は、幼い表記の基本操作TIPから「学習＋攻略」へ内容を段階的に切り替える。
// 光・裏は従来のTIPプールをそのまま使用する。
const ADVANCED_MAP_TIPS={
  crimson:[
    {key:'crimson-order',category:'計算の順序',text:'掛け算・割り算は、足し算・引き算より先に計算する。式を小さな段階に分けて確認しよう。'},
    {key:'crimson-review',category:'再挑戦',text:'ライフが尽きたときは「今回の振り返り」を確認し、同じ間違いを一つずつ減らしていこう。'},
    {key:'crimson-secret',category:'SECRET RELIC',text:'ショップでは手に入らない特別なアイテムが存在する。コレクションや図鑑の完成にも意味があるようだ。'},
    {key:'crimson-book',category:'図鑑の秘密',text:'★4・★5のモンスターを集めることは、図鑑を埋める以上の意味を持つことがある。'},
    {key:'crimson-unlock',category:'世界を開く鍵',text:'次の世界に必要な証は、一つの世界だけで揃うとは限らない。以前の世界の図鑑も見直してみよう。'}
  ],
  blue:[
    {key:'blue-fraction',category:'分数',text:'分母が違う分数の足し算・引き算は、まず通分して分母をそろえる。'},
    {key:'blue-rate',category:'割合',text:'割合は「比べる量 ÷ もとにする量」。何を基準にしているかを先に確認しよう。'},
    {key:'blue-speed',category:'速さ',text:'速さ・時間・道のりのうち、何を求める問題なのかを整理してから式を作ろう。'},
    {key:'blue-review',category:'再挑戦',text:'振り返りに出たアドバイスは、次の挑戦でも使える。答えだけでなく考え方を確認しよう。'},
    {key:'blue-unlock',category:'世界を開く鍵',text:'新しい世界への道には、複数の世界で得た「珍しい出会いの証」が関わることがある。'}
  ],
  silver:[
    {key:'silver-ratio',category:'比',text:'比は両方の数を同じ倍率で変えても関係が変わらない。できるだけ簡単な比に直して考えよう。'},
    {key:'silver-circle',category:'円',text:'半径と直径を取り違えないように注意。円周と面積では使う式も異なる。'},
    {key:'silver-relation',category:'比例・反比例',text:'比例では一方が何倍なら他方も同じ倍率。反比例では積が一定になることを利用しよう。'},
    {key:'silver-book',category:'図鑑を確認',text:'未遭遇の★4・★5が残っていないか確認してみよう。世界を進めるための証につながることがある。'},
    {key:'silver-review',category:'複数段階の問題',text:'一度に答えを出そうとせず、「先に何を求めるか」を決めると計算が整理しやすい。'}
  ],
  midori:[
    {key:'midori-unit',category:'単位換算',text:'kmとm、LとmL、m²とcm²など、単位をそろえてから計算しよう。面積の換算では倍率にも注意。'},
    {key:'midori-logic',category:'条件整理',text:'条件が多い問題は、当てはまらない選択肢を一つずつ消すと判断しやすい。'},
    {key:'midori-area',category:'面積',text:'複合図形は、知っている図形に分けるか、大きな図形から不要な部分を引いて考えよう。'},
    {key:'midori-secret',category:'SECRET RELIC',text:'世界を開く証には、複数の世界の図鑑制覇で得られるものもある。★4・★5の未遭遇を確認しよう。'},
    {key:'midori-review',category:'再挑戦',text:'間違えた問題の種類を見直し、次の挑戦では最初の一手を変えてみよう。'}
  ],
  end:[
    {key:'end-review',category:'再挑戦',text:'ライフが尽きても、振り返りから弱点を確認できる。領域ボスでは特殊行動の仕組みも読み直そう。'},
    {key:'end-river',category:'時空河',text:'道中に現れるのは、かつて戦った強敵たち。終界ボスだけが時空河の侵食によって異なる力を得ている。'},
    {key:'end-integrate',category:'総合問題',text:'難しい問題ほど、単位・計算順序・条件を分けて整理する。複数の知識を一度に使おうとしないことが近道。'},
    {key:'end-relic',category:'その先へ',text:'終の世界を越えた証にも、まだ役割が残されている。最後まで集めたコレクションと図鑑を確認しよう。'},
    {key:'end-boss',category:'終界ボス',text:'特殊行動で式や見た目が変わっても、問題の基本となる計算規則まで変わるわけではない。'}
  ]
};
let lastMapTipKey='',pendingReviewTip=null;
function currentMapSecretTipTier(){
  if(save.secretRelics?.includes('uncommon_master')||save.silverClears>0)return 3;
  if(save.secretRelics?.includes('common_master')||save.crimsonClears>0)return 2;
  if(save.backUnlocked||save.frontClears>0)return 1;
  return 0;
}
function chooseMapTip(){
  let tip=null;
  // 紅以降では、直前のGAME OVERで得た学習ポイントを一度だけ最優先する。
  if(['crimson','blue','silver','midori','end'].includes(mode)){
    if(pendingReviewTip){tip=pendingReviewTip;pendingReviewTip=null;lastMapTipKey=tip.key;return tip;}
    const advanced=ADVANCED_MAP_TIPS[mode]||ADVANCED_MAP_TIPS.crimson;
    const pool=advanced.filter(t=>t.key!==lastMapTipKey);
    tip=pick(pool.length?pool:advanced);lastMapTipKey=tip.key;return tip;
  }
  // 光・裏は従来どおり、基本操作とコレクション導線を中心に表示する。
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
    els.mapModeLabel.textContent=mode==='front'?'WORLD MAP':mode==='back'?'BACK WORLD':mode==='crimson'?'CRIMSON WORLD':mode==='blue'?'BLUE WORLD':mode==='silver'?'SILVER WORLD':mode==='midori'?'EMERALD SEA':'TIME RIVER';
    els.mapTitle.textContent=mode==='front'?'ぼうけんの ちず':mode==='back'?'ウラのせかい':mode==='crimson'?'紅の世界':mode==='blue'?'蒼の世界':mode==='silver'?'銀の世界':mode==='midori'?'FAIRWAY':'終の世界';
    els.mapImage.src=mode==='front'?'./assets/world_map_v3_clean.png':mode==='back'?'./assets/back_map.png':mode==='crimson'?'./assets/crimson_map.png':mode==='blue'?'./assets/blue_map.png':mode==='silver'?'./assets/silver_map.png':mode==='midori'?`./assets/midori_fairway_map_${Math.max(1,Math.min(5,stageIndex+1))}.png`:'./assets/end_world_map.png';
    els.mapImage.alt=mode==='midori'?`翠の世界 FAIRWAY 航海図・STAGE ${stageIndex+1}`:mode==='end'?'終の世界・時空河マップ':'ワールドマップ';
    const mapLinesFront=['森を抜けて、つぎの地へ。','洞くつの先へ進みます…','塔へ向かっています…','まおうの城へ進軍中…','決戦の部屋へ向かいます…'],mapLinesBack=['渋谷の裂け目へ移動中…','浅草の夜へ向かいます…','スカイツリー方面へ移動中…','都庁前へ急行中…','都庁屋上へ向かいます…'],mapLinesCrimson=['実りの里へ向かいます…','紅葉隠れの社へ進みます…','湯煙の古宿へ向かいます…','錦秋の城下へ進みます…','月影の山城へ向かいます…'],mapLinesBlue=['昔ながらの田舎町へ向かいます…','山の秘密基地へ進みます…','夏祭りの灯りへ向かいます…','夕暮れの公園へ進みます…','あの家へ帰ります…'],mapLinesSilver=['孤独の雪原へ踏み出します…','氷鏡の美術館へ向かいます…','天穹の雪嶺を登ります…','白夜の大天幕へ進みます…','世界の果てへ向かいます…'],mapLinesMidori=['出航の港島へ向かいます…','翠海の群島へ船を進めます…','翠深の遺跡島へ上陸します…','黒帆大船団へ突入します…','大渦の秘宝島へ向かいます…'];
    const mapLinesEnd=buildEndStages().map((st,i)=>i===0?'翠の海の先から、大時空支流へ入ります…':`${st.name}へ時空河を進みます…`);
    const lines=mode==='front'?mapLinesFront:mode==='back'?mapLinesBack:mode==='crimson'?mapLinesCrimson:mode==='blue'?mapLinesBlue:mode==='silver'?mapLinesSilver:mode==='midori'?mapLinesMidori:mapLinesEnd;els.mapMessage.textContent=lines[stageIndex]||(initial?'最初のエリアへ向かっています…':'次のエリアへ移動しています…');
    const tip=chooseMapTip();if(els.mapTipCategory)els.mapTipCategory.textContent=tip.category;if(els.mapTipText)els.mapTipText.textContent=tip.text;if(mapAdvanceResolve)mapAdvanceResolve=null;if(mapAdvanceTimer){clearTimeout(mapAdvanceTimer);mapAdvanceTimer=null;}if(els.mapVisual)els.mapVisual.disabled=true;if(els.mapNextBtn)els.mapNextBtn.disabled=true;els.mapOverlay.hidden=false;
  }

  function prepareStageOverlay(){
    const s=currentStage();els.stagePreview.style.backgroundImage=`url('./assets/${s.bg}')`;els.stageOverlayLabel.textContent=mode==='end'&&endFinalPhase?'FINAL':`STAGE ${stageIndex+1}`;els.stageOverlayName.textContent=s.name;els.stageOverlay.hidden=false;requestAnimationFrame(()=>fitSingleLineText(els.stageOverlayName,{maxWidthRatio:.90,minPx:20}));
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
    els.specialFill.style.width=`${value}%`;els.specialHud.style.setProperty('--meter-pct',value);
    els.specialHud.classList.toggle('ready',value>=100);
    const midoriBlocked=midoriSpecialBlocksAssist();
    const canUse=value>=100&&!midoriBlocked&&!specialActive&&!crimsonMoonShiftBusy&&!silverSpecialBusy&&!blueSpecialBusy&&!paused&&!gameOverActive&&!locked&&!!currentQuestion&&!!timerId&&!els.gameScreen.hidden;
    els.specialBtn.hidden=value<100||midoriBlocked||!currentQuestion||!timerId||paused||gameOverActive||specialActive;
    els.specialBtn.disabled=!canUse;
    els.specialBtn.setAttribute('aria-disabled',canUse?'false':'true');
  }
  function restoreChoiceInteractivity(){
    if(!els.choices)return;
    const buttons=[...els.choices.children];
    const globallyLocked=paused||specialActive||locked||silverSpecialBusy||crimsonMoonShiftBusy||blueSpecialBusy;
    if(globallyLocked){buttons.forEach(b=>b.disabled=true);return;}

    const viable=b=>b.dataset.eliminated!=='true'&&!b.classList.contains('mirror-vanished');
    if(midoriSpecialState?.type==='tide'&&!midoriSpecialState.ready){buttons.forEach(b=>b.disabled=true);syncMidoriSpecialControls();return;}
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
    if(midoriSpecialBlocksAssist()||specialActive||crimsonMoonShiftBusy||silverSpecialBusy||blueSpecialBusy||paused||gameOverActive||locked||specialGauge<100||!currentQuestion||!timerId)return;
    const wrongButtons=[...els.choices.children].filter(b=>b.dataset.eliminated!=='true'&&b.dataset.mirrorFake!=='true'&&!answersEqual(b.dataset.answerValue??b.textContent,currentQuestion.answer));
    if(!wrongButtons.length)return;
    specialActive=true;locked=true;
    const resumeTime=timeLeft;
    stopTimer();updateSpecialHud();syncPauseButton();
    [...els.choices.children].forEach(b=>b.disabled=true);
    document.body.classList.add('special-assist-active');
    specialGauge=0;updateSpecialHud();
    const heroFile=mode==='white'?'hero.png':mode==='end'?END_HERO_FILES[currentEndHeroWorld()]:mode==='front'?'hero.png':mode==='back'?'back_hero.png':mode==='crimson'?'crimson_hero.png':mode==='midori'?'midori_hero_pirate_captain.png':'silver_hero.png';
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
    syncMidoriAfterElimination();restoreChoiceInteractivity();
    updateSpecialHud();syncPauseButton();
    if(currentQuestion&&timeLeft>0&&!paused&&!gameOverActive)startTimer(resumeTime,{preserveCountCue:true,preserveLimit:true});
  }

  function questionHasFractionChoices(q){
    const values=Array.isArray(q?.choices)&&q.choices.length?q.choices:[q?.answer];
    return values.some(v=>!!parseFractionKey(v));
  }
  function setFractionQuestionLayout(problemFraction=false,choiceFraction=false){
    const panel=els.mathProblem.closest('.question-panel');
    if(!panel)return;
    panel.classList.toggle('fraction-question',!!problemFraction);
    panel.classList.toggle('fraction-choice-question',!!choiceFraction&&!problemFraction);
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
  function expressionNeedsEqualsPrompt(expression=''){
    const text=String(expression??'').trim();
    if(!text||/[?？□=＝]/.test(text))return false;
    // Natural-language prompts, labels, ratios and classifications are questions in their
    // own right. Appending "=?" to them is semantically wrong (notably in ratio tasks).
    if(/[ぁ-んァ-ヶ一-龯々]/.test(text)||text.includes(':')||text.includes('：'))return false;
    // Only compact arithmetic expressions receive the traditional "=?" suffix.
    return /^[0-9０-９\s.,．+＋\-−ー×÷*/()%％]+$/.test(text);
  }
  function questionDisplayText(q){
    if(q?.displayExpression!=null)return String(q.displayExpression);
    const expression=String(q?.expression??'');
    return expressionNeedsEqualsPrompt(expression)?`${expression}=?`:expression;
  }
  function fitMathProblemToBox(q=currentQuestion){
    const el=els.mathProblem,box=el?.closest('.equation-box');
    if(!el||!box)return;
    resetMathProblemFit();
    if(q?.fraction||q?.visualType)return;
    const maxWidth=Math.max(100,box.clientWidth-18);
    const maxHeight=Math.max(42,box.clientHeight-10);
    const portrait=window.matchMedia?.('(orientation:portrait)').matches;
    const lowLandscape=!portrait&&window.innerHeight<=500;
    const shown=String(q?.displayExpression??q?.expression??'');
    const textual=/[ぁ-んァ-ヶ一-龯々]/.test(shown)||shown.length>=22;
    const base=parseFloat(getComputedStyle(el).fontSize)||32;
    const minSingle=portrait?20:(lowLandscape?17:22);
    let size=textual?Math.min(base,portrait?27:(lowLandscape?20:30)):base;
    el.style.maxWidth=`${maxWidth}px`;
    el.style.fontSize=`${size}px`;
    el.style.whiteSpace='nowrap';
    while(el.scrollWidth>maxWidth&&size>minSingle){size=Math.max(minSingle,size-1);el.style.fontSize=`${size}px`;}
    if(textual||el.scrollWidth>maxWidth){
      el.style.width=`${maxWidth}px`;
      el.style.maxWidth=`${maxWidth}px`;
      el.style.whiteSpace='normal';
      el.style.display='block';
      el.style.textAlign='center';
      el.style.lineHeight=textual?'1.22':'1.15';
      el.style.overflowWrap='anywhere';
      el.style.wordBreak='normal';
      size=Math.min(size,minSingle);el.style.fontSize=`${size}px`;
      const minWrap=lowLandscape?13:15;
      while(el.scrollHeight>maxHeight&&size>minWrap){size--;el.style.fontSize=`${size}px`;}
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
    const problemFraction=!!q?.fraction||!!q?.htmlExpression;setFractionQuestionLayout(problemFraction,questionHasFractionChoices(q));setMimesisQuestionLayout(q?.visualType||'',(mode==='silver'&&bossPhase&&stageIndex===4)||(mode==='end'&&bossPhase&&!endFinalPhase&&currentEndSource()==='silver'));resetMathProblemFit();
    if(renderMimesisVisual(q))return;if(renderBlueFadeParts(q)){fitMathProblemToBox(q);return;}
    if(q?.htmlExpression)els.mathProblem.innerHTML=q.htmlExpression;else if(q?.fraction)els.mathProblem.innerHTML=fractionExpressionHtml(q.a,q.op,q.b);else els.mathProblem.textContent=questionDisplayText(q);fitMathProblemToBox(q);
  }
  function renderChoiceButton(b,v,answer){
    b.dataset.answerValue=answerKey(v);
    const f=parseFractionKey(v);if(f)b.innerHTML=fractionHtml(f);else b.textContent=v;
    if(typeof v==='string'&&!f&&!/^[-+]?\d+(?:\.\d+)?$/.test(v)&&!/^\d+:\d+$/.test(v))b.classList.add('text-choice');
    applyDebugAnswerHint(b,v,answer);b.onclick=()=>resolveAnswer(v,false);
  }
  function choicesForQuestion(q){return Array.isArray(q?.choices)&&q.choices.length?shuffle(q.choices):makeChoices(q.answer);}
  function battleQuestionTime(){if(mode==='white')return whiteBeyondActive?60:whiteQuestionTime();if(mode==='end'&&endFinalPhase)return [45,20,40,40,30][Math.max(0,Math.min(4,bossQuestion))];return 60;}
  function prepareQuestion(){
    clearMonsterAnnouncement();locked=true;clearBattleFx();renderGame();
    currentQuestion=mode==='white'?(whiteBeyondActive?makeWhiteBeyondQuestion():makeWhiteQuestion(whiteDepth,{boss:bossPhase})):bossPhase?makeBossQuestion(stageIndex):(mode==='front'?makeFrontQuestion(stageIndex):mode==='back'?makeBackQuestion(stageIndex):mode==='crimson'?makeCrimsonQuestion(stageIndex):mode==='blue'?makeBlueQuestion(stageIndex):mode==='silver'?makeSilverQuestion(stageIndex):mode==='midori'?makeMidoriQuestion(stageIndex):makeEndQuestion(currentEndSource()));
    renderQuestionContent(currentQuestion);els.feedbackText.textContent='';els.choices.innerHTML='';choicesForQuestion(currentQuestion).forEach(v=>{const b=document.createElement('button');renderChoiceButton(b,v,currentQuestion.answer);els.choices.appendChild(b);});updateBlueStage5Dimming();locked=false;if(mode==='end'&&endFinalPhase)applyEndFinalQuestionModifier(bossQuestion===4&&bossSpecialSequence?.type==='end-final-convergence'?bossSpecialSequence.step:null);syncPauseButton();updateSpecialHud();
  }

  function clearQuestionUi(){clearEndSpecialEffects();setFractionQuestionLayout(false,false);setMimesisQuestionLayout('',false);resetMathProblemFit();const panel=els.mathProblem?.closest('.question-panel');panel?.classList.remove('midori-tide-question');els.mathProblem.textContent='';els.feedbackText.textContent='';els.choices.innerHTML='';updateSpecialHud();}
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
        <small id="bossNameKicker">BOSS ENCOUNTER</small><strong id="bossNameText"></strong><em id="bossNameEnglish"></em>
      </div>
      <div id="bossCutin" class="boss-cutin" hidden aria-hidden="true">
        <div class="cutin-dim"></div><div class="cutin-slash slash-a"></div><div class="cutin-slash slash-b"></div>
        <div class="cutin-band"><img class="cutin-art" alt=""><div class="cutin-speedlines"></div></div><div class="cutin-white"></div>
      </div>
      <div class="boss-obscurer one">★</div><div class="boss-obscurer two">★</div><div class="boss-obscurer three">★</div><div class="boss-obscurer four">★</div><div class="boss-obscurer five">★</div><div class="boss-obscurer six">★</div>`;
    document.querySelector('.battlefield').appendChild(layer);return layer;
  }
  async function showMonsterEntrance(monster){
    const layer=ensureMonsterFx();clearMonsterAnnouncement();els.enemyActor.style.opacity='0';els.enemyActor.style.transform='translateY(12px) scale(.92)';const w=$('rarityWarning');
    if(mode==='end'&&monster?.endPastBoss){w.hidden=true;w.textContent='';els.enemyActor.classList.add('spawn-end-past-boss');els.enemyActor.style.opacity='1';els.enemyActor.style.transform='';await sleep(920);els.enemyActor.classList.remove('spawn-end-past-boss');clearMonsterAnnouncement();return;}
    const entranceLabel=monster.rarity===5?'★★★★★ SSR':monster.rarity===4?'★★★★ SR':monster.rarity===3?'★★★ RARE':'';w.className=`rarity-warning rarity-${monster.rarity}${monster.rarity>=4?' rarity-high':''}`;w.textContent=entranceLabel;if(monster.rarity>=4)layer.classList.add(`rare-arrival-${monster.rarity}`);if(monster.rarity>=3){w.hidden=false;await sleep(monster.rarity===5?760:monster.rarity===4?560:420);w.hidden=true;w.textContent='';}else{w.hidden=true;w.textContent='';}els.enemyActor.classList.add(`spawn-r${monster.rarity}`);els.enemyActor.style.opacity='1';els.enemyActor.style.transform='';await sleep([0,380,520,760,1050,1450][monster.rarity]);els.enemyActor.classList.remove(`spawn-r${monster.rarity}`);layer.classList.remove('rare-arrival-4','rare-arrival-5');clearMonsterAnnouncement();
  }

  async function showBossWarning(){
    ensureMonsterFx();clearMonsterAnnouncement();
    const fx=$('bossWarningFx'),label=fx?.querySelector('strong'),sub=fx?.querySelector('span');
    const endWarning=mode==='end',world=endFinalPhase?'front':(endWarning?currentEndSource():'');
    hideSpecialHudForCutin();
    try{
      if(label)label.textContent='WARNING!';
      if(sub)sub.textContent=endWarning?(endFinalPhase?'TERMINAL ENTITY DETECTED':'TEMPORAL CORRUPTION DETECTED'):'HOSTILE SIGNATURE DETECTED';
      fx.hidden=false;fx.className=`boss-warning-fx active${endWarning?` end-warning end-warning-${world}`:''}`;
      playSE(sirenSE);
      await sleep(endWarning?3200:3000);
    }finally{
      stopSE(sirenSE);
      if(fx){fx.hidden=true;fx.className='boss-warning-fx';}
      restoreSpecialHudAfterCutin();
    }
  }

  function playEndCorruptionNoise(){
    if(!soundOn)return;
    try{endCorruptionNoiseSE.pause();endCorruptionNoiseSE.currentTime=0;endCorruptionNoiseSE.play().catch(()=>{});}catch{}
  }
  function corruptedEndNameFrame(name,level=.45){
    const marks=['▯','▒','◆','◇','⌁','⊗','∞','∴','∵','Ξ'];
    return [...String(name)].map((ch,i)=>{
      if(/\s|・|ー|—/.test(ch))return ch;
      const wave=((i*17+String(name).length*11)%100)/100;
      return wave<level?marks[(i*7+Math.floor(level*10))%marks.length]:ch;
    }).join('');
  }
  async function showBossName({startEndBgm=false}={}){
    const fx=$('bossNameFx'),text=$('bossNameText'),english=$('bossNameEnglish'),kicker=$('bossNameKicker'),boss=currentBoss();
    if(mode==='end'){
      const hasRewrite=!endFinalPhase&&boss.baseName&&boss.baseName!==boss.name;
      if(kicker)kicker.textContent=endFinalPhase?'TERMINAL ENTITY DETECTED':'ENDWORLD CORRUPTION';
      if(english)english.textContent='';
      if(!hasRewrite&&!endFinalPhase&&String(boss.name||'').startsWith('終'))text.innerHTML=`<span class="end-red-glyph">終</span>${String(boss.name).slice(1)}`;else text.textContent=hasRewrite?boss.baseName:boss.name;
      fx.hidden=false;fx.className=`boss-name-fx active end-boss-name end-boss-name-${endFinalPhase?'front':(boss.sourceWorld||currentEndSource())}`;fitSingleLineText(text,{maxWidthRatio:.90,minPx:20});
      await sleep(hasRewrite?520:760);
      if(hasRewrite){
        fx.classList.add('end-name-corrupting');playEndCorruptionNoise();
        const delayedBgm=startEndBgm?(async()=>{await sleep(520);await playStageBgm();})():null;
        const frames=[.28,.48,.68,.82,.58,.74];
        for(const level of frames){text.textContent=corruptedEndNameFrame(boss.name,level);fitSingleLineText(text,{maxWidthRatio:.90,minPx:20});await sleep(165);}
        if(!endFinalPhase&&String(boss.name||'').startsWith('終'))text.innerHTML=`<span class="end-red-glyph">終</span>${String(boss.name).slice(1)}`;else text.textContent=boss.name;fitSingleLineText(text,{maxWidthRatio:.90,minPx:20});
        fx.classList.remove('end-name-corrupting');fx.classList.add('end-name-resolved');
        if(delayedBgm)await delayedBgm;
      }else fx.classList.add('end-name-resolved');
      if(english)english.textContent=boss.english||'';
      await sleep(endFinalPhase?2100:1750);
      fx.hidden=true;fx.className='boss-name-fx';if(english)english.textContent='';if(kicker)kicker.textContent='BOSS ENCOUNTER';return;
    }
    if(kicker)kicker.textContent='BOSS ENCOUNTER';if(english)english.textContent='';text.textContent=boss.name;
    fx.hidden=false;fx.className='boss-name-fx active';fitSingleLineText(text,{maxWidthRatio:.90,minPx:20});await sleep(3000);fx.hidden=true;fx.className='boss-name-fx';
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
    'boss_back_5.png':{y:.34,height:320,side:2},
    'end_final_yuusha.png':{y:.24,height:330,side:3}
  };
  let specialHudCutinDepth=0;
  function hideSpecialHudForCutin(){
    specialHudCutinDepth++;
    if(els.specialHud)els.specialHud.classList.add('cutin-hidden');
    if(els.bossHpHud)els.bossHpHud.classList.add('cutin-hidden');
    if(els.enemyRingHud)els.enemyRingHud.classList.add('cutin-hidden');
  }
  function restoreSpecialHudAfterCutin(){
    specialHudCutinDepth=Math.max(0,specialHudCutinDepth-1);
    if(specialHudCutinDepth===0){
      if(els.specialHud){els.specialHud.classList.remove('cutin-hidden');updateSpecialHud();}
      if(els.bossHpHud){els.bossHpHud.classList.remove('cutin-hidden');updateBossHpHud();}
      if(els.enemyRingHud){els.enemyRingHud.classList.remove('cutin-hidden');updateModernBattleHud();}
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
      const originalFacing=side==='enemy'&&!BATTLE_FLIP_FACING.has(imgFile);
      const reducedFlash=mode==='midori'||mode==='end';
      c.className=`boss-cutin active ${side==='hero'?'hero-cutin':'enemy-cutin'} ${variant==='assist'?'assist-cutin':'finisher-cutin'}${originalFacing?' cutin-original-facing':''}${reducedFlash?' reduced-flash':''}`;
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
    const delayedEndBgm=!retry&&mode==='end'&&!endFinalPhase;
    if(!retry&&!delayedEndBgm)await playStageBgm();
    await showBossName({startEndBgm:delayedEndBgm});
    if(isBlueStage5()&&!retry)prepareBlueStage5BossReveal();
    els.enemyActor.classList.add('spawn-boss');void els.enemyActor.offsetWidth;els.enemyActor.style.opacity='1';
    await sleep(1400);
    els.enemyActor.classList.remove('spawn-boss');
    if(isBlueStage5()&&!retry)await revealBlueStage5BossRoomAndHero();
    clearMonsterAnnouncement();updateBossHpHud();
    if(mode==='end'&&endFinalPhase&&!retry&&bossQuestion===0)await showBossTechnique(END_FINAL_SPECIAL.name,'TERMINAL ART');
    if(bossQuestion===4){await runBossFifthAction();return;}
    prepareQuestion();startTimer(battleQuestionTime());
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
      {type:'blue-trail-block',name:'巣道封鎖',time:60},
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
    ],
    midori:[
      {type:'midori-aim',name:'総督砲令・照準装填',time:60},
      {type:'midori-sonar',name:'深海探査・潮流同定',time:60},
      {type:'midori-rune',name:'翠刻碑文・数式封印',time:60},
      {type:'midori-route',name:'黒帆包囲・航路選別',time:60},
      {type:'midori-tide',name:'三叉潮界・大渦審判',time:60}
    ]
  };
  const CRIMSON_LAST_SPECIAL={type:'crimson-genma',name:'無明の一閃',time:15};
  const END_BOSS_SPECIALS={
    midori:{type:'end-tide-judgment',name:'万潮終界・五海裁定',time:60},
    crimson:{type:'end-genma-triple',name:'無明三界・一刀断算',time:20},
    silver:{type:'end-mimesis-equivalent',name:'万華鏡界・完全模倣',time:60},
    blue:{type:'end-blue-loop',name:'永劫回帰・終わらない夏',time:45},
    back:{type:'end-back-causal',name:'因果断裂・三重再演算',time:45}
  };
  const END_FINAL_SPECIAL={type:'end-final-convergence',name:'時空終式・五界収束',time:30};
  function currentBossSpecial(){
    if(mode==='white')return null;
    if(mode==='end'){
      if(endFinalPhase)return END_FINAL_SPECIAL;
      return END_BOSS_SPECIALS[currentEndSource()]||null;
    }
    if(mode==='crimson'&&crimsonLastPhase)return CRIMSON_LAST_SPECIAL;return BOSS_SPECIALS[mode]?.[stageIndex]||null;
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
        </div>
        <div id="endFinalConvergenceFx" class="end-final-convergence-fx" hidden>
          <div class="end-final-convergence-vignette"></div>
          <div class="end-final-convergence-orbs">
            <i class="orb-back"></i><i class="orb-crimson"></i><i class="orb-blue"></i><i class="orb-silver"></i><i class="orb-midori"></i>
          </div>
          <div class="end-final-convergence-core"><i class="core-ring ring-a"></i><i class="core-ring ring-b"></i><b></b></div>
          <div class="end-final-convergence-label"><small id="endFinalConvergenceKicker">FINAL BOSS TECHNIQUE</small><strong id="endFinalConvergenceTitle">時空終式・五界収束</strong><span id="endFinalConvergenceSub">FIVE WORLDS CONVERGE</span></div>
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
    const finalConv=$('endFinalConvergenceFx');if(finalConv){finalConv.hidden=true;finalConv.className='end-final-convergence-fx';}
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
      banner.hidden=false;requestAnimationFrame(()=>fitSingleLineText(label,{maxWidthRatio:.82,minPx:12}));banner.classList.remove('active');void banner.offsetWidth;banner.classList.add('active');
      await sleep(920);
      banner.classList.remove('active');await sleep(160);banner.hidden=true;
    }finally{document.body.classList.remove('boss-technique-active');restoreSpecialHudAfterCutin();}
  }
  const MULTI_PHASE_BOSS_SPECIALS=new Set(['shield','double','shield-reverse','reconstruct','shield-double','reverse-reconstruct','crimson-steam','silver-beast-ring','blue-endless-summer','end-tide-judgment','end-genma-triple','end-mimesis-equivalent','end-blue-loop','end-back-causal','end-final-convergence']);
  function bossTechniqueChipLabel(phase=''){
    const spec=currentBossSpecial();
    const name=spec?.name||'';
    const detail=String(phase||'').trim();
    if(!name)return detail;
    if(!detail||detail===name||!MULTI_PHASE_BOSS_SPECIALS.has(spec.type))return name;
    return detail;
  }
  function setBossStepChip(text='',step=1){
    const label=bossTechniqueChipLabel(text);
    if(!label){$('bossStrikeChip')?.remove();return;}
    let chip=$('bossStrikeChip');
    if(!chip){chip=document.createElement('span');chip.id='bossStrikeChip';chip.className='boss-strike-chip';document.querySelector('.question-panel')?.appendChild(chip);}
    chip.textContent=label;chip.dataset.step=String(step);requestAnimationFrame(()=>fitSingleLineText(chip,{maxWidthRatio:.46,minPx:8}));
  }
  function populateSpecialQuestion(q,{chip='',step=1}={}){
    clearMonsterAnnouncement();locked=true;clearBattleFx();renderGame();
    currentQuestion=q;
    renderQuestionContent(q);els.feedbackText.textContent='';els.choices.innerHTML='';
    choicesForQuestion(q).forEach(v=>{const b=document.createElement('button');renderChoiceButton(b,v,q.answer);els.choices.appendChild(b);});
    if(chip)setBossStepChip(chip,step);else{$('bossStrikeChip')?.remove();}
    locked=false;syncPauseButton();updateSpecialHud();
  }
  function clearMidoriSpecialEffects(){
    midoriSpecialState=null;
    document.body.classList.remove('midori-aim-active','midori-sonar-active','midori-rune-active','midori-route-active','midori-tide-active');
    const panel=document.querySelector('.question-panel');
    if(panel)panel.classList.remove('midori-special-panel','midori-tide-question');
    document.querySelectorAll('.midori-aim-selected,.midori-route-discarded,.midori-route-last,.midori-rune-choice').forEach(b=>b.classList.remove('midori-aim-selected','midori-route-discarded','midori-route-last','midori-rune-choice'));
    $('midoriTideView')?.remove();
  }
  function midoriSpecialBlocksAssist(){
    return !!(midoriSpecialState?.blockSpecial);
  }
  function syncMidoriSpecialControls(){
    const state=midoriSpecialState;
    if(!state)return;
    const blocked=paused||specialActive||locked||gameOverActive;
    document.querySelectorAll('.midori-tide-tab').forEach(b=>{b.disabled=blocked;});
    if(state.type==='tide'&&!state.ready){[...els.choices.children].forEach(b=>b.disabled=true);}
  }
  function syncMidoriAfterElimination(){
    const state=midoriSpecialState;if(!state)return;
    if(state.type==='aim'&&state.selected){
      const selected=[...els.choices.children].find(b=>b.dataset.answerValue===state.selected&&b.dataset.eliminated!=='true');
      if(!selected){state.selected=null;els.feedbackText.textContent='照準を解除しました。もう一度答えを選ぼう。';}
    }
    if(state.type==='route')updateMidoriRouteState();
  }
  function startMidoriAim(){
    midoriSpecialState={type:'aim',selected:null,blockSpecial:false};
    document.body.classList.add('midori-aim-active');document.querySelector('.question-panel')?.classList.add('midori-special-panel');
    els.feedbackText.textContent='答えを1回タップして照準。もう一度同じ答えで砲撃確定。';
    [...els.choices.children].forEach(b=>{
      const value=b.dataset.answerValue;
      b.onclick=()=>{
        if(locked||paused||specialActive||b.disabled)return;
        if(midoriSpecialState?.selected===value){resolveAnswer(value,false);return;}
        midoriSpecialState.selected=value;
        [...els.choices.children].forEach(x=>x.classList.toggle('midori-aim-selected',x===b));
        els.feedbackText.textContent=`照準：${b.textContent}　もう一度タップで砲撃！`;
      };
    });
  }
  function sonarRuleForQuestion(q){
    const nums=String(q?.expression||'').match(/-?\d+(?:\.\d+)?/g)?.slice(0,4).map(Number)||[];
    let step=nums.length>=2?nums[1]-nums[0]:0;
    if(!step||nums.some((v,i)=>i&&Math.abs((v-nums[i-1])-step)>.0001))step=-6;
    const amount=Math.abs(step),direction=step>0?'大きくなる':'小さくなる';
    const correct=`${amount}ずつ${direction}`;
    const opposite=`${amount}ずつ${step>0?'小さくなる':'大きくなる'}`;
    const altAmount=amount===1?2:Math.max(1,amount-1);
    const alternate=`${altAmount}ずつ${direction}`;
    return{correct,choices:shuffle([correct,opposite,alternate])};
  }
  function renderMidoriSonarAnswer(source){
    currentQuestion=source;renderQuestionContent(source);els.choices.innerHTML='';
    choicesForQuestion(source).forEach(v=>{const b=document.createElement('button');renderChoiceButton(b,v,source.answer);els.choices.appendChild(b);});
    midoriSpecialState={type:'sonar',phase:'answer',blockSpecial:false,source};
    bossSpecialSequence={type:'midori-sonar',step:'answer'};
    els.feedbackText.textContent='潮流を特定！ 規則を使って答えを選ぼう。';
    restoreChoiceInteractivity();updateSpecialHud();syncPauseButton();
  }
  function startMidoriSonar(){
    const source=currentQuestion,rule=sonarRuleForQuestion(source);
    midoriSpecialState={type:'sonar',phase:'rule',blockSpecial:true,source,rule};
    bossSpecialSequence={type:'midori-sonar',step:'rule'};
    document.body.classList.add('midori-sonar-active');document.querySelector('.question-panel')?.classList.add('midori-special-panel');
    els.mathProblem.textContent=`${questionDisplayText(source)}　変わり方を特定せよ`;
    fitMathProblemToBox({...source,displayExpression:els.mathProblem.textContent});
    els.choices.innerHTML='';
    rule.choices.forEach(text=>{const b=document.createElement('button');b.textContent=text;b.className='text-choice midori-sonar-choice';b.dataset.answerValue=text;b.onclick=()=>{
      if(locked||paused||specialActive||b.disabled)return;
      if(text===rule.correct){b.classList.add('correct');renderMidoriSonarAnswer(source);return;}
      b.classList.add('midori-sonar-rejected');b.disabled=true;els.feedbackText.textContent='その潮流ではない。差をもう一度比べよう。';
    };els.choices.appendChild(b);});
    els.feedbackText.textContent='SONAR：となり合う数の変わり方を選ぼう。';
    updateSpecialHud();syncPauseButton();
  }
  function midoriRuneExpression(value,index=0){
    const n=Number(value);if(!Number.isFinite(n))return String(value);
    const abs=Math.abs(n),sign=n<0?'-':'';
    const pairs=[];for(let a=2;a<=9;a++)if(Number.isInteger(abs/a)&&abs/a>=2&&abs/a<=12)pairs.push([a,abs/a]);
    if(pairs.length){const [a,b]=pairs[index%pairs.length];return`${sign}${a} × ${b}`;}
    const add=Math.min(9,Math.max(2,Math.floor(abs/3)||2));return`${sign}${Math.max(0,abs-add)} + ${add}`;
  }
  function startMidoriRune(){
    midoriSpecialState={type:'rune',blockSpecial:false};
    document.body.classList.add('midori-rune-active');document.querySelector('.question-panel')?.classList.add('midori-special-panel');
    [...els.choices.children].forEach((b,i)=>{if(b.dataset.eliminated==='true')return;const value=b.dataset.answerValue;b.textContent=midoriRuneExpression(value,i);b.classList.add('midori-rune-choice');b.setAttribute('aria-label',`碑文 ${b.textContent}`);});
    els.feedbackText.textContent='碑文の式が表す数を読み、答えを選ぼう。';
  }
  function updateMidoriRouteState(){
    if(midoriSpecialState?.type!=='route')return;
    const buttons=[...els.choices.children],removed=buttons.filter(b=>b.dataset.eliminated==='true'||b.classList.contains('midori-route-discarded'));
    const remaining=buttons.filter(b=>b.dataset.eliminated!=='true'&&!b.classList.contains('midori-route-discarded'));
    buttons.forEach(b=>b.classList.remove('midori-route-last'));
    if(removed.length>=2&&remaining.length===1){remaining[0].classList.add('midori-route-last');els.feedbackText.textContent='最終航路を決定。残した答えをタップして確定！';}
    else els.feedbackText.textContent='違うと思う航路を2つ消そう。もう一度タップで戻せる。';
  }
  function startMidoriRoute(){
    midoriSpecialState={type:'route',blockSpecial:false};
    document.body.classList.add('midori-route-active');document.querySelector('.question-panel')?.classList.add('midori-special-panel');
    [...els.choices.children].forEach(b=>{
      const value=b.dataset.answerValue;
      b.onclick=()=>{
        if(locked||paused||specialActive||b.disabled||b.dataset.eliminated==='true')return;
        const all=[...els.choices.children],remaining=all.filter(x=>x.dataset.eliminated!=='true'&&!x.classList.contains('midori-route-discarded'));
        if(b.classList.contains('midori-route-last')&&remaining.length===1){resolveAnswer(value,false);return;}
        b.classList.toggle('midori-route-discarded');updateMidoriRouteState();
      };
    });updateMidoriRouteState();
  }
  function midoriTideConditions(q){
    if(Array.isArray(q?.conditions)&&q.conditions.length>=3)return q.conditions.slice(0,3).map(String);
    return['条件①を確認','条件②を確認','条件③を確認'];
  }
  function startMidoriTide(){
    const source=currentQuestion,conditions=midoriTideConditions(source),seen=new Set([0]);
    midoriSpecialState={type:'tide',blockSpecial:true,source,conditions,seen,ready:false};
    document.body.classList.add('midori-tide-active');const panel=document.querySelector('.question-panel');panel?.classList.add('midori-special-panel','midori-tide-question');
    els.mathProblem.replaceChildren();
    const view=document.createElement('div');view.id='midoriTideView';view.className='midori-tide-view';
    const tabs=document.createElement('div');tabs.className='midori-tide-tabs';
    const condition=document.createElement('div');condition.className='midori-tide-condition';condition.textContent=conditions[0];
    conditions.forEach((text,i)=>{const b=document.createElement('button');b.type='button';b.className=`midori-tide-tab${i===0?' active':''}`;b.textContent=`潮流 ${['I','II','III'][i]}`;b.onclick=()=>{
      if(paused||specialActive||locked)return;seen.add(i);condition.textContent=text;[...tabs.children].forEach((x,j)=>x.classList.toggle('active',j===i));
      if(seen.size===3&&!midoriSpecialState.ready){midoriSpecialState.ready=true;midoriSpecialState.blockSpecial=false;els.feedbackText.textContent='三つの潮流を確認した。答えを選ぼう！';restoreChoiceInteractivity();updateSpecialHud();}
    };tabs.appendChild(b);});
    view.append(tabs,condition);els.mathProblem.appendChild(view);
    els.feedbackText.textContent='三つの潮流条件をすべて確認しよう。';
    [...els.choices.children].forEach(b=>b.disabled=true);syncMidoriSpecialControls();updateSpecialHud();
  }

  async function showEndFinalConvergenceFx(phase=0){
    ensureBossSpecialFxLayer();const fx=$('endFinalConvergenceFx');if(!fx)return;
    const step=Math.max(0,Math.min(2,Number(phase)||0));
    const titles=[
      ['FINAL BOSS TECHNIQUE','時空終式・五界収束','CONVERGENCE PHASE I'],
      ['CONVERGENCE PHASE II','収束位相 II','FIVE WORLDS COLLIDE'],
      ['CONVERGENCE PHASE III','収束位相 III','五界臨界 / CRITICAL CONVERGENCE']
    ][step];
    clearQuestionUi();locked=true;hideSpecialHudForCutin();document.body.classList.add('boss-technique-active','end-final-convergence-cutin');
    try{
      $('endFinalConvergenceKicker').textContent=titles[0];$('endFinalConvergenceTitle').textContent=titles[1];$('endFinalConvergenceSub').textContent=titles[2];
      fx.hidden=false;fx.className=`end-final-convergence-fx phase-${step+1}`;void fx.offsetWidth;fx.classList.add('active');
      if(step===2)playSE(cutinSE);
      await sleep(step===2?1500:1280);fx.classList.remove('active');await sleep(120);fx.hidden=true;
    }finally{document.body.classList.remove('boss-technique-active','end-final-convergence-cutin');restoreSpecialHudAfterCutin();}
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
    if(els.feedbackText)els.feedbackText.textContent='こたえを 0.8秒 長押し！';
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
    if(resume>0&&currentQuestion&&!gameOverActive)startTimer(resume,{preserveCountCue:true,preserveLimit:true});else{syncPauseButton();updateSpecialHud();}
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
  async function showBlueEndlessReset(message='まだ、おわらない',kicker='SUMMER REPEATS'){
    document.body.classList.add('blue-endless-rewind');
    await showBossPhaseTransition(kicker,message,'impact');
    document.body.classList.remove('blue-endless-rewind');
  }
  function startBlueEndlessSummer(){
    document.body.classList.add('blue-endless-active');document.querySelector('.question-panel')?.classList.add('blue-special-panel');
  }

  function clearEndSpecialEffects(){
    for(const id of endSpecialTimers){clearTimeout(id);clearInterval(id);}endSpecialTimers=[];
    if(endFinalModifierTimer){clearTimeout(endFinalModifierTimer);clearInterval(endFinalModifierTimer);endFinalModifierTimer=null;}
    endSpecialState=null;
    document.body.classList.remove('end-tide-judgment-active','end-genma-triple-active','end-mimesis-equivalent-active','end-blue-loop-active','end-back-causal-active','end-final-convergence-active','end-final-blue-rewrite','end-final-silver-equivalent','end-double-barrier-active','end-barrier-second');
    const panel=document.querySelector('.question-panel');panel?.classList.remove('end-special-panel','end-tide-panel','end-final-tide-panel');
    $('endTideGuide')?.remove();$('endFinalTideGuide')?.remove();
    [...els.choices.children].forEach(b=>{b.classList.remove('end-tide-discarded','end-tide-last','end-equivalent-choice');if(b.dataset.originalLabel!==undefined){b.textContent=b.dataset.originalLabel;delete b.dataset.originalLabel;}if(b.dataset.endBound==='1'){delete b.dataset.endBound;b.onclick=()=>resolveAnswer(b.dataset.answerValue??b.textContent,false);}});
  }
  function trackEndTimeout(id){endSpecialTimers.push(id);return id;}
  function trackEndInterval(id){endSpecialTimers.push(id);return id;}
  function endNumericChoiceValues(){return[...els.choices.children].map(b=>Number(b.dataset.answerValue)).filter(Number.isFinite);}
  function startEndTideJudgment(){
    document.body.classList.add('end-tide-judgment-active');document.querySelector('.question-panel')?.classList.add('end-special-panel','end-tide-panel');
    const buttons=[...els.choices.children],wrong=shuffle(buttons.filter(b=>!answersEqual(b.dataset.answerValue,currentQuestion.answer)));
    endSpecialState={type:'end-tide-judgment',step:0,wrong,discarded:new Set()};
    const guide=document.createElement('div');guide.id='endTideGuide';guide.className='end-tide-guide';guide.innerHTML='<small>FIVE SEAS JUDGMENT</small><strong>潮流Ⅰ：誤った航路を一つ切り捨てろ</strong>';const panel=document.querySelector('.question-panel');panel?.querySelector('.choice-caption')?.before(guide);
    buttons.forEach(b=>{b.dataset.endBound='1';b.onclick=()=>{
      if(locked||paused||specialActive||!timerId)return;const st=endSpecialState;if(!st)return;
      if(st.step<2){
        if(answersEqual(b.dataset.answerValue,currentQuestion.answer)){els.feedbackText.textContent='まだ航路は確定できない。誤った候補を見抜こう。';return;}
        if(st.discarded.has(b)){els.feedbackText.textContent='その航路はすでに捨てている。';return;}
        st.discarded.add(b);b.classList.add('end-tide-discarded');b.disabled=true;st.step++;
        if(st.step===1){guide.querySelector('strong').textContent='潮流Ⅱ：もう一つの誤航路を切り捨てろ';els.feedbackText.textContent='一つの誤航路を排除した。';}
        else{guide.querySelector('strong').textContent='潮流Ⅲ：残った航路を確定せよ';els.feedbackText.textContent='最終潮流。残った答えを選ぼう！';buttons.filter(x=>!st.discarded.has(x)).forEach(x=>{x.disabled=false;x.classList.add('end-tide-last');});}
        return;
      }
      resolveAnswer(b.dataset.answerValue??b.textContent,false);
    };});
  }
  function makeEndCrimsonChain(){
    const divisor=pick([.2,.3,.4,.5,.6,.8]),x=rand(6,12),first=normalizeChoiceNumber(divisor*x),m=pick([1.2,1.25,1.5,2]),second=normalizeChoiceNumber(x*m);
    const fractions=shuffle([[1,2],[1,4],[3,4],[1,5],[2,5]]);let f=fractions[0],z=pick([4,5,8,10]);while(!Number.isInteger(f[0]*z/f[1]))z=pick([4,5,8,10,12,20]);const term=f[0]*z/f[1],third=normalizeChoiceNumber(second-term);
    if(third<=0)return makeEndCrimsonChain();
    return[
      {expression:`${first} ÷ ${divisor}`,answer:x,choices:compactNumericChoices(x,[x-1,x+1])},
      {expression:`${x} × ${m}`,answer:second,choices:compactNumericChoices(second,[normalizeChoiceNumber(second-1),normalizeChoiceNumber(second+1)])},
      {expression:`${second} − ${f[0]}/${f[1]} × ${z}`,displayExpression:`${second} − ${f[0]}/${f[1]} × ${z} = ?`,answer:third,choices:compactNumericChoices(third,[normalizeChoiceNumber(third-1),normalizeChoiceNumber(third+1)])}
    ];
  }
  function startEndGenmaTriple(){
    document.body.classList.add('end-genma-triple-active');document.querySelector('.question-panel')?.classList.add('end-special-panel');
    const chain=makeEndCrimsonChain();endSpecialState={type:'end-genma-triple',step:0,chain};populateSpecialQuestion(chain[0],{chip:'初太刀',step:1});document.body.classList.add('boss-time-pressure');startTimer(20);
  }
  function makeEndMimesisEquivalentQuestion(){
    const pair=pick([[1,2,.5],[1,4,.25],[3,4,.75],[2,5,.4],[3,5,.6],[5,8,.625],[7,10,.7]]),[n,d,dec]=pair,base=pick([20,24,30,32,40,48,50,60,64,80].filter(v=>v%d===0)),answer=base*n/d;
    const wrong1=Math.max(1,answer-pick([1,2,4])),wrong2=answer+pick([2,4,5]);const choices=shuffle([answer,wrong1,wrong2]);const alt={};
    choices.forEach(v=>{alt[String(v)]=`${v*2}÷2`;});
    return{expression:`${n}/${d} × ${base}`,displayExpression:`${n}/${d} × ${base} = ?`,altExpression:`${dec} × ${base} = ?`,answer,choices,alt};
  }
  function toggleEndMimesisEquivalent(){
    const st=endSpecialState;if(!st||st.type!=='end-mimesis-equivalent'||paused||specialActive||locked)return;st.alt=!st.alt;
    els.mathProblem.textContent=st.alt?st.q.altExpression:st.q.displayExpression;fitMathProblemToBox(st.q);
    [...els.choices.children].forEach(b=>{const v=b.dataset.answerValue;if(b.dataset.originalLabel===undefined)b.dataset.originalLabel=b.textContent;b.textContent=st.alt?(st.q.alt?.[v]||b.dataset.originalLabel):b.dataset.originalLabel;b.classList.toggle('end-equivalent-choice',st.alt);});
  }
  function startEndMimesisEquivalent(){
    document.body.classList.add('end-mimesis-equivalent-active');document.querySelector('.question-panel')?.classList.add('end-special-panel');
    const q=makeEndMimesisEquivalentQuestion();endSpecialState={type:'end-mimesis-equivalent',q,alt:false};populateSpecialQuestion(q,{chip:'鏡面A',step:1});
    trackEndInterval(setInterval(()=>{toggleEndMimesisEquivalent();const chip=$('bossStrikeChip');if(chip)setBossStepChip(endSpecialState?.alt?'鏡面B':'鏡面A',1);},2600));startTimer(60);
  }
  function makeEndBlueLoopChain(){
    if(Math.random()<.5){
      const chain=[];for(let i=0;i<3;i++){const minutes=pick([3,4,5,6]),per=pick([240,300,320,360,375,400]),distance=per*minutes;chain.push({expression:`${distance}mを${minutes}分で進む。1分あたりは？m`,answer:per,choices:compactNumericChoices(per,[per-25,per+25,per+50])});}return chain;
    }
    const chain=[];for(let i=0;i<3;i++){const people=pick([4,5,6,8]),avg=pick([64,68,72,75,76,78,80,84]),answer=people*avg;chain.push({expression:`平均${avg}点の${people}人。合計は？点`,answer,choices:compactNumericChoices(answer,[answer-people*2,answer+people*2])});}return chain;
  }
  function startEndBlueLoop(){
    document.body.classList.add('end-blue-loop-active');document.querySelector('.question-panel')?.classList.add('end-special-panel');const chain=makeEndBlueLoopChain();endSpecialState={type:'end-blue-loop',step:0,chain};bossSpecialSequence={type:'end-blue-loop',step:0,chain};populateSpecialQuestion(chain[0],{chip:'回帰層 I',step:1});startTimer(45);
  }
  function makeEndBackCausalChain(){
    const x=rand(45,110),mult=pick([5,6,8,10,12]),add=pick([20,30,40,50,60]),total=x*mult+add,secondMult=pick([2,3,4]),sub=pick([10,20,30,40]),y=x*secondMult-sub,offset=pick([10,20,50]),eqCorrect=`${y+offset}−${offset}`;
    return[
      {expression:`□ × ${mult} + ${add} = ${total}`,displayExpression:`□ × ${mult} + ${add} = ${total}　□は？`,answer:x,choices:compactNumericChoices(x,[x-10,x+10])},
      {expression:`${x} × ${secondMult} − ${sub}`,answer:y,choices:compactNumericChoices(y,[y-10,y+20])},
      {expression:`${y} と同じ値は？`,answer:eqCorrect,choices:shuffle([eqCorrect,`${y}+${offset}`,`${Math.max(0,y-offset*2)}−${offset}`])}
    ];
  }
  function startEndBackCausal(){
    document.body.classList.add('end-back-causal-active');document.querySelector('.question-panel')?.classList.add('end-special-panel');const chain=makeEndBackCausalChain();endSpecialState={type:'end-back-causal',step:0,chain};populateSpecialQuestion(chain[0],{chip:'因果逆算',step:1});startTimer(45);
  }
  function applyEndFinalQuestionModifier(finalStrike=null){
    if(mode!=='end'||!endFinalPhase||!currentQuestion)return;clearEndSpecialEffects();document.body.classList.remove('boss-time-pressure');document.body.classList.add('end-final-convergence-active');const panel=document.querySelector('.question-panel');panel?.classList.add('end-special-panel');
    const phase=Math.max(0,Math.min(4,bossQuestion));
    if(phase===4&&finalStrike!==null){
      const strike=Math.max(0,Math.min(2,Number(finalStrike)||0));
      if(strike===0){setBossStepChip('収束位相 I',1);document.body.classList.add('boss-time-pressure');return;}
      if(strike===1){setBossStepChip('収束位相 II',2);document.body.classList.add('boss-time-pressure','end-final-silver-equivalent');const shift=pick([50,100,200,300]);[...els.choices.children].forEach(b=>{const v=Number(b.dataset.answerValue);if(!Number.isFinite(v))return;b.dataset.originalLabel=b.textContent;b.textContent=`${v+shift}−${shift}`;b.classList.add('end-equivalent-choice');});return;}
      setBossStepChip('収束位相 III',3);document.body.classList.add('boss-time-pressure');els.feedbackText.textContent='五界臨界――最後の答えを導け。';return;
    }
    if(phase===0){
      const ans=Number(currentQuestion.answer),div=pick([1.2,1.5,2,2.5]),add=pick([300,400,500,600]);if(Number.isFinite(ans)){currentQuestion={...currentQuestion,expression:`□ ÷ ${div} + ${add} = ${normalizeChoiceNumber(ans/div+add)}`,displayExpression:`□ ÷ ${div} + ${add} = ${normalizeChoiceNumber(ans/div+add)}　□は？`};renderQuestionContent(currentQuestion);}setBossStepChip('因果反転',1);
    }else if(phase===1){setBossStepChip('一刀断算',2);document.body.classList.add('boss-time-pressure');}
    else if(phase===2){setBossStepChip('時の改竄',3);const ans=currentQuestion.answer;endFinalModifierTimer=setTimeout(()=>{if(!currentQuestion||bossQuestion!==2||paused)return;document.body.classList.add('end-final-blue-rewrite');const n=pick([120,240,360,480]);els.mathProblem.textContent=`${ans+n} − ${n} = ?`;fitMathProblemToBox(currentQuestion);els.feedbackText.textContent='記憶が書き換わった――答えは変わらない。';},11000);}
    else if(phase===3){setBossStepChip('鏡界反転',4);document.body.classList.add('end-final-silver-equivalent');const shift=pick([50,100,200,300]);[...els.choices.children].forEach(b=>{const v=Number(b.dataset.answerValue);if(!Number.isFinite(v))return;b.dataset.originalLabel=b.textContent;b.textContent=`${v+shift}−${shift}`;b.classList.add('end-equivalent-choice');});}
    else{setBossStepChip('収束位相 I',5);document.body.classList.add('boss-time-pressure');els.feedbackText.textContent='五界収束――時間内に正確な答えを選べ。';}
  }
  function makeEndBarrierQuestion(){return makeEndQuestion(currentEndSource(),bossQuestion);}
  async function startEndBossCoreSpecial(spec){
    document.body.classList.remove('end-double-barrier-active','end-barrier-second');
    if(spec.type==='end-tide-judgment'){
      bossSpecialSequence={type:'end-tide-judgment',step:'eliminate'};prepareQuestion();setBossStepChip(spec.name,3);startEndTideJudgment();startTimer(60);return;
    }
    if(spec.type==='end-genma-triple'){
      bossSpecialSequence={type:'end-genma-triple',step:0};startEndGenmaTriple();return;
    }
    if(spec.type==='end-mimesis-equivalent'){
      bossSpecialSequence={type:'end-mimesis-equivalent',step:'final'};startEndMimesisEquivalent();return;
    }
    if(spec.type==='end-back-causal'){
      bossSpecialSequence={type:'end-back-causal',step:0};startEndBackCausal();return;
    }
  }
  async function startEndDoubleBarrier(spec){
    document.body.classList.add('end-double-barrier-active');document.body.classList.remove('end-barrier-second');
    bossSpecialSequence={type:'end-double-barrier',step:1,coreType:spec.type,coreSpec:spec};
    await showShieldForm();
    populateSpecialQuestion(makeEndBarrierQuestion(),{chip:'終界障壁 I',step:1});
    startTimer(60);
  }

  async function runBossFifthAction(){
    const spec=currentBossSpecial();
    ensureMonsterFx();ensureBossSpecialFxLayer();clearBossAction();locked=true;stopTimer();clearQuestionUi();
    if(!spec){await showActionCutin('enemy',currentBoss().img,{variant:'finisher',duration:1100});bossActionActive=false;bossSpecialSequence=null;prepareQuestion();startTimer(battleQuestionTime());return;}
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
      case'midori-aim':{
        bossSpecialSequence={type:'midori-aim',step:'final'};prepareQuestion();setBossStepChip(spec.name,1);startMidoriAim();startTimer(60);break;
      }
      case'midori-sonar':{
        bossSpecialSequence={type:'midori-sonar',step:'rule'};prepareQuestion();setBossStepChip(spec.name,1);startMidoriSonar();startTimer(60);break;
      }
      case'midori-rune':{
        bossSpecialSequence={type:'midori-rune',step:'final'};prepareQuestion();setBossStepChip(spec.name,1);startMidoriRune();startTimer(60);break;
      }
      case'midori-route':{
        bossSpecialSequence={type:'midori-route',step:'final'};prepareQuestion();setBossStepChip(spec.name,1);startMidoriRoute();startTimer(60);break;
      }
      case'midori-tide':{
        bossSpecialSequence={type:'midori-tide',step:'final'};prepareQuestion();setBossStepChip(spec.name,1);startMidoriTide();startTimer(60);break;
      }
      case'end-tide-judgment':
      case'end-genma-triple':
      case'end-mimesis-equivalent':
      case'end-back-causal':{
        await startEndDoubleBarrier(spec);break;
      }
      case'end-blue-loop':{
        // トコナツは盾ではなく「時間の回帰層」を二度突破する。現行の三巡構成が二重防壁相当。
        bossSpecialSequence={type:'end-blue-loop',step:0};startEndBlueLoop();break;
      }
      case'end-final-convergence':{
        // The FINAL climax is an offensive three-question convergence, not another double-shield pattern.
        bossSpecialSequence={type:'end-final-convergence',step:0};await showEndFinalConvergenceFx(0);prepareQuestion();startTimer(30);break;
      }
      case'crimson-genma':{
        bossSpecialSequence={type:'crimson-genma',step:'final'};await startCrimsonGenmaFinal();break;
      }
    }
  }
  function clearBossAction(){
    clearCrimsonSpecialEffects();clearMidoriSpecialEffects();clearEndSpecialEffects();
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
    if(mode==='end'&&!endFinalPhase&&stageQuestion===0&&endStageWarningIndex!==stageIndex){endStageWarningIndex=stageIndex;await showBossWarning();}
    await showMonsterEntrance(currentMonster);prepareQuestion();startTimer(battleQuestionTime());
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

  function mistakeSpecialAdvice(){
    const type=endSpecialState?.type||bossSpecialSequence?.type||'';
    const map={
      'end-blue-loop':'時間が巻き戻っても、問題の基本となる計算規則は変わらない。回帰後は焦らず式を読み直そう。',
      'blue-endless-summer':'同じ答えへ戻る仕掛けでは、見た目の変化より「何が変わっていないか」を確認しよう。',
      'end-mimesis-equivalent':'式の見た目が変わっても、同じ値を表している場合がある。変形の前後を比べよう。',
      'silver-mimesis':'鏡写しの表示に惑わされず、元の数量関係を一つずつ確認しよう。',
      'end-back-causal':'結果から原因を逆にたどる問題では、答えから計算を戻して確かめるとよい。',
      'reverse-reconstruct':'逆算では、最後に行った計算から反対の計算で戻っていこう。',
      'reconstruct':'前の答えが次の問題につながる。途中の値を覚えるのではなく、関係を確認しよう。',
      'reverse':'逆算では、足し算↔引き算、掛け算↔割り算の対応を意識しよう。',
      'shield-reverse':'結界を破った後も、逆算の基本は同じ。最後の計算から順に戻していこう。',
      'end-tide-judgment':'条件が多いときは、正解を一気に探さず、当てはまらない選択肢を順に消していこう。',
      'midori-tide':'複数の条件は一つずつ確認する。すべてを同時に考えなくてもよい。',
      'midori-route':'条件に合わない航路を一つずつ除外すると、最後の候補が見えやすい。',
      'end-genma-triple':'連続問題では、前の失敗を引きずらず、その一問の計算順序だけに集中しよう。',
      'double':'連続攻撃では、一問ごとに式を読み直す。急いで前の答え方を繰り返さないようにしよう。',
      'shield-double':'連続攻撃では、一問ごとに式を読み直す。急いで前の答え方を繰り返さないようにしよう。',
      'transform':'式が書き換わっても、どの計算を先にするかを整理すれば答えに近づける。',
      'crimson-moon-shift':'選択肢の位置が変わっても、数字や式そのものを見て判断しよう。',
      'silver-mirror':'左右が入れ替わって見えても、数量関係を落ち着いて読み取ろう。',
      'silver-spotlight':'見える選択肢が限られていても、先に自分で答えを計算してから選ぶと迷いにくい。'
    };
    return map[type]||'';
  }
  function mathAdviceForQuestion(q=currentQuestion){
    const text=String(q?.displayExpression??q?.expression??'').replace(/<[^>]*>/g,' ');
    if(q?.fraction||/\d+\s*\/\s*\d+/.test(text))return '分数は、足し算・引き算なら分母をそろえ、掛け算・割り算なら計算の規則を確認しよう。';
    if(/何%|％|%|割合|割引|増え|減っ/.test(text))return '割合は「比べる量 ÷ もとにする量」。どの数を基準にするかを先に確認しよう。';
    if(/速さ|時速|分速|秒速|道のり|km\/h|m\/分/.test(text))return '速さ・時間・道のりのうち、何を求める問題かを整理してから式を作ろう。';
    if(/円周|円の面積|半径|直径|3\.14/.test(text))return '円では半径と直径を取り違えないことが大切。円周と面積の式も確認しよう。';
    if(/比例|反比例/.test(text))return '比例は同じ倍率、反比例は積が一定になることを使って関係を確かめよう。';
    if(/\d+\s*[:：]\s*\d+|同じ比|比は/.test(text))return '比は両方の数を同じ倍率で変えても関係が変わらない。簡単な比に直して考えよう。';
    if(/cm²|m²|面積|台形|三角形|平行四辺形/.test(text))return '面積は、図形を分けるか、大きな図形から不要な部分を引くと整理しやすい。単位にも注意しよう。';
    if(/cm³|m³|体積/.test(text))return '体積は、たて・横・高さなど必要な長さをそろえてから計算しよう。';
    if(/km|mL|kg|cm|L|時間|分|秒/.test(text)&&/[=＝?？□]/.test(text))return '単位換算では、まず同じ単位にそろえる。100倍・1000倍などの関係を確認しよう。';
    if(/□/.test(text))return '□を求める問題は、分かっている結果から逆向きに計算すると整理しやすい。';
    if(/[×*]/.test(text)&&/[÷/]/.test(text)&&/[+＋\-−]/.test(text))return '混合計算では、掛け算・割り算を足し算・引き算より先に計算しよう。';
    if(/[×*÷/]/.test(text)&&/[+＋\-−]/.test(text))return '計算の順序を確認し、掛け算・割り算を先に処理しよう。';
    if(/[×*]/.test(text))return '掛け算は、位をそろえて途中の積を確認すると計算ミスを減らせる。';
    if(/[÷/]/.test(text))return '割り算は「割る数×答え＋余り」で元の数に戻るか確かめると安心。';
    if(/[+＋]/.test(text)&&/[\-−]/.test(text))return '足し算と引き算が続くときは、左から順に一段ずつ計算しよう。';
    if(/[+＋]/.test(text))return '足し算では位をそろえ、繰り上がりがある場所を確認しよう。';
    if(/[\-−]/.test(text))return '引き算では位をそろえ、繰り下がりが必要な場所を確認しよう。';
    if(/並び|規則|次|□は/.test(text))return '数の並びでは、となり同士の差や倍率に同じ規則がないか確かめよう。';
    return '問題文から「何を求めるか」を先に確認し、必要な計算を一つずつ整理しよう。';
  }
  function mistakeAdviceFor(q,{timeout=false}={}){
    const special=mistakeSpecialAdvice(),math=q?.advice||mathAdviceForQuestion(q);
    if(timeout){
      const base='時間切れでも、最初に何を求める問題かを整理すると次の計算が見つけやすい。';
      return special?`${base} ${special}`:`${base} ${math}`;
    }
    return special?`${special} ${math}`:math;
  }
  function makeMistakeRecord(value,timeout=false){
    const q=currentQuestion||{};
    return{
      q:questionDisplayText(q)||String(q.expression||'問題'),
      selected:timeout?'時間切れ':value,
      answer:q.answer,
      advice:mistakeAdviceFor(q,{timeout}),
      boss:!!bossPhase,
      world:mode,
      stage:stageIndex
    };
  }
  function renderGameOverReview(){
    const list=els.gameOverReviewList;if(!list)return;
    list.replaceChildren();
    const recent=stats.errors.slice(-3);
    if(!recent.length){
      const empty=document.createElement('p');empty.className='game-over-review-empty';empty.textContent='振り返る問題はありません。';list.appendChild(empty);return;
    }
    recent.forEach((err,i)=>{
      const item=document.createElement('article');item.className='game-over-review-item';
      const head=document.createElement('div');head.className='game-over-review-q';
      const no=document.createElement('span');no.textContent=`${i+1}`;
      const q=document.createElement('strong');q.textContent=String(err.q??'問題');head.append(no,q);
      const answers=document.createElement('div');answers.className='game-over-review-answers';
      const selected=document.createElement('span');selected.innerHTML='<small>あなたの答え</small>';
      const selectedValue=document.createElement('b');selectedValue.textContent=String(err.selected??'');selected.appendChild(selectedValue);
      const correct=document.createElement('span');correct.innerHTML='<small>正解</small>';
      const correctValue=document.createElement('b');correctValue.textContent=String(err.answer??'');correct.appendChild(correctValue);
      answers.append(selected,correct);
      const advice=document.createElement('p');advice.className='game-over-review-advice';
      const label=document.createElement('strong');label.textContent='POINT';
      advice.append(label,document.createTextNode(` ${err.advice||'問題の条件を一つずつ確認しよう。'}`));
      item.append(head,answers,advice);list.appendChild(item);
    });
  }

  async function showGameOver(){
    gameOverActive=true;locked=true;stopTimer();resetSpecialGauge();syncPauseButton();
    if(currentBgm)try{currentBgm.pause();}catch{}
    document.body.classList.add('game-over-active');
    const fromBoss=!!bossPhase;
    const titleEl=$('gameOverTitle'),kicker=els.gameOverOverlay?.querySelector('.game-over-card>small'),note=els.gameOverOverlay?.querySelector('.game-over-note');
    if(mode==='white'){if(kicker)kicker.textContent='WHITE WORLD / CHALLENGE COMPLETE';if(titleEl)titleEl.textContent='CHALLENGE COMPLETE';els.gameOverRetryBtn.textContent='もう一度挑戦';els.gameOverMessage.textContent=`今回 ${whiteTotalCorrect}問正解｜到達 DEPTH ${whiteDepth}｜BEST ${Math.max(save.whiteBestQuestions||0,whiteTotalCorrect)}問｜BEYOND ${whiteBeyondCorrectRun}/${whiteBeyondSeenRun}`;if(note)note.textContent='白の世界はライフ回復なし。記録は保存されています。もう一度、最初のDEPTHから挑戦できます。';}
    else{if(kicker)kicker.textContent='GAME OVER / REVIEW';if(titleEl)titleEl.textContent='今回の振り返り';els.gameOverRetryBtn.textContent=fromBoss?'ボス戦の最初から':'ステージ最初から';els.gameOverMessage.textContent=fromBoss?'直近の間違いを確認して、ボス戦の最初から再挑戦できます。':'直近の間違いを確認して、このステージの最初から再挑戦できます。';if(note)note.innerHTML=`タイトルに戻ると、現在の冒険の途中経過は終了し、次に始めると STAGE 1・0 / <span data-run-total>${mode==='crimson'||mode==='end'?'80':'75'}</span> からになります。`;}
    renderGameOverReview();
    els.gameOverOverlay.hidden=false;
    const card=els.gameOverOverlay.querySelector('.game-over-card');
    if(card){card.scrollTop=0;card.classList.remove('show');void card.offsetWidth;card.classList.add('show');}
  }
  async function retryFromGameOver(){
    if(!gameOverActive)return;
    if(mode==='white'){gameOverActive=false;els.gameOverOverlay.hidden=true;document.body.classList.remove('game-over-active');await startWhiteChallenge();return;}
    const retryBoss=!!bossPhase;
    const latest=stats.errors[stats.errors.length-1];
    if(['crimson','blue','silver','midori','end'].includes(mode)&&latest?.advice){
      pendingReviewTip={key:`review-${mode}-${stats.errors.length}`,category:'前回のポイント',text:latest.advice};
    }
    gameOverActive=false;els.gameOverOverlay.hidden=true;document.body.classList.remove('game-over-active');
    lives=3;locked=true;clearBattleFx();clearMonsterAnnouncement();
    if(retryBoss){await restartBossCheckpoint();return;}
    totalProgress=stageStartTotal(stageIndex);stageQuestion=0;bossPhase=false;bossQuestion=0;currentMonster=null;
    await showMapSequence(false,false);
  }
  async function returnTitleFromGameOver(){
    if(!gameOverActive)return;
    gameOverActive=false;els.gameOverOverlay.hidden=true;document.body.classList.remove('game-over-active');locked=true;stopTimer();
    clearBossAction();clearMonsterAnnouncement();clearBattleFx();enemyVisualToken++;concealEnemyVisual(true);
    try{stageBgmPlayer.pause();stageBgmPlayer.currentTime=0;}catch{}currentBgm=null;
    stopSE(sirenSE);stopSE(endCorruptionNoiseSE);stopSE(cutinSE);stopSE(breakSE);stopSE(frontFinisherSE);stopSE(backFinisherSE);stopSE(countSE);stopSE(start321SE);stopSE(start0SE);stopSE(clearSE);stopSE(cancelSE);resetRun();
    await transitionTo(()=>{showOnly(els.titleScreen);renderTitle();},mode,1050);enqueuePendingSecretRelicNotices({showNow:true});
  }

  function showPauseMenu(){els.pauseMenu.hidden=false;els.pauseConfirm.hidden=true;}
  function showPauseConfirm(){els.pauseMenu.hidden=true;els.pauseConfirm.hidden=false;}
  function pauseGame(reason='manual'){
    if(paused||locked||silverSpecialBusy||crimsonMoonShiftBusy||blueSpecialBusy||specialActive||els.gameScreen.hidden||!timerId||!currentQuestion)return false;
    pauseRestoreLocked=locked;pauseBgmShouldResume=!!(soundOn&&currentBgm&&!currentBgm.paused);
    paused=true;locked=true;stopTimer();
    if(currentBgm)try{currentBgm.pause();}catch{}
    [...els.choices.children].forEach(b=>b.disabled=true);
    document.body.classList.add('game-paused');showPauseMenu();els.pauseOverlay.hidden=false;els.pauseOverlay.dataset.reason=reason;syncPauseButton();return true;
  }
  function resumeGame(){
    if(!paused)return;
    els.pauseOverlay.hidden=true;els.pauseOverlay.removeAttribute('data-reason');document.body.classList.remove('game-paused');paused=false;locked=pauseRestoreLocked;
    restoreChoiceInteractivity();
    if(soundOn){
      if(pauseBgmShouldResume&&currentBgm)currentBgm.play().catch(()=>resumeStageBgmForCurrentState());
      else resumeStageBgmForCurrentState();
    }
    if(!locked&&currentQuestion&&timeLeft>0)startTimer(timeLeft,{preserveCountCue:true,preserveLimit:true});else syncPauseButton();
    updateSpecialHud();
  }
  async function returnTitleFromPause(){
    if(!paused)return;
    els.pauseOverlay.hidden=true;document.body.classList.remove('game-paused');paused=false;locked=true;stopTimer();
    clearBossAction();clearMonsterAnnouncement();clearBattleFx();
    try{stageBgmPlayer.pause();stageBgmPlayer.currentTime=0;}catch{}currentBgm=null;
    stopSE(sirenSE);stopSE(endCorruptionNoiseSE);stopSE(cutinSE);stopSE(breakSE);stopSE(frontFinisherSE);stopSE(backFinisherSE);stopSE(countSE);stopSE(start321SE);stopSE(start0SE);stopSE(clearSE);stopSE(cancelSE);resetRun();
    await transitionTo(()=>{showOnly(els.titleScreen);renderTitle();},mode,1050);enqueuePendingSecretRelicNotices({showNow:true});
  }

  function ensureWhiteMemoryFx(){
    const battlefield=document.querySelector('.battlefield');if(!battlefield)return null;let fx=$('whiteMemoryFx');
    if(!fx){fx=document.createElement('div');fx.id='whiteMemoryFx';fx.className='white-memory-fx';fx.setAttribute('aria-hidden','true');fx.innerHTML='<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>';battlefield.appendChild(fx);}return fx;
  }
  function pulseWhiteMemoryFx(){
    const fx=ensureWhiteMemoryFx();if(!fx)return;fx.classList.remove('answer-pulse');void fx.offsetWidth;fx.classList.add('answer-pulse');setTimeout(()=>fx.classList.remove('answer-pulse'),720);
  }
  async function showWhiteBanner(kicker,title,ms=1200){
    const battlefield=document.querySelector('.battlefield');if(!battlefield)return;let fx=$('whiteChallengeBanner');if(!fx){fx=document.createElement('div');fx.id='whiteChallengeBanner';fx.className='white-challenge-banner';battlefield.appendChild(fx);}fx.innerHTML=`<small>${kicker}</small><strong>${title}</strong>`;fx.classList.remove('show');void fx.offsetWidth;fx.classList.add('show');await sleep(ms);fx.classList.remove('show');
  }
  async function beginWhiteNormalEncounter(){
    bossPhase=false;bossQuestion=0;clearBossAction();
    currentMonster=chooseWhiteNormalMonster();renderGame();clearQuestionUi();
    if(!(await stageEnemyVisual(currentMonster)))return;
    await showMonsterEntrance(currentMonster);
    prepareQuestion();startTimer(whiteQuestionTime());
  }
  async function showWhiteDepthIntro(){
    locked=true;stopTimer();bossPhase=false;bossQuestion=0;whiteBoss=null;currentMonster=null;currentQuestion=null;chooseWhiteEnvironment();renderGame();clearQuestionUi();enemyVisualToken++;concealEnemyVisual(true);
    els.stagePreview.style.backgroundImage=`url('./assets/${whiteCurrentBg}')`;els.stageOverlayLabel.textContent=`DEPTH ${whiteDepth}`;els.stageOverlayName.textContent=whiteDepth===1?'ENDLESS CHALLENGE':'NEXT DEPTH';els.stageOverlay.hidden=false;requestAnimationFrame(()=>fitSingleLineText(els.stageOverlayName,{maxWidthRatio:.90,minPx:20}));
    await sleep(1250);await sceneBlackout(async()=>{els.stageOverlay.hidden=true;renderGame();clearQuestionUi();},{fadeIn:480,hold:100,fadeOut:620});
    ensureWhiteMemoryFx();await playStageBgm();await runBattleCountdown();await beginWhiteNormalEncounter();
  }
  async function startWhiteChallenge(){
    resetRun();document.body.classList.add('white-challenge-active');ensureWhiteMemoryFx();if(!debugFullUnlock){save.whiteAttempts=(save.whiteAttempts||0)+1;persistQuietly();}
    await transitionTo(()=>{showOnly(els.gameScreen);renderGame();clearQuestionUi();enemyVisualToken++;concealEnemyVisual(true);},'normal',1300);await showWhiteDepthIntro();
  }
  async function beginWhiteBoss(){
    locked=true;stopTimer();clearQuestionUi();await stopBgmFade(650);bossPhase=true;bossQuestion=0;chooseWhiteBoss();renderGame();enemyVisualToken++;concealEnemyVisual(true);await showBossEntrance(false,0);
  }
  async function completeWhiteDepth(){
    stopTimer();clearBossAction();els.answerMark.hidden=true;runFinisherMotion();await sleep(820);els.enemyActor.classList.add('boss-defeat');await sleep(1150);enemyVisualToken++;concealEnemyVisual(true);els.enemyActor.classList.remove('boss-defeat','finisher-hit');
    await stopBgmFade(500);await showWhiteBanner(`DEPTH ${whiteDepth} CLEAR`,'次の記憶へ',1100);
    if(whiteTotalCorrect===50&&!whiteBeyondUnlockShown){whiteBeyondUnlockShown=true;await showWhiteBanner('BEYOND UNLOCKED','算数の、その先へ。',1700);}
    whiteDepth++;whiteQuestionInDepth=0;bossPhase=false;bossQuestion=0;whiteBoss=null;resetSpecialGauge();await showWhiteDepthIntro();
  }
  async function maybeWhiteBeyond(){
    if(whiteTotalCorrect>=50&&!whiteBeyondUnlockShown){whiteBeyondUnlockShown=true;await showWhiteBanner('BEYOND UNLOCKED','算数の、その先へ。',1700);}
    const rate=whiteBeyondRate();if(!rate||Math.random()>=rate)return false;
    currentMonster=null;enemyVisualToken++;concealEnemyVisual(true);renderGame();
    whiteBeyondActive=true;whiteBeyondSeenRun++;if(!debugFullUnlock){save.whiteBeyondSeen=(save.whiteBeyondSeen||0)+1;persistQuietly();}
    document.body.classList.add('white-beyond-active');await showWhiteBanner('BEYOND QUESTION','算数の、その先へ。',1050);prepareQuestion();startTimer(60);return true;
  }
  async function continueWhiteAfterQuestion(){
    if(await maybeWhiteBeyond())return;
    if(whiteQuestionInDepth>=9){await beginWhiteBoss();return;}
    await beginWhiteNormalEncounter();
  }
  async function finishWhiteBeyond(ok){
    if(ok){whiteBeyondCorrectRun++;if(!debugFullUnlock){save.whiteBeyondCorrect=(save.whiteBeyondCorrect||0)+1;persistQuietly();}}
    whiteBeyondActive=false;document.body.classList.remove('white-beyond-active');await sleep(750);
    if(whiteQuestionInDepth>=9){await beginWhiteBoss();return;}await beginWhiteNormalEncounter();
  }
  function persistWhiteResult(){
    if(debugFullUnlock)return;save.whiteBestQuestions=Math.max(save.whiteBestQuestions||0,whiteTotalCorrect);save.whiteBestDepth=Math.max(save.whiteBestDepth||0,whiteDepth);save.whiteTotalCorrect=(save.whiteTotalCorrect||0)+whiteTotalCorrect;persistQuietly();
  }
  async function resolveWhiteAnswer(value,timeout=false){
    if(locked)return;locked=true;stopTimer();updateSpecialHud();const q=currentQuestion;[...els.choices.children].forEach(b=>{b.disabled=true;const bv=b.dataset.answerValue??b.textContent;if(answersEqual(bv,q.answer))b.classList.add('correct');if(value!==null&&answersEqual(bv,value)&&!answersEqual(value,q.answer))b.classList.add('wrong');});
    const ok=!timeout&&answersEqual(value,q.answer);
    if(whiteBeyondActive){
      if(ok){els.feedbackText.textContent='BEYOND CLEAR！';showAnswerMark(true);playSE(correctSE);}else{els.feedbackText.textContent=timeout?`時間切れ。答えは ${q.answer}（ライフは減りません）`:`答えは ${q.answer}（ライフは減りません）`;showAnswerMark(false);playSE(wrongSE);stats.errors.push(makeMistakeRecord(value,timeout));}
      await finishWhiteBeyond(ok);return;
    }
    if(ok){
      comboStreak++;adjustSpecialGauge(20);els.feedbackText.textContent='正解！';showAnswerMark(true);playSE(correctSE);
      if(bossPhase){bossQuestion=1;whiteQuestionInDepth=10;whiteTotalCorrect++;renderGame();await sleep(450);await completeWhiteDepth();return;}
      pulseWhiteMemoryFx();runAttackMotion();await sleep(700);whiteQuestionInDepth++;whiteTotalCorrect++;renderGame();await continueWhiteAfterQuestion();return;
    }
    comboStreak=0;adjustSpecialGauge(-20);playSE(wrongSE);showAnswerMark(false);stats.mistakes++;if(timeout)stats.timeouts++;stats.errors.push(makeMistakeRecord(value,timeout));lives--;els.feedbackText.textContent=timeout?`時間切れ！ 正解は ${q.answer}`:`残念！ 正解は ${q.answer}`;renderGame();await sleep(950);
    if(lives<=0){persistWhiteResult();await showGameOver();return;}
    // 白のボスは1問突破型。失敗しても同じボスに別問題で再挑戦する。
    prepareQuestion();startTimer(whiteQuestionTime());
  }

  async function startAdventure(){if(mode==='white'){await startWhiteChallenge();return;}resetRun();primeStageBgm();await transitionTo(()=>{showOnly(els.gameScreen);prepareMapOverlay(true);},mode,1500);await showMapSequence(true,true);}
  async function nextQuestion(){if(bossPhase){prepareQuestion();const spec=currentBossSpecial();startTimer(bossQuestion===4&&spec?.time?spec.time:60);}else{await beginNormalEncounter();}}

  function pulseBossCorrectFrame(){
    const panel=document.querySelector('.question-panel');if(!panel)return;
    panel.classList.remove('boss-correct-pulse');void panel.offsetWidth;panel.classList.add('boss-correct-pulse');
    setTimeout(()=>panel.classList.remove('boss-correct-pulse'),420);
  }

  async function resolveAnswer(value,timeout=false){
    if(mode==='white'){await resolveWhiteAnswer(value,timeout);return;}
    if(locked)return;locked=true;stopTimer();updateSpecialHud();[...els.choices.children].forEach(b=>{b.disabled=true;const bv=b.dataset.answerValue??b.textContent;if(answersEqual(bv,currentQuestion.answer))b.classList.add('correct');if(value!==null&&answersEqual(bv,value)&&!answersEqual(value,currentQuestion.answer))b.classList.add('wrong');});
    const ok=!timeout&&answersEqual(value,currentQuestion.answer);
    if(ok&&bossPhase&&bossQuestion===4&&bossSpecialSequence){
      const seq=bossSpecialSequence;
      const intermediate=async(message)=>{els.feedbackText.textContent=message;showAnswerMark(true);playSE(correctSE);await sleep(520);};
      if(seq.type==='end-double-barrier'){
        const coreSpec=seq.coreSpec||END_BOSS_SPECIALS[currentEndSource()];
        if(seq.step===1){
          await intermediate('第一終界障壁を破壊！');await showShieldBreak();await sleep(130);document.body.classList.add('end-barrier-second');await showShieldForm();
          bossSpecialSequence={...seq,step:2};populateSpecialQuestion(makeEndBarrierQuestion(),{chip:'終界障壁 II',step:2});startTimer(60,{preserveCountCue:true});return;
        }
        if(seq.step===2){
          await intermediate('第二終界障壁を破壊！');await showShieldBreak();document.body.classList.remove('end-double-barrier-active','end-barrier-second');
          await showBossPhaseTransition('CORE EXPOSED','終核露出','impact');await startEndBossCoreSpecial(coreSpec);return;
        }
      }
      if(seq.type==='end-genma-triple'){
        const st=endSpecialState;if(st&&st.type==='end-genma-triple'&&st.step<2){await intermediate(st.step===0?'初太刀を突破！':'返し太刀を突破！');st.step++;await showBossPhaseTransition(st.step===1?'SECOND BLADE':'FINAL BLADE',st.step===1?'返し太刀':'絶ち太刀','slash');populateSpecialQuestion(st.chain[st.step],{chip:st.step===1?'返し太刀':'絶ち太刀',step:st.step+1});startTimer(st.step===1?15:10,{preserveCountCue:true});return;}
      }
      if(seq.type==='end-blue-loop'&&Number(seq.step)<2){
        const step=Number(seq.step)||0,chain=seq.chain||endSpecialState?.chain||makeEndBlueLoopChain();
        await intermediate(step===0?'第一回帰層を突破！':'第二回帰層を突破！');
        // Two explicit revivals: HP reaches zero twice, then the summer rewinds and restores the final segment each time.
        bossQuestion=5;renderGame();updateBossHpHud();await sleep(480);
        bossQuestion=4;renderGame();updateBossHpHud();
        const nextStep=step+1;bossSpecialSequence={type:'end-blue-loop',step:nextStep,chain};endSpecialState={type:'end-blue-loop',step:nextStep,chain};
        await showBlueEndlessReset(nextStep===1?'夏が巻き戻る':'もう一度、夏が戻る',nextStep===1?'FIRST REWIND':'SECOND REWIND');
        populateSpecialQuestion(chain[nextStep],{chip:nextStep===1?'回帰層 II':'最終巡',step:nextStep+1});startTimer(nextStep===1?35:25,{preserveCountCue:true});return;
      }
      if(seq.type==='end-final-convergence'&&Number(seq.step)<2){
        const step=Number(seq.step)||0;
        await intermediate(step===0?'第一収束を突破！':'第二収束を突破！');
        await showEndFinalConvergenceFx(step+1);
        bossSpecialSequence={type:'end-final-convergence',step:step+1};
        currentQuestion=makeEndFinalQuestion(4);renderQuestionContent(currentQuestion);els.feedbackText.textContent='';els.choices.innerHTML='';choicesForQuestion(currentQuestion).forEach(v=>{const b=document.createElement('button');renderChoiceButton(b,v,currentQuestion.answer);els.choices.appendChild(b);});locked=false;applyEndFinalQuestionModifier(step+1);syncPauseButton();updateSpecialHud();startTimer(30,{preserveCountCue:true});return;
      }
      if(seq.type==='end-back-causal'){
        const st=endSpecialState;if(st&&st.type==='end-back-causal'&&st.step<2){await intermediate(st.step===0?'原因を特定！':'再計算成功！');st.step++;await showReconstructTransition(st.step===1?'CAUSE→RESULT':'RESULT→STRUCTURE',st.step===1?'CAUSAL REBUILD':'STRUCTURE JUDGE');populateSpecialQuestion(st.chain[st.step],{chip:st.step===1?'再計算':'構造判定',step:st.step+1});startTimer(st.step===1?35:30,{preserveCountCue:true});return;}
      }
      if(seq.type==='blue-endless-summer'&&seq.step==='first'){
        const first=seq.source||currentQuestion;
        els.feedbackText.textContent='せいかい！';showAnswerMark(true);
        runAttackMotion();await sleep(180);playSE(correctSE);await sleep(720);
        bossQuestion=5;renderGame();updateBossHpHud();
        await sleep(460);
        bossQuestion=4;renderGame();updateBossHpHud();
        await showBlueEndlessReset('まだ、おわらない','SUMMER REPEATS');
        bossSpecialSequence={type:'blue-endless-summer',step:'echo1',source:first};
        populateSpecialQuestion(makeBlueEndlessEchoQuestion(first),{chip:'まだ、おわらない',step:2});
        startTimer(60,{preserveCountCue:true});return;
      }
      if(seq.type==='blue-endless-summer'&&seq.step==='echo1'){
        const first=seq.source||currentQuestion;
        els.feedbackText.textContent='せいかい！';showAnswerMark(true);
        runAttackMotion();await sleep(180);playSE(correctSE);await sleep(720);
        bossQuestion=5;renderGame();updateBossHpHud();
        await sleep(460);
        bossQuestion=4;renderGame();updateBossHpHud();
        await showBlueEndlessReset('まだ、おわらせない','SUMMER WILL NOT END');
        bossSpecialSequence={type:'blue-endless-summer',step:'echo2',source:first};
        populateSpecialQuestion(makeBlueEndlessFinalQuestion(first),{chip:'まだ、おわらせない',step:3});
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
      runAttackMotion();await sleep(180);playSE(correctSE);if(bossPhase)pulseBossCorrectFrame();await sleep(blueQ10Slow?1370:(bossPhase?720:620));els.heroActor.classList.remove('blue-q10-slow');totalProgress++;
      if(bossPhase){
        const previousFinalHero=mode==='end'&&endFinalPhase?currentEndHeroWorld():null;
        bossQuestion++;renderGame();
        if(mode==='end'&&endFinalPhase&&bossQuestion<5)await showEndFinalHeroRelay(previousFinalHero,currentEndHeroWorld());
        if(bossQuestion>=5){await defeatBoss();return;}
        if(bossQuestion===4){await runBossFifthAction();return;}
        prepareQuestion();startTimer(battleQuestionTime());return;
      }
      stageQuestion++;
      if(stageQuestion>=10){await enterBossPhase();return;}
      await beginNormalEncounter();return;
    }
    comboStreak=0;adjustSpecialGauge(-20);playSE(wrongSE);showAnswerMark(false);stats.mistakes++;if(timeout)stats.timeouts++;stats.errors.push(makeMistakeRecord(value,timeout));lives--;els.feedbackText.textContent=timeout?`じかんぎれ！ 正解は ${currentQuestion.answer}`:`ざんねん！ 正解は ${currentQuestion.answer}`;renderGame();await sleep(bossPhase?1200:1050);
    if(lives<=0){
      stats.restarts++;
      await showGameOver();
      return;
    }
    if(bossPhase){
      if(bossQuestion===4){await runBossFifthAction();return;}
      prepareQuestion();startTimer(battleQuestionTime());
    }else{prepareQuestion();startTimer(battleQuestionTime());}
  }

  async function enterBossPhase(){
    locked=true;stopTimer();clearQuestionUi();enemyVisualToken++;concealEnemyVisual(true);await stopBgmFade(900);
    if(isBlueStage5()){els.answerMark.hidden=true;await blueStage5BossBlackout();}
    bossPhase=true;bossQuestion=0;currentMonster=null;clearBossAction();unlockCurrentBossMusic();await showBossEntrance(false);
  }
  function isStandaloneFinalBoss(){return(mode==='crimson'&&crimsonLastPhase)||(mode==='end'&&endFinalPhase);}
  async function restartStandaloneFinalBossCheckpoint(){
    stopTimer();await stopBgmFade(600);clearBossAction();lives=3;bossPhase=true;bossQuestion=0;currentMonster=null;currentQuestion=null;totalProgress=bossCheckpointTotal();unlockCurrentBossMusic();
    if(mode==='end'&&endFinalPhase){
      await sceneBlackout(async()=>{showOnly(els.gameScreen);document.body.dataset.mode='end';document.body.dataset.stage='final';renderGame();clearQuestionUi();enemyVisualToken++;concealEnemyVisual(true);prepareStageOverlay();},{fadeIn:420,hold:140,fadeOut:560});
      await sleep(1100);
      await sceneBlackout(async()=>{els.stageOverlay.hidden=true;renderGame();clearQuestionUi();enemyVisualToken++;concealEnemyVisual(true);},{fadeIn:420,hold:120,fadeOut:560});
      await sleep(220);
    }else{
      await sceneBlackout(async()=>{showOnly(els.gameScreen);document.body.dataset.mode='crimson';document.body.dataset.stage='last';renderGame();clearQuestionUi();enemyVisualToken++;concealEnemyVisual(true);els.stageOverlay.hidden=true;},{fadeIn:420,hold:140,fadeOut:560});
      await sleep(220);
    }
    await playStageBgm();await runBattleCountdown();await showBossEntrance(true,0);
  }
  async function restartBossCheckpoint(){
    if(isStandaloneFinalBoss()){await restartStandaloneFinalBossCheckpoint();return;}
    stopTimer();await stopBgmFade(600);clearBossAction();lives=3;bossPhase=true;bossQuestion=0;if(isBlueStage5())blueAdultState=true;totalProgress=bossCheckpointTotal();unlockCurrentBossMusic();
    prepareMapOverlay(false);await sleep(1100);
    await sceneBlackout(async()=>{prepareStageOverlay();els.mapOverlay.hidden=true;},{fadeIn:250,hold:70,fadeOut:310});
    await sleep(760);
    await sceneBlackout(async()=>{bossPhase=true;currentMonster=null;renderGame();clearQuestionUi();els.enemyActor.style.opacity='0';els.stageOverlay.hidden=true;},{fadeIn:270,hold:100,fadeOut:360});
    await playStageBgm();
    await runBattleCountdown();
    await showBossEntrance(true);
  }
  async function showEndRescue(sourceWorld){
    if(mode!=='end'||endFinalPhase||stageIndex===0)return;
    const rescued=sourceWorld||currentEndSource(),file=END_HERO_FILES[rescued];if(!file)return;
    document.body.classList.add('end-rescue-active');
    const wrap=document.createElement('div');wrap.className='end-rescue-fx';wrap.innerHTML=`<div class="end-rescue-river"></div><img src="./assets/${file}" alt="${END_HERO_NAMES[rescued]||'主人公'}"><strong>RESCUED</strong>`;document.body.appendChild(wrap);await sleep(2300);wrap.remove();document.body.classList.remove('end-rescue-active');endHeroWorld=rescued;
  }
  async function showEndFinalHeroRelay(fromWorld,toWorld){
    if(mode!=='end'||!endFinalPhase||!toWorld||fromWorld===toWorld)return;
    const battlefield=document.querySelector('.battlefield');if(!battlefield)return;
    document.body.classList.add('end-final-hero-switching');
    let fx=$('endFinalHeroRelay');if(!fx){fx=document.createElement('div');fx.id='endFinalHeroRelay';fx.className='end-final-hero-relay';battlefield.appendChild(fx);}
    const worldLabel={back:'裏',crimson:'紅',blue:'蒼',silver:'銀',midori:'翠'}[toWorld]||'';
    fx.innerHTML=`<small>NEXT RELAY / ${worldLabel}</small><strong>${END_HERO_NAMES[toWorld]||'主人公'}</strong><span>次の一問へ</span>`;fx.classList.remove('show');void fx.offsetWidth;fx.classList.add('show');
    await sleep(760);document.body.classList.remove('end-final-hero-switching');await sleep(360);fx.classList.remove('show');
  }

  async function beginEndFinalBoss(){
    endFinalHeroOrder=shuffle(END_FINAL_HERO_ORDER);
    endFinalPhase=true;bossPhase=true;bossQuestion=0;currentMonster=null;currentQuestion=null;lives=3;clearBossAction();unlockCurrentBossMusic();
    // FINAL has no road encounters, but it should still receive the same stage-title beat
    // as every other area before the boss appears. Keep the battlefield empty while the
    // card reads "FINAL / まおうの へや", then transition into the countdown and boss.
    await sceneBlackout(async()=>{
      showOnly(els.gameScreen);document.body.dataset.mode='end';document.body.dataset.stage='final';renderGame();clearQuestionUi();enemyVisualToken++;concealEnemyVisual(true);prepareStageOverlay();
    },{fadeIn:520,hold:220,fadeOut:700});
    await sleep(1500);
    await sceneBlackout(async()=>{
      els.stageOverlay.hidden=true;renderGame();clearQuestionUi();enemyVisualToken++;concealEnemyVisual(true);
    },{fadeIn:520,hold:160,fadeOut:700});
    await sleep(260);
    await playStageBgm();await runBattleCountdown();await showBossEntrance(true,0);
  }

  async function runEndFinalDefeatSequence(){
    const battlefield=document.querySelector('.battlefield');
    clearQuestionUi();updateBossHpHud(true);
    document.body.classList.add('end-final-postclear-active','end-final-defeat-active');
    els.enemyActor.classList.add('end-final-defeat');
    let fx=$('endFinalCollapseFx');
    if(!fx){
      fx=document.createElement('div');fx.id='endFinalCollapseFx';fx.className='end-final-collapse-fx';fx.setAttribute('aria-hidden','true');
      fx.innerHTML='<div class="collapse-ring ring-a"></div><div class="collapse-ring ring-b"></div><div class="collapse-crack"></div><div class="hero-lights" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><strong>THE TIME RIVER FALLS SILENT</strong>';
      battlefield?.appendChild(fx);
    }
    fx.classList.remove('active','calm');void fx.offsetWidth;fx.classList.add('active');
    await sleep(1150);
    els.enemyActor.classList.add('boss-defeat');
    await sleep(2050);
    enemyVisualToken++;concealEnemyVisual(true);
    document.body.classList.remove('end-boss-corruption-active');document.body.removeAttribute('data-end-boss-world');
    fx.classList.add('calm');
    await sleep(2100);
    fx.classList.remove('active','calm');fx.remove();
    document.body.classList.remove('end-final-defeat-active');
  }

  async function showEndCongratulationsGate(){
    const battlefield=document.querySelector('.battlefield');if(!battlefield)return;
    let gate=$('endCongratulationsGate');if(!gate){gate=document.createElement('div');gate.id='endCongratulationsGate';gate.className='end-congratulations-gate';gate.setAttribute('role','button');gate.setAttribute('tabindex','0');battlefield.appendChild(gate);}
    gate.innerHTML='<small>END WORLD COMPLETE</small><strong>CONGRATULATION!!</strong><span>画面をタップしてリザルトへ</span>';gate.classList.remove('show');void gate.offsetWidth;gate.classList.add('show');
    await sleep(850);
    await new Promise(resolve=>{let done=false;const key=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();finish();}};const finish=()=>{if(done)return;done=true;gate.removeEventListener('pointerup',finish);window.removeEventListener('keydown',key);resolve();};gate.addEventListener('pointerup',finish,{once:true});window.addEventListener('keydown',key);});
    gate.classList.remove('show');await sleep(300);gate.remove();
  }

  function worldClearLabel(world=mode){return{front:'光の世界',back:'裏の世界',crimson:'紅の世界',blue:'蒼の世界',silver:'銀の世界',midori:'翠の世界'}[world]||'';}
  async function showWorldClear(world=mode,{goldText=''}={}){
    const overlay=els.stageClearOverlay,label=overlay?.querySelector('small'),gold=$('stageClearGold');if(!overlay)return;
    if(label)label.textContent='WORLD CLEAR';els.stageClearName.textContent=worldClearLabel(world);if(gold&&goldText)gold.textContent=goldText;
    requestAnimationFrame(()=>fitSingleLineText(els.stageClearName,{maxWidthRatio:.90,minPx:18}));overlay.hidden=false;playSE(clearSE);await sleep(2750);overlay.hidden=true;if(label)label.textContent='STAGE CLEAR';
  }

  async function defeatBoss(){
    stopTimer();clearBossAction();els.answerMark.hidden=true;
    const terminalClear=mode==='end'&&endFinalPhase;
    if(terminalClear){
      // From the moment the final answer is settled, the battle-question GUI is finished.
      // Keep it suppressed through the finisher, collapse scene and result hand-off.
      document.body.classList.add('end-final-postclear-active');
      clearQuestionUi();updateBossHpHud(true);
    }
    const heroFile=mode==='end'?END_HERO_FILES[currentEndHeroWorld()]:mode==='front'?'hero.png':mode==='back'?'back_hero.png':mode==='crimson'?'crimson_hero.png':mode==='blue'?(isBlueAdultPhase()?'blue_hero_adult.png':'blue_hero.png'):mode==='silver'?'silver_hero.png':'midori_hero_pirate_captain.png';
    await showActionCutin('hero',heroFile);runFinisherMotion();await sleep(980);
    if(terminalClear){
      await runEndFinalDefeatSequence();
    }else{
      els.enemyActor.classList.add('boss-defeat');await sleep(2100);
      // A defeated boss must not pop back in when the forwards animation class is removed.
      enemyVisualToken++;concealEnemyVisual(true);
    }
    els.enemyActor.classList.remove('boss-defeat','end-final-defeat','finisher-hit','finisher-midori-hit');els.heroActor.classList.remove('finisher-front','finisher-back');document.querySelector('.battlefield')?.classList.remove('midori-finisher-impact');els.attackEffect.className='attack-effect';
    if(mode==='crimson'&&crimsonLastPhase){grantStageClearGold('crimson-last',15);await stopBgmFade(1500);await showWorldClear('crimson',{goldText:'＋15 G'});await finishRun();return;}
    if(terminalClear){
      // The clear is committed as soon as the final enemy is defeated, before the tap gate,
      // so closing the app on the congratulations screen cannot lose the clear record.
      if(!debugFullUnlock){save.endClears=(save.endClears||0)+1;persist();syncSecretRelics();}
      await sleep(450);await showEndCongratulationsGate();await finishRun({skipEndCommit:true});return;
    }
    if(mode==='end')await showEndRescue(currentEndSource());
    await clearStage();
  }

  function currentStageClearGold(){
    if(mode==='end')return 0;
    if(mode==='front')return stageIndex===4?10:3;if(mode==='back')return stageIndex===4?15:5;if(mode==='crimson')return 5;if(mode==='silver')return stageIndex===4?20:5;if(mode==='midori')return stageIndex===4?20:5;return 5;
  }
  function grantStageClearGold(key,reward){
    const amount=Math.max(0,Number(reward)||0);
    if(runStageRewards.has(key))return 0;
    runStageRewards.add(key);stats.gold+=amount;
    if(!debugFullUnlock){save.gold+=amount;persist();}
    return amount;
  }

  async function clearStage(){
    resetSpecialGauge();const stageGold=currentStageClearGold();grantStageClearGold(stageIndex,stageGold);const stageClearGold=$('stageClearGold'),clearLabel=els.stageClearOverlay?.querySelector('small'),finalStage=stageIndex>=getStages().length-1,worldComplete=finalStage&&!['crimson','end'].includes(mode);if(stageClearGold)stageClearGold.textContent=mode==='end'?'＋0 G':`＋${stageGold} G`;if(clearLabel)clearLabel.textContent=worldComplete?'WORLD CLEAR':'STAGE CLEAR';els.stageClearName.textContent=worldComplete?worldClearLabel(mode):currentStage().name;requestAnimationFrame(()=>fitSingleLineText(els.stageClearName,{maxWidthRatio:.90,minPx:18}));els.stageClearOverlay.hidden=false;playSE(clearSE);enemyVisualToken++;concealEnemyVisual(true);const fade=stopBgmFade(1500);await sleep(2750);
    if(finalStage){els.stageClearOverlay.hidden=true;if(clearLabel)clearLabel.textContent='STAGE CLEAR';await fade;if(mode==='crimson'){await beginCrimsonLastBoss();return;}if(mode==='end'){await beginEndFinalBoss();return;}await finishRun();return;}
    stageIndex++;stageQuestion=0;bossPhase=false;bossQuestion=0;currentMonster=null;clearBossAction();lives=3;prepareMapOverlay(false);await new Promise(requestAnimationFrame);await sceneBlackout(async()=>{els.stageClearOverlay.hidden=true;},{fadeIn:650,hold:160,fadeOut:850});await fade;await showMapSequence(false,true);
  }

  async function beginCrimsonLastBoss(){
    crimsonLastPhase=true;bossPhase=true;bossQuestion=0;currentMonster=null;currentQuestion=null;lives=3;clearBossAction();unlockCurrentBossMusic();
    await sceneBlackout(async()=>{showOnly(els.gameScreen);document.body.dataset.mode='crimson';document.body.dataset.stage='last';renderGame();clearQuestionUi();enemyVisualToken++;concealEnemyVisual(true);},{fadeIn:520,hold:220,fadeOut:700});
    await playStageBgm();await runBattleCountdown();await showBossEntrance(true,0);
  }
  async function finishRun({skipEndCommit=false}={}){
    stopTimer();await stopBgmFade(500);let reward=null;
    if(!debugFullUnlock){
      if(mode==='front'){save.frontClears++;if(!save.backUnlocked){save.backUnlocked=true;if(!save.owned.includes(100))save.owned.push(100);reward=ITEMS.find(i=>i.id===100);}else reward=randomReward();}
      else if(mode==='back'){save.backClears++;reward=randomReward();}else if(mode==='crimson'){save.crimsonClears=(save.crimsonClears||0)+1;reward=randomReward();}else if(mode==='blue'){save.blueClears=(save.blueClears||0)+1;reward=randomReward();}else if(mode==='silver'){save.silverClears=(save.silverClears||0)+1;reward=randomReward();}else if(mode==='midori'){save.midoriClears=(save.midoriClears||0)+1;reward=randomReward();}else if(mode==='end'&&!skipEndCommit){save.endClears=(save.endClears||0)+1;}
      persist();syncSecretRelics();
    }else renderTitle();renderResult();els.resultOverlay.hidden=false;if(reward){await sleep(600);presentRewardNotice({icon:reward.icon,name:reward.name,text:reward.id===100?'特別なアイテムを手に入れた！':'ゲームクリア報酬として、新しいコレクションアイテムを手に入れた！'});enqueuePendingSecretRelicNotices({showNow:false});}else enqueuePendingSecretRelicNotices({showNow:true});
  }
  function randomReward(){const unowned=ITEMS.filter(i=>!save.owned.includes(i.id)&&i.id!==100);if(!unowned.length)return null;const roll=Math.random(),rar=roll<.6?'common':roll<.9?'uncommon':'rare';let pool=unowned.filter(i=>i.rarity===rar);if(!pool.length)pool=unowned;const r=pick(pool);save.owned.push(r.id);persist();return r;}
  function renderResult(){els.resultMistakes.textContent=stats.mistakes;els.resultTimeouts.textContent=stats.timeouts;els.resultRestarts.textContent=stats.restarts;els.resultGold.textContent=`${stats.gold} G`;if(!stats.errors.length){els.resultErrors.innerHTML='<div class="error-row">ミスはありませんでした！</div>';return;}const recent=stats.errors.slice(-10),head=stats.errors.length>10?`<div class="error-row error-summary">全${stats.errors.length}件中、直近10件</div>`:'';els.resultErrors.innerHTML=head+recent.map(e=>`<div class="error-row"><b>${questionDisplayText({expression:e.q})}</b>　あなた: ${e.selected}　正解: ${e.answer}</div>`).join('');}

  if(els.mapVisual)els.mapVisual.onclick=advanceMapFromInput;
  if(els.mapNextBtn)els.mapNextBtn.onclick=advanceMapFromInput;

  if(els.dataManagementBtn)els.dataManagementBtn.onclick=openDataManagement;
  if(els.dataManagementBackBtn)els.dataManagementBackBtn.onclick=closeDataManagement;
  if(els.dataDeleteBtn)els.dataDeleteBtn.onclick=openDataDeleteConfirm;
  if(els.dataDeleteCancelBtn)els.dataDeleteCancelBtn.onclick=closeDataDeleteConfirm;
  if(els.dataDeleteConfirmBtn)els.dataDeleteConfirmBtn.onclick=deleteAllSaveData;
  if(els.dataDeleteConfirm)els.dataDeleteConfirm.onclick=e=>{if(e.target===els.dataDeleteConfirm)closeDataDeleteConfirm();};
  els.musicBtn.onclick=()=>openMusicPlayer();
  els.musicCloseBtn.onclick=()=>closeMusicPlayer();
  els.musicOverlay.onclick=e=>{if(e.target===els.musicOverlay){playSE(cancelSE);closeMusicPlayer();}};
  els.musicPrevBtn.onclick=()=>moveMusicTrack(-1);
  els.musicNextBtn.onclick=()=>moveMusicTrack(1);
  els.musicStopBtn.onclick=()=>{stopMusicPlayer();renderMusicPlayer();};
  els.musicPlayBtn.onclick=()=>{
    if(musicTrackIndex<0){if(musicWorld==='white')playWhiteRandomTrack(true);else moveMusicTrack(1);return;}
    if(musicPlayer.paused)musicPlayer.play().then(renderMusicPlayer).catch(()=>{});else{musicPlayer.pause();renderMusicPlayer();}
  };
  musicPlayer.addEventListener('play',renderMusicPlayer);
  musicPlayer.addEventListener('pause',renderMusicPlayer);
  musicPlayer.addEventListener('timeupdate',updateMusicSeek);
  musicPlayer.addEventListener('loadedmetadata',updateMusicSeek);
  musicPlayer.addEventListener('durationchange',updateMusicSeek);
  musicPlayer.addEventListener('ended',()=>{if(musicWorld==='white'&&!els.musicOverlay.hidden)playWhiteRandomTrack(true);});
  if(els.musicSeek){
    els.musicSeek.oninput=()=>{
      const duration=Number(musicPlayer.duration);if(!Number.isFinite(duration)||duration<=0)return;
      musicPlayer.currentTime=(Number(els.musicSeek.value)||0)/1000*duration;updateMusicSeek();
    };
  }
  if(els.debugToggleBtn)els.debugToggleBtn.onclick=()=>setDebugFullUnlock(!debugFullUnlock);
  if(els.debugCloseBtn)els.debugCloseBtn.onclick=closeDebugPanel;
  if(els.debugOverlay)els.debugOverlay.onclick=e=>{if(e.target===els.debugOverlay)closeDebugPanel();};

  els.playBtn.onclick=startAdventure;
  els.shopBtn.onclick=async()=>{await transitionTo(()=>{showOnly(els.shopScreen);renderShop();},mode,1450);};
  els.collectionBtn.onclick=async()=>{await transitionTo(()=>{showOnly(els.collectionScreen);renderCollection();},mode,1450);};
  els.monsterBookBtn.onclick=async()=>{await transitionTo(()=>{showOnly(els.monsterBookScreen);renderMonsterBook();},mode,1450);};
  els.shopBackBtn.onclick=async()=>{await transitionTo(()=>{showOnly(els.titleScreen);renderTitle();},mode,1450);};
  els.collectionBackBtn.onclick=els.shopBackBtn.onclick;
  els.monsterBookBackBtn.onclick=els.shopBackBtn.onclick;
  els.monsterCardClose.onclick=closeMonsterCard;
  els.monsterCardOverlay.onclick=e=>{if(e.target===els.monsterCardOverlay){playSE(cancelSE);closeMonsterCard();}};
  if(els.worldWarpBtn)els.worldWarpBtn.onclick=async()=>{if(!canWorldWarp())return;await transitionTo(()=>{renderWorldWarp();showOnly(els.worldWarpScreen);},mode,1300);};
  if(els.worldWarpBackBtn)els.worldWarpBackBtn.onclick=async()=>{await transitionTo(()=>{showOnly(els.titleScreen);renderTitle();},mode,1200);};
  els.backWorldBtn.onclick=async()=>{await transitionTo(()=>{mode='back';renderTitle();showOnly(els.titleScreen);},'back',1700);};
  els.frontWorldBtn.onclick=async()=>{await transitionTo(()=>{mode='front';renderTitle();showOnly(els.titleScreen);},'normal',1700);};
  els.soundBtn.onclick=async()=>{soundOn=!soundOn;els.soundBtn.textContent=`♪ ${soundOn?'ON':'OFF'}`;if(!soundOn){if(currentBgm)currentBgm.pause();[correctSE,wrongSE,swordSE,magicSE,gunSE,midoriFinisherSE,sirenSE,endCorruptionNoiseSE,cutinSE,breakSE,frontFinisherSE,backFinisherSE,countSE,buttonSE,cancelSE,start321SE,start0SE,clearSE].forEach(stopSE);}else{playSE(buttonSE);await resumeStageBgmForCurrentState();}};
  els.pauseBtn.onclick=pauseGame;
  if(els.specialBtn)els.specialBtn.onclick=activateSpecialMove;
  els.pauseResumeBtn.onclick=resumeGame;
  if(els.hudModeToggleBtn)els.hudModeToggleBtn.onclick=toggleHudMode;
  els.pauseTitleBtn.onclick=showPauseConfirm;
  els.pauseCancelTitleBtn.onclick=showPauseMenu;
  els.pauseConfirmTitleBtn.onclick=returnTitleFromPause;
  els.gameOverRetryBtn.onclick=retryFromGameOver;
  els.gameOverTitleBtn.onclick=returnTitleFromGameOver;
  els.replayBtn.onclick=async()=>{if(mode==='white'){els.resultOverlay.hidden=true;await startWhiteChallenge();return;}resetRun();primeStageBgm();await transitionTo(()=>{els.resultOverlay.hidden=true;els.rewardOverlay.hidden=true;showOnly(els.gameScreen);prepareMapOverlay(true);},mode,1500);await showMapSequence(true,true);};
  els.toTitleBtn.onclick=async()=>{await transitionTo(()=>{document.body.classList.remove('end-final-postclear-active');document.body.removeAttribute('data-boss-aura-world');document.body.removeAttribute('data-boss-aura-tier');els.resultOverlay.hidden=true;els.rewardOverlay.hidden=true;showOnly(els.titleScreen);renderTitle();},mode,1500);enqueuePendingSecretRelicNotices({showNow:true});};
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
    get state(){return{mode,stageIndex,stageQuestion,totalProgress,lives,timeLeft,timerLimit,bossPhase,bossQuestion,currentMonster:currentMonster&&{...currentMonster},bossActionActive,bossSpecialSequence:bossSpecialSequence&&{...bossSpecialSequence},currentQuestion:currentQuestion&&{...currentQuestion},paused,gameOverActive,specialGauge,comboStreak,specialActive,hudMode};},
    rarityRoll,selectMonster,makeBossQuestion,makeFrontFinalBossQuestion,makeBackFinalBossQuestion,currentBoss,makeChoices,
    showActionCutin,showBossTechnique,runBossFifthAction,showBossPhaseTransition,showShieldForm,showShieldBreak,showEquationRewrite,showReconstructTransition,startTimer,makeReverseQuestion,makeTransformQuestion,makeReconstructedQuestion,runAttackMotion,runFinisherMotion,activateSpecialMove,sceneBlackout,pauseGame,resumeGame,runBattleCountdown,showGameOver,retryFromGameOver,BATTLE_FLIP_FACING,
    setMode(v){mode=v;renderTitle();},setStage(i){clearBossAction();stageIndex=i;stageQuestion=0;bossPhase=false;bossQuestion=0;currentMonster=null;},
    forceBoss(q=0){bossPhase=true;bossQuestion=q;currentMonster=null;renderGame();},
    setLives(v){lives=v;renderGame();},
    setSpecialGauge(v){specialGauge=Math.max(0,Math.min(100,Number(v)||0));updateSpecialHud();},setHudMode(v){applyHudMode(v);},setTimerState(left,limit=timerLimit){timerLimit=Math.max(1,Number(limit)||1);timeLeft=Math.max(0,Number(left)||0);els.timerText.textContent=timeLeft;updateTimerUrgency();},updateModernBattleHud,syncModernTimerHud,
    registerMonster,hasSecretRelic,syncSecretRelics,enqueuePendingSecretRelicNotices,enqueuePendingWorldUnlockNotices,isWorldActuallyUnlocked,isWorldMarkedNew,markWorldVisited,get save(){return save;},get debugFullUnlock(){return debugFullUnlock;},setDebugFullUnlock,openDebugPanel,debugJumpToStage,debugJumpToBossFifth,debugJumpToCrimsonLast,debugJumpToEndFinal,FRONT_MONSTERS,BACK_MONSTERS,CRIMSON_MONSTERS,BLUE_MONSTERS,SILVER_MONSTERS,FRONT_STAGES,BACK_STAGES,CRIMSON_STAGES,BLUE_STAGES,SILVER_STAGES,CRIMSON_LAST,makeCrimsonQuestion,makeBlueQuestion,makeBlueBossQuestion,makeBlueFinalBossQuestion,makeBlueEndlessEchoQuestion,makeBlueEndlessFinalQuestion,makeSilverQuestion,makeSilverFinalBossQuestion,makeCrimsonFinalQuestion,makeMidoriQuestion,makeMidoriFinalBossQuestion,midoriUnitQuestion,midoriAreaQuestion,midoriPatternQuestion,midoriCountingQuestion,midoriLogicQuestion,MIDORI_MONSTERS,MIDORI_STAGES,END_MONSTERS,END_REGION_CONFIG,END_FINAL,END_FINAL_HERO_ORDER,currentEndHeroWorld,makeEndQuestion,makeEndFinalQuestion,newEndRoute,WHITE_BOSS_POOL,WHITE_BACKGROUND_POOL,WHITE_NORMAL_BGM_POOL,WHITE_BOSS_BGM_POOL,makeWhiteQuestion,makeWhiteBeyondQuestion,whiteQuestionTime,whiteBeyondRate,startWhiteChallenge,musicTracks,renderMusicPlayer,MAP_TIPS,chooseMapTip,BOSS_SPECIALS,CRIMSON_LAST_SPECIAL,currentBossSpecial,clearBossAction,clearCrimsonSpecialEffects,clearMidoriSpecialEffects,rotateCrimsonChoices,shuffleSilverChoices,rotateSilverBeastRingChoices,fitMathProblemToBox,restoreChoiceInteractivity,questionDisplayText,expressionNeedsEqualsPrompt,renderQuestionContent,prepareQuestion,startMidoriAim,startMidoriSonar,startMidoriRune,startMidoriRoute,startMidoriTide,syncMidoriSpecialControls,syncMidoriAfterElimination,
    async beginNormal(){await beginNormalEncounter();},async enterBoss(){await enterBossPhase();},async bossAction(){await runBossFifthAction();},async restartBoss(){await restartBossCheckpoint();},async resolve(v,t=false){await resolveAnswer(v,t);},stop(){stopTimer();},setProgress(sq,tp,bq=0,bp=false){stageQuestion=sq;totalProgress=tp;bossQuestion=bq;bossPhase=bp;renderGame();}
  };

  document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseGame('visibility');});
  window.addEventListener('resize',()=>requestAnimationFrame(()=>{fitVisibleNames();if(currentQuestion&&!els.gameScreen.hidden)fitMathProblemToBox(currentQuestion);}),{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(()=>{fitVisibleNames();if(currentQuestion&&!els.gameScreen.hidden)fitMathProblemToBox(currentQuestion);},80),{passive:true});
  if(document.fonts?.ready)document.fonts.ready.then(()=>fitVisibleNames()).catch(()=>{});

  initializeSecretRelics();
  initializeWorldUnlockState();
  installDebugSecretGesture();
  applyHudMode(readHudMode(),{persist:false});
  renderTitle();showOnly(els.titleScreen);enqueuePendingSecretRelicNotices({showNow:true});
})();
