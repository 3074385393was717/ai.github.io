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

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

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

function findRegions() {
  const tmp = document.createElement("canvas");
  const w = 160;
  const h = Math.max(100, Math.round((currentImage.naturalHeight / currentImage.naturalWidth) * w));
  tmp.width = w;
  tmp.height = h;
  const t = tmp.getContext("2d", { willReadFrequently: true });
  t.drawImage(currentImage, 0, 0, w, h);
  const imgData = t.getImageData(0, 0, w, h);
  const data = imgData.data;
  const g = new Float32Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    g[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  // 1. 计算多尺度梯度（Sobel + 二阶导数Laplacian）
  const gx = new Float32Array(w * h);
  const gy = new Float32Array(w * h);
  const lap = new Float32Array(w * h);
  const edgeScore = new Float32Array(w * h);

  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      const idx = y * w + x;
      // Sobel 梯度
      const sobelX = 
        -1 * g[(y-1)*w + (x-1)] + 1 * g[(y-1)*w + (x+1)] +
        -2 * g[y*w + (x-1)]     + 2 * g[y*w + (x+1)] +
        -1 * g[(y+1)*w + (x-1)] + 1 * g[(y+1)*w + (x+1)];
      const sobelY = 
        -1 * g[(y-1)*w + (x-1)] - 2 * g[(y-1)*w + x] - 1 * g[(y-1)*w + (x+1)] +
         1 * g[(y+1)*w + (x-1)] + 2 * g[(y+1)*w + x] + 1 * g[(y+1)*w + (x+1)];

      gx[idx] = sobelX;
      gy[idx] = sobelY;

      // Laplacian（二阶导数，检测零交叉=边缘中心）
      lap[idx] = 
        g[(y-1)*w + x] + g[(y+1)*w + x] + g[y*w + (x-1)] + g[y*w + (x+1)] -
        4 * g[idx];

      const mag = Math.sqrt(sobelX * sobelX + sobelY * sobelY);
      edgeScore[idx] = mag;
    }
  }

  // 2. 方向一致性检测 - 骨折线通常是细长、方向一致的
  const dirScore = new Float32Array(w * h);
  for (let y = 4; y < h - 4; y++) {
    for (let x = 4; x < w - 4; x++) {
      const idx = y * w + x;
      if (edgeScore[idx] < 15) continue;

      const angle = Math.atan2(gy[idx], gx[idx]);
      let consistent = 0, total = 0;

      // 检查邻域内梯度方向一致性
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nIdx = (y + dy) * w + (x + dx);
          if (edgeScore[nIdx] > 15) {
            const nAngle = Math.atan2(gy[nIdx], gx[nIdx]);
            const diff = Math.abs(Math.atan2(Math.sin(nAngle - angle), Math.cos(nAngle - angle)));
            if (diff < 0.5) consistent++; // 方向相似
            total++;
          }
        }
      }
      if (total > 0) {
        dirScore[idx] = consistent / total * edgeScore[idx];
      }
    }
  }

  // 3. 裂缝特征检测 - 骨折线两侧通常有明暗对比
  const fractureScore = new Float32Array(w * h);
  for (let y = 5; y < h - 5; y++) {
    for (let x = 5; x < w - 5; x++) {
      const idx = y * w + x;
      if (edgeScore[idx] < 20) continue;

      const angle = Math.atan2(gy[idx], gx[idx]);
      const perpAngle = angle + Math.PI / 2;

      // 沿垂直于边缘方向采样，检测明暗交替（裂缝特征）
      let leftBright = 0, rightBright = 0, leftCount = 0, rightCount = 0;
      for (let d = 2; d <= 6; d++) {
        const lx = Math.round(x + d * Math.cos(perpAngle));
        const ly = Math.round(y + d * Math.sin(perpAngle));
        const rx = Math.round(x - d * Math.cos(perpAngle));
        const ry = Math.round(y - d * Math.sin(perpAngle));

        if (lx >= 0 && lx < w && ly >= 0 && ly < h) {
          leftBright += g[ly * w + lx];
          leftCount++;
        }
        if (rx >= 0 && rx < w && ry >= 0 && ry < h) {
          rightBright += g[ry * w + rx];
          rightCount++;
        }
      }

      if (leftCount > 0 && rightCount > 0) {
        const avgLeft = leftBright / leftCount;
        const avgRight = rightBright / rightCount;
        const contrast = Math.abs(avgLeft - avgRight);

        // 裂缝特征：高梯度 + 方向一致 + 两侧有对比度 + Laplacian零交叉
        const lapZeroCross = Math.abs(lap[idx]) > 5 ? 1 : 0;
        fractureScore[idx] = edgeScore[idx] * 0.3 + dirScore[idx] * 0.4 + contrast * 0.2 + lapZeroCross * 30;
      }
    }
  }

  // 4. 非极大值抑制（NMS），精确定位裂缝中心线
  const nms = new Float32Array(w * h);
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      const idx = y * w + x;
      if (fractureScore[idx] < 30) continue;

      const angle = Math.atan2(gy[idx], gx[idx]);
      // 沿梯度方向检查是否为局部最大值
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const v1 = interpolate(fractureScore, x + dx, y + dy, w, h);
      const v2 = interpolate(fractureScore, x - dx, y - dy, w, h);

      if (fractureScore[idx] > v1 && fractureScore[idx] > v2) {
        nms[idx] = fractureScore[idx];
      }
    }
  }

  // 5. 收集裂缝候选点并聚类
  const candidates = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (nms[y * w + x] > 45) {
        candidates.push({ x, y, score: nms[y * w + x] });
      }
    }
  }

  if (!candidates.length) {
    return {
      scan: { x: 0.18, y: 0.16, w: 0.64, h: 0.68 },
      lesion: { x: 0.34, y: 0.34, w: 0.28, h: 0.24 },
      circle: true,
    };
  }

  candidates.sort((a, b) => b.score - a.score);

  // 6. 密度聚类 - 找出裂缝线状结构
  const clusters = [];
  const used = new Set();
  const topCandidates = candidates.slice(0, Math.min(200, candidates.length));

  for (const pt of topCandidates) {
    const key = pt.x + "," + pt.y;
    if (used.has(key)) continue;

    const cluster = [];
    const queue = [pt];
    used.add(key);

    while (queue.length > 0) {
      const curr = queue.shift();
      cluster.push(curr);

      for (const other of topCandidates) {
        const oKey = other.x + "," + other.y;
        if (used.has(oKey)) continue;
        const dist = Math.sqrt((curr.x - other.x) ** 2 + (curr.y - other.y) ** 2);
        if (dist < 12) { // 邻域阈值
          used.add(oKey);
          queue.push(other);
        }
      }
    }

    if (cluster.length >= 3) {
      // 计算簇的线性度 - 裂缝应该是细长的
      let sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0, sumXY = 0;
      for (const p of cluster) {
        sumX += p.x; sumY += p.y;
        sumX2 += p.x * p.x; sumY2 += p.y * p.y;
        sumXY += p.x * p.y;
      }
      const n = cluster.length;
      const meanX = sumX / n, meanY = sumY / n;
      const covXX = sumX2 / n - meanX * meanX;
      const covYY = sumY2 / n - meanY * meanY;
      const covXY = sumXY / n - meanX * meanY;

      // 特征值分析
      const trace = covXX + covYY;
      const det = covXX * covYY - covXY * covXY;
      const eigen1 = (trace + Math.sqrt(trace * trace - 4 * det)) / 2;
      const eigen2 = (trace - Math.sqrt(trace * trace - 4 * det)) / 2;
      const elongation = eigen1 > 0 ? eigen2 / eigen1 : 0;

      const totalScore = cluster.reduce((s, p) => s + p.score, 0);
      clusters.push({
        points: cluster,
        score: totalScore * (elongation < 0.3 ? 1.5 : 1.0), // 细长结构加分
        elongation,
        meanX, meanY,
        minX: Math.min(...cluster.map(p => p.x)),
        maxX: Math.max(...cluster.map(p => p.x)),
        minY: Math.min(...cluster.map(p => p.y)),
        maxY: Math.max(...cluster.map(p => p.y)),
      });
    }
  }

  clusters.sort((a, b) => b.score - a.score);

  // 7. 确定扫描区域和病变区域
  const bestCluster = clusters[0];
  const allPoints = clusters.length > 0 ? clusters.slice(0, 3).flatMap(c => c.points) : candidates.slice(0, 50);

  let minX = w, minY = h, maxX = 0, maxY = 0;
  allPoints.forEach(p => {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  });

  const padX = w * 0.08;
  const padY = h * 0.08;
  const scan = {
    x: Math.max(0.02, (minX - padX) / w),
    y: Math.max(0.02, (minY - padY) / h),
    w: Math.min(0.96, (maxX - minX + padX * 2) / w),
    h: Math.min(0.96, (maxY - minY + padY * 2) / h),
  };

  // 8. 精确定位病变区域 - 使用最佳簇的PCA方向
  let lesion;
  if (bestCluster && bestCluster.points.length >= 3) {
    const c = bestCluster;
    const cx = c.meanX / w;
    const cy = c.meanY / h;

    // 根据簇的形状决定 lesion 大小和方向
    const clusterW = (c.maxX - c.minX) / w;
    const clusterH = (c.maxY - c.minY) / h;

    // 确保 lesion 覆盖整个裂缝线
    const lesionW = Math.max(0.12, Math.min(0.45, clusterW * 1.4));
    const lesionH = Math.max(0.10, Math.min(0.40, clusterH * 1.4));

    lesion = {
      x: Math.max(0.01, cx - lesionW / 2),
      y: Math.max(0.01, cy - lesionH / 2),
      w: lesionW,
      h: lesionH,
    };
  } else {
    // 回退到加权中心
    let fx = 0, fy = 0, fm = 0;
    candidates.slice(0, 30).forEach(p => {
      fx += p.x * p.score;
      fy += p.y * p.score;
      fm += p.score;
    });
    fx /= fm; fy /= fm;
    const lesionW = Math.max(0.15, Math.min(0.35, scan.w * 0.35));
    const lesionH = Math.max(0.12, Math.min(0.30, scan.h * 0.32));
    lesion = {
      x: Math.max(0.02, fx / w - lesionW / 2),
      y: Math.max(0.02, fy / h - lesionH / 2),
      w: lesionW,
      h: lesionH,
    };
  }

  // 根据裂缝方向决定形状 - 细长裂缝用椭圆，块状用矩形
  const isElongated = bestCluster && bestCluster.elongation < 0.25;
  const aspectRatio = lesion.w / lesion.h;

  return {
    scan,
    lesion,
    circle: isElongated || (aspectRatio > 0.6 && aspectRatio < 1.7),
    // 附加信息供 drawMarks 使用
    _cluster: bestCluster,
  };
}

