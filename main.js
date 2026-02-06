const LANES = 3;
const LANE_WIDTH = 47;
const GRAVITY = 2000;
const INIT_GAME_SPEED = 150;
const GAME_ACCELERATION = 0;

const RUNNER_JUMP_SPEED = -600;
const RUNNER_INIT_LANE = 1;
const RUNNER_Z = -410;
const RUNNER_SPEED_X = 300;
const RUNNER_SCALE = 0.2;
const RUNNER_COIN_COLLECTION_DISTANCE = 30;
const RUNNER_Z_INDEX_BEHIND = 100;
const RUNNER_DAMAGE_COOLDOWN = 1.0;
const RUNNER_DAMAGE_FLASH_DURATION = 0.15;

const ENTITIES_Z_GAP = 50;
const ENTITIES_PER_LEVEL = 30;
const ENTITIES_PER_LEVEL_SERIES = 6;
const ENTITIES_SPAWN_Z_LAST = 40;
const ENTITIES_SPAWN_Z_FIRST =
  ENTITIES_SPAWN_Z_LAST + ENTITIES_PER_LEVEL * ENTITIES_Z_GAP;
const ENTITIES_Y_FLOATING = -75;
const ENTITIES_BOMB_CHANCE = 0.3;
const ENTITIES_DEATH_TIME = 0.2;

const LEVEL_LENGTH = ENTITIES_SPAWN_Z_FIRST + 550;

// Gate system constants
const GATE_Z_POSITIONS = [-300, -200, -100];
const GATE_WIDTH = 200;
const GATE_HEIGHT = 150;

// Finish line constant - positioned after the last gate
const FINISH_LINE_Z = -450;

// Gate definitions for date choices
const GATE_DEFINITIONS = [
  {
    id: 1,
    question: "First date activity?",
    zPosition: GATE_Z_POSITIONS[0],
    leftOption: { text: "Coffee Shop", emoji: "☕", lane: 0 },
    rightOption: { text: "Museum", emoji: "🎨", lane: 2 },
  },
  {
    id: 2,
    question: "Evening plans?",
    zPosition: GATE_Z_POSITIONS[1],
    leftOption: { text: "Dinner", emoji: "🍝", lane: 0 },
    rightOption: { text: "Concert", emoji: "🎵", lane: 2 },
  },
  {
    id: 3,
    question: "End the night?",
    zPosition: GATE_Z_POSITIONS[2],
    leftOption: { text: "Walk in Park", emoji: "🌙", lane: 0 },
    rightOption: { text: "Rooftop Bar", emoji: "🍸", lane: 2 },
  }
];

// Values used to project a 3D point onto 2D space
const ROAD_ANGLE = (60 * Math.PI) / 180;
const ROAD_ANGLE_SIN = Math.sin(ROAD_ANGLE);
const ROAD_ANGLE_COS = Math.cos(ROAD_ANGLE);
const ROAD_ANGLE_SIN_COS = ROAD_ANGLE_SIN * ROAD_ANGLE_COS;
const PERSPECTIVE = 600;

// Gate Choice Manager Class
class GateChoiceManager {
  constructor(gateDefinitions) {
    this.gates = gateDefinitions;
    this.currentGateIndex = 0;
    this.sessionData = this.initializeSession();
  }

  initializeSession() {
    return {
      sessionId: Date.now().toString(),
      startTime: new Date().toISOString(),
      endTime: null,
      choices: [],
      completed: false
    };
  }

  getNextGate() {
    if (this.currentGateIndex >= this.gates.length) {
      return null;
    }
    return this.gates[this.currentGateIndex];
  }

  checkGateCrossing(runnerZ) {
    const gate = this.getNextGate();
    if (!gate) return null;

    if (runnerZ <= gate.zPosition) {
      return gate;
    }
    return null;
  }

