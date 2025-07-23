import { API_BASE_URL } from "@/shared/api";

import type { SpaceObject } from "../model/types";

export const getSpaceObjects = async (): Promise<SpaceObject[]> => {
    const response = await fetch(`${API_BASE_URL}/space-objects`, {
        method: "GET",
    }); // TODO: replace with actual route

    if (!response.ok) {
        throw new Error("Unknown error occured while fetching space objects");
    }

    return response.json();
};
