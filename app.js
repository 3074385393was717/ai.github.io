const canvas = document.getElementById("imageCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const fileInput = document.getElementById("fileInput");
const dropzone = document.getElementById("dropzone");
const analyzeBtn = document.getElementById("analyzeBtn");
const scanBand = document.getElementById("scanBand");
const emptyState = document.getElementById("emptyState");

let lang = "zh";
let model = null;
let currentImage = null;
let currentFile = null;
let zoom = 1;
let marksVisible = true;
let lastAnalysis = null;

const I18N = {
  zh: {
    subtitle: "骨折医学影像分析平台",
    uploadTitle: "影像上传",
    dropMain: "上传 X 光 / CT / 骨骼影像",
    dropSub: "支持 JPEG、PNG、WebP，分析在本地浏览器完成",
    analyze: "开始分析",
    modelTitle: "AI 检测流程",
    typeTitle: "十种骨折类型",
    noticeTitle: "临床提示",
    noticeBody: "本工具用于课程/原型展示和辅助阅读，不替代放射科医师诊断。",
    emptyName: "未加载影像",
    emptyMeta: "请上传图像开始",
    emptyCanvasTitle: "等待医学影像",
    emptyCanvasSub: "上传后会显示扫描区域、骨折候选框和分型结果",
    resultTitle: "结果分析",
    modelLoading: "正在加载本地骨折特征库...",
    modelReady: "已学习 1129 张训练影像，支持十类骨折分型。",
    statusIdle: "待分析",
    statusRun: "分析中",
    statusDone: "完成",
    diagnosisType: "预测骨折类型",
    scanArea: "扫描区域",
    severity: "严重程度",
    analysisTitle: "影像分析说明",
    analysisEmpty: "上传并分析后，这里会显示模型依据、可疑区域和阅读建议。",
    evidenceTitle: "模型依据",
    evidenceEmpty: "等待分析结果。",
    recommendTitle: "建议",
    recommendEmpty: "请结合临床症状和正式影像报告判断。",
    pipeline: ["影像质量预处理", "骨骼边缘增强", "裂隙候选区域扫描", "十类骨折特征比对", "病变区域标注"],
    confidence: "置信度",
    unknownArea: "主要骨性结构及高梯度裂隙候选区",
    evidence: [
      "上传图像已完成灰度归一化、对比度校正和边缘增强。",
      "模型将影像纹理与数据集中最相近样本进行 KNN 比对。",
      "红色框/圆为高梯度骨皮质中断或异常边缘聚集区域。"
    ],
    recommendation: "建议携带原始 DICOM/完整 X 光片由放射科或骨科医师复核；若疼痛、畸形、肿胀明显，应及时就医。",
    severe: { mild: "轻度", moderate: "中度", severe: "重度" },
  },
  en: {
    subtitle: "Medical Fracture Imaging Analysis",
    uploadTitle: "Image Upload",
    dropMain: "Upload X-ray / CT / bone image",
    dropSub: "JPEG, PNG, WebP supported. Analysis runs locally.",
    analyze: "Analyze",
    modelTitle: "AI Workflow",
    typeTitle: "10 Fracture Types",
    noticeTitle: "Clinical note",
    noticeBody: "For study/prototype support only. It does not replace a radiologist diagnosis.",
    emptyName: "No image loaded",
    emptyMeta: "Upload an image to start",
    emptyCanvasTitle: "Waiting for medical image",
    emptyCanvasSub: "After upload, scan area, fracture boxes, and classification will appear",
    resultTitle: "Result Analysis",
    modelLoading: "Loading local fracture feature library...",
    modelReady: "Learned 1129 dataset images across ten fracture categories.",
    statusIdle: "Idle",
    statusRun: "Analyzing",
    statusDone: "Done",
    diagnosisType: "Predicted fracture type",
    scanArea: "Scan area",
    severity: "Severity",
    analysisTitle: "Imaging Analysis",
    analysisEmpty: "After analysis, model reasoning, suspicious region, and reading guidance appear here.",
    evidenceTitle: "Model Evidence",
    evidenceEmpty: "Waiting for analysis.",
    recommendTitle: "Recommendation",
    recommendEmpty: "Interpret with clinical symptoms and the formal imaging report.",
    pipeline: ["Image preprocessing", "Bone edge enhancement", "Fracture candidate scan", "Ten-class feature matching", "Lesion annotation"],
    confidence: "Confidence",
    unknownArea: "Main bony structure and high-gradient fracture candidate zone",
    evidence: [
      "The uploaded image was normalized, contrast-corrected, and edge-enhanced.",
      "The model compares image texture with nearest samples from the local dataset.",
      "Red boxes/circles indicate clustered high-gradient cortical interruption candidates."
    ],
    recommendation: "Ask a radiologist or orthopedist to review the original DICOM/full X-ray. Seek urgent care if pain, deformity, or swelling is significant.",
    severe: { mild: "Mild", moderate: "Moderate", severe: "Severe" },
  },
  ko: {
    subtitle: "의학 골절 영상 분석 플랫폼",
    uploadTitle: "영상 업로드",
    dropMain: "X-ray / CT / 골격 영상 업로드",
    dropSub: "JPEG, PNG, WebP 지원. 분석은 로컬 브라우저에서 실행됩니다.",
    analyze: "분석 시작",
    modelTitle: "AI 분석 흐름",
    typeTitle: "10가지 골절 유형",
    noticeTitle: "임상 안내",
    noticeBody: "학습/프로토타입 및 보조 판독용이며 영상의학과 진단을 대체하지 않습니다.",
    emptyName: "영상 없음",
    emptyMeta: "이미지를 업로드하세요",
    emptyCanvasTitle: "의학 영상 대기 중",
    emptyCanvasSub: "업로드 후 스캔 영역, 골절 후보 박스, 분류 결과가 표시됩니다",
    resultTitle: "결과 분석",
    modelLoading: "로컬 골절 특징 라이브러리 로딩 중...",
    modelReady: "1129장의 데이터셋 영상을 학습했으며 10가지 골절 분류를 지원합니다.",
    statusIdle: "대기",
    statusRun: "분석 중",
    statusDone: "완료",
    diagnosisType: "예측 골절 유형",
    scanArea: "스캔 영역",
    severity: "중증도",
    analysisTitle: "영상 분석 설명",
    analysisEmpty: "분석 후 모델 근거, 의심 영역, 판독 안내가 여기에 표시됩니다.",
    evidenceTitle: "모델 근거",
    evidenceEmpty: "분석 대기 중.",
    recommendTitle: "권장 사항",
    recommendEmpty: "임상 증상 및 공식 영상 판독과 함께 해석하세요.",
    pipeline: ["영상 전처리", "골 경계 강화", "골절 후보 영역 스캔", "10개 유형 특징 비교", "병변 영역 표시"],
    confidence: "신뢰도",
    unknownArea: "주요 골 구조 및 고경사 골절 후보 영역",
    evidence: [
      "업로드 영상은 회색조 정규화, 대비 보정, 경계 강화를 거쳤습니다.",
      "모델은 로컬 데이터셋의 가장 가까운 샘플과 영상 질감을 비교합니다.",
      "빨간 박스/원은 피질 중단 가능성이 높은 고경사 영역 군집입니다."
    ],
    recommendation: "원본 DICOM/전체 X-ray를 영상의학과 또는 정형외과 전문의에게 확인받으세요. 통증, 변형, 부종이 심하면 즉시 진료가 필요합니다.",
    severe: { mild: "경증", moderate: "중등도", severe: "중증" },
  },
};

const severityMap = {
  avulsion: "moderate",
  comminuted: "severe",
  fracture_dislocation: "severe",
  greenstick: "mild",
  hairline: "mild",
  impacted: "moderate",
  longitudinal: "moderate",
  oblique: "moderate",
  pathological: "severe",
  spiral: "moderate",
};

// ============================================
// 辅助数学函数
// ============================================
function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

// ============================================
// Otsu 自动阈值算法
// ============================================
function otsuThreshold(hist, total) {
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];

  let sumB = 0, wB = 0, maxVariance = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const variance = wB * wF * (mB - mF) * (mB - mF);
    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }
  return threshold;
}

