const endpointByAction = {
  full: "/api/full-check",
};

const labelByAction = {
  full: "一鍵完整檢查",
};

const statusLabelByStep = {
  passed: "成功",
  skipped: "未執行",
  failed: "失敗",
};

const buttons = Array.from(document.querySelectorAll("[data-action]"));
const statusCard = document.querySelector("#status-card");
const statusTitle = document.querySelector("#status-title");
const statusMessage = document.querySelector("#status-message");
const stockAccount = document.querySelector("#stock-account");
const futuresAccount = document.querySelector("#futures-account");
const stepList = document.querySelector("#step-list");
const orderGrid = document.querySelector("#order-grid");
const summaryResult = document.querySelector("#summary-result");
const rawResult = document.querySelector("#raw-result");
const copySummaryButton = document.querySelector("#copy-summary");
const ambientCanvas = document.querySelector("#ambient-canvas");
const credentialForm = document.querySelector("#credential-form");

if (credentialForm) {
  credentialForm.addEventListener("submit", (event) => {
    event.preventDefault();
    runTest("full");
  });
}

buttons.forEach((button) => {
  button.addEventListener("click", () => runTest(button.dataset.action));
});

if (copySummaryButton) {
  copySummaryButton.addEventListener("click", async () => {
    const text = summaryResult.textContent.trim();
    if (!text || text === "-") return;

    await navigator.clipboard.writeText(text);
    copySummaryButton.textContent = "已複製";
    window.setTimeout(() => {
      copySummaryButton.textContent = "複製";
    }, 1200);
  });
}

async function runTest(action) {
  const payload = {
    api_key: document.querySelector("#api-key").value,
    secret_key: document.querySelector("#secret-key").value,
  };

  setLoading(action);

  try {
    const response = await fetch(endpointByAction[action], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok || !data.ok) {
      setError(data.error || "測試失敗。");
      return;
    }

    setSuccess(action, data.result);
  } catch (error) {
    setError(error.message || "無法連線到本機測試服務。");
  } finally {
    buttons.forEach((button) => {
      button.disabled = false;
    });
  }
}

function setLoading(action) {
  buttons.forEach((button) => {
    button.disabled = true;
  });
  statusCard.className = "status-card";
  statusTitle.textContent = "測試中";
  statusMessage.textContent = labelByAction[action];
  resetResultPanels();
  renderSteps([]);
  renderOrders({});
}

function setSuccess(action, result) {
  const steps = Array.isArray(result.steps) ? result.steps : [];
  const failed = steps.some((step) => step.status === "failed");
  const skipped = steps.some((step) => step.status === "skipped");

  statusCard.className = failed
    ? "status-card error"
    : skipped
      ? "status-card warning"
      : "status-card ok";
  statusTitle.textContent = failed
    ? "檢查完成，有項目失敗"
    : skipped
      ? "檢查完成，有項目未執行"
      : "測試成功";
  statusMessage.textContent = labelByAction[action];
  stockAccount.textContent = result.stock_account || "-";
  futuresAccount.textContent = result.futures_account || "-";
  renderSteps(steps);
  renderOrders(ordersFromResult(result));
  summaryResult.textContent = result.summary || buildSingleTestSummary(action, result);
  rawResult.textContent = JSON.stringify(result, null, 2);
}

function setError(message) {
  statusCard.className = "status-card error";
  statusTitle.textContent = "測試失敗";
  statusMessage.textContent = message;
  resetResultPanels();
  renderSteps([]);
  renderOrders({});
  rawResult.textContent = message;
}

function resetResultPanels() {
  stockAccount.textContent = "-";
  futuresAccount.textContent = "-";
  summaryResult.textContent = "-";
  rawResult.textContent = "-";
}

function renderSteps(steps) {
  stepList.replaceChildren();

  if (!steps.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "-";
    stepList.append(empty);
    return;
  }

  steps.forEach((step) => {
    const item = document.createElement("div");
    item.className = `step-item ${step.status}`;

    const marker = document.createElement("span");
    marker.className = "step-marker";
    marker.textContent = statusLabelByStep[step.status] || step.status;

    const body = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = step.name;
    const message = document.createElement("p");
    message.textContent = step.message;

    body.append(title, message);
    if (step.detail) {
      const detail = document.createElement("pre");
      detail.textContent = step.detail;
      body.append(detail);
    }

    item.append(marker, body);
    stepList.append(item);
  });
}