  recordChoice(gate, runnerLane) {
    let selectedOption;
    let choiceText;
    let choiceEmoji;

    if (runnerLane === gate.leftOption.lane) {
      selectedOption = "left";
      choiceText = gate.leftOption.text;
      choiceEmoji = gate.leftOption.emoji;
    } else if (runnerLane === gate.rightOption.lane) {
      selectedOption = "right";
      choiceText = gate.rightOption.text;
      choiceEmoji = gate.rightOption.emoji;
    } else {
      selectedOption = "left";
      choiceText = gate.leftOption.text;
      choiceEmoji = gate.leftOption.emoji;
    }

    const choice = {
      gateId: gate.id,
      question: gate.question,
      leftOption: gate.leftOption,
      rightOption: gate.rightOption,
      selectedOption: selectedOption,
      selectedText: choiceText,
      selectedEmoji: choiceEmoji,
      timestamp: new Date().toISOString(),
      runnerLane: runnerLane
    };

    this.sessionData.choices.push(choice);
    this.currentGateIndex++;

    return choice;
  }

  isComplete() {
    return this.currentGateIndex >= this.gates.length;
  }

  finalizeSession() {
    if (!this.sessionData.completed) {
      this.sessionData.endTime = new Date().toISOString();
      this.sessionData.completed = true;
      return this.sessionData;
    }
    return null;
  }

  saveToLocalStorage(key = 'datePlanResult') {
    try {
      localStorage.setItem(key, JSON.stringify(this.sessionData));
      return true;
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
      return false;
    }
  }

  static loadFromLocalStorage(key = 'datePlanResult') {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
      return null;
    }
  }

  reset() {
    this.currentGateIndex = 0;
    this.sessionData = this.initializeSession();
  }

  getSummary() {
    return {
      totalGates: this.gates.length,
      completedGates: this.sessionData.choices.length,
      isComplete: this.isComplete(),
      choices: this.sessionData.choices.map(c => ({
        question: c.question,
        selected: `${c.selectedEmoji} ${c.selectedText}`
      }))
    };
  }
}

const view = {
  level: document.getElementById('level'),
  score: document.getElementById('score'),
  scene: document.getElementById('scene'),
  road: document.getElementById('road'),
  runner: document.getElementById('runner'),
  entities: Array.from({ length: ENTITIES_PER_LEVEL }, () => {
    const element = document.createElement('div');
    element.style.opacity = 0;
    document.getElementById('scene').append(element);

    return element;
  }),
  gates: GATE_DEFINITIONS.map((gateDef) => {
    // Left gate structure (two sticks + banner with text)
    const leftStickLeft = document.createElement('div');
    leftStickLeft.className = 'gate-stick';
    leftStickLeft.style.opacity = 0;
    document.getElementById('scene').append(leftStickLeft);

    const leftStickRight = document.createElement('div');
    leftStickRight.className = 'gate-stick';
    leftStickRight.style.opacity = 0;
    document.getElementById('scene').append(leftStickRight);

    const leftBanner = document.createElement('div');
    leftBanner.className = 'gate-banner';
    leftBanner.style.opacity = 0;
    leftBanner.innerHTML = `
      <div class="banner-text">${gateDef.leftOption.emoji} ${gateDef.leftOption.text}</div>
    `;
    document.getElementById('scene').append(leftBanner);

    // Right gate structure (two sticks + banner with text)
    const rightStickLeft = document.createElement('div');
    rightStickLeft.className = 'gate-stick';
    rightStickLeft.style.opacity = 0;
    document.getElementById('scene').append(rightStickLeft);

    const rightStickRight = document.createElement('div');
    rightStickRight.className = 'gate-stick';
    rightStickRight.style.opacity = 0;
    document.getElementById('scene').append(rightStickRight);

    const rightBanner = document.createElement('div');
    rightBanner.className = 'gate-banner';
    rightBanner.style.opacity = 0;
    rightBanner.innerHTML = `
      <div class="banner-text">${gateDef.rightOption.emoji} ${gateDef.rightOption.text}</div>
    `;
    document.getElementById('scene').append(rightBanner);

    return {
      leftStickLeft,
      leftStickRight,
      leftBanner,
      rightStickLeft,
      rightStickRight,
      rightBanner,
      def: gateDef
    };
  }),
  finishLine: (() => {
    const element = document.createElement('div');
    element.className = 'finish-line';
    element.style.opacity = 0; // Hidden initially
    document.getElementById('scene').append(element);
    return element;
  })(),
  resultsScreen: null,
};

