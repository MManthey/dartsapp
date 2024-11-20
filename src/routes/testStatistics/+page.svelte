<script lang="ts">
    import { userStats } from '../../store/localStore';

    function updateStats() {
        userStats.update(stats => {
            stats.gamesPlayed += 1;
            return stats;
        });
    }

    // Optional: reset the stats
    function resetStats() {
        userStats.set({ gamesPlayed: 0 });
    }
</script>

<p>Games Played: {$userStats.gamesPlayed}</p>
<button on:click={updateStats}>+1</button>
<p>Wins / Losses: {$userStats.gameWins} / {$userStats.gamesPlayed - $userStats.gameWins}</p>
<button on:click={updateStats}>+1</button>
<p>Throw Count: {$userStats.throwCount}</p>
<button on:click={updateStats}>+1</button>
<p>Throw Average: {$userStats.averageThrow}</p>
<button on:click={updateStats}>+1</button>
<p>Double Count: {$userStats.doubleCount}</p>
<button on:click={updateStats}>+1</button>
<p>Triple Count: {$userStats.tripleCount}</p>
<button on:click={updateStats}>+1</button>
<p>Triple20 Count: {$userStats.triple20Count}</p>
<button on:click={updateStats}>+1</button>
<p>Bullseye Count: {$userStats.bullseyeCount}</p>
<button on:click={updateStats}>+1</button>


<button on:click={resetStats}>Reset Games Played Stats</button>
