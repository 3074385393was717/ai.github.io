# BoneVision AI

骨折医学影像分析网站，支持中文、English、한국어三种语言。

## 功能

- 上传 X 光 / CT / 骨骼影像
- 本地浏览器端完成骨折类型分析
- 支持 10 种骨折类型：
  - Avulsion fracture
  - Comminuted fracture
  - Fracture Dislocation
  - Greenstick fracture
  - Hairline Fracture
  - Impacted fracture
  - Longitudinal fracture
  - Oblique fracture
  - Pathological fracture
  - Spiral Fracture
- 显示扫描区域
- 使用圆形或方框标注可疑骨折区域
- 显示置信度、严重程度、影像分析说明和建议

## 文件结构

```text
bonevision/
├── index.html
├── styles.css
├── app.js
├── model-data.json
├── .nojekyll
└── demo/
    └── oblique.jpg
```

## GitHub Pages 打开方法

1. 在 GitHub 新建仓库，例如 `bonevision-ai`。
2. 上传本文件夹中的所有文件。
3. 打开仓库的 `Settings`。
4. 进入 `Pages`。
5. Source 选择 `Deploy from a branch`。
6. Branch 选择 `main`，文件夹选择 `/root`。
7. 保存后等待 1-2 分钟。
8. GitHub 会生成一个访问链接，例如：

```text
https://你的用户名.github.io/bonevision-ai/
```

## 本地运行

```bash
python3 -m http.server 4173
```

然后打开：

```text
http://127.0.0.1:4173
```

## 注意

本项目用于课程展示、原型演示和辅助阅读，不替代放射科医师或骨科医师的正式诊断。
