# 투표 앱

질문 하나에 선택지 중 하나를 골라 투표하고 결과를 보는 웹앱입니다. Next.js로 만들고 Vercel에 배포하며, 데이터는 Neon DB에 저장합니다.

- 용어: [CONTEXT.md](CONTEXT.md)
- 결정 기록: [docs/adr/](docs/adr/)
- 스펙과 티켓: [.scratch/voting-app-mvp/](.scratch/voting-app-mvp/)

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
npm run dev      # http://localhost:3000, 운영자 화면은 /admin
npm test         # Vitest (감시 모드). 한 번만 실행하려면 npx vitest run
```
