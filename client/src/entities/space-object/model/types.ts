export type SpaceObjectType = "debris" | "satellite";

export interface SpaceObject {
    id: Id;
    name: string;
    description: string;
    type: SpaceObjectType;
    position: [number, number, number];
    orbit: [number, number, number][];
}
