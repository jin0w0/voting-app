# 06: GitHub와 Vercel 배포 연결

Spec: [../spec.md](../spec.md)

**What to build:** 이 저장소를 GitHub에 올리고 Vercel 프로젝트에 연결해, `main`에 push할 때마다 자동 배포되게 한다. 배포된 앱에서 운영자 로그인이 동작하는 것을 확인한다. 이후 티켓은 push만 하면 운영에 반영된다. 계정 권한과 비밀 값이 필요한 사람의 작업이다.

**Blocked by:** 01 (운영자 로그인과 로그아웃)

**Status:** ready-for-human

- [ ] GitHub에 저장소를 만들고 `origin`으로 추가한 뒤 `main`을 push한다
- [ ] Vercel에서 GitHub 저장소를 가져와 프로젝트를 만든다
- [ ] Vercel 환경변수에 `DATABASE_URL`(로컬과 같은 Neon DB), `ADMIN_PASSWORD`(긴 무작위 값), `SESSION_SECRET`(긴 무작위 값)을 등록한다
- [ ] 로컬 `.env.local`에도 `ADMIN_PASSWORD`, `SESSION_SECRET`을 추가한다
- [ ] 배포된 URL에서 `/admin/login` 로그인과 로그아웃이 동작하는지 확인한다
- [ ] (선택) 원격 저장소가 생겼으니, 이슈 트래커를 GitHub Issues로 옮길지 정한다(`/setup-matt-pocock-skills` 재실행)
