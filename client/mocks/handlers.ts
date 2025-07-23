import { LoremIpsum } from "lorem-ipsum";
import { HttpResponse, http } from "msw";

const SEGMENTS = 1024;

const lorem = new LoremIpsum();

function random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

function generateMockOrbit() {
    const inclinationDeg = random(0, 180); // keep inclination realistic
    const ascendingNodeDeg = random(0, 360); // RAAN
    const argOfPerigeeDeg = random(0, 360); // argument of perigee

    const a = random(6500, 7500); // semi-major axis [km]

    const orbit: [number, number, number][] = [];

    // Convert to radians
    const inc = (inclinationDeg * Math.PI) / 180;
    const raan = (ascendingNodeDeg * Math.PI) / 180;
    const argPerigee = (argOfPerigeeDeg * Math.PI) / 180;

    // Combined rotation matrix: R = Rz(RAAN) * Rx(inc) * Rz(argPerigee)
    const cosRAAN = Math.cos(raan);
    const sinRAAN = Math.sin(raan);
    const cosInc = Math.cos(inc);
    const sinInc = Math.sin(inc);
    const cosArg = Math.cos(argPerigee);
    const sinArg = Math.sin(argPerigee);

    for (let i = 0; i <= SEGMENTS; i++) {
        const theta = (i / SEGMENTS) * 2 * Math.PI;

        // Orbital plane coordinates
        const xOrb = a * Math.cos(theta);
        const yOrb = a * Math.sin(theta);
        const zOrb = 0;

        // Rotate about Z by argument of perigee
        const x1 = xOrb * cosArg - yOrb * sinArg;
        const y1 = xOrb * sinArg + yOrb * cosArg;
        const z1 = zOrb;

        // Rotate about X by inclination
        const x2 = x1;
        const y2 = y1 * cosInc - z1 * sinInc;
        const z2 = y1 * sinInc + z1 * cosInc;

        // Rotate about Z by RAAN
        const x3 = x2 * cosRAAN - y2 * sinRAAN;
        const y3 = x2 * sinRAAN + y2 * cosRAAN;
        const z3 = z2;

        orbit.push([x3, y3, z3]);
    }

    return orbit;
}

let objects = Array.from({ length: 5 }).map((_, i) => {
    const orbit = generateMockOrbit();
    return {
        id: i + 1,
        name: `Object-${i + 1}`,
        description: lorem.generateWords(15),
        type: Math.random() > 0.5 ? "satellite" : "debris",
        orbit,
        orbitIndex: 0,
        position: orbit[0],
    };
});

export const handlers = [
    http.get("/api/space-objects", () => {
        objects = objects.map(obj => {
            const nextIndex = (obj.orbitIndex + 1) % SEGMENTS;
            return {
                ...obj,
                orbitIndex: nextIndex,
                position: obj.orbit[nextIndex],
            };
        });

        return HttpResponse.json(objects);
    }),
];
