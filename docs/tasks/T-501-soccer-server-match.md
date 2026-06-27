# T-501 伺服器：足球賽局狀態機 + 自動分隊 + 前鋒指派 + 開賽/結束

| 項目 | 內容 |
|---|---|
| **Task ID** | T-501 |
| **版本** | v1.5（足球多人）|
| **優先** | P0（足球 MVP 第一個 task）|
| **估時** | 1 天 |
| **負責** | drone-coder |
| **測試** | drone-reviewer |
| **狀態** | ✅ 完成（`server.js`，`validate-t501.js` 11/11 PASS）|
| **設計依據** | `docs/drone-soccer-design.md` §2.3、§3、§4 |

---

## 目標

在 `server.js` 加一套**伺服器權威**的足球賽局狀態機，仿照現有「大亂鬥 Arena」，負責：分隊、指派前鋒、開賽 3-2-1 倒數、1 局 3 分鐘計時、結束判勝、廣播比分。**這是足球 MVP 的後端骨幹。**

## 背景

- Arena 已有完整伺服器權威多人架構可參考：`server.js` 的 `ARENA` 狀態物件、`arenaStart()` / `arenaTick()` / `arenaEnd()` / `broadcastArena()` / `arenaSnapshot()` / `arenaPlayers()`。
- 學生 WS 訊息路由在 `wss.on('connection')`：學生送 `arena_join` / `arena_pos` / `arena_pop`，老師送 `arena_start`。足球比照新增 `soccer_*`。
- 足球與 Arena 互斥：一個學生同時只會在其一（沿用 `s.arena` 旗標的模式，新增 `s.soccer`）。

## 描述

### 1. 賽局狀態物件 `SOCCER`（伺服器端，仿 `ARENA`）
- `status`：`idle | countdown | running | done`
- `mode`：固定 `'1x3min'`（1 局 3 分鐘；3 局制留階段 2）
- `endTime`：running 時 = 開賽 + 180s
- `scores`：`{ blue: 0, red: 0 }`
- `armed`：`{ blue: true, red: true }`（半場重置用，T-504 會讀；本 task 先初始化 true）
- 場地常數：中線 `z=0`、兩端門 z 座標、門半徑（與 client 對齊，數值放共用常數或註解標明）

### 2. 分隊（自動平均）+ 前鋒（老師指定）
- 學生送 `soccer_join` → 加入賽局（`s.soccer = true`）。
- 伺服器**自動平均分隊**：藍/紅人數差不超過 1（新加入者補人少的隊）。
- **前鋒（攻擊手）由老師指定（已拍板）**：老師後台送 `soccer_set_striker { studentId }` → 把該生設為其隊前鋒（`s.striker = true`），並把同隊原前鋒取消（**每隊恰 1 名**，伺服器強制）。
  - **Fallback**：開賽時若某隊老師沒指定前鋒，伺服器自動指定該隊第一人為前鋒（避免無前鋒無法得分）。
- 隊伍欄位：`s.team`（`'blue' | 'red'`）、`s.striker`（bool）。
- `soccer_leave` / 斷線 → 退出賽局；若前鋒離開，自動把該隊剩餘第一人補為前鋒（仍恰 1 名），廣播更新。

### 3. 出生點（兩半場排開）
- 藍隊在一端半場、紅隊在另一端半場，沿窄邊排開（仿 `arenaSpreadSpawns()` 但改成兩排）。
- 前鋒站中間、兩防守在兩側（座標回傳給 client 當起飛點）。

### 4. 開賽流程（老師觸發，仿 Arena）
- 老師後台送 `soccer_start` → `soccerStart()`：
  - `status='countdown'`，重置 `scores`、`armed`，重新分隊/指派前鋒/算出生點。
  - 廣播 `soccer_state`（完整快照）。
  - 3-2-1 倒數（廣播 `soccer_countdown`），倒數完 `status='running'`、設 `endTime`，廣播 `soccer_go`。

### 5. 賽局 tick（仿 `arenaTick`，~12Hz）
- running 時廣播 `soccer_players`（所有玩家 id/name/team/striker/x/y/z/yaw，給 client 畫分身）。
- 到 `endTime` → `soccerEnd('time')`：`status='done'`，比較比分 → winner `'blue' | 'red' | 'draw'`，廣播 `soccer_end` + 最終比分（學生端 + 老師端都收）。

