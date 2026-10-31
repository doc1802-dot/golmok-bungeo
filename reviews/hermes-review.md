# 골목 붕어빵 — 코드·밸런스·접근성 리뷰 (Hermes)

검토자: Hermes (worker task `task_dbac55fc49dc`) · 검토 시각: 2026-10-31 01:07–01:30 KST
검토 대상(스냅샷 `ca836cf6`): `dist/app.js` `dist/engine.js` `dist/index.html` `dist/style.css` `game.test.mjs`

| 파일 | md5 |
| --- | --- |
| dist/app.js | ca836cf65e71461b56dfc88f10da607a |
| dist/engine.js | 549b90470f119a2598638fe181a1167b |
| dist/index.html | 2383e3601f3116e4c12b54cc04f41ff9 |
| dist/style.css | ab181c326e423b8cd74eedec2b90c586 |
| game.test.mjs | 3f833e955e3a82f4580c007e3025d534 |

**주의 — 검토 중 워킹 트리가 동시에 편집되었습니다.** 01:07에 읽은 `dist/*`가 01:11–01:18 사이에 4개 파일 모두 변경되었습니다(목표 40,000 상한, `discardFish` + "1개 비우기" 버튼, 모바일 플레이 모드 CSS, muted 팔레트, `aria-labelledby`, `#next-shift`, Space 가드 등). 본 문서는 **01:18 이후 안정된 스냅샷 기준**이며, 섹션 1의 "이미 반영됨" 표에 무엇이 해결되었는지 따로 정리했습니다. 공개 배포본(https://golmok-bungeo.vercel.app)은 23:05 빌드로 **아래 P0가 그대로 재현**됩니다.

검증 방법: 정적 리뷰 + `node --test`(8/8 통과) + 로컬 서버(`node server.mjs`, 127.0.0.1:4178) DOM/CDP 실측 + 공개 URL 실측 + 완전 플레이 봇 시뮬레이션(`dist/engine.js` 직접 구동) + 엔진 프로브. 소스·배포는 건드리지 않았습니다.

---

## 0. 요약 (우선순위)

| ID | 등급 | 제목 | 상태 |
| --- | --- | --- | --- |
| P0-1 | Blocker | 첫 화면에서 Esc → **게임 시작 경로 완전 소실**(빈 화면, 새로고침 외 복구 불가) | **미수정** |
| P0-2 | High | 영업 종료 후 모달을 닫으면 "다음 영업 시작" 버튼이 문서 1,852px 지점에만 존재 → 화면상 빈 페이지 | 부분 수정(`#next-shift` 추가됨, 위치 문제) |
| P1-1 | High | 목표 40,000 상한 → day 11 이후 **성장 정지/무한 잉여**(숙련자) 또는 **영구 정체**(미숙련자) | 미수정 |
| P1-2 | High | 주문 수량 상한 3 + 스폰 하한 5초 → day 11+ 수급량 고정, 목표가 의미를 잃음 | 미수정 |
| P1-3 | Med | 업그레이드 총 소비 114,000원 → **day 5에 전부 만렙**, 이후 돈이 죽은 자원(1.3M 누적) | 미수정 |
| P2-1 | Med | 본문 외 보조 텍스트 7곳 WCAG AA 미달(2.37–4.00:1), 8–12px | 일부만 수정됨 |
| P2-2 | Med | 탭 타깃 44px 미만: `.discard` 57×36, `#reset` 46×14 | 부분(아이콘 40×40로 개선) |
| P2-3 | Med | `#griddle`가 role 없는 div에 `aria-label`만 → 스크린리더에서 무시 | 미수정 |
| P2-4 | Low | 타이머/콤보/쿡 진행에 `aria-live` 없음 → 화면낭독 사용자는 뒤집기 타이밍 인지 불가 | 미수정 |
| P3-1 | Low | 사운드 설정 미저장(새로고침 시 OFF) | 미수정 |
| P3-2 | Low | 다중 탭 동시 플레이 시 마지막 저장이 이김(진행 유실 가능) | 미수정 |
| P3-3 | Low | `validateSave`가 `day: 1e9` 허용 → "DAY 1000000000" 표시 | 미수정 |
| P3-4 | Low | 콤보 보너스가 콤보 6에서 500 상한(이후 무보상), 팁은 정확히 50%에서 0 | 미수정 |
| P3-5 | Low | `tick` dt 0.5초 클램프 → 5초 히치 시 0.5초만 진행(저사양에서 체감 저하) | 미수정 |

**이미 반영됨(검증 완료, 다시 손대지 않아도 됨)**

| 항목 | 검증 결과 |
| --- | --- |
| 슬롯 버튼에 포커스가 있을 때 Space | 이제 일시정지 동작(`app.js:167-170`) — 실측: 클릭 후 Space → 일시정지 모달, 슬롯 상태 불변 |
| 다이얼로그 접근성 이름 | `openModal`이 `aria-labelledby`를 h2에 연결(`app.js:87-92`) — AX 트리 name="잠깐, 쉬어갈까요?" 확인 |
| 모바일 플레이 모드(그릴+주문 1화면) | 390×667에서 그릴+주문 카드 2행 모두 뷰포트 내(필요 span 507px) — 측정/스크린샷 확인 |
| 리셋 모달 Esc | `cancel` 핸들러가 reset-cancel을 대신 클릭(`app.js:153`) — 실측: 모달 닫힘 + 타이머 재개(01:29→01:26) |
| 영업 종료 시계/일시정지 버튼 상태 | 종료 시 "00:00" + `#pause` disabled 확인(이전 빌드의 "00:01"+활성 잔상 해결) |
| muted 팔레트(#796954) | 고객 이름/대사/힌트 5.21:1로 통과(이전 3.05–3.36) |
| `begin()` 중복 호출 | `if (active) return`(`app.js:100-101`) + 고객 DOM 초기화로 이전 날 카드 잔상 제거 |

### 코디네이터 요청 4항목 대응

| 요청 | 결론 | 근거 위치 |
| --- | --- | --- |
| 잘못된 맛으로 보관함이 가득 찼을 때 탈출구 없음 | 현재 스냅샷에서 **해결 확인**(`discardFish` + "1개 비우기") — 아래 3-5 | 3-5 |
| 모바일 그릴/대기열 분리 | **해결 확인** — 390×667에서 그릴+주문 2행이 한 화면(필요 507px) | 4-5 |
| 버튼 포커스 후 Space 단축키 | **해결 확인** — 포커스된 슬롯에서 Space → 일시정지, 슬롯 상태 불변 | 0장 '이미 반영됨' |
| 목표 무한 상승 vs 손님 수급 상한 | **핵심 밸런스 문제** — 40,000 상한이 실패 모드를 '영구 정체/무한 잉여'로 바꿨을 뿐 | 3-1, 3-2 |

---

## 1. P0-1 (Blocker) 첫 화면 Esc → 시작 경로 소실

**재현 (공개 URL·로컬 동일)**

1. 페이지 로드 → "어서 와요, 사장님!" 모달 표시
2. `Esc` 1회
3. 결과: 모달은 닫히고, **화면 어디에도 게임을 시작할 방법이 없음**. 슬롯·재료·일시정지 모두 비활성, 새 고객도 오지 않음. 새로고침만이 복구 수단.

**실측 근거**

```
A) welcome modal: {"open":true,"nextShiftExists":true,"nextShiftHidden":true}
A) after Esc:     {"open":false,"visibleStart":0,"nextShiftHidden":true,"pauseDisabled":true}
cancel 이벤트:    ["cancel preventable=false", "close event"]   // preventDefault가 먹지 않음
```

**원인 3가지**

1. `app.js:151-159` — `cancel` 핸들러가 `e.preventDefault()`를 호출하지만, 현재 Chrome에서 이 `cancel` 이벤트는 `cancelable=false`로 발생해 **막을 수 없음**(위 로그). 즉 Esc는 항상 다이얼로그를 닫음.
2. `app.js:66` — 대체 CTA인 `#next-shift`의 표시 조건이 `hidden = active || !run.done`. 첫 로드 시 `run = startDay(save)`라 `run.done === false` → 시작 전에는 **항상 숨김**.
3. 시작 버튼(`data-action="start"`)이 다이얼로그 안에만 존재 → 다이얼로그가 닫히면 DOM에서 접근 불가(닫힌 `dialog` 내부 버튼은 클릭 대상이 아님).

**권장 수정(택1 + 3은 필수)**

```js
// 1) 헤더에 상시 시작 버튼 (다이얼로그 밖)
// index.html: <button id="start-shift" class="primary" hidden>영업 시작</button>
// app.js render(): $('start-shift').hidden = active || paused

// 2) 모든 모달에서 '닫힘'을 상태 복구 트리거로 사용 (preventDefault 의존 금지)
const endBody = { /* end()가 만드는 마크업을 함수로 분리: renderEnd() */ }
$('modal').addEventListener('close', () => {
  if (modalMode === 'welcome') welcome()      // 시작 전이면 다시 열기
  if (modalMode === 'end') renderEnd()        // 종료 화면 복원
})

// 3) 종료 모달을 다시 만들 수 있게 end()를 두 조각으로 분리
function renderEnd() { openModal('end', endMarkup()) }
```

**검증 기준**: 로드 → Esc → "가게 문 열기" 클릭 가능 / 클릭 시 DAY 1 시작. 또한 종료 화면에서 Esc → 시작 CTA가 **뷰포트 안에** 보여야 함(P0-2).

---

## 2. P0-2 (High) 종료 후 CTA가 화면 밖에만 존재

**재현**: DAY 영업 종료 → 모달에서 Esc → 화면은 정적 페이지. DOM에는 `#next-shift`가 있으나 위치가 문서 1,852px 지점(뷰포트 844px, scrollY 0).

```
after Esc at end: {"open":false,"nextShiftVisible":true,"nextShiftTop":1852,"vh":844,"scrollY":0}
```

`#next-shift`가 `.shop` 섹션 하단에 들어 있어(`index.html:27`) 첫 화면에서 보이지 않음. 사용자는 "게임이 끝났다"고 인식할 가능성이 큼.

**권장 수정**: `#next-shift`를 `.stats`(sticky) 또는 헤더로 이동하고, 동시에 P0-1의 `close` 복구 핸들러를 넣으면 두 문제가 함께 사라짐. 모달을 닫아도 종료 화면이 다시 뜨므로 위치 문제도 완화됨.

---

## 3. P1 밸런스

### 3-1. 목표 상한 40,000의 역설 (`engine.js:22`)

봇(항상 정확히 뒤집고, 콤보 유지, 요구 수량 우선 조리)으로 26일 연속 플레이한 결과입니다. `dist/engine.js`를 그대로 import해 0.1초 스텝으로 구동했습니다.

| 일차 | 매출 | 목표 | 달성률 | 업그레이드 |
| --- | --- | --- | --- | --- |
| 1 | 15,500 | 10,000 | 155% | - |
| 3 | 32,480 | 16,000 | 203% | - |
| 5 | 44,460 | 22,000 | 202% | **전부 만렙** |
| 10 | 51,560 | 37,000 | 139% | 만렙 |
| 11 | 50,580 | 40,000(상한) | 126% | 만렙 |
| 18 | 61,820 | 40,000 | 155% | 만렙 |
| 26 | 65,160 | 40,000 | 163% | 만렙 (지갑 1,321,000원) |

- 숙련자: day 11부터 목표가 고정인데 매출은 5–8만 → **26일 내내 126–209%로 여유 통과**. 실패 조건이 사실상 사라지고 게임이 끝나지도 않음(엔딩/시즌 없음).
- 미숙련자: day 11의 40,000은 하루 ~11건 판매가 필요. 이 벽을 못 넘으면 **같은 날 무한 재도전**인데, 업그레이드는 day 5에 이미 만렙이라 **실력을 늘릴 수단이 없음**. 상한이 "영구 정체"로 실패 모드를 고정시킴.
- 즉 상한은 "이길 수 없는 벽"을 "이길 필요도, 질 수도 없는 구간"으로 바꿨을 뿐, 난이도 곡선을 만들지는 못했습니다.

**권장**: 목표를 고정식이 아니라 **개인 최고 기록 기반**으로.

```js
target: Math.max(10000, Math.round(Math.max(save.best, 10000) * 1.15))
```
+ 업그레이드 무한 레벨(비용 지수 증가) 또는 day 10/20에 주문 수량·스폰·동시 손님 수가 한 단계 오르는 "장사 성수기" 이벤트, day 30 클리어 엔딩.

### 3-2. 수급 상한이 난이도 상한 (`engine.js:33`, `engine.js:54`)

- 주문 수량: `1 + floor(random * min(3, 2 + floor(day/3)))` → day 3 이후에도 **최대 3개 고정**.
- 손님 스폰: `max(5, 10 - day*0.4)` → day 10 이후 **5초 고정**, 동시 4명 상한 → 90초에 약 17–18명이 천장.
- 그래서 매출 천장 ≈ 18건 × (3×1,600 + 200 + 500) ≈ 99,000원(이론), 실측 봇 5–8만. 목표가 이 천장을 넘으면 회복 불가였고(상한 없는 이전 빌드에서 day 19부터 실패), 지금은 40,000에서 멈춰 서 성장이 끝남.
- 참고: 대기열이 4명으로 차 있는 동안에도 `run.spawn`이 계속 감소하기 때문에(`engine.js:53`), 손님을 빨리 보내면 스폰 간격이 무시되고 즉시 리스폰됨. "느린 플레이어만 손해"라는 비대칭이 생김.

### 3-3. 경제가 day 5에 고갈

업그레이드 3종 × 3레벨 총액 = `heat 36,000 + recipe 48,000 + charm 30,000 = 114,000원`. 봇은 day 5에 누적 128,000원으로 전부 만렙, 이후 지갑만 1.32M까지 증가하고 **소비처가 없음**. `upgradeCost`가 선형(`base*(lv+1)`)이라 후반 비용 곡선도 없습니다.
**권장**: 레벨 상한 확장(지수 비용) 또는 소비처(장식/가게 확장/재료 등) 추가.

### 3-4. 세부 수치(설계 확인 필요)

| 항목 | 실측 | 비고 |
| --- | --- | --- |
| 팁 | 대기 50% 초과 시 200원, **정확히 50%면 0원** | `engine.js:80` 경계 오프바이원, 의도 확인 필요 |
| 콤보 보너스 | 콤보 1→6: 0,100,200,300,400,500 / **콤보 7+ 500 고정** | `engine.js:81`; UI는 콤보를 계속 증가시켜 보상 기대를 만듦 |
| day 1 목표 | 10,000원 = 봇 매출의 65% | 튜토리얼 난이도로는 적절, 다만 2–9일차도 139–203%라 긴장 구간이 없음 |

### 3-5. 잘못된 맛으로 보관함 가득 (수정 확인)

이전 빌드의 막다른 길: 보관함 12/12가 모두 슈크림인데 손님이 팥을 요구하면 `touchSlot`은 `'full'`(`engine.js:68`), `serve`는 `null`(`engine.js:77`), 슈크림 주문 손님이 오기 전까지 **조리를 멈추고 대기**하는 것 외에 선택지가 없었습니다(팥을 구울 공간이 없음).

현재 스냅샷은 `discardFish`(`engine.js:27-30`)와 트레이의 "1개 비우기" 버튼(`index.html:22`, `app.js:133-136`)으로 해소되었습니다. 추가 확인:

```
discardFish(빈 보관함)   → false  (음수 방지 OK)
discardFish(run,'unknown') → false  (타입 가드 OK)
run.done === true        → false  (영업 종료 후 조작 불가 OK)
테스트 'discarding wrong flavor...' → 통과
```

남은 다듬기: 두 버튼이 보관함이 0일 때도 자리를 차지하며(비활성) 8–9px 라벨로 57×36px — 44px 이상으로 키우고 "비우기" 아이콘+수량 형태를 권장. 또 비우기가 **돈을 만들지 않으므로**(테스트로 고정됨) 그대로 유지하는 것이 맞습니다.

---

## 4. P2 접근성·모바일

### 4-1. 색 대비 (WCAG AA 4.5:1, 실측 계산)

`--muted`가 `#796954`로 바뀌면서 본문은 통과했지만, 아래는 **여전히 미달**입니다.

| 요소 | 대비 | 크기 | 파일 |
| --- | --- | --- | --- |
| `.grill-legend` (반죽→뒤집기→꺼내기 범례) | **3.27:1** | 9px | style.css `.grill-legend` |
| `dialog p` (모달 본문) | **3.64:1** | 12px | style.css `dialog p` |
| `.modal-note` | **2.62:1** | 9px | style.css `.modal-note` |
| `.upgrade small` (LV.x) | **2.56:1** | 8px | style.css `.upgrade small` |
| `footer > span` | **2.37:1** | 9px | style.css `footer` |
| `.eyebrow` | **3.06:1** | 8px | style.css `.eyebrow` |
| `.slot .slot-label` (밝은 글자/어두운 틀) | 4.00:1 | 10px | style.css `.slot .slot-label` |

조작법을 알려주는 범례와 모달 본문이 가장 낮습니다. 최소 `#6b5a45` 수준(≈5:1)으로 내리거나, 12px 이상 + medium weight로 올리는 조합을 권합니다.

### 4-2. 폰트 크기

데스크톱 1280px 실측(초기 빌드): **9px 22개, 8px 15개, 7px 7개**. 모바일 플레이 모드에서도 `.playing .customer .name` 9px, `.playing .discard` 9px 등 9–10px 구간이 핵심 정보(주문자 이름/수량)에 쓰입니다. 실기기에서 흐릿하게 보일 수 있으니 본문 하한 11–12px을 권장합니다.

### 4-3. 탭 타깃 (실측, 모바일 390px)

| 요소 | 크기 | 판정 |
| --- | --- | --- |
| `#sound` `#help` `#pause` | 40×40 | 44 권장에 근접(양호) |
| `.discard`("1개 비우기") | 57×36 | 높이 부족, 라벨 8–9px |
| `#reset`(푸터 "새 가게 시작") | 46×14 | 매우 작음(파괴적 동작인데 오탭 위험) |
| 슬롯 | 88×107 | 양호 |

### 4-4. 시맨틱/스크린리더

- `index.html:18` — `<div class="griddle" id="griddle" aria-label="붕어빵 굽는 틀">`: role이 없는 div의 `aria-label`은 **무시**됩니다. `role="group"` 추가 필요.
- 타이머(`#time`), 콤보, 쿡 진행(`.cook-meter`)이 라이브 리전이 아님. 슬롯 `aria-label`은 90ms마다 갱신되지만 포커스가 없으면 읽히지 않음. 최소한 `flip-ready`/`ready` 전환 시 `#toast`(role=status)로 문구를 흘려주면 화면낭독 사용자도 타이밍을 잡을 수 있습니다.
- 키보드만으로 플레이 가능(1–6, Q/W, Space) — 좋습니다. 다만 숫자키가 `.click()`으로 포커스를 슬롯에 옮기므로, 이후 Space가 "일시정지"로 동작하는지 회귀 테스트가 필요합니다(현재는 정상).

### 4-5. 모바일 (해결 확인)

플레이 모드(`body.playing` + `@media(max-width:700px)` 블록) 적용 후 390×667에서 그릴 상단~주문 2행 하단까지 **507px**로 한 화면에 들어옵니다(측정). 이전 빌드의 756px 문제는 해소됨. 남은 개선점: (a) `.playing`에서 `#wallet`(지갑)이 숨겨져 영업 중 잔액을 볼 수 없음, (b) 토스트가 `bottom:12px`로 주문 카드 하단을 가릴 수 있음, (c) `#reset` 46×14.

---

## 5. P3 세이브·일시정지·기타 엣지

1. **사운드 미저장** — `sound`는 메모리 변수(`app.js:7`, 토글 `app.js:163`). save 스키마(`engine.js:7`)에 없어 새로고침마다 OFF. save에 `sound:boolean` 추가 + `validateSave`에서 boolean 검증.
2. **다중 탭** — `storage` 이벤트를 듣지 않음. 두 탭에서 각자 `save`를 들고 있다가 종료 시 `persist()` → 마지막 탭이 이김. `window.addEventListener('storage', ...)`로 재로드하거나 최소한 "다른 탭에서 플레이 중" 안내.
3. **`validateSave` day 상한 없음** — `{version:1, day:1e9}` 통과(실측) → 헤더 "DAY 1000000000". `Math.min(s.day, 9999)` 권장.
4. **콤보/팁 상한** — 3-4 참조.
5. **dt 클램프** — `Math.max(0, Math.min(dt, .5, run.left))`(`engine.js:39`). 실측 `tick(run, 5)` → 0.5초만 진행. 프레임이 1초 이상 끊기면 조리/대기/시계가 함께 느려짐(자기일관적이라 버그는 아니지만, 1초 이상 끊김은 "잠깐 멈췄어요" 토스트로 알리는 편이 정직함).
6. **`totalServed` 저장되지만 미표시**(`engine.js:7`, `finishDay`에서 누적) — 엔딩/누적 통계에 활용 가능한 죽은 필드.
7. **영업 중 리셋 → Esc** — 모달이 닫히고 게임이 재개됨(실측, 정상). 다만 리셋 진입 시 `paused = true`만 하고 `render()`를 부르지 않아(`app.js:164`) 그 순간 슬롯 버튼의 disabled 상태가 갱신되지 않음(클릭은 `paused` 가드로 막힘). `render()` 한 줄 추가 권장.
8. **`index.html`만 CRLF** — 나머지 파일은 LF. 배포에는 무해하나 diff 노이즈 원인.

---

## 6. 테스트

`node --test game.test.mjs` → **8/8 통과**(현재 스냅샷).

```
✔ batter, flip, collect, and fulfill a two-fish order
✔ overcooking burns, clearing resets, no money for unfulfilled orders
✔ tray capacity and wrong flavor cannot fulfill orders
✔ settlement happens once, successful day advances, upgrades spend correctly
✔ failed day retains revenue and can be retried, time ends and locks actions
✔ expired customers leave and broken saves are sanitized
✔ discarding wrong flavor frees room for the required order without creating money
✔ late-game goals stop rising after the customer spawn rate reaches its cap
```

**커버리지 갭** — 전부 엔진 단위 테스트이고 DOM/통합 테스트가 0입니다. 이번 P0(모달 닫힘으로 시작 경로 소실)는 엔진 테스트로 잡을 수 없는 종류입니다.

| 없는 테스트 | 왜 필요한가 |
| --- | --- |
| 스폰 간격/동시 4명 상한 | 3-2의 수급 천장이 밸런스의 핵심인데 미검증 |
| 콤보 보너스 상한·팁 50% 경계 | 3-4의 경계 동작(0원)이 의도인지 고정 필요 |
| `tick` dt 클램프 | 저사양/탭 복귀 시 시간 왜곡 방지 |
| 세이브 왕복(`persist` → `validateSave`) | 손상 save·필드 누락 회귀 |
| DOM 통합: 로드 → Esc / 종료 후 Esc / 리셋 Esc | P0 재발 방지 (jsdom 또는 Playwright) |

제안 예시(엔진):

```js
test('spawn interval floors at 5s and never exceeds 4 waiting customers', () => {
  const r = startDay({ ...newSave(), day: 40 }, () => .1)
  let seen = 0
  for (let t = 0; t < 90; t += .1) { tick(r, .1); assert.ok(r.customers.length <= 4); if (r.customers.length) seen++ }
  assert.ok(seen > 0)
  assert.ok(Math.abs(r.spawn - 5) < 10)     // 음수로 무한 누적되지 않아야 함(현재는 누적됨)
})
test('combo bonus caps at 500 but combo counter keeps rising', () => { /* ... */ })
```

---

## 7. 브라우저 QA 범위와 한계 / 확인하지 못한 것

**실제로 수행한 것** — Chromium(CDP) 자동화로 아래를 직접 클릭·측정했습니다.

- 공개 배포본(https://golmok-bungeo.vercel.app): 로드 → DAY 1 90초 실제 플레이 → 종료 모달 → Esc / 리셋 모달 취소 경로 → P0 재현. 뷰포트 1264×569·390×844 레이아웃 측정, 스크린샷.
- 로컬 현재 dist(`node server.mjs` → 127.0.0.1:4178, 검토 후 프로세스 종료): Esc 처리 3종, Space+포커스, 리셋 모달 Esc, `dialog` AX 이름, 390×667/844 플레이 모드 측정, 탭 타깃 크기, 대비 색상 수집.

**한계(그대로 판단 근거로 봐 주세요)**

1. **에뮬레이션 ≠ 실기기.** device metrics override로 390/844를 흉내 냈을 뿐, iOS Safari의 `100dvh`/`dialog`/`backdrop-filter` 차이, 주소창 접힘, 저사양 안드로이드의 프레임 드랍은 검증하지 못했습니다. 특히 `<dialog>` Esc 처리 동작은 브라우저별 차이가 커서(**이번 P0의 원인이기도 함**) Safari/Firefox에서 재확인이 필요합니다.
2. **브라우저 스냅샷 도구가 EOF를 반환하는 환경**이었습니다. 그래서 DOM 스냅샷 대신 **CDP 직접 호출(JS 평가 + 실좌표 클릭 + AX 트리)** 로 우회했고, 위 수치는 전부 그 경로의 실측값입니다. 스냅샷 기반 시각 회귀는 하지 않았습니다.
3. `visibilitychange` 자동 일시정지: 코드상 정상(`app.js:176`)이나 실제 탭 전환·백그라운드 복귀는 미실측.
4. 오디오(Web Audio)는 실제 소리로 확인하지 않았고, `sound` 기본값/재생성만 코드로 확인.
5. 공개 배포본은 23:05 빌드입니다. 위 "이미 반영됨" 항목은 **로컬 현재 dist 기준**이므로, 배포 후 P0/P2 항목을 한 번 더 확인해야 합니다.
6. 검토 중 `dist/*`가 계속 편집되어(01:11–01:18) 중간 버전에서 관측한 현상(예: 종료 시 "00:01" 잔상)은 최종 스냅샷에서 재확인 후 '해결'로 표기했습니다.

---

## 8. 재현에 쓴 명령 (참고)

```sh
cd games/golmok-bungeo
node --test game.test.mjs          # 8/8 통과
node server.mjs                    # http://127.0.0.1:4178 (검토용 로컬 서버, 검토 후 종료)
# CDP 실측: Esc 처리, aria 이름, 모바일 390x667 레이아웃, 탭 타깃, 대비 계산, 봇 시뮬레이션
```

수정은 하지 않았고, 이 문서(`reviews/hermes-review.md`)만 추가했습니다.