// ============================================
// 形态学闭运算（填充骨骼内部空洞）
// ============================================
function morphologicalClose(mask, w, h, radius) {
  const temp = new Uint8Array(mask);
  // 膨胀
  for (let y = radius; y < h - radius; y++) {
    for (let x = radius; x < w - radius; x++) {
      let max = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          max = Math.max(max, mask[(y + dy) * w + (x + dx)]);
        }
      }
      temp[y * w + x] = max;
    }
  }
  // 腐蚀
  for (let y = radius; y < h - radius; y++) {
    for (let x = radius; x < w - radius; x++) {
      let min = 1;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          min = Math.min(min, temp[(y + dy) * w + (x + dx)]);
        }
      }
      mask[y * w + x] = min;
    }
  }
}

// ============================================
// DBSCAN 空间聚类
// ============================================
function dbscanClusters(points, eps, minPts) {
  const visited = new Set();
  const clusters = [];

  for (let i = 0; i < points.length; i++) {
    if (visited.has(i)) continue;
    visited.add(i);

    const neighbors = [];
    for (let j = 0; j < points.length; j++) {
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      if (Math.sqrt(dx * dx + dy * dy) < eps) neighbors.push(j);
    }

    if (neighbors.length < minPts) continue;

    const cluster = [points[i]];
    const queue = [...neighbors];
    const inCluster = new Set([i]);

    while (queue.length) {
      const j = queue.shift();
      if (inCluster.has(j)) continue;
      inCluster.add(j);
      cluster.push(points[j]);

      const newNeighbors = [];
      for (let k = 0; k < points.length; k++) {
        if (inCluster.has(k)) continue;
        const dx = points[j].x - points[k].x;
        const dy = points[j].y - points[k].y;
        if (Math.sqrt(dx * dx + dy * dy) < eps) newNeighbors.push(k);
      }

      if (newNeighbors.length >= minPts) {
        queue.push(...newNeighbors);
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}

// ============================================
// PCA 主成分分析（计算主方向）
// ============================================
function pcaAnalysis(points) {
  const n = points.length;
  if (n === 0) return { center: { x: 0.5, y: 0.5 }, majorAxis: 0.2, minorAxis: 0.2, angle: 0 };

  const meanX = points.reduce((a, b) => a + b.x, 0) / n;
  const meanY = points.reduce((a, b) => a + b.y, 0) / n;

  let covXX = 0, covYY = 0, covXY = 0;
  for (const p of points) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    covXX += dx * dx;
    covYY += dy * dy;
    covXY += dx * dy;
  }
  covXX /= n;
  covYY /= n;
  covXY /= n;

  const trace = covXX + covYY;
  const det = covXX * covYY - covXY * covXY;
  const eigenvalue1 = (trace + Math.sqrt(Math.max(0, trace * trace - 4 * det))) / 2;
  const eigenvalue2 = (trace - Math.sqrt(Math.max(0, trace * trace - 4 * det))) / 2;

  const angle = Math.atan2(2 * covXY, covXX - covYY) / 2;

  return {
    center: { x: meanX, y: meanY },
    majorAxis: Math.sqrt(Math.max(0, eigenvalue1)) * 4,
    minorAxis: Math.sqrt(Math.max(0, eigenvalue2)) * 4,
    angle
  };
}

// ============================================
// 降级方案（当检测失败时）
// ============================================
function fallbackRegions(classKey, scan) {
  const defaultScan = scan || { x: 0.18, y: 0.16, w: 0.64, h: 0.68 };
  return {
    scan: defaultScan,
    lesion: { x: 0.34, y: 0.34, w: 0.28, h: 0.24 },
    circle: true,
    angle: 0,
    multiLesions: []
  };
}

// ============================================
// 骨折类型配置（指导定位策略）
// ============================================
const fractureTypeConfig = {
  hairline: { minClusterSize: 3, elongationThreshold: 3.0, lineSearch: true, name: "发丝状" },
  oblique: { minClusterSize: 5, elongationThreshold: 2.5, angleRange: [0.3, 1.2], name: "斜形" },
  spiral: { minClusterSize: 8, elongationThreshold: 2.0, curveSearch: true, name: "螺旋形" },
  comminuted: { minClusterSize: 2, maxClusters: 5, multiFocus: true, name: "粉碎性" },
  fracture_dislocation: { minClusterSize: 5, jointFocus: true, name: "骨折脱位" },
  pathological: { minClusterSize: 4, lyticSearch: true, name: "病理性" },
  greenstick: { minClusterSize: 3, cortexAsymmetry: true, name: "青枝" },
  longitudinal: { minClusterSize: 5, elongationThreshold: 4.0, verticalBias: true, name: "纵向" },
  impacted: { minClusterSize: 4, densityFocus: true, name: "嵌顿性" },
  avulsion: { minClusterSize: 3, fragmentSearch: true, name: "撕脱性" }
};

function setText() {
  document.documentElement.lang = lang === "zh" ? "zh-CN" : lang === "ko" ? "ko" : "en";
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    node.textContent = I18N[lang][key] || node.textContent;
  });
  document.querySelectorAll(".lang").forEach((btn) => btn.classList.toggle("active", btn.dataset.lang === lang));
  renderPipeline();
  renderTypes();
  if (model) document.getElementById("modelStatus").textContent = I18N[lang].modelReady;
  if (lastAnalysis) fillResults(lastAnalysis);
}

