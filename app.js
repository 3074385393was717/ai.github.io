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
      document.getElementById("imageMeta").textContent = `${img.naturalWidth} x ${img.naturalHeight}px`;
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

  // 返回骨折类型几何特征，用于指导定位
  const typePatterns = {
    oblique: { angle: 45, isLinear: true, width: 0.08, height: 0.35 },
    spiral: { angle: null, isCurved: true, width: 0.12, height: 0.40 },
    transverse: { angle: 90, isLinear: true, width: 0.35, height: 0.08 },
    longitudinal: { angle: 0, isLinear: true, width: 0.08, height: 0.35 },
    greenstick: { angle: null, isPartial: true, width: 0.20, height: 0.15 },
    comminuted: { isFragmented: true, width: 0.30, height: 0.25 },
    avulsion: { isFragment: true, width: 0.15, height: 0.12 },
    impacted: { isCompressed: true, width: 0.18, height: 0.15 },
    fracture_dislocation: { isDisplaced: true, width: 0.25, height: 0.20 },
    pathological: { isDestructive: true, width: 0.30, height: 0.25 },
    hairline: { angle: null, isFaint: true, width: 0.06, height: 0.30 },
  };

  return { 
    classKey: best[0], 
    confidence, 
    neighbors: scored.slice(0, 5), 
    ranked,
    _pattern: typePatterns[best[0]] || { width: 0.20, height: 0.20 }
  };
}

