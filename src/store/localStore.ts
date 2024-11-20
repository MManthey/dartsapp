import { writable, type Writable } from 'svelte/store';

function createPersistentStore<T>(key: string, initialValue: T): Writable<T> {
    const isBrowser = typeof window !== 'undefined';

    // Standardwert auf initialValue setzen
    let storedValue: T = initialValue;

    if (isBrowser) {
        // Nur im Browser zugreifen, um Fehler zu vermeiden
        const json = localStorage.getItem(key);
        if (json) {
            try {
                storedValue = JSON.parse(json);
            } catch (e) {
                console.error(`Fehler beim Laden des localStorage für ${key}:`, e);
                localStorage.removeItem(key); // Lösche fehlerhafte Daten
            }
        }
    }

    const store = writable<T>(storedValue);

    if (isBrowser) {
        // Speichern der aktuellen Werte im localStorage
        store.subscribe(value => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error(`Fehler beim Speichern von ${key} in localStorage:`, e);
            }
        });
    }

    return store;
}

export const userStats = createPersistentStore('userStats', { gamesPlayed: 0, highScore: 0 });