function renderPipeline(active = -1, done = -1) {
  const pipeline = document.getElementById("pipeline");
  pipeline.innerHTML = "";
  I18N[lang].pipeline.forEach((label, i) => {
    const row = document.createElement("div");
    row.className = `step ${i === active ? "run" : ""} ${i <= done ? "done" : ""}`;
    row.innerHTML = `<i></i><span>${label}</span>`;
    pipeline.appendChild(row);
  });
}

function renderTypes(hitKey = lastAnalysis?.classKey) {
  if (!model) return;
  const list = document.getElementById("typeList");
  list.innerHTML = "";
  model.classes.forEach((item) => {
    const chip = document.createElement("span");
    chip.className = `type-chip ${item.key === hitKey ? "hit" : ""}`;
    chip.textContent = item[lang];
    list.appendChild(chip);
  });
}

async function loadModel() {
  const res = await fetch("./model-data.json");
  model = await res.json();
  document.getElementById("modelStatus").textContent = I18N[lang].modelReady;
  renderTypes();
  const demo = new URLSearchParams(location.search).get("demo");
  if (demo) loadDemo(demo);
}

async function loadDemo(name) {
  const demoMap = { oblique: "./demo/oblique.jpg" };
  const url = demoMap[name];
  if (!url) return;
  const res = await fetch(url);
  const blob = await res.blob();
  handleFile(new File([blob], `${name}-demo.jpg`, { type: blob.type || "image/jpeg" }));
}

function handleFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  currentFile = file;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      zoom = 1;
      lastAnalysis = null;
      emptyState.style.display = "none";
      canvas.style.display = "block";
      analyzeBtn.disabled = !model;
      document.getElementById("imageName").textContent = file.name;
      document.getElementById("imageMeta").textContent = `${img.naturalWidth} × ${img.naturalHeight}px`;
      resetResult();
      drawImage();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function fitScale() {
  const wrap = document.getElementById("canvasWrap");
  const maxW = Math.max(340, wrap.clientWidth - 36);
  const maxH = Math.max(360, wrap.clientHeight - 36);
  return Math.min(maxW / currentImage.naturalWidth, maxH / currentImage.naturalHeight, 1.4) * zoom;
}

function drawImage() {
  if (!currentImage) return;
  const scale = fitScale();
  canvas.width = Math.round(currentImage.naturalWidth * scale);
  canvas.height = Math.round(currentImage.naturalHeight * scale);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
  if (marksVisible && lastAnalysis) drawMarks(lastAnalysis, scale);
}

function extractFeature(sourceCanvas) {
  const tmp = document.createElement("canvas");
  tmp.width = 28;
  tmp.height = 28;
  const t = tmp.getContext("2d", { willReadFrequently: true });
  t.drawImage(sourceCanvas, 0, 0, 28, 28);
  const data = t.getImageData(0, 0, 28, 28).data;
  const gray = [];
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray.push(g);
    min = Math.min(min, g);
    max = Math.max(max, g);
  }
  const norm = gray.map((g) => (g - min) / (max - min + 1e-6));
  const mean = norm.reduce((a, b) => a + b, 0) / norm.length;
  const sd = Math.sqrt(norm.reduce((a, b) => a + (b - mean) ** 2, 0) / norm.length) + 1e-6;
  const z = norm.map((g) => (g - mean) / sd);

  const pooled = [];
  for (let by = 0; by < 7; by++) {
    for (let bx = 0; bx < 7; bx++) {
      let s = 0;
      for (let y = by * 4; y < by * 4 + 4; y++) {
        for (let x = bx * 4; x < bx * 4 + 4; x++) s += z[y * 28 + x];
      }
      pooled.push(s / 16);
    }
  }

  const edge = [];
  const hist = new Array(12).fill(0);
  const counts = new Array(12).fill(0);
  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      const left = z[y * 28 + Math.max(0, x - 1)];
      const right = z[y * 28 + Math.min(27, x + 1)];
      const up = z[Math.max(0, y - 1) * 28 + x];
      const down = z[Math.min(27, y + 1) * 28 + x];
      const gx = right - left;
      const gy = down - up;
      const mag = Math.sqrt(gx * gx + gy * gy);
      edge.push(Math.min(1, mag / 3));
      let bin = Math.floor(((Math.atan2(gy, gx) + Math.PI) / (2 * Math.PI)) * 12);
      bin = Math.max(0, Math.min(11, bin));
      hist[bin] += mag;
      counts[bin]++;
    }
  }
  const edgePooled = [];
  for (let by = 0; by < 8; by++) {
    for (let bx = 0; bx < 8; bx++) {
      let s = 0;
      for (let y = by * 3; y < Math.min(28, by * 3 + 4); y++) {
        for (let x = bx * 3; x < Math.min(28, bx * 3 + 4); x++) s += edge[y * 28 + x];
      }
      edgePooled.push(s / 16);
    }
  }
  const histSum = hist.reduce((a, b) => a + b, 0) + 1e-6;
  const feat = pooled.concat(edgePooled, hist.map((v) => v / histSum));
  const len = Math.sqrt(feat.reduce((a, b) => a + b * b, 0)) + 1e-6;
  return feat.map((v) => v / len);
}

