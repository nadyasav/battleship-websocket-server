Task: https://github.com/AlreadyBored/nodejs-assignments/blob/main/assignments/battleship/assignment.md   
Deadline 2025-05-20 01:00   
Score: 135/188   

* Websocket   
- [x] - +6 Implemented workable websocket server
- [x] - +3/6 Handle websocket clients connection/disconnection properly (disconnection not implemented)
- [x] - +10 Websocket server message handler implemented properly
- [x] - +10 Websocket server message sender implemented properly

* User   
- [x] - +5 Create user with password in temprorary database
- [x] - +5 User validation

* Room   
- [x] - +6 Create game room
- [x] - +6 Add user to game room
- [x] - +6 Start game
- [x] - +6 Finish game
- [x] - +8 Update room's game state
- [x] - +4 Update player's turn
- [x] - +8 Update players winner table

* Ships   
- [x] - +10 Locate ship to the game board

* Game   
- [x] - +8 Attack
- [x] - +4 Random attack

* Advanced Scope   
- [x] - +30 Task implemented on Typescript
- [x] - +20 Codebase is separated (at least 4 modules)
- [ ] - +30 Make bot for single play (optionally)

* Forfeits   
- [ ] - -95% of total task score any external tools except ws, cross-env, dotenv, tsx, typescript, ts-node, ts-node-dev, nodemon, eslint and its plugins, webpack and its plugins, prettier, @types/* and testing tools (for example, Jest, Mocha, AVA, Jasmine, Cypress, Storybook, Puppeteer)
- [ ] - -30% of total task score Commits after deadline (except commits that affect only Readme.md, .gitignore, etc.)
- [x] - -10 Missing PR or its description is incorrect
- [x] - -10 No separate development branch
- [ ] - -10 Less than 3 commits in the development branch, not including commits that make changes only to Readme.md or similar files (tsconfig.json, .gitignore, .prettierrc.json, etc.)

---

# RSSchool NodeJS websocket task template
> Static http server and base task packages. 
> By default WebSocket client tries to connect to the 3000 port.

## Installation
1. Clone/download repo
2. `npm install`

## Usage
**Development**

`npm run start:dev`

* App served @ `http://localhost:8181` with nodemon

**Production**

`npm run start`

* App served @ `http://localhost:8181` without nodemon

---

**All commands**

Command | Description
--- | ---
`npm run start:dev` | App served @ `http://localhost:8181` with nodemon
`npm run start` | App served @ `http://localhost:8181` without nodemon

**Note**: replace `npm` with `yarn` in `package.json` if you use yarn.