function getInitialState() {
  const state = {
    game: {
      isOver: false,
      level: 0,
      levelProgress: 0,
      score: 0,
      speed: INIT_GAME_SPEED,
      progress: 0,
      isComplete: false, // Track if finish line reached
    },
    runner: {
      position: {
        x: getLaneX(RUNNER_INIT_LANE),
        y: 0,
        z: RUNNER_Z,
      },
      lane: RUNNER_INIT_LANE,
      ySpeed: 0,
      damageTimer: 0,
    },
    entities: new Array(ENTITIES_PER_LEVEL),
    gateManager: new GateChoiceManager(GATE_DEFINITIONS),
    gates: GATE_DEFINITIONS.map(def => ({
      zPosition: def.zPosition,
      def: def
    })),
    finishLineZ: FINISH_LINE_Z,
  };

  spawnLevelEntities(state);

  // Initialize gates with visibility
  view.gates.forEach((gate, index) => {
    gate.leftStickLeft.style.opacity = 1;
    gate.leftStickRight.style.opacity = 1;
    gate.leftBanner.style.opacity = 1;
    gate.rightStickLeft.style.opacity = 1;
    gate.rightStickRight.style.opacity = 1;
    gate.rightBanner.style.opacity = 1;
    console.log(`Gate ${index + 1} initialized at z=${gate.def.zPosition}, runner at z=${state.runner.position.z}`);
  });

  return state;
}

function project({ x, y, z }, rescale = 1) {
  const rY = y * ROAD_ANGLE_SIN - z * ROAD_ANGLE_COS;
  const rZ = y * ROAD_ANGLE_COS + z * ROAD_ANGLE_SIN;

  const scale = PERSPECTIVE / (PERSPECTIVE + rZ);

  return {
    x: x * scale,
    y: rY * scale,
    scale: rescale * scale,
  };
}

function getTransform({ x, y, scale }) {
  return `translateX(${x}px) translateY(${y}px) scale(${scale})`;
}

function getLaneX(lane) {
  return (lane - Math.floor(LANES / 2)) * LANE_WIDTH;
}

function getLaneDividerX(lane) {
  // Get the X position of the divider on the left side of the lane
  const laneX = getLaneX(lane);
  return laneX - LANE_WIDTH / 2;
}

function getAdjacentLanes(lane) {
  return [lane - 1, lane + 1].filter((x) => x >= 0 && x < LANES);
}

function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function changeSpawnPosition(position) {
  const lanes = getAdjacentLanes(position.lane);

  // Equally possible options: new Y / Lane 1 / Lane 2
  const newDirection = Math.floor(Math.random() * (lanes.length + 1));
  if (newDirection === 0) {
    position.y = position.y === 0 ? ENTITIES_Y_FLOATING : 0;
  } else {
    position.lane = lanes[newDirection - 1];
  }
}

