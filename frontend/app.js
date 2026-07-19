(() => {
  "use strict";

  /** Адрес бэкенда: правь в config.js после деплоя на bothost */
  const API_URL = (
    window.KUZOSPY_CONFIG?.API_URL ||
    ""
  ).replace(/\/$/, "");

  const FALLBACK_LOCATIONS = [
    "Космическая станция",
    "База на Луне",
    "Орбитальный отель",
    "Завод роботов",
    "Подводная лодка",
    "Пиратский корабль",
    "Круизный лайнер",
    "Затонувшая Атлантида",
    "Необитаемый остров",
    "Рыцарский замок",
    "Древний Египет",
    "Школа магии",
    "Деревня викингов",
    "Дикий Запад (Салун)",
    "Пассажирский самолет",
    "Метро",
    "Поезд «Восточный экспресс»",
    "Космический шаттл",
    "Офис IT-компании",
    "Пожарная часть",
    "Полицейский участок",
    "Автосервис",
    "Военная база",
    "Подземный бункер",
    "Лаборатория ученого",
    "Тюрьма",
    "Казино в Лас-Вегасе",
    "Ночной клуб",
    "Цирк",
    "Аквапарк",
    "Рок-фестиваль",
    "Парк аттракционов",
    "Горнолыжный курорт",
    "Фестиваль косплея",
    "Кинотеатр",
    "Киностудия Голливуда",
    "Музей искусств",
    "Театр оперы",
    "Библиотека",
    "Дорогой ресторан",
    "Бургерная",
    "Кондитерская фабрика",
    "Отель «Все включено»",
    "Психиатрическая больница",
    "Салон красоты",
    "Спа-курорт",
    "Супермаркет",
    "Стадион",
    "Кошачий приют",
    "Детский сад",
  ];

  const GAME_SECONDS = 5 * 60;

  const state = {
    players: 5,
    spies: 1,
    cards: [],
    currentIndex: 0,
    hasSeenCard: false,
    timerId: null,
    secondsLeft: GAME_SECONDS,
    locations: FALLBACK_LOCATIONS.slice(),
  };

  const tg = window.Telegram?.WebApp;
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      tg.setHeaderColor("#0b0f14");
      tg.setBackgroundColor("#0b0f14");
    } catch (_) {
      /* ignore */
    }
  }

  const els = {
    welcome: document.getElementById("welcome"),
    welcomeBtn: document.getElementById("welcome-btn"),
    setup: document.getElementById("setup"),
    app: document.getElementById("app"),
    deal: document.getElementById("screen-deal"),
    play: document.getElementById("screen-play"),
    end: document.getElementById("screen-end"),
    playersValue: document.getElementById("players-value"),
    spiesChips: document.getElementById("spies-chips"),
    btnStart: document.getElementById("btn-start"),
    setupError: document.getElementById("setup-error"),
    dealTitle: document.getElementById("deal-title"),
    dealSub: document.getElementById("deal-sub"),
    roleCard: document.getElementById("role-card"),
    cardRole: document.getElementById("card-role"),
    cardRoleLabel: document.getElementById("card-role-label"),
    btnReveal: document.getElementById("btn-reveal"),
    btnNextPlayer: document.getElementById("btn-next-player"),
    timer: document.getElementById("timer"),
    timerDigits: document.getElementById("timer-digits"),
    locationsList: document.getElementById("locations-list"),
    btnEnd: document.getElementById("btn-end"),
    btnRestart: document.getElementById("btn-restart"),
  };

  function haptic(type) {
    try {
      tg?.HapticFeedback?.impactOccurred?.(type || "light");
    } catch (_) {
      /* ignore */
    }
  }

  /** Окно 1 → Окно 2 */
  function goWelcomeToSetup() {
    haptic("light");
    els.welcome.classList.add("is-out");

    window.setTimeout(() => {
      showSetupWindow();
    }, 180);

    window.setTimeout(() => {
      els.welcome.hidden = true;
      els.welcome.classList.remove("is-out");
    }, 680);
  }

  function showSetupWindow() {
    els.setup.hidden = false;
    els.setup.classList.remove("is-out", "is-in");
    void els.setup.offsetWidth;
    requestAnimationFrame(() => {
      els.setup.classList.add("is-in");
    });
  }

  /** Окно 2 → Окно 3 (карты) */
  function goSetupToDeal() {
    els.setup.classList.remove("is-in");
    els.setup.classList.add("is-out");

    window.setTimeout(() => {
      els.setup.hidden = true;
      els.setup.classList.remove("is-out", "is-in");
      els.app.hidden = false;
      els.app.classList.add("is-enter");
      window.setTimeout(() => els.app.classList.remove("is-enter"), 700);
      prepareDealScreen();
    }, 620);
  }

  function showGameScreen(name) {
    const map = {
      deal: els.deal,
      play: els.play,
      end: els.end,
    };

    Object.entries(map).forEach(([key, node]) => {
      const active = key === name;
      node.hidden = !active;
      node.classList.toggle("screen--active", active);
    });
  }

  function setSetupError(message) {
    if (!message) {
      els.setupError.hidden = true;
      els.setupError.textContent = "";
      return;
    }
    els.setupError.hidden = false;
    els.setupError.textContent = message;
  }

  function updatePlayersUI() {
    els.playersValue.textContent = String(state.players);
  }

  function updateSpiesUI() {
    els.spiesChips.querySelectorAll(".chip").forEach((chip) => {
      const value = Number(chip.dataset.spies);
      chip.classList.toggle("chip--active", value === state.spies);
    });
  }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function stopTimer() {
    if (state.timerId !== null) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function startTimer() {
    stopTimer();
    state.secondsLeft = GAME_SECONDS;
    els.timerDigits.textContent = formatTime(state.secondsLeft);
    els.timer.classList.remove("is-low");

    state.timerId = setInterval(() => {
      state.secondsLeft -= 1;
      if (state.secondsLeft <= 0) {
        state.secondsLeft = 0;
        els.timerDigits.textContent = formatTime(0);
        stopTimer();
        endGame();
        return;
      }
      els.timerDigits.textContent = formatTime(state.secondsLeft);
      els.timer.classList.toggle("is-low", state.secondsLeft <= 30);
    }, 1000);
  }

  function renderLocations() {
    const fragment = document.createDocumentFragment();
    state.locations.forEach((name) => {
      const li = document.createElement("li");
      li.textContent = name;
      fragment.appendChild(li);
    });
    els.locationsList.replaceChildren(fragment);
  }

  function isApiConfigured() {
    return Boolean(
      API_URL &&
        !API_URL.includes("YOUR_SERVER") &&
        /^https?:\/\//i.test(API_URL)
    );
  }

  function shuffle(array) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function createLocalDeck(players, spies) {
    if (spies >= players) {
      throw new Error("Шпионов должно быть меньше, чем игроков");
    }
    const location =
      FALLBACK_LOCATIONS[Math.floor(Math.random() * FALLBACK_LOCATIONS.length)];
    const deck = Array(spies)
      .fill("Шпион")
      .concat(Array(players - spies).fill(location));
    return shuffle(deck);
  }

  async function loadLocations() {
    if (!isApiConfigured()) {
      state.locations = FALLBACK_LOCATIONS.slice().sort((a, b) =>
        a.localeCompare(b, "ru")
      );
      renderLocations();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/locations`);
      if (!response.ok) throw new Error("locations failed");
      const data = await response.json();
      if (Array.isArray(data.locations) && data.locations.length) {
        state.locations = data.locations;
      }
    } catch (_) {
      state.locations = FALLBACK_LOCATIONS.slice().sort((a, b) =>
        a.localeCompare(b, "ru")
      );
    }
    renderLocations();
  }

  function resetCardView() {
    els.roleCard.classList.remove("is-flipped", "is-spy", "is-location");
    els.btnReveal.classList.remove("is-pressed");
    els.cardRole.textContent = "—";
    els.cardRoleLabel.textContent = "Твоя роль";
  }

  function prepareDealScreen() {
    state.currentIndex = 0;
    state.hasSeenCard = false;
    resetCardView();
    els.btnReveal.hidden = false;
    els.btnReveal.disabled = false;
    els.btnNextPlayer.hidden = true;
    updateDealCopy("take");
    showGameScreen("deal");
  }

  function updateDealCopy(mode) {
    const player = state.currentIndex + 1;
    const total = state.cards.length;

    if (mode === "take") {
      els.dealTitle.textContent = `Игрок ${player}, возьми телефон`;
      els.dealSub.textContent =
        "Зажми кнопку «Посмотреть карту». Отпусти — карта снова спрячется.";
      return;
    }

    if (mode === "pass") {
      if (player < total) {
        els.dealTitle.textContent = `Передай телефон Игроку ${player + 1}`;
        els.dealSub.textContent = "Убедись, что карту никто больше не видит.";
      } else {
        els.dealTitle.textContent = "Все посмотрели карты";
        els.dealSub.textContent = "Можно начинать игру.";
      }
    }
  }

  function showCard() {
    const role = state.cards[state.currentIndex];
    const isSpy = role === "Шпион";

    els.cardRole.textContent = role;
    els.cardRoleLabel.textContent = isSpy ? "Ты" : "Место";
    els.roleCard.classList.toggle("is-spy", isSpy);
    els.roleCard.classList.toggle("is-location", !isSpy);
    els.roleCard.classList.add("is-flipped");
    els.btnReveal.classList.add("is-pressed");
    state.hasSeenCard = true;
  }

  function hideCard() {
    els.roleCard.classList.remove("is-flipped");
    els.btnReveal.classList.remove("is-pressed");

    if (!state.hasSeenCard) return;

    els.btnReveal.hidden = true;
    els.btnReveal.disabled = true;
    els.btnNextPlayer.hidden = false;
    updateDealCopy("pass");

    const isLast = state.currentIndex >= state.cards.length - 1;
    els.btnNextPlayer.textContent = isLast
      ? "Начать игру"
      : `Передай телефон Игроку ${state.currentIndex + 2}`;
  }

  function goNextPlayer() {
    if (state.currentIndex >= state.cards.length - 1) {
      startPlayScreen();
      return;
    }

    state.currentIndex += 1;
    state.hasSeenCard = false;
    resetCardView();
    els.btnReveal.hidden = false;
    els.btnReveal.disabled = false;
    els.btnNextPlayer.hidden = true;
    updateDealCopy("take");
  }

  function startPlayScreen() {
    showGameScreen("play");
    startTimer();
  }

  function endGame() {
    stopTimer();
    showGameScreen("end");
  }

  /** Новая игра → снова окно состава */
  function resetToSetup() {
    stopTimer();
    state.cards = [];
    state.currentIndex = 0;
    state.hasSeenCard = false;
    setSetupError("");
    els.app.hidden = true;
    showSetupWindow();
  }

  async function startGame() {
    setSetupError("");
    els.btnStart.disabled = true;
    els.btnStart.textContent = "Готовим карты…";

    try {
      let cards = null;

      if (isApiConfigured()) {
        try {
          const url = new URL(`${API_URL}/api/game`);
          url.searchParams.set("players", String(state.players));
          url.searchParams.set("spies", String(state.spies));

          const response = await fetch(url.toString());
          if (!response.ok) {
            let detail = "Не удалось создать игру";
            try {
              const errorData = await response.json();
              if (errorData.detail) detail = String(errorData.detail);
            } catch (_) {
              /* ignore */
            }
            throw new Error(detail);
          }

          const data = await response.json();
          if (!Array.isArray(data.cards) || data.cards.length !== state.players) {
            throw new Error("Сервер вернул странный ответ");
          }
          cards = data.cards;
        } catch (_) {
          cards = null;
        }
      }

      if (!cards) {
        cards = createLocalDeck(state.players, state.spies);
      }

      state.cards = cards;
      await loadLocations();
      haptic("medium");
      goSetupToDeal();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось начать игру.";
      setSetupError(message);
    } finally {
      els.btnStart.disabled = false;
      els.btnStart.textContent = "Поехали!";
    }
  }

  document.querySelector('[data-stepper="players"]').addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    haptic("light");

    if (button.dataset.action === "minus") {
      state.players = Math.max(3, state.players - 1);
    }
    if (button.dataset.action === "plus") {
      state.players = Math.min(10, state.players + 1);
    }

    if (state.spies >= state.players) {
      state.spies = 1;
      updateSpiesUI();
    }
    updatePlayersUI();
  });

  els.spiesChips.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-spies]");
    if (!chip) return;
    const value = Number(chip.dataset.spies);
    if (value >= state.players) {
      setSetupError("Шпионов должно быть меньше, чем игроков");
      return;
    }
    setSetupError("");
    state.spies = value;
    updateSpiesUI();
    haptic("light");
  });

  els.welcomeBtn.addEventListener("click", goWelcomeToSetup);

  els.btnStart.addEventListener("click", () => {
    void startGame();
  });

  const revealTargets = [els.btnReveal, els.roleCard];

  function onRevealStart(event) {
    if (els.btnReveal.disabled || els.btnReveal.hidden) return;
    event.preventDefault();
    showCard();
  }

  function onRevealEnd(event) {
    if (!state.hasSeenCard) return;
    event.preventDefault();
    hideCard();
  }

  revealTargets.forEach((target) => {
    target.addEventListener("pointerdown", onRevealStart);
    target.addEventListener("pointerup", onRevealEnd);
    target.addEventListener("pointerleave", onRevealEnd);
    target.addEventListener("pointercancel", onRevealEnd);
  });

  window.addEventListener("pointerup", () => {
    if (els.roleCard.classList.contains("is-flipped")) {
      hideCard();
    }
  });

  els.btnNextPlayer.addEventListener("click", goNextPlayer);
  els.btnEnd.addEventListener("click", endGame);
  els.btnRestart.addEventListener("click", resetToSetup);

  updatePlayersUI();
  updateSpiesUI();
  els.app.hidden = true;
  els.setup.hidden = true;
  els.welcome.hidden = false;
  els.welcome.classList.remove("is-out");
})();
