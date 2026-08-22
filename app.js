(() => {
  "use strict";

  const QUESTION_SECONDS = 60;
  const CORRECT_DELAY = 900;
  const WRONG_DELAY = 1850;
  const MAX_STREAK = 20;

  const startScreen = document.getElementById("startScreen");
  const startBtn = document.getElementById("startBtn");
  const startSoundBtn = document.getElementById("startSoundBtn");
  const game = document.getElementById("game");
  const bgmToggle = document.getElementById("bgmToggle");
  const streakText = document.getElementById("streakText");
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
  const stageOverlay = document.getElementById("stageOverlay");
  const stageOverlayTitle = document.getElementById("stageOverlayTitle");
  const clearOverlay = document.getElementById("clearOverlay");
  const againBtn = document.getElementById("againBtn");
  const confetti = document.getElementById("confetti");

  const bgm = new Audio("./assets/bgm.mp3");
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
  let currentQuestion = null;
  let locked = false;
  let timerId = null;
  let timeLeft = QUESTION_SECONDS;
  let lastProblemKey = "";
  let recentProblemKeys = [];
  let lastSimpleOp = null;
  let sameSimpleOpCount = 0;
  let currentZone = "forest";

  const STAGES = [
    {
      key: "forest",
      name: "はじまりの もり",
      minStreak: 0,
      enemies: [
        ["ぷるるスライム", "slime.png"],
        ["きのこぞう", "mushroom.png"],
        ["ちびバット", "bat.png"]
      ]
    },
    {
      key: "cave",
      name: "ふしぎな どうくつ",
      minStreak: 5,
      enemies: [
        ["いわゴーレム", "golem.png"],
        ["クリスタルン", "crystal.png"],
        ["どうくつバット", "bat.png"]
      ]
    },
    {
      key: "tower",
      name: "まほうの とう",
      minStreak: 10,
      enemies: [
        ["まほうつかい", "wizard.png"],
        ["クリスタルン", "crystal.png"],
        ["そらバット", "bat.png"]
      ]
    },
    {
      key: "castle",
      name: "まおうの しろ",
      minStreak: 15,
      enemies: [
        ["あくまのナイト", "knight.png"],
        ["やみのまほうつかい", "wizard.png"],
        ["くろゴーレム", "golem.png"]
      ]
    },
    {
      key: "boss",
      name: "まおうの へや",
      minStreak: 19,
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
    if (value >= 19) return STAGES[4];
    if (value >= 15) return STAGES[3];
    if (value >= 10) return STAGES[2];
    if (value >= 5) return STAGES[1];
    return STAGES[0];
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
      if (streak < 5) q = makeForestQuestion();
      else if (streak < 10) q = makeCaveQuestion();
      else if (streak < 15) q = makeTowerQuestion();
      else if (streak < 19) q = makeCastleQuestion(false);
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
    } else if (!game.hidden) {
      bgm.play().catch(() => {});
    }
  }

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

  async function showStageIntro(nextStage) {
    stageOverlayTitle.textContent = nextStage.name;
    stageOverlay.hidden = false;
    await sleep(850);
    stageOverlay.hidden = true;
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
    stageStep.textContent = `${streak + 1} / ${MAX_STREAK}`;
  }

  async function prepareQuestion({ stageIntro = false } = {}) {
    locked = true;
    stopTimer();
    const stage = stageForStreak(streak);
    const zoneChanged = stage.key !== currentZone;
    currentZone = stage.key;
    document.body.dataset.zone = stage.key;
    renderHud(stage);
    if (stageIntro || zoneChanged) await showStageIntro(stage);

    setEnemy(stage);
    currentQuestion = generateQuestion();
    mathProblem.textContent = `${currentQuestion.expression} = ?`;
    feedbackText.textContent = "";
    feedbackText.className = "feedback-text";
    bottomMessage.textContent = streak === 19 ? "さいごの 1もん！ まおうを たおそう！" : "もんだいに こたえて すすもう！";

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
      renderHud(stageForStreak(Math.min(streak, 19)));
      if (streak >= MAX_STREAK) {
        await sleep(550);
        showClear();
        return;
      }
      const newStage = stageForStreak(streak).key;
      await sleep(Math.max(0, CORRECT_DELAY - 390));
      await prepareQuestion({ stageIntro: oldStage !== newStage });
    } else {
      if (!timeUp) {
        const wrongBtn = answerButtons.find(btn => Number(btn.dataset.value) === selectedValue);
        if (wrongBtn) wrongBtn.classList.add("wrong");
      }
      playSE(wrongSE);
      feedbackText.textContent = timeUp ? `じかんぎれ！ せいかいは ${answer} だよ` : `ざんねん！ せいかいは ${answer} だよ`;
      feedbackText.className = "feedback-text bad";
      bottomMessage.textContent = "だいじょうぶ！ もういちど 0から すすめるよ！";
      enemySprite.classList.add("hit");
      streak = 0;
      journeyFill.style.width = "0%";
      streakText.textContent = "0 / 20";
      await sleep(WRONG_DELAY);
      currentZone = "forest";
      document.body.dataset.zone = "forest";
      await prepareQuestion();
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

  function showClear() {
    stopTimer();
    buildConfetti();
    clearOverlay.hidden = false;
    if (soundOn) {
      try {
        correctSE.currentTime = 0;
        correctSE.play().catch(() => {});
      } catch (_) {}
    }
  }

  async function startGame() {
    startScreen.hidden = true;
    clearOverlay.hidden = true;
    game.hidden = false;
    streak = 0;
    currentZone = "forest";
    recentProblemKeys = [];
    lastSimpleOp = null;
    sameSimpleOpCount = 0;
    document.body.dataset.zone = "forest";
    if (soundOn) bgm.play().catch(() => {});
    await runCountdown();
    await prepareQuestion();
  }

  answerButtons.forEach(btn => {
    btn.addEventListener("click", () => resolveAnswer(Number(btn.dataset.value), false));
  });
  startBtn.addEventListener("click", startGame);
  againBtn.addEventListener("click", startGame);
  startSoundBtn.addEventListener("click", () => setSound(!soundOn));
  bgmToggle.addEventListener("click", () => setSound(!soundOn));

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      bgm.pause();
      if (!game.hidden && clearOverlay.hidden && !locked) stopTimer();
    } else if (soundOn && !game.hidden) {
      bgm.play().catch(() => {});
      if (clearOverlay.hidden && !locked) startTimer();
    }
  });

  setSound(true);
})();