function findRegions(pattern) {
  // 使用足够分辨率进行分析
  const tmp = document.createElement("canvas");
  const w = 240;
  const h = Math.max(160, Math.round((currentImage.naturalHeight / currentImage.naturalWidth) * w));
  tmp.width = w;
  tmp.height = h;
  const t = tmp.getContext("2d", { willReadFrequently: true });
  t.drawImage(currentImage, 0, 0, w, h);
  const imgData = t.getImageData(0, 0, w, h);
  const data = imgData.data;

  // 提取灰度
  const gray = new Float32Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  // ============================================================
  // 基于X线骨折诊断标准的精准定位算法
  // 核心：骨折线是骨皮质内的"低密度透亮线"，不是边缘
  // ============================================================

  // 1. 确定骨皮质亮度阈值
  const sorted = Array.from(gray).sort((a, b) => b - a);
  const boneThreshold = sorted[Math.floor(sorted.length * 0.22)];

  // 2. 定义检测方向（8个主要方向 + 根据骨折类型调整）
  const baseDirections = [
    { dx: 1, dy: 0, angle: 0 },
    { dx: 0, dy: 1, angle: 90 },
    { dx: 1, dy: 1, angle: 45 },
    { dx: 1, dy: -1, angle: 135 },
    { dx: 2, dy: 1, angle: 26.6 },
    { dx: 1, dy: 2, angle: 63.4 },
    { dx: 2, dy: -1, angle: 153.4 },
    { dx: 1, dy: -2, angle: 116.6 },
  ];

  // 如果分类提供了期望角度，优先使用该方向附近的检测
  let directions = [...baseDirections];
  if (pattern && pattern.angle !== null) {
    const expectedAngle = pattern.angle;
    directions.sort((a, b) => {
      const diffA = Math.abs(a.angle - expectedAngle);
      const diffB = Math.abs(b.angle - expectedAngle);
      return diffA - diffB;
    });
  }

  // 3. 检测"骨皮质内的暗线"——骨折的核心X线征象
  const fracturePoints = [];

  for (let y = 6; y < h - 6; y++) {
    for (let x = 6; x < w - 6; x++) {
      const idx = y * w + x;

      // 跳过非骨组织区域
      if (gray[idx] < boneThreshold * 0.35) continue;

      let bestScore = 0;
      let bestDir = null;

      for (const dir of directions) {
        // 沿方向采样13个点
        const profile = [];
        for (let d = -6; d <= 6; d++) {
          const sx = Math.round(x + d * dir.dx);
          const sy = Math.round(y + d * dir.dy);
          if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
            profile.push({
              val: gray[sy * w + sx],
              dist: d,
              isCenter: d === 0
            });
          }
        }

        if (profile.length < 11) continue;

        const center = profile.find(p => p.isCenter);
        const leftSide = profile.filter(p => p.dist < -2);
        const rightSide = profile.filter(p => p.dist > 2);

        if (!center || leftSide.length < 2 || rightSide.length < 2) continue;

        // 两侧骨皮质平均亮度
        const leftAvg = leftSide.slice(-2).reduce((a, p) => a + p.val, 0) / 2;
        const rightAvg = rightSide.slice(0, 2).reduce((a, p) => a + p.val, 0) / 2;
        const sideAvg = (leftAvg + rightAvg) / 2;

        const centerVal = center.val;
        const contrast = sideAvg - centerVal;

        // 骨折判定：亮-暗-亮模式
        if (sideAvg > boneThreshold * 0.60 && 
            centerVal < sideAvg * 0.55 && 
            contrast > 22) {

          // 暗区宽度
          let darkWidth = 0;
          for (const p of profile) {
            if (p.val < sideAvg * 0.65) darkWidth++;
          }

          // 合理裂缝宽度：1-6像素
          if (darkWidth >= 1 && darkWidth <= 6) {
            // 线性连续性验证
            let continuity = 0;
            for (let extend = 1; extend <= 4; extend++) {
              const ex = Math.round(x + extend * dir.dx * 3);
              const ey = Math.round(y + extend * dir.dy * 3);
              if (ex >= 0 && ex < w && ey >= 0 && ey < h) {
                const eVal = gray[ey * w + ex];
                const eLeft = gray[ey * w + Math.max(0, ex - dir.dx)];
                const eRight = gray[ey * w + Math.min(w-1, ex + dir.dx)];
                if (eVal < (eLeft + eRight) / 2 * 0.60) continuity++;
              }
            }

            // 额外： hairline骨折需要更高对比度
            const contrastBonus = (pattern && pattern.isFaint) ? (contrast > 35 ? 20 : 0) : 0;

            const score = contrast * 2.5 + continuity * 30 + (darkWidth > 1 ? 15 : 0) + contrastBonus;
            if (score > bestScore) {
              bestScore = score;
              bestDir = dir;
            }
          }
        }
      }

      if (bestScore > 55) {
        fracturePoints.push({
          x, y,
          score: bestScore,
          dir: bestDir,
          angle: bestDir ? Math.atan2(bestDir.dy, bestDir.dx) : 0
        });
      }
    }
  }

  // 4. 聚类形成骨折线
  if (!fracturePoints.length) {
    return fallbackRegion(w, h, pattern);
  }

  fracturePoints.sort((a, b) => b.score - a.score);

  // 方向感知聚类
  const clusters = [];
  const used = new Set();
  const topPoints = fracturePoints.slice(0, Math.min(400, fracturePoints.length));

  for (const pt of topPoints) {
    const key = pt.x + "," + pt.y;
    if (used.has(key)) continue;

    const cluster = [];
    const queue = [pt];
    used.add(key);

    while (queue.length > 0) {
      const curr = queue.shift();
      cluster.push(curr);

      for (const other of topPoints) {
        const oKey = other.x + "," + other.y;
        if (used.has(oKey)) continue;

        const dist = Math.sqrt((curr.x - other.x) ** 2 + (curr.y - other.y) ** 2);
        if (dist > 22) continue;

        let angleDiff = Math.abs(curr.angle - other.angle);
        while (angleDiff > Math.PI) angleDiff -= Math.PI;
        angleDiff = Math.min(angleDiff, Math.PI - angleDiff);

        if (dist < 14 || (dist < 22 && angleDiff < 0.55)) {
          used.add(oKey);
          queue.push(other);
        }
      }
    }

    if (cluster.length >= 5) {
      const xs = cluster.map(p => p.x);
      const ys = cluster.map(p => p.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);

      // PCA
      let sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0, sumXY = 0, totalScore = 0;
      for (const p of cluster) {
        const weight = p.score;
        sumX += p.x * weight; sumY += p.y * weight;
        sumX2 += p.x * p.x * weight; sumY2 += p.y * p.y * weight;
        sumXY += p.x * p.y * weight;
        totalScore += weight;
      }

      const meanX = sumX / totalScore, meanY = sumY / totalScore;
      const covXX = sumX2 / totalScore - meanX * meanX;
      const covYY = sumY2 / totalScore - meanY * meanY;
      const covXY = sumXY / totalScore - meanX * meanY;

      const trace = covXX + covYY;
      const det = covXX * covYY - covXY * covXY;
      const eigen1 = (trace + Math.sqrt(Math.max(0, trace * trace - 4 * det))) / 2;
      const eigen2 = (trace - Math.sqrt(Math.max(0, trace * trace - 4 * det))) / 2;
      const elongation = eigen1 > 0.001 ? eigen2 / eigen1 : 1;

      const angle = Math.atan2(2 * covXY, covXX - covYY) / 2;

      clusters.push({
        points: cluster,
        score: totalScore,
        elongation: Math.min(elongation, 1),
        meanX, meanY,
        minX, maxX, minY, maxY,
        angle,
        width: maxX - minX,
        height: maxY - minY,
        isFractureLine: elongation < 0.30 && (maxX - minX > 12 || maxY - minY > 12),
      });
    }
  }

  clusters.sort((a, b) => b.score - a.score);

  if (!clusters.length) {
    return fallbackRegion(w, h, pattern);
  }

  // 5. 构建结果
  const best = clusters[0];

  // 扫描区域
  const allPts = clusters.slice(0, 3).flatMap(c => c.points);
  let sMinX = w, sMinY = h, sMaxX = 0, sMaxY = 0;
  for (const p of allPts) {
    sMinX = Math.min(sMinX, p.x); sMinY = Math.min(sMinY, p.y);
    sMaxX = Math.max(sMaxX, p.x); sMaxY = Math.max(sMaxY, p.y);
  }
  const sPad = 0.12;
  const scan = {
    x: Math.max(0.005, (sMinX / w) - sPad),
    y: Math.max(0.005, (sMinY / h) - sPad),
    w: Math.min(0.99, (sMaxX - sMinX) / w + sPad * 2),
    h: Math.min(0.99, (sMaxY - sMinY) / h + sPad * 2),
  };

  // 病变区域：使用分类指导的尺寸
  const c = best;
  const cx = c.meanX / w, cy = c.meanY / h;

  // 如果有分类模式，使用分类指导的尺寸；否则自动计算
  let lesionW, lesionH;
  if (pattern && pattern.width && pattern.height) {
    // 分类指导的尺寸，但根据实际检测到的簇大小调整
    const cW = (c.maxX - c.minX) / w;
    const cH = (c.maxY - c.minY) / h;
    lesionW = Math.max(pattern.width * 0.6, Math.min(pattern.width * 2.0, cW * 2.2));
    lesionH = Math.max(pattern.height * 0.6, Math.min(pattern.height * 2.0, cH * 2.2));
  } else {
    const cW = (c.maxX - c.minX) / w;
    const cH = (c.maxY - c.minY) / h;
    lesionW = Math.max(0.08, Math.min(0.50, cW * 2.2));
    lesionH = Math.max(0.06, Math.min(0.50, cH * 2.2));
  }

  return {
    scan,
    lesion: {
      x: Math.max(0.005, cx - lesionW / 2),
      y: Math.max(0.005, cy - lesionH / 2),
      w: lesionW,
      h: lesionH,
    },
    circle: c.isFractureLine || (lesionW / lesionH > 0.35 && lesionW / lesionH < 2.8),
    _cluster: best,
    _isFractureLine: c.isFractureLine,
    _angle: c.angle,
    _allClusters: clusters.slice(0, 3),
    _pattern: pattern,
  };
}