function spawnLevelEntities(state) {
  const initZ = ENTITIES_SPAWN_Z_FIRST;
  const spawnPosition = { lane: 1, y: 0, z: initZ };

  state.game.level++;
  state.game.levelProgress = 0;

  for (let i = 0; i < ENTITIES_PER_LEVEL; i++) {
    if (i % ENTITIES_PER_LEVEL_SERIES === 0) {
      changeSpawnPosition(spawnPosition);
    }

    const type = Math.random() > ENTITIES_BOMB_CHANCE ? 'coin' : 'bomb';

    const { lane, y, z } = spawnPosition;
    const position = { x: getLaneX(lane), y, z };

    state.entities[i] = {
      index: i,
      type,
      position,
      deathTimer: 0,
    };
    view.entities[i].className = type;
    view.entities[i].style.opacity = 1;
    view.entities[i].style.zIndex = 0;

    spawnPosition.z -= ENTITIES_Z_GAP;
  }
}

function handleGameEvents(state) {
  document.addEventListener('keydown', (event) => {
    const { runner } = state;

    switch (event.key) {
      case 'ArrowLeft':
        runner.lane = Math.max(runner.lane - 1, 0);
        return;

      case 'ArrowRight':
        runner.lane = Math.min(runner.lane + 1, LANES - 1);
        return;

      case 'ArrowUp':
        if (runner.position.y === 0) {
          runner.ySpeed = RUNNER_JUMP_SPEED;
        }
        return;

      case ' ':
        if (state.game.isOver) {
          Object.assign(state, getInitialState());
          view.runner.removeAttribute('class');
        }
    }
  });
}

function update(state, dt) {
  const { game, runner, entities, gateManager } = state;
  if (game.isOver || game.isComplete) {
    return;
  }

  if (game.levelProgress >= LEVEL_LENGTH) {
    spawnLevelEntities(state);
  }

  const speed = game.speed * dt;
  game.levelProgress += speed;
  game.progress += speed;
  game.speed += GAME_ACCELERATION * dt;

  updateRunner(runner, dt);

  for (const entity of entities) {
    updateEntity(game, runner, entity, dt);
  }

  // Update gate positions (move them backward like entities)
  for (const gate of state.gates) {
    gate.zPosition -= speed;
  }

  // Update finish line position
  // state.finishLineZ -= speed;

  // Check for gate crossings
  const crossedGate = gateManager.checkGateCrossing(runner.position.z);
  if (crossedGate) {
    gateManager.recordChoice(crossedGate, runner.lane);
  }

  // Check if we've reached level 3 and crossed the finish line
  // if (game.level >= 3 && runner.position.z <= state.finishLineZ && !game.isComplete) {
  //   game.isComplete = true;
  //   completeGame(state);
  // }
}

function updateRunner(runner, dt) {
  const { position } = runner;
  const destinationX = getLaneX(runner.lane);

  if (position.x < destinationX) {
    position.x = Math.min(position.x + RUNNER_SPEED_X * dt, destinationX);
  } else if (position.x > destinationX) {
    position.x = Math.max(position.x - RUNNER_SPEED_X * dt, destinationX);
  }

  if (position.y < 0) {
    runner.ySpeed += GRAVITY * dt;
  }
  position.y = Math.min(position.y + runner.ySpeed * dt, 0);

  if (runner.damageTimer > 0) {
    runner.damageTimer -= dt;
  }
}

function updateEntity(game, runner, entity, dt) {
  if (entity.deathTimer > 0) {
    entity.deathTimer += dt;
    return;
  }

  entity.position.z -= game.speed * dt;

  switch (entity.type) {
    case 'coin':
      if (
        distance(entity.position, runner.position) <=
        RUNNER_COIN_COLLECTION_DISTANCE
      ) {
        game.score++;
        entity.deathTimer = dt;
      }
      break;

    case 'bomb':
      if (runner.damageTimer <= 0 && checkBombCollision(runner.position, entity.position)) {
        runner.damageTimer = RUNNER_DAMAGE_COOLDOWN;
        entity.deathTimer = dt;
      }
      break;
  }
}

function checkBombCollision(runner, bomb) {
  // Collision between 2 rectangular cuboids:
  // For each dimension: abs(dim1-dim2) <= (size1+  size2)/2
  // But I adjusted values for an easier gameplay :)
  return (
    Math.abs(runner.z - bomb.z) <= 4 &&
    Math.abs(runner.y - bomb.y) <= 30 &&
    Math.abs(runner.x - bomb.x) <= 25
  );
}