function ordersFromResult(result) {
  if (result.orders) return result.orders;
  return {};
}

function renderOrders(orders) {
  orderGrid.replaceChildren();

  const entries = [
    ["股票模擬委託", orders.stock],
    ["期貨模擬委託", orders.futures],
  ].filter(([, order]) => Boolean(order));

  if (!entries.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "-";
    orderGrid.append(empty);
    return;
  }

  entries.forEach(([title, order]) => {
    const card = document.createElement("section");
    card.className = "order-card";

    const heading = document.createElement("div");
    heading.className = "order-heading";
    const headingText = document.createElement("strong");
    headingText.textContent = title;
    const contract = document.createElement("span");
    contract.textContent = order.contract || "-";
    heading.append(headingText, contract);

    card.append(
      heading,
      detailBlock("送出前的委託內容", order.order_request),
      detailBlock("實際使用的合約", order.contract_info),
      detailBlock("券商回傳摘要", order.response),
    );

    if (Array.isArray(order.available_contracts) && order.available_contracts.length) {
      card.append(contractList(order.available_contracts));
    }

    orderGrid.append(card);
  });
}

function detailBlock(title, details) {
  const block = document.createElement("div");
  block.className = "detail-block";

  const label = document.createElement("p");
  label.textContent = title;
  block.append(label);

  const rows = document.createElement("dl");
  Object.entries(details || {}).forEach(([key, value]) => {
    if (!value) return;
    const term = document.createElement("dt");
    term.textContent = key;
    const description = document.createElement("dd");
    description.textContent = value;
    rows.append(term, description);
  });

  if (!rows.children.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "-";
    block.append(empty);
  } else {
    block.append(rows);
  }

  return block;
}

function contractList(contracts) {
  const block = document.createElement("div");
  block.className = "detail-block";

  const label = document.createElement("p");
  label.textContent = "查到的 TXF 候選合約";
  block.append(label);

  const list = document.createElement("div");
  list.className = "contract-list";
  contracts.forEach((contract) => {
    const item = document.createElement("span");
    item.textContent = contract.code || contract.full_code || "-";
    list.append(item);
  });
  block.append(list);

  return block;
}

function buildSingleTestSummary(action, result) {
  const lines = [`Shioaji API 檢查結果`, `${labelByAction[action]}：成功`];
  if (result.stock_account) {
    lines.push("證券帳戶：已取得");
  }
  if (result.futures_account) {
    lines.push("期貨帳戶：已取得");
  }
  return lines.join("\n");
}

const SIM_CONFIG = {
  SIM_RES: 256,
  DYE_RES: 1280,
  PRESSURE_ITER: 28,
  VEL_DISSIPATION: 0.5,
  DYE_DISSIPATION: 0.13,
  CURL: 3.0,
  SPLAT_RADIUS: 0.0065,
  SPLAT_FORCE: 2300,
};

const INKS = [
  { key: "green", hex: "#4dffae" },
  { key: "teal", hex: "#37f0d2" },
  { key: "cyan", hex: "#5ad6ff" },
  { key: "violet", hex: "#a98bff" },
  { key: "pink", hex: "#ff86d0" },
].map((ink) => ({
  ...ink,
  absorption: hexToEmission(ink.hex),
}));

const INK_BY_KEY = Object.fromEntries(INKS.map((ink) => [ink.key, ink]));

const baseVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const splatShader = `
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;

  void main() {
    vec2 p = vUv - point.xy;
    p.x *= aspectRatio;
    vec3 splat = color * exp(-dot(p, p) / radius);
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }
`;

const advectionShader = `
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform float dt;
  uniform float dissipation;

  void main() {
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    vec2 coord = vUv - dt * velocity * texelSize;
    vec4 result = texture2D(uSource, coord);
    gl_FragColor = result / (1.0 + dissipation * dt);
  }
`;

