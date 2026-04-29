/**
 * Utility function to sort an array of strings
 * @param {string[]} array - The input array to be sorted.
 * @param {'Ascending' | 'Descending'} direction - The sorting direction.
 * @param {boolean} [isNumeric=False] - Set to true if the strings contain numeric values that require logical sorting (e.g., ensuring 'EMP2' comes before 'EMP10').
 * @returns {string[]} A new, sorted array based on the specified parameters.
 */

export function getExpectedSortedArray(array: string[], direction: 'Ascending' | 'Descending', isNumeric: boolean = false): string[] {
    return [...array].sort((a, b) => {
        if (direction === 'Ascending') {
            return a.localeCompare(b, undefined, { numeric: isNumeric, sensitivity: 'base' });
        } else {
            return b.localeCompare(a, undefined, { numeric: isNumeric, sensitivity: 'base' });
        }
    })
}