function draw(state) {
  const { game, runner, entities } = state;
  if (game.isOver) {
    view.runner.style.animationPlayState = 'running';
    view.runner.className = 'dead';
    return;
  }

  view.score.innerText = game.score;
  view.level.innerText = game.level;

  view.road.style.backgroundPositionY = `${
    game.progress / ROAD_ANGLE_SIN_COS
  }px`;

  const runnerPosition = project(runner.position, RUNNER_SCALE);
  view.runner.style.transform = getTransform(runnerPosition);
  view.runner.style.animationPlayState =
    runner.position.y < 0 ? 'paused' : 'running';

  // Apply damage flash effect
  const timeIntoDamage = RUNNER_DAMAGE_COOLDOWN - runner.damageTimer;
  if (runner.damageTimer > 0 && timeIntoDamage < RUNNER_DAMAGE_FLASH_DURATION) {
    view.runner.className = 'damaged';
  } else {
    view.runner.className = '';
  }

  for (const entity of entities) {
    drawEntity(runner, entity);
  }

  // Draw gates
  state.gates.forEach((gateState, index) => {
    drawGate(view.gates[index], gateState, runner);
  });

  // Draw finish line (only visible in level 3)
  // if (game.level >= 3) {
  //   drawFinishLine(state.finishLineZ, runner);
  // }
}

function drawGate(gateView, gateState, runner) {
  const gateDef = gateState.def;
  const zPosition = gateState.zPosition; // Use dynamic z position from state
  const zIndex = zPosition < runner.position.z ? RUNNER_Z_INDEX_BEHIND : 0;
  const bannerHeight = -80; // Height above ground

  // Left gate structure (lane 0)
  const leftLaneX = getLaneX(gateDef.leftOption.lane);

  // Two sticks at lane dividers flanking the left lane
  const leftStickLeftX = getLaneDividerX(gateDef.leftOption.lane);
  const leftStickRightX = getLaneDividerX(gateDef.leftOption.lane + 1);

  const leftStickLeftPos = project({ x: leftStickLeftX, y: 0, z: zPosition });
  gateView.leftStickLeft.style.transform = getTransform(leftStickLeftPos);
  gateView.leftStickLeft.style.zIndex = zIndex;

  const leftStickRightPos = project({ x: leftStickRightX, y: 0, z: zPosition });
  gateView.leftStickRight.style.transform = getTransform(leftStickRightPos);
  gateView.leftStickRight.style.zIndex = zIndex;

  // Left banner (centered in lane, elevated above the sticks)
  const leftBannerPos = project({ x: leftLaneX, y: bannerHeight, z: zPosition });
  gateView.leftBanner.style.transform = getTransform(leftBannerPos);
  gateView.leftBanner.style.zIndex = zIndex;

  // Right gate structure (lane 2)
  const rightLaneX = getLaneX(gateDef.rightOption.lane);

  // Two sticks at lane dividers flanking the right lane
  const rightStickLeftX = getLaneDividerX(gateDef.rightOption.lane);
  const rightStickRightX = getLaneDividerX(gateDef.rightOption.lane + 1);

  const rightStickLeftPos = project({ x: rightStickLeftX, y: 0, z: zPosition });
  gateView.rightStickLeft.style.transform = getTransform(rightStickLeftPos);
  gateView.rightStickLeft.style.zIndex = zIndex;

  const rightStickRightPos = project({ x: rightStickRightX, y: 0, z: zPosition });
  gateView.rightStickRight.style.transform = getTransform(rightStickRightPos);
  gateView.rightStickRight.style.zIndex = zIndex;

  // Right banner (centered in lane, elevated above the sticks)
  const rightBannerPos = project({ x: rightLaneX, y: bannerHeight, z: zPosition });
  gateView.rightBanner.style.transform = getTransform(rightBannerPos);
  gateView.rightBanner.style.zIndex = zIndex;
}