const divergenceShader = `
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform vec2 texelSize;

  void main() {
    float L = texture2D(uVelocity, vUv - vec2(texelSize.x, 0.0)).x;
    float R = texture2D(uVelocity, vUv + vec2(texelSize.x, 0.0)).x;
    float B = texture2D(uVelocity, vUv - vec2(0.0, texelSize.y)).y;
    float T = texture2D(uVelocity, vUv + vec2(0.0, texelSize.y)).y;
    vec2 C = texture2D(uVelocity, vUv).xy;

    if (vUv.x - texelSize.x < 0.0) L = -C.x;
    if (vUv.x + texelSize.x > 1.0) R = -C.x;
    if (vUv.y - texelSize.y < 0.0) B = -C.y;
    if (vUv.y + texelSize.y > 1.0) T = -C.y;

    float divergence = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(divergence, 0.0, 0.0, 1.0);
  }
`;

const curlShader = `
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform vec2 texelSize;

  void main() {
    float L = texture2D(uVelocity, vUv - vec2(texelSize.x, 0.0)).y;
    float R = texture2D(uVelocity, vUv + vec2(texelSize.x, 0.0)).y;
    float B = texture2D(uVelocity, vUv - vec2(0.0, texelSize.y)).x;
    float T = texture2D(uVelocity, vUv + vec2(0.0, texelSize.y)).x;
    float value = R - L - T + B;
    gl_FragColor = vec4(0.5 * value, 0.0, 0.0, 1.0);
  }
`;

