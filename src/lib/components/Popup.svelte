<script lang="ts">

    export let isOpen = false;
    export let onClose: () => void;
    import { training } from '$lib/stores';

    // Event-Handler für das Schließen des Modals
    function handleOverlayClick() {
        onClose();
    }


    // Mit $training greifst du auf das aktuelle trainingForm im Store zu
    function getThrows() {
        if ($training !== null) {
            return ($training as Cricket).throws;
        } else {
            return 0;
        }
    }
</script>

{#if isOpen}
    <div class="overlay" on:click={handleOverlayClick}>
        <div class="cricketPopup">
        <div class="text-3xl my-6 mx-6">
            Training beendet!
        </div>
        <div class="text-2xl my-6 mx-6">
            Du hast insgesamt {getThrows()} Würfe gebraucht.
        </div>
    </div>
    </div>
{/if}