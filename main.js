const LANES = 3;
const JUMP_SPEED = -700;
const GRAVITY = 2500;
const X_SPEED = 1000;
const Z_SPEED = 100;
const INIT_LANE = 1;
const LANE_WIDTH = 46;
const SPAWN_Z = -1000;

const ANGLE = (30 * Math.PI) / 180;
const PERSPECTIVE = 600;
const WIDTH = 500;
const HEIGHT = 600;
const ROAD_HEIGHT = 2500;

const view = {
  game: document.getElementById('game'),
  road: document.getElementById('road'),
  runner: document.getElementById('runner'),
  cubeBlueprint: document.getElementById('cube-blueprint'),
  coinBlueprint: document.getElementById('coin-blueprint'),
};

const state = {
  progress: 0,
  runner: {
    position: { x: getLaneX(INIT_LANE), y: 0, z: -420 },
    lane: INIT_LANE,
    ySpeed: 0,
  },
  objects: [],
};

function createFromBlueprint(blueprint, position) {
  const element = blueprint.cloneNode(true);
  element.removeAttribute('id');
  view.game.append(element);

  return element;
}

function perspectiveScale(z) {
  return PERSPECTIVE / (PERSPECTIVE + z);
}

function project({ x, y, z }, rescale = 1) {
  const rY = y * Math.cos(ANGLE) - z * Math.sin(ANGLE);
  const rZ = y * Math.sin(ANGLE) + z * Math.cos(ANGLE);

  const scale = perspectiveScale(rZ);

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
  return (lane - 1) * LANE_WIDTH;
}

function spawnObjects() {
  let lane = 0;

  for (let i = 0; i < 20; i++) {
    const x = getLaneX(lane);
    const y = 0;
    const z = 300 - i * 50;

    const position = { x, y, z };

    const object = {
      element: createFromBlueprint(view.coinBlueprint, position),
      position,
    };

    if (Math.random() > 0.8) {
      const cubePosition = { ...position };
      state.objects.push({
        element: createFromBlueprint(view.cubeBlueprint, cubePosition),
        position: cubePosition,
      });

      position.y -= 50;
    }

    state.objects.push(object);
  }
}

spawnObjects();

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

  if (runner.position.y < 0) {
    runner.ySpeed += GRAVITY * dt;
  }
  position.y = Math.min(position.y + runner.ySpeed * dt, 0);

  const zSpeed = Z_SPEED * dt;
  state.progress += zSpeed / Math.cos(ANGLE);
  for (const object of objects) {
    object.position.z -= zSpeed;
  }
}

function draw() {
  const { runner, objects, progress } = state;

  view.road.style.backgroundPositionY = `${progress}px`;

  const runnerPosition = project(runner.position, 0.2);
  view.runner.style.zIndex = Math.floor(-runnerPosition.z);
  view.runner.style.transform = getTransform(runnerPosition);
  view.runner.style.animationPlayState =
    runner.position.y < 0 ? 'paused' : 'running';

  for (const object of objects) {
    const position = project(object.position);

    object.element.style.zIndex = Math.floor(-position.z);
    object.element.style.transform = getTransform(position);
  }
}

let prevTime = performance.now();
function loop(time) {
  const dt = (time - prevTime) / 1000;
  prevTime = performance.now();

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
