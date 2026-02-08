const LANES = 3;
const LANE_WIDTH = 47;
const GATE_HORIZONTAL_SPACING = 20; // Additional horizontal offset for gates (positive = wider spacing)
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

// Audio constants
const BACKGROUND_MUSIC_PATH = 'background-music.wav'; // TODO: Add path to background music file (e.g., './audio/background-music.mp3')
const COIN_COLLECT_SOUND_PATH = 'coin.ogg'; // TODO: Add path to coin collection sound file (e.g., './audio/coin-collect.mp3')
const LEVEL_COMPLETE_SOUND_PATH = 'level-complete.wav'; // Path to level complete sound file
const HURT_SOUND_PATH = 'hurt.wav'; // Path to hurt/damage sound file
const BACKGROUND_MUSIC_VOLUME = 0.3; // Background music volume (0.0 to 1.0)
const COIN_SOUND_VOLUME = 0.5; // Coin sound effect volume (0.0 to 1.0)
const LEVEL_COMPLETE_SOUND_VOLUME = 0.7; // Level complete sound volume (0.0 to 1.0)
const HURT_SOUND_VOLUME = 0.6; // Hurt sound effect volume (0.0 to 1.0)

// Gate system constants
// Gates spread across levels 1, 2, and 3
// Positioned at the middle of each level for even distribution
// LEVEL_LENGTH = 2090, so gates are roughly 2090 units apart
const GATE_Z_POSITIONS = [
  LEVEL_LENGTH * 0.5,  // Gate 1: Middle of Level 1 (~1045)
  LEVEL_LENGTH * 1.5,  // Gate 2: Middle of Level 2 (~3135)
  LEVEL_LENGTH * 2.5   // Gate 3: Middle of Level 3 (~5225)
];
const GATE_WIDTH = 200;
const GATE_HEIGHT = 150;

// Finish line constant - positioned to be reached at the end of level 3
// Finish line only starts moving when level 3 begins
// Should be positioned roughly one level length ahead of runner
const FINISH_LINE_Z = LEVEL_LENGTH; // Will take one full level duration to reach

// Gate definitions for date choices
const GATE_DEFINITIONS = [
 {
    id: 1,
    question: "First date activity?",
    zPosition: GATE_Z_POSITIONS[0],
    leftOption: { text: "Bowling", emoji: "🎳", lane: 0 }, // Swapped coffee for bowling
    rightOption: { text: "Arcade", emoji: "🕹️", lane: 2 },  // Swapped art for arcade
  },
  {
    id: 2,
    question: "Evening plans?",
    zPosition: GATE_Z_POSITIONS[1],
    leftOption: { text: "Dinner", emoji: "🍝", lane: 0 },
    rightOption: { text: "Picnic", emoji: "🧺", lane: 2 }, // Added picnic basket
  },
  {
    id: 3,
    question: "End the night?",
    zPosition: GATE_Z_POSITIONS[2],
    leftOption: { text: "Baking", emoji: "🧁", lane: 0 }, // Added cupcake/baking
    rightOption: { text: "Homemade Cocktails", emoji: "🍹", lane: 2 }, // Updated to a tropical vibe
  }
];

// Values used to project a 3D point onto 2D space
const ROAD_ANGLE = (60 * Math.PI) / 180;
const ROAD_ANGLE_SIN = Math.sin(ROAD_ANGLE);
const ROAD_ANGLE_COS = Math.cos(ROAD_ANGLE);
const ROAD_ANGLE_SIN_COS = ROAD_ANGLE_SIN * ROAD_ANGLE_COS;
const PERSPECTIVE = 600;