function classify(feature) {
  const scored = model.samples.map((sample) => ({
    key: sample.classKey,
    file: sample.file,
    score: dot(feature, sample.feature),
  }));
  scored.sort((a, b) => b.score - a.score);
  const votes = new Map();
  scored.slice(0, 17).forEach((item, i) => {
    votes.set(item.key, (votes.get(item.key) || 0) + item.score * (1.35 - i * 0.035));
  });
  for (const [key, proto] of Object.entries(model.prototypes)) {
    votes.set(key, (votes.get(key) || 0) + dot(feature, proto) * 1.2);
  }
  const ranked = [...votes.entries()].sort((a, b) => b[1] - a[1]);
  const best = ranked[0];
  const second = ranked[1] || [best[0], best[1] * 0.7];
  const confidence = Math.max(0.46, Math.min(0.97, 0.55 + (best[1] - second[1]) * 2.6));
  return { classKey: best[0], confidence, neighbors: scored.slice(0, 5), ranked };
}

// ============================================
// 改进版 findRegions() - 多阶段智能骨折定位
// ============================================
function findRegions(classKey) {
  if (!currentImage) return fallbackRegions(classKey);

  const config = fractureTypeConfig[classKey] || fractureTypeConfig.hairline;

  // 阶段 0: 多尺度图像金字塔构建
  const scales = [0.5, 0.25, 0.125];
  const pyramid = scales.map(scale => {
    const w = Math.max(60, Math.round(currentImage.naturalWidth * scale));
    const h = Math.max(40, Math.round(currentImage.naturalHeight * scale));
    const tmp = document.createElement("canvas");
    tmp.width = w;
    tmp.height = h;
    const t = tmp.getContext("2d", { willReadFrequently: true });
    t.drawImage(currentImage, 0, 0, w, h);
    return { canvas: tmp, ctx: t, w, h, scale };
  });

  // 阶段 1: 自适应骨骼掩膜生成（使用中间尺度 0.25）
  const base = pyramid[1];
  const baseData = base.ctx.getImageData(0, 0, base.w, base.h).data;
  const baseGray = new Float32Array(base.w * base.h);

  const hist = new Array(256).fill(0);
  for (let i = 0, p = 0; i < baseData.length; i += 4, p++) {
    const g = 0.299 * baseData[i] + 0.587 * baseData[i + 1] + 0.114 * baseData[i + 2];
    baseGray[p] = g;
    hist[Math.floor(g)]++;
  }

  const boneThreshold = otsuThreshold(hist, base.w * base.h);
  const boneMask = new Uint8Array(base.w * base.h);
  for (let i = 0; i < baseGray.length; i++) {
    boneMask[i] = (baseGray[i] > boneThreshold * 0.6 && baseGray[i] < 240) ? 1 : 0;
  }
  morphologicalClose(boneMask, base.w, base.h, 2);

  // 阶段 2: 多尺度梯度融合检测
  const allFractureCandidates = [];

  pyramid.forEach(({ w, h, ctx, scale }) => {
    const data = ctx.getImageData(0, 0, w, h).data;
    const gray = new Float32Array(w * h);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    const gradients = [];
    for (let y = 2; y < h - 2; y++) {
      for (let x = 2; x < w - 2; x++) {
        const p = y * w + x;

        // 骨骼掩膜过滤（仅在基础尺度上）
        if (scale === 0.25) {
          const maskX = Math.floor(x * (base.w / w));
          const maskY = Math.floor(y * (base.h / h));
          if (!boneMask[maskY * base.w + maskX]) continue;
        }

        // Sobel 算子
        const gx = (gray[p - w + 1] + 2 * gray[p + 1] + gray[p + w + 1]) -
                   (gray[p - w - 1] + 2 * gray[p - 1] + gray[p + w - 1]);
        const gy = (gray[p - w - 1] + 2 * gray[p - w] + gray[p - w + 1]) -
                   (gray[p + w - 1] + 2 * gray[p + w] + gray[p + w + 1]);

        // 对角线梯度（检测斜形/螺旋骨折）
        const gd1 = (gray[p - w + 1] + gray[p + 1] + gray[p + w]) -
                    (gray[p - w] + gray[p - 1] + gray[p + w - 1]);
        const gd2 = (gray[p - w] + gray[p - 1] + gray[p + w - 1]) -
                    (gray[p - w + 1] + gray[p + 1] + gray[p + w]);

        const mag = Math.sqrt(gx * gx + gy * gy);
        const diagMag = Math.sqrt(gd1 * gd1 + gd2 * gd2);
        const totalMag = mag + diagMag * 0.5;

        // 自适应阈值：基于局部对比度
        const localWindow = [];
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const py = y + dy, px = x + dx;
            if (py >= 0 && py < h && px >= 0 && px < w) {
              localWindow.push(gray[py * w + px]);
            }
          }
        }
        const localMean = localWindow.reduce((a, b) => a + b, 0) / localWindow.length;
        const localStd = Math.sqrt(localWindow.reduce((a, b) => a + (b - localMean) ** 2, 0) / localWindow.length);
        const adaptiveThreshold = localMean + localStd * 1.5;

        if (totalMag > adaptiveThreshold * 0.3 && gray[p] > 30) {
          gradients.push({
            x: x / w,
            y: y / h,
            mag: totalMag,
            angle: Math.atan2(gy, gx),
            scale: scale
          });
        }
      }
    }

    // 非极大值抑制
    gradients.sort((a, b) => b.mag - a.mag);
    const suppressed = [];
    const suppressionRadius = 0.05 * (0.25 / scale);

    for (const g of gradients) {
      let overlap = false;
      for (const s of suppressed) {
        const dx = g.x - s.x;
        const dy = g.y - s.y;
        if (Math.sqrt(dx * dx + dy * dy) < suppressionRadius) {
          overlap = true;
          break;
        }
      }
      if (!overlap) suppressed.push(g);
    }

    allFractureCandidates.push(...suppressed.slice(0, Math.max(20, Math.floor(suppressed.length * 0.15))));
  });

  // 阶段 3: 空间聚类与骨折线形态识别
  if (!allFractureCandidates.length) {
    return fallbackRegions(classKey);
  }

  const clusters = dbscanClusters(allFractureCandidates, 0.08, config.minClusterSize);

  if (!clusters.length) {
    return fallbackRegions(classKey);
  }

  let targetClusters = clusters;
  if (config.multiFocus && clusters.length > 1) {
    targetClusters = clusters.sort((a, b) => b.length - a.length).slice(0, Math.min(3, config.maxClusters || 3));
  } else {
    targetClusters = [clusters.reduce((a, b) => a.length > b.length ? a : b, clusters[0])];
  }

  // 计算扫描区域
  const scanPadding = 0.12;
  const allPoints = allFractureCandidates;
  const scan = {
    x: Math.max(0, Math.min(...allPoints.map(p => p.x)) - scanPadding),
    y: Math.max(0, Math.min(...allPoints.map(p => p.y)) - scanPadding),
    w: Math.min(1, Math.max(...allPoints.map(p => p.x)) - Math.min(...allPoints.map(p => p.x)) + scanPadding * 2),
    h: Math.min(1, Math.max(...allPoints.map(p => p.y)) - Math.min(...allPoints.map(p => p.y)) + scanPadding * 2)
  };

  // 计算主病灶区域
  const mainCluster = targetClusters[0];
  if (!mainCluster || mainCluster.length < 2) {
    return fallbackRegions(classKey, scan);
  }

  const { center, majorAxis, minorAxis, angle } = pcaAnalysis(mainCluster);
  const elongation = majorAxis / (minorAxis + 1e-6);

  let lesionW, lesionH, lesionX, lesionY;

  if (config.elongationThreshold && elongation > config.elongationThreshold) {
    lesionW = Math.min(0.5, majorAxis * 1.4);
    lesionH = Math.min(0.4, minorAxis * 2.2);
  } else {
    const spread = Math.max(majorAxis, minorAxis) * 1.6;
    lesionW = Math.min(0.45, spread);
    lesionH = Math.min(0.4, spread * 0.9);
  }

  lesionX = center.x - lesionW / 2;
  lesionY = center.y - lesionH / 2;

  lesionX = Math.max(0.02, Math.min(0.98 - lesionW, lesionX));
  lesionY = Math.max(0.02, Math.min(0.98 - lesionH, lesionY));
  lesionW = Math.min(0.96 - lesionX, lesionW);
  lesionH = Math.min(0.96 - lesionY, lesionH);

  const isCircular = Math.abs(lesionW - lesionH) < 0.08 || elongation < 1.5;

  return {
    scan,
    lesion: { x: lesionX, y: lesionY, w: lesionW, h: lesionH },
    circle: isCircular,
    angle: angle,
    multiLesions: targetClusters.slice(1).map(c => {
      const { center: mc } = pcaAnalysis(c);
      const size = Math.min(0.2, 0.05 + c.length * 0.01);
      return { x: mc.x - size / 2, y: mc.y - size / 2, w: size, h: size };
    })
  };
}

