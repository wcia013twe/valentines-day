const LANES = 3;
const LANE_WIDTH = 47;
const GRAVITY = 2000;
const INIT_GAME_SPEED = 150;
const GAME_ACCELERATION = 6;

const RUNNER_JUMP_SPEED = -600;
const RUNNER_INIT_LANE = 1;
const RUNNER_Z = -410;
const RUNNER_SPEED_X = 300;
const RUNNER_SCALE = 0.2;
const RUNNER_COIN_COLLECTION_DISTANCE = 30;
const RUNNER_Z_INDEX_BEHIND = 100;

const ENTITIES_Z_GAP = 50;
const ENTITIES_PER_LEVEL = 30;
const ENTITIES_SPAWN_Z_LAST = 40;
const ENTITIES_SPAWN_Z_FIRST =
  ENTITIES_SPAWN_Z_LAST + ENTITIES_PER_LEVEL * ENTITIES_Z_GAP;
const ENTITIES_Y_FLOATING = -75;
const ENTITIES_BEFORE_DIRECTION_CHANGE = 6;
const ENTITIES_BOMB_CHANCE = 0.3;
const ENTITIES_DEATH_TIME = 0.2;

const LEVEL_LENGTH = ENTITIES_SPAWN_Z_FIRST + 550;

// Values used to project a 3D point onto 2D space
const ROAD_ANGLE = (60 * Math.PI) / 180;
const ROAD_ANGLE_SIN = Math.sin(ROAD_ANGLE);
const ROAD_ANGLE_COS = Math.cos(ROAD_ANGLE);
const ROAD_ANGLE_SIN_COS = ROAD_ANGLE_SIN * ROAD_ANGLE_COS;
const PERSPECTIVE = 600;

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
    },
    runner: {
      position: { x: getLaneX(RUNNER_INIT_LANE), y: 0, z: RUNNER_Z },
      lane: RUNNER_INIT_LANE,
      ySpeed: 0,
    },
    entities: new Array(ENTITIES_PER_LEVEL),
  };

  spawnLevelEntities(state);

  return state;
}

function project({ x, y, z }, rescale = 1) {
  const rY = y * ROAD_ANGLE_SIN - z * ROAD_ANGLE_COS;
  const rZ = y * ROAD_ANGLE_COS + z * ROAD_ANGLE_SIN;

  const scale = PERSPECTIVE / (PERSPECTIVE + rZ);

  return {
    x: x * scale,
    y: rY * scale,
    z: rZ,
    scale: rescale * scale,
  };
}

function getTransform({ x, y, scale }) {
  return `translateX(${x}px) translateY(${y}px) scale(${scale})`;
}

function getLaneX(lane) {
  return (lane - Math.floor(LANES / 2)) * LANE_WIDTH;
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
    if (i % ENTITIES_BEFORE_DIRECTION_CHANGE === 0) {
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
  const { game, runner, entities } = state;
  if (game.isOver) {
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
        distance(entity.position, runner.position) <
        RUNNER_COIN_COLLECTION_DISTANCE
      ) {
        game.score++;
        entity.deathTimer = dt;
      }
      break;

    case 'bomb':
      if (checkBombCollision(runner.position, entity.position)) {
        game.isOver = true;
      }
      break;
  }
}

function checkBombCollision(runner, bomb) {
  // Collision between 2 rectangular cuboids:
  // For each dimension: abs(dim1-dim2) <= (size1-size2)/2
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

  for (const entity of entities) {
    drawEntity(runner, entity);
  }
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
