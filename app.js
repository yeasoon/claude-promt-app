const stages = [
  {
    key: "kernel",
    label: "Kernel Front-End",
    description: "Instruction decode + warp scheduling",
    options: [
      { name: "Scalar heavy", warpIssue: 36, latency: 46 },
      { name: "Balanced", warpIssue: 54, latency: 34 },
      { name: "Tensor tuned", warpIssue: 72, latency: 30 }
    ]
  },
  {
    key: "sm",
    label: "SM Compute",
    description: "Streaming multiprocessor occupancy",
    options: [
      { name: "Register bound", occupancy: 38, smCount: 48 },
      { name: "Balanced", occupancy: 66, smCount: 64 },
      { name: "High occupancy", occupancy: 86, smCount: 80 }
    ]
  },
  {
    key: "memory",
    label: "Memory Fabric",
    description: "L2 + HBM/VRAM throughput",
    options: [
      { name: "Cache missy", bandwidth: 540, l2Hit: 42 },
      { name: "Coalesced", bandwidth: 820, l2Hit: 67 },
      { name: "Tuned", bandwidth: 1030, l2Hit: 79 }
    ]
  },
  {
    key: "sync",
    label: "Barrier / Sync",
    description: "Cross-warp coordination overhead",
    options: [
      { name: "Many barriers", syncCost: 31, divergence: 32 },
      { name: "Moderate", syncCost: 19, divergence: 18 },
      { name: "Minimal", syncCost: 11, divergence: 9 }
    ]
  }
];

let state = {
  selected: Object.fromEntries(stages.map((stage) => [stage.key, 1])),
  score: 0
};

const pipelineEl = document.getElementById("pipeline");
const telemetryEl = document.getElementById("telemetry");
const notesEl = document.getElementById("notes");
const eventLogEl = document.getElementById("eventLog");
const scoreBadge = document.getElementById("scoreBadge");

function getBuild() {
  return stages.map((stage) => stage.options[state.selected[stage.key]]);
}

function calcTelemetry() {
  const [kernel, sm, mem, sync] = getBuild();
  const warpPressure = Math.round((kernel.warpIssue * (100 - sync.divergence)) / 100);
  const throughput = Math.round(
    (warpPressure * sm.occupancy * mem.bandwidth) /
      (100 * 100) *
      (1 - sync.syncCost / 100)
  );

  const bottleneck = Math.min(
    kernel.warpIssue,
    sm.occupancy,
    Math.round(mem.bandwidth / 12),
    100 - sync.syncCost
  );

  const efficiency = Math.max(6, Math.min(99, Math.round((throughput / 600) * 100)));

  return {
    warpPressure,
    throughput,
    bottleneck,
    efficiency,
    l2Hit: mem.l2Hit,
    occupancy: sm.occupancy,
    syncCost: sync.syncCost
  };
}

function renderPipeline() {
  pipelineEl.innerHTML = "";
  stages.forEach((stage) => {
    const selectedOption = stage.options[state.selected[stage.key]];
    const card = document.createElement("button");
    card.className = "stage";
    card.type = "button";
    card.innerHTML = `
      <strong>${stage.label}</strong>
      <p>${stage.description}</p>
      <div class="value">${selectedOption.name}</div>
      <small>Tap to cycle profile</small>
    `;

    card.addEventListener("click", () => {
      state.selected[stage.key] = (state.selected[stage.key] + 1) % stage.options.length;
      render();
    });

    pipelineEl.appendChild(card);
  });
}

function renderTelemetry() {
  const t = calcTelemetry();
  telemetryEl.innerHTML = `
    <li>Estimated throughput: <strong>${t.throughput} GFLOP/s</strong></li>
    <li>SM occupancy: <strong>${t.occupancy}%</strong></li>
    <li>L2 hit ratio: <strong>${t.l2Hit}%</strong></li>
    <li>Warp issue pressure: <strong>${t.warpPressure}</strong></li>
    <li>Sync overhead: <strong>${t.syncCost}%</strong></li>
    <li>Pipeline efficiency: <strong>${t.efficiency}%</strong></li>
  `;
}

function renderNotes() {
  const t = calcTelemetry();
  const notes = [];

  if (t.occupancy < 50) {
    notes.push({ text: "Low occupancy: reduce register pressure or block size.", cls: "bad" });
  }
  if (t.l2Hit < 55) {
    notes.push({ text: "Weak cache locality: coalesce global memory accesses.", cls: "warn" });
  }
  if (t.syncCost > 25) {
    notes.push({ text: "Barrier-heavy kernel: fuse steps or use warp primitives.", cls: "bad" });
  }
  if (t.efficiency > 80) {
    notes.push({ text: "Great balance! This setup is near hardware sweet spot.", cls: "ok" });
  }
  if (notes.length === 0) {
    notes.push({ text: "Stable configuration. Try pushing memory or occupancy further.", cls: "ok" });
  }

  notesEl.innerHTML = notes.map((n) => `<li class="${n.cls}">${n.text}</li>`).join("");
}

function runKernel() {
  const t = calcTelemetry();
  const gained = Math.max(10, t.efficiency + Math.round(t.bottleneck / 2));
  state.score += gained;
  scoreBadge.textContent = `Score: ${state.score}`;

  const qualityClass = t.efficiency >= 75 ? "ok" : t.efficiency >= 50 ? "warn" : "bad";
  eventLogEl.innerHTML = `
    <p class="${qualityClass}">
      Kernel dispatched. +${gained} points. Efficiency ${t.efficiency}%, bottleneck indicator ${t.bottleneck}.
    </p>
    <p>
      Tip: Keep warp pressure close to occupancy and reduce sync overhead to maximize sustained throughput.
    </p>
  `;
}

function resetGame() {
  state = {
    selected: Object.fromEntries(stages.map((stage) => [stage.key, 1])),
    score: 0
  };
  scoreBadge.textContent = "Score: 0";
  eventLogEl.innerHTML = "<p>Board reset. Build your next kernel pipeline.</p>";
  render();
}

function render() {
  renderPipeline();
  renderTelemetry();
  renderNotes();
}

document.getElementById("runBtn").addEventListener("click", runKernel);
document.getElementById("resetBtn").addEventListener("click", resetGame);

resetGame();
