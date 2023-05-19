const initialValue = {
    currentGameMoves: [],
    history: {
        currentRoundGames: [],
        allGames: [],
    },
};
export default class Store extends EventTarget {
    constructor(storageKey, players) {
        super();
        this.storageKey = storageKey;
        this.players = players;
    }
    get stats() {
        const state = this.getState();
        return {
            playerWithStats: this.players.map((player) => {
                const wins = state.history.allGames.filter((game) => { var _a; return ((_a = game.status.winner) === null || _a === void 0 ? void 0 : _a.id) === player.id; }).length;
                return Object.assign(Object.assign({}, player), { wins });
            }),
            ties: state.history.allGames.filter((game) => game.status.winner === null)
                .length,
        };
    }
    get game() {
        const state = this.getState();
        const currentPlayer = this.players[state.currentGameMoves.length % 2];
        const winningPatterns = [
            [1, 2, 3],
            [1, 5, 9],
            [1, 4, 7],
            [2, 5, 8],
            [3, 5, 7],
            [3, 6, 9],
            [4, 5, 6],
            [7, 8, 9],
        ];
        let winner = null;
        for (const player of this.players) {
            const selectedSquareIds = state.currentGameMoves
                .filter((move) => move.player.id === player.id)
                .map((move) => move.squareId);
            for (const pattern of winningPatterns) {
                if (pattern.every((v) => selectedSquareIds.includes(v))) {
                    winner = player;
                }
            }
        }
        return {
            moves: state.currentGameMoves,
            currentPlayer,
            status: {
                isComplete: winner != null || state.currentGameMoves.length === 9,
                winner,
            },
        };
    }
    playerMove(squareId) {
        const stateClone = JSON.parse(JSON.stringify(this.getState()));
        stateClone.currentGameMoves.push({
            squareId,
            player: this.game.currentPlayer,
        });
        this.saveState(stateClone);
    }
    reset() {
        const stateClone = JSON.parse(JSON.stringify(this.getState()));
        const { status, moves } = this.game;
        if (status.isComplete) {
            stateClone.history.currentRoundGames.push({
                moves,
                status,
            });
            stateClone.history.allGames.push({
                moves,
                status,
            });
        }
        stateClone.currentGameMoves = [];
        this.saveState(stateClone);
    }
    newRound() {
        this.reset();
        const stateClone = JSON.parse(JSON.stringify(this.getState()));
        stateClone.history.allGames = [];
        stateClone.history.currentRoundGames = [];
        this.saveState(stateClone);
    }
    saveState(stateOrFn) {
        const prevState = this.getState();
        let newState;
        switch (typeof stateOrFn) {
            case "function":
                newState = stateOrFn(prevState);
                break;
            case "object":
                newState = stateOrFn;
                break;
            default:
                throw new Error("Invalid argument passed to saveState");
        }
        window.localStorage.setItem(this.storageKey, JSON.stringify(Object.assign(Object.assign({}, newState), { stats: this.stats })));
        this.dispatchEvent(new Event("statechange"));
    }
    getState() {
        const item = window.localStorage.getItem(this.storageKey);
        if (item) {
            return JSON.parse(item);
        }
        else {
            return initialValue;
        }
    }
}