function drawFinishLine(finishLineZ, runner) {
  view.finishLine.style.opacity = 1;
  const zIndex = finishLineZ < runner.position.z ? RUNNER_Z_INDEX_BEHIND : 0;

  // Position the finish line across the road
  const finishLinePos = project({ x: 0, y: 0, z: finishLineZ });
  view.finishLine.style.transform = getTransform(finishLinePos);
  view.finishLine.style.zIndex = zIndex;
}

function drawEntity(runner, entity) {
  if (entity.deathTimer > 0) {
    return drawDeadEntity(entity);
  }

  const element = view.entities[entity.index];

  if (entity.position.z < runner.position.z) {
    element.style.zIndex = RUNNER_Z_INDEX_BEHIND;
  }

  const position = project(entity.position);
  element.style.transform = getTransform(position);
}

function drawDeadEntity(entity) {
  const opacity = 1 - entity.deathTimer / ENTITIES_DEATH_TIME;

  const position = {
    x: entity.position.x + 300 * entity.deathTimer,
    y: entity.position.y - 1000 * entity.deathTimer,
    z: entity.position.z,
  };

  const scale = 1 + entity.deathTimer * 3;
  const projectedPosition = project(position, scale);
  const transform = getTransform(projectedPosition);
  const rotation = `rotateY(${Math.floor(entity.deathTimer * 1000)}deg`;

  const element = view.entities[entity.index];
  element.style.opacity = opacity;
  element.style.transform = `${transform} ${rotation}`;
}

function completeGame(state) {
  const { gateManager } = state;

  // Finalize the session data
  gateManager.finalizeSession();
  gateManager.saveToLocalStorage();

  // Create and show results screen
  showResultsScreen(state);
}

function showResultsScreen(state) {
  // Remove existing results screen if any
  if (view.resultsScreen) {
    view.resultsScreen.remove();
  }

  const resultsScreen = document.createElement('div');
  resultsScreen.className = 'results-screen';

  const resultsContent = document.createElement('div');
  resultsContent.className = 'results-content';

  const title = document.createElement('h2');
  title.textContent = '💖 Your Perfect Date Plan! 💖';

  const choicesContainer = document.createElement('div');
  choicesContainer.className = 'results-choices';

  // Display each choice
  state.gateManager.sessionData.choices.forEach((choice) => {
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';

    const question = document.createElement('div');
    question.className = 'result-question';
    question.textContent = choice.question;

    const selectedChoice = document.createElement('div');
    selectedChoice.className = 'result-choice';
    selectedChoice.textContent = `${choice.selectedEmoji} ${choice.selectedText}`;

    resultItem.appendChild(question);
    resultItem.appendChild(selectedChoice);
    choicesContainer.appendChild(resultItem);
  });

  const restartButton = document.createElement('button');
  restartButton.className = 'restart-button';
  restartButton.textContent = 'Plan Another Date! 💕';
  restartButton.onclick = () => {
    resultsScreen.remove();
    view.resultsScreen = null;
    Object.assign(state, getInitialState());
    view.runner.removeAttribute('class');
    view.finishLine.style.opacity = 0; // Hide finish line for restart
  };

  resultsContent.appendChild(title);
  resultsContent.appendChild(choicesContainer);
  resultsContent.appendChild(restartButton);
  resultsScreen.appendChild(resultsContent);

  document.querySelector('.game').appendChild(resultsScreen);
  view.resultsScreen = resultsScreen;
}

function init() {
  const state = getInitialState();
  handleGameEvents(state);

  let lastFrameTime = performance.now();

  function loop(time) {
    const dt = (time - lastFrameTime) / 1000;
    lastFrameTime = time;

    update(state, dt);
    draw(state);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

init();
