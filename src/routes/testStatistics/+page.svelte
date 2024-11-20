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
        userStats.set({ gamesPlayed: 0, highScore: 0 });
    }
</script>

<p>Games Played: {$userStats.gamesPlayed}</p>
<button on:click={updateStats}>+1</button>
<button on:click={resetStats}>Reset Stats</button>
