const LANES = 3;
const JUMP_SPEED = -600;
const GRAVITY = 2000;
const X_SPEED = 300;
const INIT_GAME_SPEED = 130;
const INIT_LANE = 1;
const LANE_WIDTH = 47;
const SPAWN_Z = -1000;

const Z_INDEX_BEHIND_PLAYER = 100;

const ANGLE = (60 * Math.PI) / 180;
const ANGLE_SIN = Math.sin(ANGLE);
const ANGLE_COS = Math.cos(ANGLE);
const PERSPECTIVE = 600;

const view = {
  game: document.getElementById('game'),
  scene: document.getElementById('scene'),
  road: document.getElementById('road'),
  runner: document.getElementById('runner'),
  bombBlueprint: document.getElementById('bomb-blueprint'),
  coinBlueprint: document.getElementById('coin-blueprint'),
};

const state = {
  prevTime: 0,
  score: 0,
  gameSpeed: INIT_GAME_SPEED,
  progress: 0,
  runner: {
    position: { x: getLaneX(INIT_LANE), y: 0, z: -410 },
    lane: INIT_LANE,
    ySpeed: 0,
  },
  objects: [],
};

function createFromBlueprint(blueprint) {
  const element = blueprint.cloneNode(true);
  element.removeAttribute('id');
  view.scene.append(element);

  return element;
}

function project({ x, y, z }, rescale = 1) {
  const rY = y * ANGLE_SIN - z * ANGLE_COS;
  const rZ = y * ANGLE_COS + z * ANGLE_SIN;

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

function getLaneNeighbours(lane) {
  return [lane - 1, lane + 1].filter((x) => x >= 0 && x < LANES);
}

function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function spawnObjects() {
  let lane = 1;
  let x = getLaneX(lane);
  let y = 0;
  let z = 1300;
  x = 0;

  for (let i = 0; i < 30; i++) {
    if (i % 6 === 0) {
      const neighbours = getLaneNeighbours(lane);

      const newDirection = Math.floor(Math.random() * (neighbours.length + 1));
      if (newDirection === 0) {
        y = y === 0 ? -60 : 0;
      } else {
        lane = neighbours[newDirection - 1];
        x = getLaneX(lane);
      }
    }

    const position = { x, y, z };

    if (Math.random() > 0.7) {
      const bombPosition = { ...position };
      state.objects.push({
        type: 'bomb',
        deathTimer: 0,
        element: createFromBlueprint(view.bombBlueprint, bombPosition),
        position: bombPosition,
      });
    } else {
      state.objects.push({
        type: 'coin',
        deathTimer: 0,
        element: createFromBlueprint(view.coinBlueprint, position),
        position,
      });
    }

    z -= 50;
  }
}

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
        runner.ySpeed = JUMP_SPEED;
      }
  }
});

function update(dt) {
  const { runner, objects } = state;

  const { position } = runner;
  const destinationX = getLaneX(runner.lane);

  if (position.x < destinationX) {
    position.x = Math.min(position.x + X_SPEED * dt, destinationX);
  } else if (position.x > destinationX) {
    position.x = Math.max(position.x - X_SPEED * dt, destinationX);
  }

  if (position.y < 0) {
    runner.ySpeed += GRAVITY * dt;
  }
  position.y = Math.min(position.y + runner.ySpeed * dt, 0);

  state.gameSpeed += 5 * dt;
  const zSpeed = state.gameSpeed * dt;
  state.progress += zSpeed / (ANGLE_SIN * ANGLE_COS);

  for (const object of objects) {
    if (object.deathTimer > 0) {
      object.deathTimer += dt;
      continue;
    }

    object.position.z -= zSpeed;

    if (object.position.z < -500) {
      object.deathTimer = dt;
      object.element.remove();
    }

    if (object.type === 'coin') {
      if (distance(object.position, position) < 30) {
        object.deathTimer = dt;
      }
    }
  }
}

function draw() {
  const { runner, objects, progress } = state;

  view.road.style.backgroundPositionY = `${progress}px`;

  const runnerPosition = project(runner.position, 0.2);
  view.runner.style.transform = getTransform(runnerPosition);
  view.runner.style.animationPlayState =
    runner.position.y < 0 ? 'paused' : 'running';

  for (const object of objects) {
    const { element, deathTimer } = object;
    if (!element) {
      continue;
    }

    const adjustedPosition = deathTimer
      ? {
          ...object.position,
          y: object.position.y - 1000 * deathTimer,
          x: object.position.x + 300 * deathTimer,
        }
      : object.position;

    const position = project(adjustedPosition, 1 + deathTimer * 3);
    const transform = getTransform(position);
    const rotation = deathTimer
      ? ` rotateY(${Math.floor(deathTimer * 1000)}deg)`
      : '';

    element.style.transform = transform + rotation;
    if (position.z < runnerPosition.z) {
      element.style.zIndex = Z_INDEX_BEHIND_PLAYER;
    }

    const opacity = Math.max(0, 1 - deathTimer * 5);
    if (deathTimer > 0) {
      element.style.opacity = opacity;
      continue;
    }
  }
}

function loop(time) {
  const dt = (time - state.prevTime) / 1000;
  state.prevTime = time;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

function init() {
  spawnObjects();

  state.prevTime = performance.now();
  requestAnimationFrame(loop);
}

init();
