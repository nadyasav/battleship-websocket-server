import { INDEX_LAST_FIELD_CELL } from "./constants";

export const isXYInField = (x: number, y: number): boolean => (
    y >= 0 && x >= 0 && y <= INDEX_LAST_FIELD_CELL && x <= INDEX_LAST_FIELD_CELL
)