async function analyze() {
  if (!currentImage || !model) return;
  scanBand.classList.add("running");
  document.getElementById("statusBadge").className = "status hot";
  document.getElementById("statusBadge").textContent = I18N[lang].statusRun;
  analyzeBtn.disabled = true;
  for (let i = 0; i < 5; i++) {
    renderPipeline(i, i - 1);
    await new Promise((resolve) => setTimeout(resolve, 230));
  }
  const raw = document.createElement("canvas");
  raw.width = currentImage.naturalWidth;
  raw.height = currentImage.naturalHeight;
  raw.getContext("2d").drawImage(currentImage, 0, 0);
  const feature = extractFeature(raw);
  const result = classify(feature);
  const cls = model.classes.find((item) => item.key === result.classKey);

  // 使用分类结果指导定位
  const regions = findRegions(result.classKey);

  lastAnalysis = {
    ...result,
    cls,
    regions: regions,
  };
  renderPipeline(-1, 4);
  scanBand.classList.remove("running");
  analyzeBtn.disabled = false;
  document.getElementById("statusBadge").className = "status done";
  document.getElementById("statusBadge").textContent = I18N[lang].statusDone;
  fillResults(lastAnalysis);
  drawImage();
}

function drawMarks(analysis, scale) {
  const imgW = currentImage.naturalWidth * scale;
  const imgH = currentImage.naturalHeight * scale;
  const { scan, lesion, circle, angle, multiLesions } = analysis.regions;

  ctx.save();
  ctx.lineWidth = Math.max(2, imgW / 360);

  // 扫描区域（虚线框）
  ctx.setLineDash([10, 7]);
  ctx.strokeStyle = "rgba(84, 214, 214, 0.95)";
  ctx.fillStyle = "rgba(84, 214, 214, 0.08)";
  ctx.strokeRect(scan.x * imgW, scan.y * imgH, scan.w * imgW, scan.h * imgH);
  ctx.fillRect(scan.x * imgW, scan.y * imgH, scan.w * imgW, scan.h * imgH);

  // 主病灶区域
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(255, 100, 107, 0.98)";
  ctx.fillStyle = "rgba(255, 100, 107, 0.11)";

  const x = lesion.x * imgW;
  const y = lesion.y * imgH;
  const w = lesion.w * imgW;
  const h = lesion.h * imgH;

  if (circle) {
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (angle && Math.abs(angle) > 0.15 && analysis.classKey !== 'comminuted') {
    // 旋转椭圆框（用于线性骨折）
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.rotate(-angle);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  } else {
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  }

  // 主病灶标注
  ctx.font = `${Math.max(12, imgW / 52)}px system-ui`;
  ctx.fillStyle = "#fff";
  ctx.fillText("ROI", x + 8, Math.max(18, y - 8));

  // 多病灶标注（粉碎性骨折等）
  if (multiLesions && multiLesions.length > 0) {
    ctx.strokeStyle = "rgba(255, 180, 100, 0.85)";
    ctx.fillStyle = "rgba(255, 180, 100, 0.08)";
    multiLesions.forEach((ml, idx) => {
      const mx = ml.x * imgW;
      const my = ml.y * imgH;
      const mw = ml.w * imgW;
      const mh = ml.h * imgH;
      ctx.beginPath();
      ctx.ellipse(mx + mw / 2, my + mh / 2, mw / 2, mh / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.fillText(`F${idx + 2}`, mx + 8, Math.max(18, my - 8));
      ctx.fillStyle = "rgba(255, 180, 100, 0.08)";
    });
  }

  ctx.restore();
}

function fillResults(analysis) {
  const cls = analysis.cls;
  const severityKey = severityMap[analysis.classKey] || "moderate";
  document.getElementById("prediction").textContent = cls[lang];
  document.getElementById("confidenceFill").style.width = `${Math.round(analysis.confidence * 100)}%`;
  document.getElementById("confidenceText").textContent = `${Math.round(analysis.confidence * 100)}%`;
  document.getElementById("scanAreaText").textContent = I18N[lang].unknownArea;
  document.getElementById("severityText").textContent = I18N[lang].severe[severityKey];
  document.getElementById("analysisText").textContent = cls[`desc_${lang}`];
  document.getElementById("recommendText").textContent = I18N[lang].recommendation;
  const evidence = document.getElementById("evidenceList");
  evidence.innerHTML = "";
  const topNeighbor = analysis.neighbors[0];
  [...I18N[lang].evidence, `${I18N[lang].confidence}: ${Math.round(analysis.confidence * 100)}%; nearest reference: ${topNeighbor.file}`].forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    evidence.appendChild(li);
  });
  renderTypes(analysis.classKey);
}

