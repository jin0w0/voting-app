# Voting App

A simple web app where people pick one option in a poll and see the results.

## Language

**Poll** (투표):
A question together with its 2–10 options that people vote on. The question text belongs to the poll; it is not a separate concept. A poll's question and options never change after creation. A poll is either open or closed.
_Avoid_: Survey, question, 설문

**Open** (진행 중):
The state of a poll that still accepts votes.
_Avoid_: Active, live, running

**Closed** (마감됨):
The state of a poll that no longer accepts votes, because its deadline has passed or the admin closed it early. A closed poll never reopens.
_Avoid_: Ended, finished, expired, 종료됨, 끝남

**Deadline** (마감 시각):
The moment an open poll becomes closed on its own. A poll may have no deadline, in which case it stays open until the admin closes it or deletes it.
_Avoid_: End time, due date, expiry, 종료 시각

**Option** (선택지):
One of the choices in a poll.
_Avoid_: Choice, answer, item

**Vote** (표):
The record of one voter picking one option in a poll. A voter has at most one vote per poll, and a vote can never be changed or withdrawn.
_Avoid_: Ballot, response, answer, 응답

**Results** (결과):
The count of votes for each option in a poll. While a poll is open, a voter sees its results only after voting in it; once it is closed, anyone can see them. The admin can always see them.
_Avoid_: Tally, stats, score, 집계

**Leading option** (1위):
The option or options with the most votes in a poll's results; tied options all lead. No option leads while a poll has no votes.
_Avoid_: Winner, top pick, 우승

## People

**Voter** (투표자):
An anonymous person who casts votes, recognised only by the browser they use. Voters never log in.
_Avoid_: User, participant, 참여자

**Admin** (운영자):
The person who creates, closes and deletes polls, proven by knowing the single shared admin password. There are no individual admin accounts.
_Avoid_: Manager, owner, moderator, 관리자