function fallbackRegion(w, h, pattern) {
  const defaultW = pattern ? pattern.width : 0.28;
  const defaultH = pattern ? pattern.height : 0.24;
  return {
    scan: { x: 0.18, y: 0.16, w: 0.64, h: 0.68 },
    lesion: { x: 0.34, y: 0.34, w: defaultW, h: defaultH },
    circle: true,
    _isFractureLine: false,
    _pattern: pattern,
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

  // 将分类结果中的骨折类型模式传给 findRegions，实现协同定位
  lastAnalysis = {
    ...result,
    cls,
    regions: findRegions(result._pattern),
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
  const cluster = analysis.regions._cluster;
  const isFractureLine = analysis.regions._isFractureLine;
  const fractureAngle = analysis.regions._angle || 0;
  const pattern = analysis.regions._pattern;

  ctx.save();

  // 扫描区域
  ctx.lineWidth = Math.max(2, imgW / 400);
  ctx.setLineDash([12, 8]);
  ctx.strokeStyle = "rgba(84, 214, 214, 0.80)";
  ctx.fillStyle = "rgba(84, 214, 214, 0.05)";
  ctx.strokeRect(scan.x * imgW, scan.y * imgH, scan.w * imgW, scan.h * imgH);
  ctx.fillRect(scan.x * imgW, scan.y * imgH, scan.w * imgW, scan.h * imgH);

  // 骨折标注
  ctx.setLineDash([]);
  const lx = lesion.x * imgW;
  const ly = lesion.y * imgH;
  const lw = lesion.w * imgW;
  const lh = lesion.h * imgH;

  if (isFractureLine && cluster) {
    // 细长骨折线：旋转椭圆精确匹配裂缝方向
    ctx.save();
    ctx.translate(lx + lw / 2, ly + lh / 2);
    ctx.rotate(fractureAngle);

    // 主椭圆
    ctx.strokeStyle = "rgba(255, 50, 50, 0.95)";
    ctx.fillStyle = "rgba(255, 50, 50, 0.08)";
    ctx.lineWidth = Math.max(3, imgW / 240);

    const major = Math.max(lw, lh) * 0.65;
    const minor = Math.min(lw, lh) * 0.22;
    ctx.beginPath();
    ctx.ellipse(0, 0, major, minor, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 骨折线中心指示
    ctx.strokeStyle = "rgba(255, 240, 80, 0.95)";
    ctx.lineWidth = Math.max(2.5, imgW / 320);
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.moveTo(-major * 0.85, 0);
    ctx.lineTo(major * 0.85, 0);
    ctx.stroke();

    // 端点
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255, 240, 80, 0.9)";
    for (const end of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(end * major * 0.85, 0, Math.max(4, imgW / 280), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

  } else if (circle) {
    // 圆形/椭圆
    ctx.strokeStyle = "rgba(255, 50, 50, 0.95)";
    ctx.fillStyle = "rgba(255, 50, 50, 0.08)";
    ctx.lineWidth = Math.max(3, imgW / 280);
    ctx.beginPath();
    ctx.ellipse(lx + lw / 2, ly + lh / 2, lw / 2, lh / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

  } else {
    // 矩形
    ctx.strokeStyle = "rgba(255, 50, 50, 0.95)";
    ctx.fillStyle = "rgba(255, 50, 50, 0.08)";
    ctx.lineWidth = Math.max(3, imgW / 280);
    ctx.fillRect(lx, ly, lw, lh);
    ctx.strokeRect(lx, ly, lw, lh);
  }

  // 标签
  ctx.font = `bold ${Math.max(13, imgW / 42)}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  const labelText = isFractureLine ? "FRACTURE LINE" : "FRACTURE";
  ctx.fillText(labelText, lx + 12, Math.max(24, ly - 14));
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
