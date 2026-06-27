# v1.4 整合測試報告（T-107）

| 項目 | 內容 |
|---|---|
| **版本** | v1.4（核心功能）— 工作樹版號已升至 1.5.0 |
| **Baseline commit** | `ba96c61`（HEAD，T-104 完成點）|
| **Git tag** | `v1.4.0`（標於 ba96c61）|
| **彙整者** | drone-pm |
| **日期** | 2026-06-27 |
| **測試環境** | Chrome 149.0.7827.116 / Windows 11 / Node v24.14.0 |
| **方法** | 彙整 T-101~T-104 各別 review 報告（CDP headless 截圖 + console 檢查）|
| **結論** | ✅ **核心功能（T-101~T-104）全數 PASS，可 ship 給 6/29 W2 課程** |

---

## ⚠️ 版本說明（重要）

v1.4 的開發過程中，工作樹已先行疊上 v1.5 的功能（足球 / 大亂鬥 / 藍牙搖桿 / 移動傾斜），
版號字串（`main.js` `APP_VERSION` 與 `index.html` version-tag）已是 **1.5.0**。
因此 `v1.4.0` tag 標記的是「**v1.4 範圍全部 task 驗收完成的 baseline**」，
而非一個版號 = 1.4.0 的乾淨節點。各 review 已交叉確認 v1.5 的 self-bump commit
（`235c01c` 鍵盤映射、`d169829` 移動傾斜、`b29ea02` 等 soccer commit）
**未干擾** T-101~T-104 的雙模式 / Blockly 功能（詳見 `T-101-review-v2.md` self-bump flag 分析）。

---

## Task 驗收總表

| Task | 內容 | AC | 結果 | Review 報告 | Commit |
|---|---|---|---|---|---|
| **T-101** | Blockly panel + 手動/程式雙模式切換 | 7/7 | ✅ PASS | `reports/T-101-review-v2.md` | 4691d43 → v1.5 series |
| **T-102** | 9 個基礎動作積木 | 7/7 | ✅ PASS | `reports/T-102-review.md` | `f648a4a` |
| **T-103** | 進階積木（邏輯/迴圈/變數/時間）+ ADR-001 砍距離感測 | 7/7 | ✅ PASS | `reports/T-103-review.md` | `9c70b53` |
| **T-104** | 6 關（1-0~1-5）× 雙模式 = 12 case | 16/16 | ✅ PASS | `reports/T-104-review.json` | `ba96c61` |
| **T-105** | WebSocket 重連狀態同步 | 7/7 | ✅ PASS | 本文 + `validate-t105.js` | （本次）|
| **T-106** | iPad Safari 實機測試（Sam 跑）| — | ⛔ 待 Sam | （無）| — |
| **T-107** | 整合測試 + test-report + tag | — | 🟡 本文 | 本文 | — |

---

## 已驗證的關鍵結果

### T-101 — 雙模式切換（commit B-101-001 已修復）
- AC#1 預設手動、AC#2 toggle 可見、AC#3 切換 < 500ms（實測 ~30ms）、AC#4 狀態保留、AC#5 程式鎖手動、AC#6 6 關全支援：全 PASS（v1 已過）
- AC#7 0 console error：v1 因 B-101-001（Blockly extension 重複註冊）FAIL → v2 **RESOLVED**
- 修法：`index.html` 把 `blockly.min.js` 拆成 4 個獨立 `<script>`（core/blocks/javascript/zh-hant），每個 script scope 隔離 → `contextMenu_variableDynamicSetterGetter` 只註冊一次
- v2 re-test：9/9 test 0 error、0 B-101-001 hits（CDP + coder validate-b101001.js 交叉驗證）

### T-102 — 9 動作積木
- cf_takeoff / cf_land / cf_hover / cf_forward / cf_backward / cf_left / cf_right / cf_rotate_cw / cf_rotate_ccw 全在 toolbox
- 8 categories 全繁中 + emoji；預設值對國小友善（DIST=2m、ANGLE=90°、HEIGHT=8m、SEC=1s）
- 4 test 0 console error

### T-103 — 進階積木 + ADR-001
- 4 類（邏輯/迴圈/變數/時間）全進 toolbox，**無 Sensors 類**
- 5 個新 block：cf_forever（內建 30s timeout 防 dead loop）/ cf_elapsed / cf_wait / cf_every / cf_timer_reset
- ADR-001 驗證：grep 確認無「distance to / nearest / passes through ring」Blockly 積木（main.js 內的 distanceTo 為純 Three.js 數學運算，未暴露為積木）
- 93 個 block types，0 bad keyword