const vorticityShader = `
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform vec2 texelSize;
  uniform float curl;
  uniform float dt;

  void main() {
    float L = abs(texture2D(uCurl, vUv - vec2(texelSize.x, 0.0)).x);
    float R = abs(texture2D(uCurl, vUv + vec2(texelSize.x, 0.0)).x);
    float B = abs(texture2D(uCurl, vUv - vec2(0.0, texelSize.y)).x);
    float T = abs(texture2D(uCurl, vUv + vec2(0.0, texelSize.y)).x);
    float C = texture2D(uCurl, vUv).x;

    vec2 force = 0.5 * vec2(T - B, R - L);
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;

    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity += force * dt;
    velocity = clamp(velocity, -1000.0, 1000.0);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

const pressureShader = `
  varying vec2 vUv;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  uniform vec2 texelSize;

  void main() {
    float L = texture2D(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
    float R = texture2D(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
    float B = texture2D(uPressure, vUv - vec2(0.0, texelSize.y)).x;
    float T = texture2D(uPressure, vUv + vec2(0.0, texelSize.y)).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`;

const gradientSubtractShader = `
  varying vec2 vUv;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  uniform vec2 texelSize;

  void main() {
    float L = texture2D(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
    float R = texture2D(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
    float B = texture2D(uPressure, vUv - vec2(0.0, texelSize.y)).x;
    float T = texture2D(uPressure, vUv + vec2(0.0, texelSize.y)).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity -= vec2(R - L, T - B) * 0.5;
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

const clearShader = `
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform float value;

  void main() {
    gl_FragColor = value * texture2D(uTexture, vUv);
  }
`;

const displayShader = `
  varying vec2 vUv;
  uniform sampler2D uDye;
  uniform vec2 resolution;
  uniform float time;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = resolution.x / resolution.y;
    vec2 p = vec2(uv.x * aspect, uv.y);

    // 深空底色
    vec3 color = vec3(0.012, 0.018, 0.035);

    // 極光簾幕：x 高頻 → 垂直光簾；緩慢左右擺動；自上而下淡出
    float t = time * 0.05;
    float sway = fbm(vec2(p.x * 0.7, p.y * 0.4 + t * 0.3));
    float curtain = fbm(vec2(p.x * 9.0 + sway * 2.6, p.y * 0.8 - t));
    curtain = pow(curtain, 2.4);
    float vGrad = smoothstep(0.0, 0.72, 1.0 - uv.y);
    curtain *= vGrad;
    vec3 green = vec3(0.10, 0.66, 0.42);
    vec3 teal = vec3(0.10, 0.48, 0.58);
    vec3 violet = vec3(0.40, 0.20, 0.62);
    vec3 aurora = mix(green, teal, sway);
    aurora = mix(aurora, violet, smoothstep(0.4, 1.0, uv.y * 0.4 + sway * 0.6));
    color += aurora * curtain * 0.8;

    // 星點（稀疏、微閃）
    vec2 gp = uv * resolution / 2.2;
    vec2 cell = floor(gp);
    float star = hash(cell);
    if (star > 0.986) {
      float d = length(fract(gp) - 0.5);
      float twinkle = 0.55 + 0.45 * sin(time * 2.0 + star * 40.0);
      color += vec3(0.85, 0.92, 1.0) * smoothstep(0.5, 0.0, d) * twinkle * 0.9;
    }

    // 互動星雲氣體：多取樣柔光暈散（像發光氣體，不像墨筆）
    vec3 gas = max(texture2D(uDye, uv).rgb, vec3(0.0));
    vec3 halo = vec3(0.0);
    vec2 px = 1.0 / resolution;
    for (int k = 0; k < 8; k++) {
      float a = float(k) * 0.7853982;
      vec2 dir = vec2(cos(a), sin(a));
      halo += max(texture2D(uDye, uv + dir * px * 4.0).rgb, vec3(0.0));
      halo += max(texture2D(uDye, uv + dir * px * 9.0).rgb, vec3(0.0));
    }
    halo /= 16.0;
    vec3 soft = gas * 0.32 + halo * 1.0;
    color += (vec3(1.0) - exp(-soft * 1.7)) * 0.82;

    // 暗角
    float vignette = smoothstep(1.18, 0.34, distance(uv, vec2(0.5)));
    color *= mix(0.62, 1.06, vignette);

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;

class DoubleFBO {
  constructor(createTarget, width, height) {
    this.createTarget = createTarget;
    this.width = width;
    this.height = height;
    this.read = createTarget(width, height);
    this.write = createTarget(width, height);
  }

  swap() {
    const temp = this.read;
    this.read = this.write;
    this.write = temp;
  }

  dispose() {
    this.read.dispose();
    this.write.dispose();
  }
}

class Suminagashi {
  constructor(canvas) {
    this.canvas = canvas;
    this.params = SIM_CONFIG;
    this.width = 1;
    this.height = 1;
    this.aspectRatio = 1;
    this.lastTime = performance.now();
    this.pointer = {
      down: false,
      id: null,
      lastX: null,
      lastY: null,
      hoverX: null,
      hoverY: null,
    };
    this.inkMode = "cycle";
    this.cycleIndex = 0;
    this.lastInteraction = performance.now();
    this.washStarted = 0;
    this.washDuration = 1500;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.hint = document.querySelector("#gesture-hint");
    this.hideHintTimer = window.setTimeout(() => this.hideHint(), 5000);
  }

  init() {
    if (!this.canvas || !window.THREE) {
      this.hideHint();
      return;
    }

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });
    this.renderer.setPixelRatio(1);
    this.renderer.autoClear = false;

    this.textureType = this.pickTextureType();
    this.filter = THREE.LinearFilter;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
    this.scene.add(this.quad);

    this.createMaterials();
    this.resize();
    this.bindPointerEvents();
    this.queueInitialInk();
    requestAnimationFrame((time) => this.tick(time));
  }

  pickTextureType() {
    if (this.renderer.capabilities.isWebGL2 || this.renderer.extensions.has("OES_texture_half_float")) {
      return THREE.HalfFloatType;
    }
    return THREE.UnsignedByteType;
  }

  createMaterials() {
    this.splatMaterial = this.material(splatShader, {
      uTarget: { value: null },
      aspectRatio: { value: 1 },
      color: { value: new THREE.Vector3() },
      point: { value: new THREE.Vector2() },
      radius: { value: this.params.SPLAT_RADIUS },
    });
    this.advectionMaterial = this.material(advectionShader, {
      uVelocity: { value: null },
      uSource: { value: null },
      texelSize: { value: new THREE.Vector2() },
      dt: { value: 0.016 },
      dissipation: { value: 0 },
    });
    this.divergenceMaterial = this.material(divergenceShader, {
      uVelocity: { value: null },
      texelSize: { value: new THREE.Vector2() },
    });
    this.curlMaterial = this.material(curlShader, {
      uVelocity: { value: null },
      texelSize: { value: new THREE.Vector2() },
    });
    this.vorticityMaterial = this.material(vorticityShader, {
      uVelocity: { value: null },
      uCurl: { value: null },
      texelSize: { value: new THREE.Vector2() },
      curl: { value: this.params.CURL },
      dt: { value: 0.016 },
    });
    this.pressureMaterial = this.material(pressureShader, {
      uPressure: { value: null },
      uDivergence: { value: null },
      texelSize: { value: new THREE.Vector2() },
    });
    this.gradientSubtractMaterial = this.material(gradientSubtractShader, {
      uPressure: { value: null },
      uVelocity: { value: null },
      texelSize: { value: new THREE.Vector2() },
    });
    this.clearMaterial = this.material(clearShader, {
      uTexture: { value: null },
      value: { value: 0 },
    });
    this.displayMaterial = this.material(displayShader, {
      uDye: { value: null },
      resolution: { value: new THREE.Vector2(1, 1) },
      time: { value: 0 },
    });
  }

  material(fragmentShader, uniforms) {
    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader: baseVertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
    });
  }

  resize() {
    this.width = Math.max(1, window.innerWidth);
    this.height = Math.max(1, window.innerHeight);
    this.aspectRatio = this.width / this.height;
    this.renderer.setSize(this.width, this.height, false);

    const sim = this.resolution(this.params.SIM_RES);
    const dye = this.resolution(this.params.DYE_RES);
    this.disposeTargets();

    this.velocity = new DoubleFBO((w, h) => this.target(w, h), sim.width, sim.height);
    this.dye = new DoubleFBO((w, h) => this.target(w, h), dye.width, dye.height);
    this.pressure = new DoubleFBO((w, h) => this.target(w, h), sim.width, sim.height);
    this.divergence = this.target(sim.width, sim.height);
    this.curl = this.target(sim.width, sim.height);

    this.simTexel = new THREE.Vector2(1 / sim.width, 1 / sim.height);
    this.dyeTexel = new THREE.Vector2(1 / dye.width, 1 / dye.height);
    this.clearAllTargets();
  }

  resolution(size) {
    if (this.width >= this.height) {
      return {
        width: size,
        height: Math.max(1, Math.round(size / this.aspectRatio)),
      };
    }
    return {
      width: Math.max(1, Math.round(size * this.aspectRatio)),
      height: size,
    };
  }

  target(width, height) {
    const target = new THREE.WebGLRenderTarget(width, height, {
      type: this.textureType,
      format: THREE.RGBAFormat,
      minFilter: this.filter,
      magFilter: this.filter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
    });
    target.texture.generateMipmaps = false;
    return target;
  }

  disposeTargets() {
    if (this.velocity) this.velocity.dispose();
    if (this.dye) this.dye.dispose();
    if (this.pressure) this.pressure.dispose();
    if (this.divergence) this.divergence.dispose();
    if (this.curl) this.curl.dispose();
  }

  clearAllTargets() {
    const targets = [
      this.velocity.read,
      this.velocity.write,
      this.dye.read,
      this.dye.write,
      this.pressure.read,
      this.pressure.write,
      this.divergence,
      this.curl,
    ];
    this.renderer.setClearColor(0x000000, 1);
    targets.forEach((target) => {
      this.renderer.setRenderTarget(target);
      this.renderer.clear();
    });
    this.renderer.setRenderTarget(null);
  }

  bindPointerEvents() {
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("pointerdown", (event) => this.onPointerDown(event), { passive: true });
    window.addEventListener("pointermove", (event) => this.onPointerMove(event), { passive: true });
    window.addEventListener("pointerup", (event) => this.onPointerUp(event), { passive: true });
    window.addEventListener("pointercancel", (event) => this.onPointerUp(event), { passive: true });
  }

  onPointerDown(event) {
    if (!event.isPrimary || this.isUiTarget(event.target)) return;

    this.pointer.down = true;
    this.pointer.id = event.pointerId;
    this.pointer.lastX = event.clientX;
    this.pointer.lastY = event.clientY;
    this.pointer.hoverX = event.clientX;
    this.pointer.hoverY = event.clientY;
    this.lastInteraction = performance.now();
    this.hideHint();
    this.dropAt(event.clientX, event.clientY, this.chooseInkForDrop(), 1.1);
  }

  onPointerMove(event) {
    if (!event.isPrimary || this.isUiTarget(event.target)) return;

    const x = event.clientX;
    const y = event.clientY;

    if (this.pointer.down && this.pointer.id === event.pointerId) {
      const dx = x - this.pointer.lastX;
      const dy = y - this.pointer.lastY;
      const speed = Math.hypot(dx, dy);
      if (speed > 0.1) {
        this.addVelocity(x, y, dx, dy, 0.55);
        this.addDye(x, y, this.currentInk(), clamp(speed / 130, 0.03, 0.14), this.params.SPLAT_RADIUS * 1.2);
      }
      this.pointer.lastX = x;
      this.pointer.lastY = y;
      this.lastInteraction = performance.now();
      this.hideHint();
      return;
    }

    if (this.pointer.hoverX !== null) {
      const dx = x - this.pointer.hoverX;
      const dy = y - this.pointer.hoverY;
      if (Math.hypot(dx, dy) > 0.25) {
        this.addVelocity(x, y, dx, dy, 0.22);
      }
    }
    this.pointer.hoverX = x;
    this.pointer.hoverY = y;
  }

  onPointerUp(event) {
    if (this.pointer.id !== event.pointerId) return;
    this.pointer.down = false;
    this.pointer.id = null;
  }

  isUiTarget(target) {
    if (!target || !target.closest) return false;
    return Boolean(target.closest("input, button, textarea, select, a, .panel, .results"));
  }

  chooseInkForDrop() {
    if (this.inkMode === "cycle") {
      const ink = INKS[this.cycleIndex % INKS.length];
      this.cycleIndex += 1;
      return ink;
    }
    return INK_BY_KEY[this.inkMode] || INKS[0];
  }

  currentInk() {
    if (this.inkMode === "cycle") {
      return INKS[(this.cycleIndex + INKS.length - 1) % INKS.length] || INKS[0];
    }
    return INK_BY_KEY[this.inkMode] || INKS[0];
  }

  dropAt(x, y, ink, strength) {
    this.addDye(x, y, ink, strength, this.params.SPLAT_RADIUS * 1.6);
    // 向上飄送 → 氣體拉成垂直光簾，而非一坨
    const force = this.reducedMotion ? 4 : 11;
    this.splatVelocity(x, y, (Math.random() - 0.5) * force * 0.5, force, this.params.SPLAT_RADIUS * 3.2);
  }

  addDye(x, y, ink, strength, radius) {
    const absorption = ink.absorption;
    this.splat(this.dye, x, y, [
      absorption[0] * strength,
      absorption[1] * strength,
      absorption[2] * strength,
    ], radius);
  }

  addVelocity(x, y, dx, dy, multiplier) {
    const scale = (this.params.SPLAT_FORCE / Math.max(this.width, this.height)) * multiplier;
    this.splatVelocity(x, y, dx * scale, -dy * scale, this.params.SPLAT_RADIUS * 2.2);
  }

  splatVelocity(x, y, forceX, forceY, radius) {
    this.splat(this.velocity, x, y, [forceX, forceY, 0], radius);
  }

  splat(target, x, y, color, radius) {
    this.splatMaterial.uniforms.uTarget.value = target.read.texture;
    this.splatMaterial.uniforms.aspectRatio.value = this.aspectRatio;
    this.splatMaterial.uniforms.point.value.set(x / this.width, 1 - y / this.height);
    this.splatMaterial.uniforms.color.value.set(color[0], color[1], color[2]);
    this.splatMaterial.uniforms.radius.value = radius;
    this.blit(this.splatMaterial, target.write);
    target.swap();
  }

  queueInitialInk() {
    window.setTimeout(() => this.dropAt(this.width * 0.5, this.height * 0.3, INK_BY_KEY.green, 0.55), 120);
    window.setTimeout(() => this.dropAt(this.width * 0.72, this.height * 0.26, INK_BY_KEY.teal, 0.45), 450);
    window.setTimeout(() => this.dropAt(this.width * 0.32, this.height * 0.28, INK_BY_KEY.violet, 0.4), 950);
  }

  tick(time) {
    const dt = Math.min((time - this.lastTime) / 1000, 0.033);
    this.lastTime = time;
    this.step(dt || 0.016, time);
    this.render(time);
    requestAnimationFrame((nextTime) => this.tick(nextTime));
  }

  step(dt, time) {
    this.curlMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
    this.curlMaterial.uniforms.texelSize.value.copy(this.simTexel);
    this.blit(this.curlMaterial, this.curl);

    this.vorticityMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
    this.vorticityMaterial.uniforms.uCurl.value = this.curl.texture;
    this.vorticityMaterial.uniforms.texelSize.value.copy(this.simTexel);
    this.vorticityMaterial.uniforms.curl.value = this.reducedMotion ? this.params.CURL * 0.38 : this.params.CURL;
    this.vorticityMaterial.uniforms.dt.value = dt;
    this.blit(this.vorticityMaterial, this.velocity.write);
    this.velocity.swap();

    this.divergenceMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
    this.divergenceMaterial.uniforms.texelSize.value.copy(this.simTexel);
    this.blit(this.divergenceMaterial, this.divergence);

    this.clearMaterial.uniforms.uTexture.value = this.pressure.read.texture;
    this.clearMaterial.uniforms.value.value = 0;
    this.blit(this.clearMaterial, this.pressure.write);
    this.pressure.swap();

    this.pressureMaterial.uniforms.uDivergence.value = this.divergence.texture;
    this.pressureMaterial.uniforms.texelSize.value.copy(this.simTexel);
    for (let i = 0; i < this.params.PRESSURE_ITER; i += 1) {
      this.pressureMaterial.uniforms.uPressure.value = this.pressure.read.texture;
      this.blit(this.pressureMaterial, this.pressure.write);
      this.pressure.swap();
    }

    this.gradientSubtractMaterial.uniforms.uPressure.value = this.pressure.read.texture;
    this.gradientSubtractMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
    this.gradientSubtractMaterial.uniforms.texelSize.value.copy(this.simTexel);
    this.blit(this.gradientSubtractMaterial, this.velocity.write);
    this.velocity.swap();

    this.advectionMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
    this.advectionMaterial.uniforms.uSource.value = this.velocity.read.texture;
    this.advectionMaterial.uniforms.texelSize.value.copy(this.simTexel);
    this.advectionMaterial.uniforms.dt.value = dt;
    this.advectionMaterial.uniforms.dissipation.value = this.params.VEL_DISSIPATION;
    this.blit(this.advectionMaterial, this.velocity.write);
    this.velocity.swap();

    this.advectionMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
    this.advectionMaterial.uniforms.uSource.value = this.dye.read.texture;
    this.advectionMaterial.uniforms.texelSize.value.copy(this.simTexel);
    this.advectionMaterial.uniforms.dt.value = dt;
    this.advectionMaterial.uniforms.dissipation.value = this.dyeDissipation(time);
    this.blit(this.advectionMaterial, this.dye.write);
    this.dye.swap();
  }

  dyeDissipation(time) {
    if (!this.washStarted) return this.params.DYE_DISSIPATION;

    const t = (time - this.washStarted) / this.washDuration;
    if (t >= 1) {
      this.washStarted = 0;
      return this.params.DYE_DISSIPATION;
    }
    const ease = 1 - Math.pow(1 - clamp(t, 0, 1), 2);
    return this.params.DYE_DISSIPATION + 5.2 * (1 - ease * 0.25);
  }

  render(time) {
    this.displayMaterial.uniforms.uDye.value = this.dye.read.texture;
    this.displayMaterial.uniforms.resolution.value.set(this.width, this.height);
    this.displayMaterial.uniforms.time.value = time * 0.001;
    this.blit(this.displayMaterial, null);
  }

  blit(material, target) {
    this.quad.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.camera);
  }

  hideHint() {
    if (!this.hint) return;
    window.clearTimeout(this.hideHintTimer);
    this.hint.classList.add("is-hidden");
  }
}

function hexToEmission(hex) {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16) / 255,
    parseInt(value.slice(2, 4), 16) / 255,
    parseInt(value.slice(4, 6), 16) / 255,
  ];
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const suminagashi = new Suminagashi(ambientCanvas);
suminagashi.init();