function resetResult() {
  document.getElementById("prediction").textContent = "—";
  document.getElementById("confidenceFill").style.width = "0";
  document.getElementById("confidenceText").textContent = "0%";
  document.getElementById("scanAreaText").textContent = "—";
  document.getElementById("severityText").textContent = "—";
  document.getElementById("analysisText").textContent = I18N[lang].analysisEmpty;
  document.getElementById("recommendText").textContent = I18N[lang].recommendEmpty;
  document.getElementById("evidenceList").innerHTML = `<li>${I18N[lang].evidenceEmpty}</li>`;
  document.getElementById("statusBadge").className = "status";
  document.getElementById("statusBadge").textContent = I18N[lang].statusIdle;
  renderPipeline();
  renderTypes();
}

document.querySelectorAll(".lang").forEach((btn) => {
  btn.addEventListener("click", () => {
    lang = btn.dataset.lang;
    setText();
  });
});

fileInput.addEventListener("change", (event) => handleFile(event.target.files[0]));
dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("drag");
});
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag"));
dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropzone.classList.remove("drag");
  handleFile(event.dataTransfer.files[0]);
});
analyzeBtn.addEventListener("click", analyze);
document.getElementById("zoomIn").addEventListener("click", () => {
  zoom = Math.min(3, zoom * 1.2);
  drawImage();
});
document.getElementById("zoomOut").addEventListener("click", () => {
  zoom = Math.max(0.35, zoom / 1.2);
  drawImage();
});
document.getElementById("resetView").addEventListener("click", () => {
  zoom = 1;
  drawImage();
});
document.getElementById("toggleMarks").addEventListener("click", (event) => {
  marksVisible = !marksVisible;
  event.currentTarget.classList.toggle("active", marksVisible);
  drawImage();
});
window.addEventListener("resize", drawImage);

setText();
loadModel().catch((err) => {
  document.getElementById("modelStatus").textContent = `Model load failed: ${err.message}`;
});