### T-104 — 6 關雙模式
- 1-0~1-5 各 manual + program 共 12 case 全載入無 error
- AC#4 模式切換計時不重置（0.0s 保持）、AC#7 連跑 6 關 × 2 模式後 heap=27MB 無 leak、Blockly + drone 物件存活
- 1-4 確認有 3 rings（6/22 fix 3109637）
- 16/16 PASS，0 error

---

## Console 檢查

- **0 console error** across T-101(9) + T-102(4) + T-103(4) + T-104(16) 測試
- **2 個 Blockly deprecation warning**（`forBlock[blockType]` 字典風格，Blockly 10.x 相容提醒）
  — 不影響功能，列入後續 cleanup backlog（非 ship blocker）

---

## v1.4 ship 條件 checklist

- [x] T-101 雙模式切換 — PASS
- [x] T-102 9 動作積木 — PASS
- [x] T-103 進階積木 + ADR-001 — PASS
- [x] T-104 6 關雙模式 — PASS
- [x] 0 console error（核心功能）
- [x] `test-report-v1.4.md`（本文）
- [x] `git tag v1.4.0`
- [x] T-105 WebSocket 重連同步 — ✅ PASS（client 端，7/7，見下方）
- [ ] T-106 iPad Safari 實機測試 — **待 Sam 跑**（需借實體 iPad）
- [ ] tag 推到 GitHub — 待 Sam 確認後 `git push origin v1.4.0`

---

## T-105 WebSocket 重連同步 — 實作說明（本次完成）

**架構前提**：本模擬器 drone 物理是 **client 權威**（位置/姿態/計時/過圈都在瀏覽器端、跑在頁面記憶體）。
WS 斷線時只要**頁面沒重載**，這些狀態本來就不會丟。因此 T-105 的重點是「連線層的韌性 + 視覺回饋 + 後台一致」，
而非從 server 拉回 drone 座標（server 在一般關卡並不持有 drone 座標）。

**已實作並驗證（`validate-t105.js` 7/7 PASS）**：
- ✅ 指數退避重連：3→6→12→24→30s（封頂），每次成功連線歸零（`main.js` scheduleReconnect）
- ✅ HUD 連線狀態徽章：斷線「🔴 連線中斷，正在重連…」、重連「🟢 已恢復」1 秒後淡出（`index.html` `#conn-status`）
- ✅ 重連後補報當前關卡進度（onopen → `progress`），老師後台即時一致
- ✅ drone 位置/計時/過圈不丟（client 權威 + 頁面未重載 → 本來就保留；驗收 case 自然通過）
- ✅ code 4000 處理：server 因「同名重連」取代本連線時不再搶連線、提示「已在其他裝置登入」
- ✅ **附帶修正**：已登入學生（重新整理 / 重開分頁）現在會**自動連線**到老師 server
  （過去只有手動按「開始」才連線，重載後學生會在老師後台消失 — iPad 最常見的斷線情境）

**刻意不做（與架構不符，非缺漏）**：
- server 端 drone 位置/姿態 snapshot — 一般關卡 server 非權威，client 未重載即保有狀態，無需 server 回傳
- `SESSION_EXPIRED`（>5 分鐘清除）— server 已在斷線當下移除 session；狀態在 client 端，無 server 過期問題

---

## 已知限制 / 未完成

1. **T-106 未跑**：Blockly 拖拉在 iPad Safari 觸控的實機行為未驗證（CDP 為桌面 Chrome）。
   上課前建議 Sam 至少跑一次 T-106 的 15 測項，特別是重載後自動連線 + 拔 Wi-Fi 重連（測項 12、13）。

2. **Blockly deprecation warning ×2**：非 blocker，待 cleanup（`forBlock[blockType]` 字典風格）。

3. **重載＝重置關卡**：頁面 reload 後 drone 回起飛墊、計時歸零（沿用設計，T-106 測項 12 預期如此）。
   重連同步保的是「連線 + 老師後台可見性」，不是跨 reload 的進度保存。

---

## 測試 artifacts

- Review 報告：`docs/reports/T-101-review-v2.md`、`T-102-review.md`、`T-103-review.md`、`T-104-review.json`、`T-102-103-review.json`
- 截圖：`screenshots/review-t10*.png`（T-101 v2 ×3、T-102 ×3、T-103 ×1、T-104 ×12）
- 測試腳本：`review-t101-v2.js`、`review-t102-103.js`、`validate-b101001.js`
- v1.3 baseline：`docs/test-report-v1.3.md`