// Audio Manager Class
class AudioManager {
  constructor() {
    this.backgroundMusic = null;
    this.coinSound = null;
    this.levelCompleteSound = null;
    this.hurtSound = null;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;

    // Initialize background music
    if (BACKGROUND_MUSIC_PATH) {
      this.backgroundMusic = new Audio(BACKGROUND_MUSIC_PATH);
      this.backgroundMusic.volume = BACKGROUND_MUSIC_VOLUME;
      this.backgroundMusic.loop = true; // Loop the background music
    }

    // Initialize coin collection sound
    if (COIN_COLLECT_SOUND_PATH) {
      this.coinSound = new Audio(COIN_COLLECT_SOUND_PATH);
      this.coinSound.volume = COIN_SOUND_VOLUME;
    }

    // Initialize level complete sound
    if (LEVEL_COMPLETE_SOUND_PATH) {
      this.levelCompleteSound = new Audio(LEVEL_COMPLETE_SOUND_PATH);
      this.levelCompleteSound.volume = LEVEL_COMPLETE_SOUND_VOLUME;
    }

    // Initialize hurt sound
    if (HURT_SOUND_PATH) {
      this.hurtSound = new Audio(HURT_SOUND_PATH);
      this.hurtSound.volume = HURT_SOUND_VOLUME;
    }

    this.initialized = true;
  }

  playBackgroundMusic() {
    if (this.backgroundMusic && BACKGROUND_MUSIC_PATH) {
      this.backgroundMusic.play().catch(error => {
        console.log('Background music playback failed:', error);
      });
    }
  }

  pauseBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
    }
  }

  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
  }

  playCoinSound() {
    if (this.coinSound && COIN_COLLECT_SOUND_PATH) {
      // Clone the audio to allow multiple simultaneous plays
      const sound = this.coinSound.cloneNode();
      sound.volume = COIN_SOUND_VOLUME;
      sound.play().catch(error => {
        console.log('Coin sound playback failed:', error);
      });
    }
  }

  playLevelCompleteSound() {
    if (this.levelCompleteSound && LEVEL_COMPLETE_SOUND_PATH) {
      this.levelCompleteSound.currentTime = 0; // Reset to start
      this.levelCompleteSound.play().catch(error => {
        console.log('Level complete sound playback failed:', error);
      });
    }
  }

  playHurtSound() {
    if (this.hurtSound && HURT_SOUND_PATH) {
      // Clone the audio to allow multiple simultaneous plays
      const sound = this.hurtSound.cloneNode();
      sound.volume = HURT_SOUND_VOLUME;
      sound.play().catch(error => {
        console.log('Hurt sound playback failed:', error);
      });
    }
  }

  setBackgroundVolume(volume) {
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = Math.max(0, Math.min(1, volume));
    }
  }

  setCoinVolume(volume) {
    if (this.coinSound) {
      this.coinSound.volume = Math.max(0, Math.min(1, volume));
    }
  }
}

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
  startScreen: document.getElementById('start-screen'),
  startButton: document.getElementById('start-button'),
  entities: Array.from({ length: ENTITIES_PER_LEVEL }, () => {
    const element = document.createElement('div');
    element.style.opacity = 0;
    document.getElementById('scene').append(element);

    return element;
  }),
  gates: GATE_DEFINITIONS.map((gateDef) => {
    // Create a container for the left gate (sticks + banner as one unit)
    const leftGateContainer = document.createElement('div');
    leftGateContainer.className = 'gate-container gate-container-left';
    leftGateContainer.style.opacity = 0;
    leftGateContainer.style.position = 'absolute';
    leftGateContainer.style.left = '50%';
    leftGateContainer.style.top = '0';
    leftGateContainer.innerHTML = `
      <div class="gate-stick" style="position: absolute; left: -23.5px; top: 0;"></div>
      <div class="gate-stick" style="position: absolute; left: 23.5px; top: 0;"></div>
      <div class="gate-banner" style="position: absolute; left: 0; top: -100px; transform: translateX(-50%);">
        <div class="banner-text">${gateDef.leftOption.emoji} ${gateDef.leftOption.text}</div>
      </div>
    `;
    document.getElementById('scene').append(leftGateContainer);

    // Create a container for the right gate (sticks + banner as one unit)
    const rightGateContainer = document.createElement('div');
    rightGateContainer.className = 'gate-container gate-container-right';
    rightGateContainer.style.opacity = 0;
    rightGateContainer.style.position = 'absolute';
    rightGateContainer.style.left = '50%';
    rightGateContainer.style.top = '0';
    rightGateContainer.innerHTML = `
      <div class="gate-stick gate-stick-right" style="position: absolute; left: -23.5px; top: 0;"></div>
      <div class="gate-stick gate-stick-right" style="position: absolute; left: 23.5px; top: 0;"></div>
      <div class="gate-banner" style="position: absolute; left: 0; top: -100px; transform: translateX(-50%);">
        <div class="banner-text">${gateDef.rightOption.emoji} ${gateDef.rightOption.text}</div>
      </div>
    `;
    document.getElementById('scene').append(rightGateContainer);

    return {
      leftGateContainer,
      rightGateContainer,
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
      hasStarted: false, // Track if game has been started via start screen
      level: 0, // Start at 0, will become 1 when spawnLevelEntities is called
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
    audioManager: new AudioManager(),
    gates: GATE_DEFINITIONS.map(def => ({
      zPosition: def.zPosition,
      def: def
    })),
    finishLineZ: FINISH_LINE_Z,
  };

  // Don't spawn entities yet - wait for start screen
  // spawnLevelEntities(state);

  // Initialize gates with visibility
  view.gates.forEach((gate) => {
    gate.leftGateContainer.style.opacity = 0; // Hide initially
    gate.rightGateContainer.style.opacity = 0; // Hide initially
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

  console.log('Spawning level', state.game.level, 'entities. Total entities:', ENTITIES_PER_LEVEL);

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
  console.log('Spawned', ENTITIES_PER_LEVEL, 'entities. First entity at z:', state.entities[0].position.z);
}

function handleGameEvents(state) {
  document.addEventListener('keydown', (event) => {
    const { runner, audioManager } = state;

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
          const newState = getInitialState();
          // Preserve audio manager
          newState.audioManager = audioManager;
          Object.assign(state, newState);
          view.runner.removeAttribute('class');
          audioManager.playBackgroundMusic();
        }
    }
  });
}

function update(state, dt) {
  const { game, runner, entities, gateManager, audioManager } = state;

  // Debug: Always log first few frames
  if (state._updateCount === undefined) {
    state._updateCount = 0;
  }
  state._updateCount++;

  if (state._updateCount <= 5) {
    console.log('Update #' + state._updateCount, '- isOver:', game.isOver, 'isComplete:', game.isComplete, 'hasStarted:', game.hasStarted);
  }

  if (game.isOver || game.isComplete || !game.hasStarted) {
    return;
  }

  // Cap at 3 levels max
  if (game.levelProgress >= LEVEL_LENGTH && game.level < 3) {
    spawnLevelEntities(state);
  }

  const speed = game.speed * dt;
  game.levelProgress += speed;
  game.progress += speed;
  game.speed += GAME_ACCELERATION * dt;

  // Debug: Log first update
  if (game.progress < 10) {
    console.log('Update running! Speed:', speed, 'Progress:', game.progress, 'dt:', dt);
  }

  updateRunner(runner, dt);

  for (const entity of entities) {
    updateEntity(game, runner, entity, dt, audioManager);
  }

  // Update gate positions (move them backward like entities)
  for (const gate of state.gates) {
    gate.zPosition -= speed;
  }

  // Update finish line position (move it backward like entities)
  // Only move the finish line in level 3, so it appears at the right time
  if (game.level >= 3) {
    state.finishLineZ -= speed;
  }

  // Check for gate crossings
  const crossedGate = gateManager.checkGateCrossing(runner.position.z);
  if (crossedGate) {
    gateManager.recordChoice(crossedGate, runner.lane);
  }

  // Check if we've reached level 3 and crossed the finish line
  // Finish line moves toward runner (Z decreases). Runner is at fixed Z=-410.
  // Stop the Koopa 50 units past the finish line, not on it
  const STOP_DISTANCE_PAST_FINISH = 50;
  if (game.level >= 3 && state.finishLineZ <= (runner.position.z - STOP_DISTANCE_PAST_FINISH) && !game.isComplete) {
    game.isComplete = true;
    completeGame(state);
  }

  // Slow down the game as we approach the finish line in level 3
  if (game.level >= 3) {
    const distanceToFinish = state.finishLineZ - runner.position.z;
    if (distanceToFinish < 150 && distanceToFinish > -STOP_DISTANCE_PAST_FINISH) {
      // Gradually reduce speed as finish line gets closer
      const slowdownFactor = Math.max(0.1, (distanceToFinish + STOP_DISTANCE_PAST_FINISH) / 150);
      game.speed = INIT_GAME_SPEED * slowdownFactor;
    }
  }
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

function updateEntity(game, runner, entity, dt, audioManager) {
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
        // Play coin collection sound
        audioManager.playCoinSound();
      }
      break;

    case 'bomb':
      if (runner.damageTimer <= 0 && checkBombCollision(runner.position, entity.position)) {
        runner.damageTimer = RUNNER_DAMAGE_COOLDOWN;
        entity.deathTimer = dt;
        // Play hurt sound
        audioManager.playHurtSound();
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

  // Stop road animation and runner when game is complete
  if (game.isComplete) {
    view.runner.style.animationPlayState = 'paused';
    return;
  }

  view.score.innerText = game.score;
  view.level.innerText = game.level;

  const roadPosition = game.progress / ROAD_ANGLE_SIN_COS;
  view.road.style.backgroundPositionY = `${roadPosition}px`;

  // Debug: Log road position updates
  if (game.progress > 0 && game.progress < 10) {
    console.log('Draw - Road position:', roadPosition, 'Progress:', game.progress);
  }

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
  if (game.level >= 3) {
    drawFinishLine(state.finishLineZ, runner);
  }
}

function drawGate(gateView, gateState, runner) {
  const gateDef = gateState.def;
  const zPosition = gateState.zPosition; // Use dynamic z position from state
  const zIndex = zPosition < runner.position.z ? RUNNER_Z_INDEX_BEHIND : 0;

  // Left gate container - position it at the center of the left lane
  // Apply additional spacing offset (negative for left gate)
  const leftLaneX = getLaneX(gateDef.leftOption.lane) - GATE_HORIZONTAL_SPACING;
  const leftGatePos = project({ x: leftLaneX, y: 0, z: zPosition });
  gateView.leftGateContainer.style.transform = getTransform(leftGatePos);
  gateView.leftGateContainer.style.zIndex = zIndex;

  // Right gate container - position it at the center of the right lane
  // Apply additional spacing offset (positive for right gate)
  const rightLaneX = getLaneX(gateDef.rightOption.lane) + GATE_HORIZONTAL_SPACING;
  const rightGatePos = project({ x: rightLaneX, y: 0, z: zPosition });
  gateView.rightGateContainer.style.transform = getTransform(rightGatePos);
  gateView.rightGateContainer.style.zIndex = zIndex;
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
  const { gateManager, audioManager } = state;

  // Pause background music when game completes
  audioManager.pauseBackgroundMusic();

  // Play level complete sound
  audioManager.playLevelCompleteSound();

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

  // Create envelope container
  const envelopeContainer = document.createElement('div');
  envelopeContainer.className = 'envelope-container';

  const envelope = document.createElement('div');
  envelope.className = 'envelope';

  const envelopeFlap = document.createElement('div');
  envelopeFlap.className = 'envelope-flap';

  const envelopeBody = document.createElement('div');
  envelopeBody.className = 'envelope-body';

  const envelopeHeart = document.createElement('div');
  envelopeHeart.className = 'envelope-heart';
  envelopeHeart.textContent = '❤️';

  const envelopeShadow = document.createElement('div');
  envelopeShadow.className = 'envelope-shadow';

  envelope.appendChild(envelopeFlap);
  envelope.appendChild(envelopeBody);
  envelope.appendChild(envelopeHeart);
  envelopeContainer.appendChild(envelope);
  envelopeContainer.appendChild(envelopeShadow);

  // Create letter container
  const letterContainer = document.createElement('div');
  letterContainer.className = 'letter-container';

  const letterPaper = document.createElement('div');
  letterPaper.className = 'letter-paper';

  // Get the choices from the game
  const choices = state.gateManager.sessionData.choices;
  const choice1 = choices[0] ? choices[0].selectedText : 'Coffee Shop';
  const choice2 = choices[1] ? choices[1].selectedText : 'Dinner';
  const choice3 = choices[2] ? choices[2].selectedText : 'Walk in Park';

  // Create the romantic letter content
  letterPaper.innerHTML = `
    <div class="letter-header">My Koopy Valentine,</div>
    <div class="letter-text">From the moment I saw you, I knew you were my player 2. </div>
    <div class="letter-text">I've been dreaming of a perfect day with you, and I've planned something special...</div>
    <div class="letter-text" style="margin-top: 20px;">Our date would begin at <span style="color: #ff1493;">${choice1}</span>, where we could enjoy some quality koop time.</div>
    <div class="letter-text">As the day unfolds, we'd enjoy <span style="color: #ff1493;">${choice2}</span>. What is a date without good food?</div>
    <div class="letter-text">Finally, as the Lumas begin to twinkle above us, we'd end our perfect evening with <span style="color: #ff1493;">${choice3}</span>.</div>
    <div class="letter-text" style="margin-top: 20px; font-weight: bold;">I can't wait to spend another valentines day with you, so here's my question, the one I've been waiting to ask:</div>
    <div class="letter-text" style="text-align: center; font-size: 20px; color: #8b0000; margin: 20px 0;">Will you be my Valentine? ❤️</div>
    <div class="response-section">
      <div class="response-label">Your answer:</div>
      <div class="response-options">
        <label class="response-option">
          <input type="checkbox" name="valentine-response" value="yes" onchange="handleValentineResponse(this, 'yes')">
          <span>Yes! 💕</span>
        </label>
        <label class="response-option">
          <input type="checkbox" name="valentine-response" value="no" onchange="handleValentineResponse(this, 'no')">
          <span>No 💔</span>
        </label>
      </div>
    </div>
    <div class="letter-signature">Forever Koopy</div>
  `;

  letterContainer.appendChild(letterPaper);

  // Add click handler to envelope
  envelopeContainer.onclick = () => {
    envelope.classList.add('opening');
    setTimeout(() => {
      envelopeContainer.style.display = 'none';
      letterContainer.classList.add('visible');
      revealLetterLineByLine(letterPaper);
    }, 600);
  };

  resultsScreen.appendChild(envelopeContainer);
  resultsScreen.appendChild(letterContainer);
  document.querySelector('.game').appendChild(resultsScreen);
  view.resultsScreen = resultsScreen;
}

// Function to reveal letter text line by line
function revealLetterLineByLine(letterPaper) {
  const elements = letterPaper.querySelectorAll('.letter-text, .letter-signature, .response-section');
  let delay = 0;

  elements.forEach((element, index) => {
    setTimeout(() => {
      element.classList.add('visible');
    }, delay);
    delay += 800; // 800ms between each line
  });
}

// Global function to handle Valentine response
window.handleValentineResponse = function(checkbox, value) {
  // Uncheck all other checkboxes
  const checkboxes = document.querySelectorAll('input[name="valentine-response"]');
  checkboxes.forEach(cb => {
    if (cb !== checkbox) cb.checked = false;
  });

  if (checkbox.checked) {
    // Get the date plan data
    const sessionData = JSON.parse(localStorage.getItem('datePlanResult') || '{}');
    const choices = sessionData.choices || [];

    // Create email body with the response
    const dateDetails = choices.map(c => `${c.question} ${c.selectedEmoji} ${c.selectedText}`).join('\n');
    const emailSubject = value === 'yes' ? '💕 YES! Valentine\'s Day Response' : 'Valentine\'s Day Response';
    const emailBody = `Koopy's Day Game Response

Answer: ${value === 'yes' ? 'YES! 💕' : 'No 💔'}

Date Plan Chosen:
${dateDetails}

Session ID: ${sessionData.sessionId || 'N/A'}
Timestamp: ${new Date().toISOString()}
`;

    // Send the data (using mailto: link)
    const mailto = `mailto:wcia013twe@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    // Show response message
    setTimeout(() => {
      const responseSection = checkbox.closest('.response-section');
      let message = document.querySelector('.response-message');

      if (!message) {
        message = document.createElement('div');
        message.className = 'response-message letter-text visible';
        message.style.textAlign = 'center';
        message.style.fontSize = '20px';
        message.style.marginTop = '20px';
        message.style.color = value === 'yes' ? '#ff1493' : '#8b0000';
        responseSection.appendChild(message);
      }

      if (value === 'yes') {
        message.innerHTML = `
          💖 You've made me the happiest person in the world! 💖
          <br><br>
          <a href="${mailto}" class="restart-button" style="display: inline-block; text-decoration: none; margin: 10px;">
            📧 Send Response
          </a>
          <br>
          <button class="restart-button" onclick="location.reload()">Start Over</button>
        `;
      } else {
        message.innerHTML = `
          💔 urm what the sigma? 💔
          <br><br>
          <a href="${mailto}" class="restart-button" style="display: inline-block; text-decoration: none; margin: 10px;">
            📧 Send Response
          </a>
          <br>
          <button class="restart-button" onclick="location.reload()">Try Again</button>
        `;
      }

      // Also log to console for debugging
      console.log('Valentine Response Data:', {
        answer: value,
        choices: choices,
        sessionData: sessionData
      });
    }, 300);
  }
};

function startGame(state) {
  console.log('=== START GAME CALLED ===');
  console.log('Current state before start:', {
    hasStarted: state.game.hasStarted,
    level: state.game.level,
    speed: state.game.speed,
    progress: state.game.progress
  });

  state.game.hasStarted = true;

  // Hide start screen
  console.log('Hiding start screen...');
  if (view.startScreen) {
    view.startScreen.classList.add('hidden');
    console.log('Start screen hidden');
  } else {
    console.error('Start screen element not found!');
  }

  // Initialize and start background music
  if (!state.audioManager.initialized) {
    state.audioManager.initialize();
  }
  state.audioManager.playBackgroundMusic();

  // Spawn level entities
  console.log('Spawning level entities...');
  spawnLevelEntities(state);

  // Show gates
  view.gates.forEach((gate) => {
    gate.leftGateContainer.style.opacity = 1;
    gate.rightGateContainer.style.opacity = 1;
  });

  console.log('Game state after start:', {
    hasStarted: state.game.hasStarted,
    level: state.game.level,
    speed: state.game.speed,
    progress: state.game.progress,
    entitiesCount: state.entities.filter(e => e).length
  });
  console.log('=== GAME STARTED SUCCESSFULLY ===');
}

function init() {
  const state = getInitialState();
  handleGameEvents(state);

  // Set up start button click handler
  console.log('Initializing game...');
  console.log('Start button element:', view.startButton);
  console.log('Start screen element:', view.startScreen);

  if (!view.startButton) {
    console.error('Start button not found! Retrying...');
    view.startButton = document.getElementById('start-button');
    view.startScreen = document.getElementById('start-screen');
  }

  if (view.startButton) {
    view.startButton.addEventListener('click', () => {
      console.log('Start button clicked!');
      startGame(state);
    });
  } else {
    console.error('Could not find start button element!');
  }

  let lastFrameTime = performance.now();
  let frameCount = 0;

  function loop(time) {
    frameCount++;

    // Debug: Log first 10 frames always, then every 60 frames
    if (frameCount <= 10 || frameCount % 60 === 0) {
      console.log('🔄 Loop frame #' + frameCount, 'hasStarted:', state.game.hasStarted);
    }

    const dt = (time - lastFrameTime) / 1000;
    lastFrameTime = time;

    try {
      update(state, dt);
      draw(state);
    } catch (error) {
      console.error('Error in game loop:', error);
    }

    // Debug: Log game state every 60 frames
    if (frameCount % 60 === 0 && state.game.hasStarted) {
      console.log('Game running - Level:', state.game.level, 'Progress:', Math.floor(state.game.progress), 'Speed:', state.game.speed);
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
  console.log('Game loop started, initial hasStarted:', state.game.hasStarted);
}

init();
