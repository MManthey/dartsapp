import { writable } from "svelte/store";

function createGameDataStore() {
    const isBrowser = typeof window !== "undefined";

    // Lade die gespeicherten Daten oder initialisiere mit leeren Daten
    let initialData = isBrowser ? JSON.parse(localStorage.getItem("gameData") || "[]") : [];

    const { subscribe, set, update } = writable(initialData);

    if (isBrowser) {
        subscribe(value => {
            localStorage.setItem("gameData", JSON.stringify(value));
        });
    }

    return {
        subscribe,
        reset: () => set([]), // Setzt die Daten zurück
        testaddRandomThrow: (date: number, throwValue: number) =>
            update(data => {
                // Suche nach dem aktuellen Tag
                let todayIndex = data.findIndex(day => day[0] === date);

                if (todayIndex === -1) {
                    // Neuer Tag hinzufügen
                    const newDay = [date, 0, 0, 0, 0, throwValue];
                    return [...data, newDay];
                } else {
                    // Existierender Tag: Wurf hinzufügen
                    const updatedDay = [...data[todayIndex]];
                    updatedDay.push(throwValue);
                    data[todayIndex] = updatedDay;
                    return [...data];
                }
            }),
    };
}


// Detailled Info     -----------------------------!THIS IS IMPORTANT TO UNDERSTAND THE STORE!----------------------------
//  JSON Format: [ day, day, day, day... ]
//      day: [ date, winCount, lossCount, outs, nonOuts, throw1, throw2, throw3, ..., throwN ]
//          date (Index 0): number -> 0 represents 01.01.2024; 1 - 02.01.2024; ... ; 366 - 01.01.2025 (one more because Schaltjahr!!!); etc.
//          winCount (Index 1): number
//          lossCount (Index 2): number
//          outs (Index 3): number -> How many throws were the one that brought the own points to 0
//          nonOuts (Index 4): number -> how many throws COULD have been outs but were not hit (over/ under)
//          throw (From Index 5): number -> First charater for Single/ Double/ Triple, rest is the hit number: 
//                           11 represents Single 1; 320 - Triple 20; 125 Single Bull, 225 - Bullseye
export const gameData = createGameDataStore();