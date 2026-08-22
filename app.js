(() => {
  "use strict";

  const QUESTION_SECONDS = 60;
  const CORRECT_DELAY = 900;
  const WRONG_DELAY = 1850;
  const MAX_STREAK = 45;
  const MAX_LIVES = 3;

  const startScreen = document.getElementById("startScreen");
  const startBtn = document.getElementById("startBtn");
  const startSoundBtn = document.getElementById("startSoundBtn");
  const game = document.getElementById("game");
  const bgmToggle = document.getElementById("bgmToggle");
  const streakText = document.getElementById("streakText");
  const lifePips = document.getElementById("lifePips");
  const journeyFill = document.getElementById("journeyFill");
  const timerText = document.getElementById("timerText");
  const stageName = document.getElementById("stageName");
  const stageStep = document.getElementById("stageStep");
  const mathProblem = document.getElementById("mathProblem");
  const feedbackText = document.getElementById("feedbackText");
  const choicesEl = document.getElementById("choices");
  const answerButtons = [...document.querySelectorAll(".answer")];
  const bottomMessage = document.getElementById("bottomMessage");
  const heroSprite = document.getElementById("heroSprite");
  const enemySprite = document.getElementById("enemySprite");
  const enemyImage = document.getElementById("enemyImage");
  const enemyName = document.getElementById("enemyName");
  const countdownOverlay = document.getElementById("countdownOverlay");
  const countdownText = document.getElementById("countdownText");
  const mapOverlay = document.getElementById("mapOverlay");
  const worldMap = document.getElementById("worldMap");
  const mapMarker = document.getElementById("mapMarker");
  const mapMessage = document.getElementById("mapMessage");
  const stageRevealOverlay = document.getElementById("stageRevealOverlay");
  const stageRevealBg = document.getElementById("stageRevealBg");
  const stageRevealTitle = document.getElementById("stageRevealTitle");
  const stageClearOverlay = document.getElementById("stageClearOverlay");
  const stageClearTitle = document.getElementById("stageClearTitle");
  const clearOverlay = document.getElementById("clearOverlay");
  const confetti = document.getElementById("confetti");
  const resultOverlay = document.getElementById("resultOverlay");
  const resultMistakes = document.getElementById("resultMistakes");
  const resultTimeouts = document.getElementById("resultTimeouts");
  const resultRestarts = document.getElementById("resultRestarts");
  const resultErrorList = document.getElementById("resultErrorList");
  const resultRestartBtn = document.getElementById("resultRestartBtn");
  const resultTitleBtn = document.getElementById("resultTitleBtn");

  const FALLBACK_BGM = "./assets/bgm.mp3";
  const bgm = new Audio(FALLBACK_BGM);
  let currentBgmFile = FALLBACK_BGM;
  let requestedBgmFile = FALLBACK_BGM;
  const correctSE = new Audio("./assets/correct.mp3");
  const wrongSE = new Audio("./assets/wrong.mp3");
  const goSE = new Audio("./assets/go.mp3");
  bgm.loop = true;
  bgm.volume = 0.34;
  correctSE.volume = 0.85;
  wrongSE.volume = 0.82;
  goSE.volume = 0.85;

  let soundOn = true;
  let streak = 0;
  let lives = MAX_LIVES;
  let currentQuestion = null;
  let locked = false;
  let timerId = null;
  let timeLeft = QUESTION_SECONDS;
  let lastProblemKey = "";
  let recentProblemKeys = [];
  let lastSimpleOp = null;
  let sameSimpleOpCount = 0;
  let currentZone = "forest";
  let mistakeLog = [];
  let timeoutCount = 0;
  let stageRestartCount = 0;

  const STAGES = [
    {
      key: "forest",
      name: "はじまりの もり",
      minStreak: 0,
      bgm: "./assets/Cybern.mp3",
      enemies: [
        ["ぷるるスライム", "slime.png"],
        ["きのこぞう", "mushroom.png"],
        ["ちびバット", "bat.png"]
      ]
    },
    {
      key: "cave",
      name: "ふしぎな どうくつ",
      minStreak: 10,
      bgm: "./assets/Cold Amber.mp3",
      enemies: [
        ["いわゴーレム", "golem.png"],
        ["クリスタルン", "crystal.png"],
        ["どうくつバット", "bat.png"]
      ]
    },
    {
      key: "tower",
      name: "まほうの とう",
      minStreak: 20,
      bgm: "./assets/Crate Lockup Tango.mp3",
      enemies: [
        ["まほうつかい", "wizard.png"],
        ["クリスタルン", "crystal.png"],
        ["そらバット", "bat.png"]
      ]
    },
    {
      key: "castle",
      name: "まおうの しろ",
      minStreak: 30,
      bgm: "./assets/Quantized Panic.mp3",
      enemies: [
        ["あくまのナイト", "knight.png"],
        ["やみのまほうつかい", "wizard.png"],
        ["くろゴーレム", "golem.png"]
      ]
    },
    {
      key: "boss",
      name: "まおうの へや",
      minStreak: 40,
      bgm: "./assets/Geology.mp3",
      enemies: [["まおうキング", "demon.png"]]
    }
  ];

  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const choose = arr => arr[Math.floor(Math.random() * arr.length)];
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function shuffle(arr) {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function digitNoCarryAdd(a, b) {
    if (a < 0 || b < 0 || a + b > 99) return false;
    return (a % 10) + (b % 10) <= 9 && Math.floor(a / 10) + Math.floor(b / 10) <= 9;
  }

  function digitNoBorrowSub(a, b) {
    if (a < b || b < 0) return false;
    return (a % 10) >= (b % 10) && Math.floor(a / 10) >= Math.floor(b / 10);
  }

  function stageForStreak(value) {
    if (value >= 40) return STAGES[4];
    if (value >= 30) return STAGES[3];
    if (value >= 20) return STAGES[2];
    if (value >= 10) return STAGES[1];
    return STAGES[0];
  }

  function renderLives() {
    const gems = lifePips ? [...lifePips.querySelectorAll(".life-gem")] : [];
    gems.forEach((gem, index) => {
      const active = index < lives;
      gem.classList.toggle("active", active);
      gem.classList.toggle("lost", !active);
    });
    if (lifePips) lifePips.setAttribute("aria-label", `ライフ ${lives} / ${MAX_LIVES}`);
  }

  function resetLives() {
    lives = MAX_LIVES;
    renderLives();
  }

  function pickSimpleOperator() {
    let op = Math.random() < 0.5 ? "+" : "-";
    if (lastSimpleOp === op && sameSimpleOpCount >= 3) op = op === "+" ? "-" : "+";
    if (lastSimpleOp === op) sameSimpleOpCount += 1;
    else {
      lastSimpleOp = op;
      sameSimpleOpCount = 1;
    }
    return op;
  }

  function makeForestQuestion() {
    const op = pickSimpleOperator();
    if (op === "+") {
      for (let i = 0; i < 200; i++) {
        const a = randInt(1, 8), b = randInt(1, 8);
        if (digitNoCarryAdd(a, b) && a + b <= 9) return makeQuestion([a, b], ["+"]);
      }
    } else {
      const a = randInt(2, 9), b = randInt(1, a - 1);
      return makeQuestion([a, b], ["-"]);
    }
    return makeQuestion([3, 5], ["+"]);
  }

  function makeCaveQuestion() {
    const op = pickSimpleOperator();
    for (let i = 0; i < 800; i++) {
      if (op === "+") {
        const a = randInt(10, 29), b = randInt(1, 9);
        if (digitNoCarryAdd(a, b)) return makeQuestion([a, b], ["+"]);
      } else {
        const a = randInt(10, 29), b = randInt(1, 9);
        if (digitNoBorrowSub(a, b) && a - b >= 1) return makeQuestion([a, b], ["-"]);
      }
    }
    return makeQuestion([12, 6], [op]);
  }

  function makeTowerQuestion() {
    const op = pickSimpleOperator();
    for (let i = 0; i < 1400; i++) {
      if (op === "+") {
        const a = randInt(10, 79), b = randInt(10, 79);
        if (digitNoCarryAdd(a, b) && a + b <= 99) return makeQuestion([a, b], ["+"]);
      } else {
        const a = randInt(20, 99), b = randInt(10, 89);
        if (digitNoBorrowSub(a, b) && a - b >= 1) return makeQuestion([a, b], ["-"]);
      }
    }
    return op === "+" ? makeQuestion([24, 13], ["+"]) : makeQuestion([37, 12], ["-"]);
  }

  function validateThree(nums, ops) {
    let value = nums[0];
    for (let i = 0; i < ops.length; i++) {
      const n = nums[i + 1];
      if (ops[i] === "+") {
        if (!digitNoCarryAdd(value, n)) return false;
        value += n;
      } else {
        if (!digitNoBorrowSub(value, n)) return false;
        value -= n;
      }
      if (value < 1 || value > 99) return false;
    }
    return true;
  }

  function makeCastleQuestion(isBoss = false) {
    const patterns = [["+", "+"], ["-", "-"], ["+", "-"], ["-", "+"]];
    for (let i = 0; i < 5000; i++) {
      const ops = choose(patterns);
      const a = isBoss ? randInt(40, 99) : randInt(10, 79);
      const b = isBoss ? randInt(10, 49) : randInt(1, 39);
      const c = isBoss ? randInt(10, 39) : randInt(1, 29);
      const nums = [a, b, c];
      if (validateThree(nums, ops)) return makeQuestion(nums, ops);
    }
    return isBoss ? makeQuestion([98, 34, 21], ["-", "-"]) : makeQuestion([11, 28, 6], ["+", "-"]);
  }

  function makeQuestion(nums, ops) {
    let value = nums[0];
    for (let i = 0; i < ops.length; i++) value = ops[i] === "+" ? value + nums[i + 1] : value - nums[i + 1];
    const expression = nums.map((n, i) => i === 0 ? String(n) : `${ops[i - 1]} ${n}`).join(" ");
    return { nums, ops, answer: value, expression, key: `${expression}=${value}` };
  }

  function generateQuestion() {
    let q;
    for (let i = 0; i < 120; i++) {
      if (streak < 10) q = makeForestQuestion();
      else if (streak < 20) q = makeCaveQuestion();
      else if (streak < 30) q = makeTowerQuestion();
      else if (streak < 40) q = makeCastleQuestion(false);
      else q = makeCastleQuestion(true);
      if (!recentProblemKeys.includes(q.key)) break;
    }
    recentProblemKeys.push(q.key);
    recentProblemKeys = recentProblemKeys.slice(-4);
    lastProblemKey = q.key;
    return q;
  }

  function makeChoices(answer) {
    let values;
    if (answer >= 99) values = [97, 98, 99];
    else values = [answer - 1, answer, answer + 1];
    return shuffle(values);
  }

  function setSound(on) {
    soundOn = !!on;
    startSoundBtn.textContent = `♪ おんがく：${soundOn ? "ON" : "OFF"}`;
    bgmToggle.textContent = `♪ ${soundOn ? "ON" : "OFF"}`;
    if (!soundOn) {
      bgm.pause();
    } else if (!game.hidden && mapOverlay.hidden && stageRevealOverlay.hidden) {
      playStageBGM(stageForStreak(Math.min(streak, 44)));
    }
  }

  function stopBGM({ reset = false } = {}) {
    bgm.pause();
    bgm.volume = 0.34;
    if (reset) {
      try { bgm.currentTime = 0; } catch (_) {}
    }
  }

  async function fadeOutBGM(duration = 1200) {
    if (bgm.paused) {
      stopBGM({ reset: true });
      return;
    }
    const startVolume = bgm.volume || 0.34;
    const started = performance.now();
    await new Promise(resolve => {
      const tick = now => {
        const progress = Math.min(1, (now - started) / duration);
        bgm.volume = startVolume * (1 - progress);
        if (progress < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    stopBGM({ reset: true });
  }

  function playStageBGM(stage) {
    if (!soundOn || !stage) return;
    const target = stage.bgm || FALLBACK_BGM;
    requestedBgmFile = target;
    if (currentBgmFile !== target) {
      stopBGM({ reset: true });
      currentBgmFile = target;
      bgm.src = target;
      bgm.load();
    }
    bgm.loop = true;
    bgm.volume = 0.34;
    bgm.play().catch(() => {
      if (target !== FALLBACK_BGM) playFallbackBGM(target);
    });
  }

  function playFallbackBGM(failedTarget) {
    if (!soundOn || requestedBgmFile !== failedTarget) return;
    stopBGM({ reset: true });
    currentBgmFile = FALLBACK_BGM;
    bgm.src = FALLBACK_BGM;
    bgm.load();
    bgm.loop = true;
    bgm.volume = 0.34;
    bgm.play().catch(() => {});
  }

  bgm.addEventListener("error", () => {
    if (currentBgmFile !== FALLBACK_BGM) playFallbackBGM(currentBgmFile);
  });

  function playSE(audio) {
    if (!soundOn) return;
    try {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch (_) {}
  }

  async function runCountdown() {
    countdownOverlay.hidden = false;
    for (const item of ["3", "2", "1", "GO!"]) {
      countdownText.textContent = item;
      countdownText.style.animation = "none";
      void countdownText.offsetWidth;
      countdownText.style.animation = "countdownPop .65s steps(5,end)";
      if (item === "GO!") playSE(goSE);
      await sleep(item === "GO!" ? 620 : 660);
    }
    countdownOverlay.hidden = true;
  }

  function stopTimer() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  function startTimer() {
    stopTimer();
    timeLeft = QUESTION_SECONDS;
    renderTimer();
    timerId = setInterval(() => {
      timeLeft -= 1;
      renderTimer();
      if (timeLeft <= 0) {
        stopTimer();
        resolveAnswer(-1, true);
      }
    }, 1000);
  }

  function renderTimer() {
    timerText.textContent = String(Math.max(0, timeLeft));
    const block = timerText.closest(".timer-block");
    block.classList.toggle("warning", timeLeft <= 10);
  }

  const MAP_POINTS = {
    // world_map_v3.png 上の位置。前版の地理関係（森→洞窟→塔→城）を維持。
    forest: { left: 12.8, top: 52.0 },
    cave: { left: 34.6, top: 47.8 },
    tower: { left: 53.6, top: 56.0 },
    castle: { left: 74.1, top: 41.9 },
    // 最終ステージは「別の土地」ではなく、城内部の拡大表示（玉座の間）へ進む。
    boss: { left: 88.0, top: 66.2 }
  };

  const STAGE_BACKGROUNDS = {
    forest: "./assets/bg_forest.png",
    cave: "./assets/bg_cave.png",
    tower: "./assets/bg_tower.png",
    castle: "./assets/bg_castle.png",
    boss: "./assets/bg_boss.png"
  };

  function setMarker(point, instant = false) {
    if (instant) mapMarker.style.transition = "none";
    mapMarker.style.left = `${point.left}%`;
    mapMarker.style.top = `${point.top}%`;
    if (instant) {
      void mapMarker.offsetWidth;
      mapMarker.style.transition = "left 2.65s cubic-bezier(.42,.08,.18,1), top 2.65s cubic-bezier(.42,.08,.18,1)";
    }
  }

  async function showInitialMap(stage) {
    stopBGM({ reset: true });
    const startPoint = { left: 5.5, top: 61.5 };
    const toPoint = MAP_POINTS[stage.key] || MAP_POINTS.forest;

    mapMessage.textContent = "ぼうけんの はじまりへ…";
    worldMap?.classList.remove("traveling", "arrived", "boss-entering");
    mapMarker.classList.remove("traveling", "arrived");
    setMarker(startPoint, true);
    mapOverlay.hidden = false;

    await sleep(650);
    worldMap?.classList.add("traveling");
    mapMarker.classList.add("traveling");
    setMarker(toPoint, false);
    await sleep(2700);

    mapMarker.classList.remove("traveling");
    mapMarker.classList.add("arrived");
    worldMap?.classList.remove("traveling");
    worldMap?.classList.add("arrived");
    mapMessage.textContent = `${stage.name} から ぼうけん スタート`;
    await sleep(650);

    worldMap?.classList.remove("arrived");
    mapMarker.classList.remove("arrived");
    mapOverlay.hidden = true;
    await showStageBackground(stage);
  }

  async function showMapTravel(fromStage, toStage) {
    const fromPoint = MAP_POINTS[fromStage.key] || MAP_POINTS.forest;
    const toPoint = MAP_POINTS[toStage.key] || MAP_POINTS.forest;
    const enteringBossRoom = toStage.key === "boss";

    mapMessage.textContent = enteringBossRoom
      ? "まおうの しろ の おくへ…"
      : `${fromStage.name} から ${toStage.name} へ`;

    worldMap?.classList.remove("traveling", "arrived", "boss-entering");
    mapMarker.classList.remove("traveling", "arrived");
    setMarker(fromPoint, true);
    mapOverlay.hidden = false;

    // 地図を見せるための導入。BGMはここから無音。
    await sleep(520);
    worldMap?.classList.add("traveling");
    if (enteringBossRoom) worldMap?.classList.add("boss-entering");
    mapMarker.classList.add("traveling");
    setMarker(toPoint, false);

    // 光の軌跡とゆるいズームを伴う移動。
    await sleep(2700);
    mapMarker.classList.remove("traveling");
    mapMarker.classList.add("arrived");
    worldMap?.classList.remove("traveling");
    worldMap?.classList.add("arrived");
    mapMessage.textContent = enteringBossRoom
      ? "まおうの へや へ…"
      : `${toStage.name} に とうちゃく！`;

    await sleep(520);
    worldMap?.classList.remove("arrived", "boss-entering");
    mapMarker.classList.remove("arrived");
    mapOverlay.hidden = true;
  }

  async function showStageBackground(stage) {
    stageRevealTitle.textContent = stage.name;
    stageRevealBg.style.backgroundImage = `url('${STAGE_BACKGROUNDS[stage.key]}')`;
    stageRevealOverlay.hidden = false;
    await sleep(1250);
    stageRevealOverlay.hidden = true;
  }

  async function showStageClearTransition(stage) {
    stageClearTitle.textContent = stage.name;
    stageClearOverlay.hidden = false;
    stageClearOverlay.classList.remove("play");
    void stageClearOverlay.offsetWidth;
    stageClearOverlay.classList.add("play");
    await sleep(1200);
    stageClearOverlay.hidden = true;
    stageClearOverlay.classList.remove("play");
  }

  async function runStageTransition(fromStage, toStage) {
    await Promise.all([fadeOutBGM(1200), showStageClearTransition(fromStage)]);
    await showMapTravel(fromStage, toStage);
    await showStageBackground(toStage);
  }

  function setEnemy(stage) {
    const [name, file] = choose(stage.enemies);
    enemyName.textContent = name;
    enemyImage.src = `./assets/${file}`;
    enemyImage.alt = name;
    enemySprite.classList.remove("hit", "defeat");
  }

  function renderHud(stage) {
    streakText.textContent = `${streak} / ${MAX_STREAK}`;
    journeyFill.style.width = `${(streak / MAX_STREAK) * 100}%`;
    stageName.textContent = stage.name;
    stageStep.textContent = `${Math.min(streak + 1, MAX_STREAK)} / ${MAX_STREAK}`;
    renderLives();
  }

  function renderEquation(question) {
    // v8: 問題ごとの自動縮小は廃止。
    // すべての問題を同じ固定サイズで表示する。
    const compactExpression = question.expression.replace(/\s+/g, "");
    mathProblem.textContent = `${compactExpression}=?`;
    mathProblem.classList.toggle("three-term", question.nums.length >= 3);
  }

  async function prepareQuestion({ stageIntro = false, previousStageKey = null } = {}) {
    locked = true;
    stopTimer();
    const stage = stageForStreak(streak);
    const zoneChanged = stage.key !== currentZone;
    currentZone = stage.key;
    document.body.dataset.zone = stage.key;
    renderHud(stage);
    if (stageIntro || zoneChanged) {
      const fromStage = STAGES.find(s => s.key === previousStageKey) || stage;
      await runStageTransition(fromStage, stage);
      playStageBGM(stage);
    }

    setEnemy(stage);
    currentQuestion = generateQuestion();
    renderEquation(currentQuestion);
    feedbackText.textContent = "";
    feedbackText.className = "feedback-text";
    bottomMessage.textContent = streak === 44 ? "さいごの 1もん！ まおうを たおそう！" : (streak >= 40 ? "さいしゅうステージ！ まおうを たおそう！" : "もんだいに こたえて すすもう！");

    const values = makeChoices(currentQuestion.answer);
    answerButtons.forEach((button, index) => {
      button.textContent = values[index];
      button.dataset.value = String(values[index]);
      button.disabled = false;
      button.classList.remove("correct", "wrong");
    });
    heroSprite.classList.remove("attack");
    enemySprite.classList.remove("hit", "defeat");
    locked = false;
    startTimer();
  }

  async function resolveAnswer(selectedValue, timeUp = false) {
    if (locked) return;
    locked = true;
    stopTimer();
    answerButtons.forEach(btn => btn.disabled = true);

    const answer = currentQuestion.answer;
    const isCorrect = !timeUp && selectedValue === answer;
    if (!isCorrect) {
      const stage = stageForStreak(streak);
      mistakeLog.push({
        stage: stage.name,
        question: `${currentQuestion.expression.replace(/\s+/g, "")}=${answer}`,
        selected: timeUp ? null : selectedValue,
        correct: answer,
        timeUp
      });
      if (timeUp) timeoutCount += 1;
    }
    const correctBtn = answerButtons.find(btn => Number(btn.dataset.value) === answer);
    if (correctBtn) correctBtn.classList.add("correct");

    if (isCorrect) {
      playSE(correctSE);
      feedbackText.textContent = "せいかい！";
      feedbackText.className = "feedback-text good";
      bottomMessage.textContent = "こうげき せいこう！";
      heroSprite.classList.add("attack");
      enemySprite.classList.add("hit");
      await sleep(390);
      enemySprite.classList.add("defeat");
      const oldStage = stageForStreak(streak).key;
      streak += 1;
      renderHud(stageForStreak(Math.min(streak, 44)));
      if (streak >= MAX_STREAK) {
        await sleep(550);
        showClear();
        return;
      }
      const newStage = stageForStreak(streak).key;
      if (oldStage !== newStage) resetLives();
      await sleep(Math.max(0, CORRECT_DELAY - 390));
      await prepareQuestion({ stageIntro: oldStage !== newStage, previousStageKey: oldStage });
    } else {
      if (!timeUp) {
        const wrongBtn = answerButtons.find(btn => Number(btn.dataset.value) === selectedValue);
        if (wrongBtn) wrongBtn.classList.add("wrong");
      }
      playSE(wrongSE);
      lives = Math.max(0, lives - 1);
      renderLives();
      feedbackText.textContent = timeUp ? `じかんぎれ！ せいかいは ${answer} だよ` : `ざんねん！ せいかいは ${answer} だよ`;
      feedbackText.className = "feedback-text bad";
      enemySprite.classList.add("hit");

      if (lives > 0) {
        bottomMessage.textContent = `ライフは あと ${lives}。このまま すすもう！`;
        await sleep(WRONG_DELAY);
        await prepareQuestion();
      } else {
        const stage = stageForStreak(streak);
        bottomMessage.textContent = "ライフ 0。いまの ステージを はじめから！";
        await sleep(WRONG_DELAY + 300);
        stageRestartCount += 1;
        streak = stage.minStreak;
        resetLives();
        currentZone = stage.key;
        document.body.dataset.zone = stage.key;
        renderHud(stage);
        await prepareQuestion();
      }
    }
  }

  function buildConfetti() {
    confetti.replaceChildren();
    const colors = ["#ffd33d", "#2ec4b6", "#ff6b6b", "#5b8cff", "#c268e0", "#6bd66b"];
    for (let i = 0; i < 55; i++) {
      const p = document.createElement("i");
      p.style.left = `${Math.random() * 100}%`;
      p.style.setProperty("--c", choose(colors));
      p.style.setProperty("--d", `${2.4 + Math.random() * 3.2}s`);
      p.style.setProperty("--delay", `${-Math.random() * 4}s`);
      confetti.appendChild(p);
    }
  }

  function renderResult() {
    resultMistakes.textContent = String(mistakeLog.length);
    resultTimeouts.textContent = String(timeoutCount);
    resultRestarts.textContent = String(stageRestartCount);
    resultErrorList.replaceChildren();

    if (mistakeLog.length === 0) {
      const perfect = document.createElement("div");
      perfect.className = "result-perfect";
      perfect.textContent = "ノーミス！ すべての もんだいを クリアしました。";
      resultErrorList.appendChild(perfect);
      return;
    }

    mistakeLog.forEach((item, index) => {
      const row = document.createElement("article");
      row.className = "result-error-item";
      const answerText = item.timeUp ? "じかんぎれ" : `えらんだ こたえ：${item.selected}`;
      row.innerHTML = `<span class="result-error-no">${index + 1}</span><div><small>${item.stage}</small><strong>${item.question}</strong><p>${answerText} ／ せいかい：${item.correct}</p></div>`;
      resultErrorList.appendChild(row);
    });
  }

  function showResult() {
    renderResult();
    resultOverlay.hidden = false;
  }

  async function showClear() {
    stopTimer();
    await fadeOutBGM(1000);
    buildConfetti();
    clearOverlay.hidden = false;
    if (soundOn) {
      try {
        correctSE.currentTime = 0;
        correctSE.play().catch(() => {});
      } catch (_) {}
    }
    await sleep(2400);
    clearOverlay.hidden = true;
    showResult();
  }

  function resetRunStats() {
    mistakeLog = [];
    timeoutCount = 0;
    stageRestartCount = 0;
  }

  async function startGame() {
    startScreen.hidden = true;
    clearOverlay.hidden = true;
    resultOverlay.hidden = true;
    game.hidden = false;
    resetRunStats();
    streak = 0;
    resetLives();
    currentZone = "forest";
    recentProblemKeys = [];
    lastSimpleOp = null;
    sameSimpleOpCount = 0;
    document.body.dataset.zone = "forest";
    renderHud(STAGES[0]);
    await showInitialMap(STAGES[0]);
    playStageBGM(STAGES[0]);
    await prepareQuestion();
  }

  answerButtons.forEach(btn => {
    btn.addEventListener("click", () => resolveAnswer(Number(btn.dataset.value), false));
  });
  startBtn.addEventListener("click", startGame);
  resultRestartBtn.addEventListener("click", startGame);
  resultTitleBtn.addEventListener("click", () => {
    stopTimer();
    stopBGM({ reset: true });
    resultOverlay.hidden = true;
    clearOverlay.hidden = true;
    stageClearOverlay.hidden = true;
    mapOverlay.hidden = true;
    stageRevealOverlay.hidden = true;
    game.hidden = true;
    startScreen.hidden = false;
  });
  startSoundBtn.addEventListener("click", () => setSound(!soundOn));
  bgmToggle.addEventListener("click", () => setSound(!soundOn));

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      bgm.pause();
      if (!game.hidden && clearOverlay.hidden && resultOverlay.hidden && !locked) stopTimer();
    } else if (soundOn && !game.hidden) {
      if (mapOverlay.hidden && stageRevealOverlay.hidden && stageClearOverlay.hidden && resultOverlay.hidden) playStageBGM(stageForStreak(Math.min(streak, 44)));
      if (clearOverlay.hidden && resultOverlay.hidden && !locked) startTimer();
    }
  });


  setSound(true);
})();
