# 01: 운영자 로그인과 로그아웃

Spec: [../spec.md](../spec.md)

**What to build:** 운영자(Admin)가 `/admin/login`에서 공유 비밀번호(`ADMIN_PASSWORD`)로 로그인하면 `/admin`에 들어갈 수 있다. 이 티켓의 `/admin`은 빈 관리 화면과 로그아웃 버튼뿐이다. 로그인하지 않은 방문자는 `/admin`에 들어가면 로그인 페이지로 이동된다. 세션은 `SESSION_SECRET`으로 서명한 httpOnly 쿠키로 7일 유지된다(ADR-0002). 이 앱의 첫 테스트로 Vitest를 설정하고 운영자 인증 모듈을 테스트한다.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Vitest를 추가하고 `test` 스크립트를 등록한다
- [x] 운영자 인증 모듈: 비밀번호 확인(타이밍 안전 비교), 세션 발급, 세션 검증. 비밀 값과 현재 시각은 인자로 받는다. Node 내장 HMAC-SHA256을 쓰고 외부 라이브러리는 쓰지 않는다
- [x] 테스트: 맞는·틀린·길이가 다른 비밀번호, 발급 직후 통과, 7일 직전 통과·이후 거부, 다른 서명 키 거부, 변조된·형식이 깨진 토큰 거부
- [x] `/admin/login`: 비밀번호 폼. 틀리면 오류 메시지를 보여주고, 맞으면 세션 쿠키(httpOnly, 운영 환경에서 Secure, SameSite=Lax, 7일)를 발급하고 `/admin`으로 이동한다
- [x] 이미 로그인한 상태로 `/admin/login`에 오면 `/admin`으로 이동한다
- [x] 세션이 없거나 유효하지 않으면 `/admin`에서 `/admin/login`으로 이동한다
- [x] 로그아웃 버튼을 누르면 세션 쿠키를 지우고 로그인 페이지로 이동한다
- [x] 일반 화면에는 운영자 링크를 노출하지 않는다
- [x] 로컬 설정에 필요한 `ADMIN_PASSWORD`, `SESSION_SECRET`을 README 등에 적는다(값은 적지 않는다)
- [x] 코드를 쓰기 전에 `node_modules/next/dist/docs/`의 인증, 서버 액션, `cookies()`, `proxy` 가이드를 읽는다

## Comments

- 2026-09-28 구현 완료. 인증 모듈 테스트 16개가 통과했고, `next start`로 로그인, 틀린 비밀번호, 리다이렉트, 위조 쿠키, 로그아웃을 확인함. `/admin` 보호는 proxy 없이 페이지와 서버 액션 안의 `requireAdmin()`으로 처리함. `ADMIN_PASSWORD`나 `SESSION_SECRET`이 비어 있으면 로그인이 막히고 서버 로그에 원인이 남음. Vitest 5를 설치하려고 `@types/node`를 ^24(로컬 Node v24)로 올림.