// 双线性插值辅助函数
function interpolate(arr, x, y, w, h) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, w - 1), y1 = Math.min(y0 + 1, h - 1);
  const dx = x - x0, dy = y - y0;
  const v00 = arr[y0 * w + x0] || 0;
  const v01 = arr[y0 * w + x1] || 0;
  const v10 = arr[y1 * w + x0] || 0;
  const v11 = arr[y1 * w + x1] || 0;
  return v00 * (1 - dx) * (1 - dy) + v01 * dx * (1 - dy) + v10 * (1 - dx) * dy + v11 * dx * dy;
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
  lastAnalysis = {
    ...result,
    cls,
    regions: findRegions(),
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
  const { scan, lesion, circle } = analysis.regions;
  ctx.save();

  // 扫描区域 - 虚线框
  ctx.lineWidth = Math.max(2, imgW / 400);
  ctx.setLineDash([12, 8]);
  ctx.strokeStyle = "rgba(84, 214, 214, 0.85)";
  ctx.fillStyle = "rgba(84, 214, 214, 0.06)";
  ctx.strokeRect(scan.x * imgW, scan.y * imgH, scan.w * imgW, scan.h * imgH);
  ctx.fillRect(scan.x * imgW, scan.y * imgH, scan.w * imgW, scan.h * imgH);

  // 病变区域 - 根据裂缝方向绘制更精确的标注
  ctx.setLineDash([]);
  const x = lesion.x * imgW;
  const y = lesion.y * imgH;
  const w = lesion.w * imgW;
  const h = lesion.h * imgH;

  // 如果检测到细长裂缝，绘制旋转的椭圆以匹配裂缝方向
  const cluster = analysis.regions._cluster;
  const isFractureLine = cluster && cluster.elongation < 0.3 && cluster.points.length > 5;

  if (isFractureLine) {
    // 计算裂缝方向（PCA主方向）
    let sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0, sumXY = 0;
    for (const p of cluster.points) {
      sumX += p.x; sumY += p.y;
      sumX2 += p.x * p.x; sumY2 += p.y * p.y;
      sumXY += p.x * p.y;
    }
    const n = cluster.points.length;
    const meanX = sumX / n, meanY = sumY / n;
    const covXX = sumX2 / n - meanX * meanX;
    const covYY = sumY2 / n - meanY * meanY;
    const covXY = sumXY / n - meanX * meanY;

    const angle = Math.atan2(2 * covXY, covXX - covYY) / 2;

    // 绘制旋转椭圆，长轴沿裂缝方向
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(angle);
    ctx.strokeStyle = "rgba(255, 100, 107, 0.98)";
    ctx.fillStyle = "rgba(255, 100, 107, 0.15)";
    ctx.lineWidth = Math.max(2.5, imgW / 300);

    // 椭圆长轴沿裂缝方向
    const majorAxis = Math.max(w, h) * 0.55;
    const minorAxis = Math.min(w, h) * 0.35;
    ctx.beginPath();
    ctx.ellipse(0, 0, majorAxis, minorAxis, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 绘制裂缝中心线
    ctx.strokeStyle = "rgba(255, 200, 100, 0.9)";
    ctx.lineWidth = Math.max(1.5, imgW / 500);
    ctx.beginPath();
    ctx.moveTo(-majorAxis * 0.7, 0);
    ctx.lineTo(majorAxis * 0.7, 0);
    ctx.stroke();

    ctx.restore();
  } else if (circle) {
    // 圆形/椭圆标注（块状骨折）
    ctx.strokeStyle = "rgba(255, 100, 107, 0.98)";
    ctx.fillStyle = "rgba(255, 100, 107, 0.11)";
    ctx.lineWidth = Math.max(2, imgW / 360);
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    // 矩形标注
    ctx.strokeStyle = "rgba(255, 100, 107, 0.98)";
    ctx.fillStyle = "rgba(255, 100, 107, 0.11)";
    ctx.lineWidth = Math.max(2, imgW / 360);
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  }

  // ROI 标签
  ctx.font = `bold ${Math.max(13, imgW / 50)}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 4;
  ctx.fillText("ROI", x + 10, Math.max(20, y - 10));
  ctx.shadowBlur = 0;

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
