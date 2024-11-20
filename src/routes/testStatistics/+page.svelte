<script lang="ts">
    import { goto } from '$app/navigation';
    import { gameData } from '../../store/localStore';
    import { LogOutIcon } from 'svelte-feather-icons';
	import Button from '$lib/components/Button.svelte';
	import { writable, derived } from 'svelte/store';

    export const selectedTimeframe = writable("Last Week");

    let currentDay = -1;

    //TODO: STRESS TEST WITH MORE DATA

	// Helper: Get statistics for a specific timeframe
	const getStatsForTimeframe = (timeframe: string, data: any[]) => {
        const currentDate = new Date();
        let startOffset = 0;

        if (timeframe === "Last Week") startOffset = 7;
        else if (timeframe === "Last Month") startOffset = 30;
        else if (timeframe === "Last Year") startOffset = 365;
        else if (timeframe === "All Time") return data;

        //TODO: checken, ob auch Schaltjahr mit einbezogen wurde
        currentDay = Math.floor(
            (Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()) -
                Date.UTC(currentDate.getFullYear(), 0, 1)) /
                (24 * 60 * 60 * 1000)
        );

        const filteredData = data.filter(([date]) => date >= currentDay - startOffset);

        return filteredData;
    };

	// Derived store to calculate aggregated stats based on selected timeframe
	const stats = derived(
        [gameData, selectedTimeframe], // Beide Stores einbinden
        ([$data, timeframe]) => {
            const filteredData = getStatsForTimeframe(timeframe, $data);

            const totalGames = filteredData.reduce((acc, day) => acc + day[1] + day[2], 0);
            const wins = filteredData.reduce((acc, day) => acc + day[1], 0);
            const losses = filteredData.reduce((acc, day) => acc + day[2], 0);
            const throws = filteredData.reduce((acc, day) => acc + day.slice(5).length, 0);
            const outs = filteredData.reduce((acc, day) => acc + day[3], 0);
            const nonOuts = filteredData.reduce((acc, day) => acc + day[4], 0);
            const allThrows = filteredData.flatMap(day => day.slice(5));

            const doubleCount = allThrows.filter(t => String(t).startsWith("2")).length;
            const tripleCount = allThrows.filter(t => String(t).startsWith("3")).length;
            const triple20Count = allThrows.filter(t => t === 320).length;
            const bullseyeCount = allThrows.filter(t => t === 225).length;

            const avgThrow = (() => {
                if (allThrows.length === 0) return 0;
                const totalPoints = allThrows.reduce((sum, t) => {
                    const prefix = Number(String(t)[0]);
                    const value = Number(String(t).slice(1));
                    if (prefix === 1) return sum + value; // Single
                    if (prefix === 2) return sum + value * 2; // Double
                    if (prefix === 3) return sum + value * 3; // Triple
                    return sum; // Fallback
                }, 0);
                return totalPoints / allThrows.length; // Durchschnitt
            })();

            return {
                totalGames,
                wins,
                losses,
                throws,
                outs,
                nonOuts,
                avgThrow,
                doubleCount,
                tripleCount,
                triple20Count,
                bullseyeCount,
            };
        }
    );

    //--------------------------------------------TESTING FUNCTIONS!!-------------------------------------------------------
	function updateStats() {
        gameData.testaddRandomThrow(currentDay, Math.floor(Math.random() * 320)); // Mock: Add random throw
    }

    function updateStatsPre2W() {
        gameData.testaddRandomThrow(currentDay - 14, Math.floor(Math.random() * 320)); // Mock: Add random throw 14 days before today
    }

    function updateStatsPre6M() {
        gameData.testaddRandomThrow(currentDay - 150 , Math.floor(Math.random() * 320)); // Mock: Add random throw 150 days before today
    }

	function clearStats() {
		gameData.reset(); // Reset all data
    }
    //-----------------------------------------------------------------------------------------------------------------------
</script>

<div class="table-container border-token border-surface-400-500-token">
    <div class="flex items-center justify-between py-4 bg-primary-500 dark:bg-primary-800">
        <h3 class="h3 m-2 text-center flex-grow text-white bg-primary-500 dark:bg-primary-800">Your personal statistics</h3>
    </div>

    <!-- Border -->
    <div class="border-t-[0.5px] border-surface-400"></div>

    <!-- Dropdown for Timeframe -->
    <div class="flex w-full justify-center items-center py-2 dark:bg-surface-800">
        <label for="timeframe" class="mb-0.5 text-center mr-2 text-white">Timeframe:</label>
        <select
            id="timeframe"
            bind:value={$selectedTimeframe}
            class="ml-1 mt-1 mb-1 dark:bg-surface-800 text-sm text-white border rounded py-1"
        >
            <option class="ml-1" value="Last Week">Last Week</option>
            <option value="Last Month">Last Month</option>
            <option value="Last Year">Last Year</option>
            <option value="All Time">All Time</option>
        </select>
    </div>

    <table class="table table-hover rounded-t-none">
        <tbody>
            <tr class="border-t-[1px] border-surface-400">
                <td class="text-center w-1/2">Games Played:</td>
                <td class="text-center w-1/2">{$stats.totalGames ?? 0}</td>
            </tr>
            <tr>
                <td class="text-center w-1/2">Wins/Losses:</td>
                <td class="text-center w-1/2">{$stats.wins ?? 0}/{$stats.losses ?? 0}</td>
            </tr>
            <tr>
                <td class="text-center w-1/2">Throw Count:</td>
                <td class="text-center w-1/2">{$stats.throws ?? 0}</td>
            </tr>
            <tr>
                <td class="text-center w-1/2">Throw Average:</td>
                <td class="text-center w-1/2">{$stats.avgThrow ? $stats.avgThrow.toFixed(2) : "0.00"}</td>
            </tr>
            <tr>
                <td class="text-center w-1/2">Double Count:</td>
                <td class="text-center w-1/2">{$stats.doubleCount ?? 0}</td>
            </tr>
            <tr>
                <td class="text-center w-1/2">Triple Count:</td>
                <td class="text-center w-1/2">{$stats.tripleCount ?? 0}</td>
            </tr>
            <tr>
                <td class="text-center w-1/2">Triple20 Count:</td>
                <td class="text-center w-1/2">{$stats.triple20Count ?? 0}</td>
            </tr>
            <tr>
                <td class="text-center w-1/2">Bullseye Count:</td>
                <td class="text-center w-1/2">{$stats.bullseyeCount ?? 0}</td>
            </tr>
        </tbody>
    </table>
</div>

<!-- ----------------------------------------TESTING BUTTONS!!---------------------------------------------------- -->
<div class="m-4 flex justify-center">
    <button class="m-2 text-sm btn-icon-xl border p-4" type="button" on:click={updateStats}>
        +1 Heute
    </button>
    <button class="m-2 text-sm btn-icon-xl border p-4" type="button" on:click={updateStatsPre2W}>
        +1 vor 2 W.
    </button>
    <button class="m-2 text-sm btn-icon-xl border p-4" type="button" on:click={updateStatsPre6M}>
        +1 vor 6 M.
    </button>
</div>
<!-- ------------------------------------------------------------------------------------------------------------- -->

<div class="sticky bottom-5 flex flex-row justify-center gap-5 mt-8">
	<button class="btn-icon btn-icon-xl variant-filled-error" type="button" on:click={() => { goto('/'); }}>
		<LogOutIcon/>
	</button>
</div>