### 5b. 重設賽局 / 開新場（老師觸發 — 已拍板，課堂輪替賽要用）
- 老師後台送 `soccer_reset` → `soccerReset()`：
  - `status='idle'`、`scores` 歸零、`armed` 復位、清掉勝負結果。
  - **隊伍/前鋒處理**：預設**保留目前在場玩家的分隊**但**清掉前鋒指派**（讓老師重新指定）；另提供 `soccer_reset { clearTeams:true }` 把分隊也清掉、重新自動平均分（換完全新一輪）。
  - 廣播 `soccer_state`（idle 快照）給學生端 + 老師端 → 大家回到「待開賽」畫面。
- 用途：一場打完（或中途要重排），老師按「重設 / 開新場」就能清乾淨、重新指定前鋒、再開一局，**不需重啟 server**。

### 6. 廣播輔助
- `broadcastSoccer(msg)`：送給所有 `s.soccer` 玩家。
- `broadcastSoccerScores()`：`{ type:'soccer_scores', scores, armed, status, endTime }` → 玩家 + 老師後台。
- `soccerSnapshot()`：`{ type:'soccer_state', status, endTime, scores, armed, players:[...], spawns:[...], field:{...} }`。

### 7. 訊息路由（`wss.on('connection')` 內新增）
- 學生：`soccer_join` / `soccer_leave` / `soccer_pos`（暫存座標，T-503/504 會用）/ `soccer_goal`（T-503 處理，本 task 先收下不計分）。
- 老師：`soccer_start` / `soccer_state_req` / `soccer_set_striker { studentId }`（指定前鋒，每隊強制恰 1 名）/ `soccer_reset { clearTeams? }`（重設賽局 / 開新場）。

## 驗收標準

1. **開賽可運作**：老師送 `soccer_start`，伺服器進入 countdown→running，廣播 `soccer_go`。
2. **自動分隊正確**：N 人加入後藍/紅人數差 ≤ 1。
3. **老師指定前鋒**：`soccer_set_striker` 可把指定學生設為其隊前鋒，同隊原前鋒被取消（每隊恰 1）；開賽時未指定的隊自動補第一人；前鋒離開自動遞補。
4. **出生點分兩半場**：藍/紅在相對兩端，座標可回傳。
5. **計時與結束**：running 後 180s（測試可調短）到 → `soccer_end`，winner 依比分（先給 0:0 → draw）。
5b. **重設 / 開新場**：`soccer_reset` 後比分歸零、回 idle、清前鋒（`clearTeams:true` 連分隊一起清重分）；可立即重新指定前鋒並再開一局，不需重啟 server。
6. **比分廣播**：`soccer_scores` / `soccer_state` 學生端與老師端皆收得到。
7. **與 Arena 互斥不衝突**：同一連線不會同時 `arena=true` 且 `soccer=true`。
8. **無 server crash / 無未捕捉例外**（斷線、空場開賽等邊界）。

## Sam 怎麼驗收

1. 用測試腳本（或多個瀏覽器分頁）讓 4~6 個學生送 `soccer_join`。
2. 老師後台送 `soccer_start`（T-504 會做按鈕；本 task 可用測試腳本送）。
3. 檢查伺服器 log / 廣播：分隊平均、各隊 1 前鋒、3-2-1 倒數、180s（測試縮短）到結束。

## 相依

- 無（仿 Arena，後端獨立）。後續 T-502~T-505 都依賴本 task。

## 風險 / 注意

- **不要破壞 Arena**：足球路由與 Arena 路由並存，旗標獨立（`s.soccer` vs `s.arena`）。
- **計時測試**：180s 太長，測試時用環境變數或常數縮短（例 `SOCCER_DURATION`）。
- 場地常數（中線 z=0、門 z、門半徑）要與 client（T-502）**同一份數值**，避免計分判定不一致 — 建議集中成一個 `SOCCER_FIELD` 常數並在註解標明 client 對應處。
- 人數湊不滿 3v3：MVP 允許任意人數（2v2、1v2 也能玩），不強制 6 人。

## 派工備註

coder 完成後 PM 派 drone-reviewer 用模擬多 client 腳本驗收 1~8。**先確認設計文件「待 Sam 確認」第 1~4 點**（見 T-500 index）。
