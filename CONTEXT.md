# Voting App

A simple web app where people pick one option in a poll and see the results.

## Language

**Poll** (투표):
A question together with its 2–10 options that people vote on. The question text belongs to the poll; it is not a separate concept. A poll never changes after creation and stays open until it is deleted.
_Avoid_: Survey, question, 설문

**Option** (선택지):
One of the choices in a poll.
_Avoid_: Choice, answer, item

**Vote** (표):
The record of one voter picking one option in a poll. A voter has at most one vote per poll, and a vote can never be changed or withdrawn.
_Avoid_: Ballot, response, answer, 응답

**Results** (결과):
The count of votes for each option in a poll. A voter sees a poll's results only after voting in it; the admin can always see them.
_Avoid_: Tally, stats, score, 집계

## People

**Voter** (투표자):
An anonymous person who casts votes, recognised only by the browser they use. Voters never log in.
_Avoid_: User, participant, 참여자

**Admin** (운영자):
The person who creates and deletes polls, proven by knowing the single shared admin password. There are no individual admin accounts.
_Avoid_: Manager, owner, moderator, 관리자
