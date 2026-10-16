import type { Exercise, Profile } from "./training";
export type EquipmentKey = typeof equipmentChoices[number][0];
export type EquipmentInventory = {
    confirmed: boolean;
    items: EquipmentKey[];
    dumbbells: 'none' | 'single' | 'pair';
    dumbbellLoading: 'fixed' | 'adjustable';
};
export type MovementRole = 'horizontal-press' | 'incline-press' | 'vertical-press' | 'horizontal-pull' | 'vertical-pull' | 'squat' | 'split-squat' | 'hinge' | 'hip-extension' | 'knee-flexion' | 'knee-extension' | 'calf' | 'elbow-flexion' | 'elbow-extension' | 'lateral-raise' | 'chest-fly' | 'rear-shoulder' | 'face-pull' | 'anti-extension' | 'anti-rotation' | 'opposite-limb-control' | 'jump-landing';
export type Movement = { role: MovementRole; needs: EquipmentKey[]; muscles: string[]; dumbbells?: 1 | 2; floor?: boolean; difference?: string };
declare let equipmentChoices: string[][];
declare let emptyInventory: () => EquipmentInventory;
/** Setup presets are editable suggestions; confirmation is still the owner's choice. */
declare function defaultInventory(equipment?: string): EquipmentInventory;
declare let movementRoles: Record<string, Movement>;
declare function inventoryErrors(p: Profile): string[];
declare function equipmentFit(e: Exercise, p?: Profile): {
    available: boolean;
    known: boolean;
    reason: string;
};
declare function sameFunctionIds(id: string): string[];
declare function prescriptionAlternatives(id: string, p: Profile): string[];
declare function equipmentSummary(exercises: Exercise[], p: Profile): string[];
declare function recoveryGroupsOverlap(a?: string, b?: string): boolean;
export { equipmentChoices };
export { emptyInventory };
export { defaultInventory };
export { movementRoles };
export { inventoryErrors };
export { equipmentFit };
export { sameFunctionIds };
export { prescriptionAlternatives };
export { equipmentSummary };
export { recoveryGroupsOverlap };
