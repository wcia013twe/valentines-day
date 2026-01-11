const LANES = 3;
const JUMP_SPEED = -450;
const GRAVITY = 800;
const X_SPEED = 500;
const PROGRESS_SPEED = 40;
const INIT_LANE = 1;
const LANE_WIDTH = 142;
const SPAWN_Z = -1000;

const view = {
  scene: document.getElementById('scene'),
  road: document.getElementById('road'),
  runner: document.getElementById('runner'),
  cubeBlueprint: document.getElementById('cube-blueprint'),
  coinBlueprint: document.getElementById('coin-blueprint'),
};

const state = {
  progress: 0,
  runner: {
    position: { x: getLaneX(INIT_LANE), y: 0 },
    lane: INIT_LANE,
    ySpeed: 0,
  },
  objects: [],
};

function createFromBlueprint(blueprint) {
  const cube = blueprint.cloneNode(true);
  cube.removeAttribute('id');
  road.append(cube);

  return cube;
}

function getLaneX(lane) {
  return (lane - 1) * LANE_WIDTH;
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
  const { runner } = state;

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

  const increment = PROGRESS_SPEED * dt;
  state.progress += increment;
}

function draw() {
  const { progress, runner } = state;
  const { position } = runner;

  view.road.style.backgroundPositionY = `${progress}px`;

  view.runner.style.transform = `translateX(${position.x}px) translateY(${position.y}px) translateZ(-30px) scale(0.5)`;
  view.runner.style.animationPlayState =
    runner.position.y < 0 ? 'paused' : 'running';
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
