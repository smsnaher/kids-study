import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a UUID4 string with the specified length
 * @param length - The desired length of the UUID (default: 9)
 * @returns A UUID4 string truncated to the specified length
 */
export const getUUID = (length: number = 9): string => {
    return uuidv4().replace(/-/g, '').slice(0, length);
};
