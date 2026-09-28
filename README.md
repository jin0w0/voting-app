# 투표 앱

질문 하나에 선택지 중 하나를 골라 투표하고 결과를 보는 웹앱입니다. Next.js로 만들고 Vercel에 배포하며, 데이터는 Neon DB에 저장합니다.

- 용어: [CONTEXT.md](CONTEXT.md)
- 결정 기록: [docs/adr/](docs/adr/)
- 스펙과 티켓:
  - [.scratch/voting-app-mvp/](.scratch/voting-app-mvp/): 투표 만들기, 투표하기, 결과, 운영자 로그인과 삭제
  - [.scratch/poll-deadline-and-results-graph/](.scratch/poll-deadline-and-results-graph/): 마감 시각, 지금 마감, 결과 그래프(1위 강조). 앞 스펙의 "삭제될 때까지 열려 있음"과 결과 공개 규칙을 바꿈

## 동작 요약

- 투표자는 로그인하지 않고, 브라우저마다 투표 하나에 한 표를 던집니다.
- 진행 중인 투표의 결과는 투표한 사람만 봅니다. 마감되면 누구나 봅니다. 운영자는 `/admin`에서 항상 봅니다.
- 운영자는 투표를 만들 때 마감 시각(한국 시간)을 정할 수 있고, 목록에서 "지금 마감"으로 앞당겨 마감하거나 삭제할 수 있습니다. 마감된 투표는 다시 열리지 않습니다.
- 진행 중인지 마감됐는지는 앱 서버가 아니라 DB 시각으로 판단합니다.
- 투표 목록에는 진행 중인 투표가 먼저 나오고, 각 묶음 안에서는 최신순입니다.

## 환경변수

로컬에서는 `.env.local`에, 운영에서는 Vercel 프로젝트 설정에 넣습니다. 값은 절대 커밋하지 않습니다.

| 이름 | 용도 |
|---|---|
| `DATABASE_URL` | Neon DB 연결 문자열 |
| `ADMIN_PASSWORD` | 운영자 로그인 비밀번호. 길고 무작위인 값을 쓰세요 |
| `SESSION_SECRET` | 운영자 세션 서명 키. 32자 이상의 무작위 값을 쓰세요 |

`ADMIN_PASSWORD`나 `SESSION_SECRET`이 비어 있으면 운영자 로그인이 되지 않습니다. 비밀번호가 새어 나갔다면 두 값을 모두 바꾸세요. `ADMIN_PASSWORD`를 바꾸면 새 로그인을 막고, `SESSION_SECRET`을 바꾸면 이미 로그인된 세션이 모두 끊깁니다.

무작위 값 만들기:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## 개발

```bash
npm install
npm run dev      # http://localhost:3000, 운영자 화면은 /admin (목록의 "운영자 로그인" 링크)
npm test         # Vitest (감시 모드). 한 번만 실행하려면 npx vitest run
```

## DB 스키마 변경

스키마는 `lib/db/schema.ts`에 있고, 마이그레이션 SQL은 `drizzle/`에 커밋합니다. 빌드와 배포는 DB를 건드리지 않으므로, 스키마를 바꾸면 직접 적용해야 합니다. 로컬과 운영이 같은 DB를 쓰니 적용하는 순간 운영에도 반영됩니다.

```bash
npm run db:generate -- --name <변경_이름>   # 스키마 변경으로 새 마이그레이션 SQL 생성
npm run db:migrate                          # .env.local의 DATABASE_URL에 적용
```
