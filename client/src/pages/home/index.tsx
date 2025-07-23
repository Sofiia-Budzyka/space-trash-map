import { Line, OrbitControls, Stars } from "@react-three/drei";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { useQuery } from "@tanstack/react-query";
import { Suspense, useEffect, useRef, useState } from "react";
import { useClickAway } from "react-use";
import { AdditiveBlending, Group, TextureLoader, Vector3 } from "three";

import { cn } from "@/shared/lib";
import {
    AlertDialog,
    AlertDialogContent,
    Button,
    Checkbox,
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/shared/ui";

import { type SpaceObject, getSpaceObjects } from "@/entities/space-object";

interface SpaceObjecttProps extends SpaceObject {
    onClick: () => void;
}

interface OrbitPathProps {
    orbitPoints: [number, number, number][];
    sphereRadius?: number;
    highlighted?: boolean;
}

const objectColor = {
    debris: "red",
    satellite: "green",
};

const objectTypes = ["debris", "satellite"];

export default function Globe({
    spaceObjects,
}: {
    spaceObjects?: SpaceObject[];
}) {
    const sphereRadius = 2;
    const earthRadiusKm = 6371;
    const scaleFactor = sphereRadius / earthRadiusKm;

    const [open, setOpen] = useState(false);
    const [selectedObject, setSelectedObject] = useState<SpaceObject | null>(
        null,
    );
    const [targetPosition, setTargetPosition] = useState<Vector3 | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const setScaledTragetPosition = (obj?: SpaceObject) => {
        if (!obj) return;

        const scaledPosition = new Vector3(
            obj.position[0] * scaleFactor,
            obj.position[1] * scaleFactor,
            obj.position[2] * scaleFactor,
        );

        setTargetPosition(scaledPosition);
    };

    const handleObjectClick = (obj: SpaceObject) => {
        setOpen(true);
        setSelectedObject(obj);
        setScaledTragetPosition(obj);
    };

    const handleReset = () => {
        setTargetPosition(null);
        setSelectedObject(null);
    };

    const handleStopFocus = () => {
        setOpen(false);
        handleReset();
    };

    const handleSubmit = () => {
        handleStopFocus();
    };

    useEffect(() => {
        const obj = spaceObjects?.find(obj => obj.id === selectedObject?.id)!;

        setScaledTragetPosition(obj);
    }, [spaceObjects]);

    useClickAway(modalRef, () => {
        handleReset();
        handleStopFocus();
    });

    return (
        <>
            <Canvas camera={{ position: [0, 0, 5] }}>
                <Suspense fallback={null}>
                    <Scene
                        spaceObjects={spaceObjects}
                        targetPosition={targetPosition}
                        selectedObject={selectedObject}
                        onObjectClick={handleObjectClick}
                    />
                    <Stars fade />
                </Suspense>
            </Canvas>
            <AlertDialog open={open}>
                <AlertDialogContent
                    ref={modalRef}
                    className="bottom-6 left-1/2 w-11/12 -translate-x-1/2"
                >
                    <div className="flex flex-col justify-between gap-4 px-4 pb-4">
                        <div className="flex items-center gap-2 border-b border-neutral-400 py-3">
                            <div className="flex items-center">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="size-9 cursor-pointer active:bg-neutral-300"
                                    onClick={handleStopFocus}
                                >
                                    <span className="material-symbols-outlined filled text-xl!">
                                        arrow_back_ios_new
                                    </span>
                                </Button>
                                <h3 className="px-2 font-bold">
                                    {selectedObject?.name}
                                </h3>
                            </div>
                            <div
                                className={cn(
                                    "flex h-6 items-center rounded-full px-3 text-sm leading-none",
                                    {
                                        "bg-red-200 text-red-800":
                                            objectColor[
                                                selectedObject?.type || "debris"
                                            ] === "red",
                                        "bg-green-200 text-green-800":
                                            objectColor[
                                                selectedObject?.type || "debris"
                                            ] === "green",
                                    },
                                )}
                            >
                                {selectedObject?.type}
                            </div>
                        </div>
                        <div className="px-2">
                            {selectedObject?.description}
                        </div>
                        <Button
                            className="h-12 cursor-pointer rounded-xl shadow-xl shadow-black/10 active:bg-neutral-800"
                            onClick={handleSubmit}
                        >
                            Details
                        </Button>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
            {/* <Modal open={open} setOpen={setOpen} onClickAway={handleReset}>
                <div className="flex flex-col justify-between gap-4 px-4 pb-4">
                    <div className="flex items-center gap-2 border-b border-neutral-400 py-3">
                        <div className="flex items-center">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="size-9 cursor-pointer active:bg-neutral-300"
                                onClick={handleStopFocus}
                            >
                                <span className="material-symbols-outlined filled text-xl!">
                                    arrow_back_ios_new
                                </span>
                            </Button>
                            <h3 className="px-2 font-bold">
                                {selectedObject?.name}
                            </h3>
                        </div>
                        <div
                            className={cn(
                                "flex h-6 items-center rounded-full px-3 text-sm leading-none",
                                {
                                    "bg-red-200 text-red-800":
                                        objectColor[
                                            selectedObject?.type || "debris"
                                        ] === "red",
                                    "bg-green-200 text-green-800":
                                        objectColor[
                                            selectedObject?.type || "debris"
                                        ] === "green",
                                },
                            )}
                        >
                            {selectedObject?.type}
                        </div>
                    </div>
                    <div className="px-2">{selectedObject?.description}</div>
                    <Button
                        className="h-12 cursor-pointer rounded-xl shadow-xl shadow-black/10 active:bg-neutral-800"
                        onClick={handleSubmit}
                    >
                        Details
                    </Button>
                </div>
            </Modal> */}
        </>
    );
}

function Scene({
    spaceObjects,
    targetPosition,
    selectedObject,
    onObjectClick,
}: {
    spaceObjects?: SpaceObject[];
    targetPosition: Vector3 | null;
    selectedObject: SpaceObject | null;
    onObjectClick: (obj: SpaceObject) => void;
}) {
    const controlsRef = useRef<any>(null);
    const { camera } = useThree();

    useFrame(() => {
        if (targetPosition && controlsRef.current) {
            const desiredPosition = targetPosition
                .clone()
                .normalize()
                .multiplyScalar(3.5);
            camera.position.lerp(desiredPosition, 0.05);
            controlsRef.current.target.lerp(targetPosition, 0.05);
            controlsRef.current.update();
        } else {
            controlsRef.current.target.lerp(new Vector3(0, 0, 0), 0.05);
            controlsRef.current.update();
        }
    });

    return (
        <>
            <Earth />
            {spaceObjects?.map(obj =>
                obj.position && obj.orbit ? (
                    <group key={obj.id}>
                        <OrbitPath
                            orbitPoints={obj.orbit}
                            highlighted={selectedObject?.id === obj.id}
                        />
                        <SpaceObjectt
                            {...obj}
                            position={obj.position} // add this line explicitly
                            onClick={() => onObjectClick(obj)}
                        />
                    </group>
                ) : null,
            )}
            <OrbitControls ref={controlsRef} />
        </>
    );
}

function Earth() {
    const texture = useLoader(TextureLoader, "/earth.jpg");

    return (
        <mesh>
            <sphereGeometry args={[2, 64, 64]} />
            <meshStandardMaterial map={texture} />
            <ambientLight intensity={2} />
        </mesh>
    );
}

export function SpaceObjectt({
    position,
    type,
    onClick,
}: SpaceObjecttProps & { position: [number, number, number] }) {
    const sphereRadius = 2;
    const earthRadiusKm = 6371;
    const scaleFactor = sphereRadius / earthRadiusKm;

    const groupRef = useRef<Group>(null!);
    const targetPos = useRef(new Vector3());
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (!position || !groupRef.current) return;

        targetPos.current.set(...position).multiplyScalar(scaleFactor);
        groupRef.current.position.copy(targetPos.current);
        setInitialized(true);
    }, [position, scaleFactor]);

    useFrame(() => {
        if (!position || !groupRef.current) return;
        if (!initialized) return;

        targetPos.current.set(...position).multiplyScalar(scaleFactor);

        groupRef.current.position.lerp(targetPos.current, 0.01);
    });

    return (
        <group ref={groupRef} onClick={onClick}>
            <mesh>
                <sphereGeometry args={[0.125, 16, 16]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            <mesh>
                <sphereGeometry args={[0.03, 16, 16]} />
                <meshBasicMaterial color={objectColor[type]} />
            </mesh>
            <mesh>
                <sphereGeometry args={[0.06, 16, 16]} />
                <meshBasicMaterial
                    color={objectColor[type]}
                    transparent
                    opacity={0.25}
                    blending={AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
}

export function OrbitPath({
    orbitPoints,
    sphereRadius = 2,
    highlighted = false,
}: OrbitPathProps) {
    const earthRadiusKm = 6371;
    const scaleFactor = sphereRadius / earthRadiusKm;

    const scaledPoints: [number, number, number][] = orbitPoints.map(p => [
        p[0] * scaleFactor,
        p[1] * scaleFactor,
        p[2] * scaleFactor,
    ]);

    return (
        <Line
            points={scaledPoints}
            color={highlighted ? "yellow" : "white"}
            lineWidth={highlighted ? 2 : 1}
            transparent
            opacity={highlighted ? 1 : 0.4}
        />
    );
}

export const HomePage = () => {
    const {
        data: spaceObjects,
        error,
        isLoading,
    } = useQuery({
        queryKey: ["space-objects"],
        queryFn: getSpaceObjects,
        refetchInterval: 1000,
    });

    const [open, setOpen] = useState(false);
    const [debrisAmount, setDebrisAmount] = useState(0);
    const [satelliteAmount, setSatelliteAmount] = useState(0);
    const [objectAmountMap, setObjectAmountMap] = useState<{
        [key: string]: number;
    }>({ debris: debrisAmount, satellite: satelliteAmount });
    const [appliedFilters, setAppliedFilters] = useState<string[]>([
        "debris",
        "satellite",
    ]);
    const [upcomingFilters, setUpcomingFilters] =
        useState<string[]>(appliedFilters);
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!spaceObjects) return;

        const newDebrisAmount = spaceObjects.filter(
            obj => obj.type === "debris",
        ).length;
        const newSatelliteAmount = spaceObjects.length - newDebrisAmount;

        setDebrisAmount(newDebrisAmount);
        setSatelliteAmount(newSatelliteAmount);

        setObjectAmountMap({
            debris: newDebrisAmount,
            satellite: newSatelliteAmount,
        });
    }, [spaceObjects]);

    const filteredSpaceObjects = spaceObjects?.filter(obj =>
        appliedFilters.includes(obj.type),
    );

    useClickAway(popupRef, () => {
        setOpen(false);
    });

    if (isLoading) return <div>Loading...</div>;

    if (error instanceof Error) return <div>Error: {error.message}</div>;

    return (
        <div className="h-screen w-screen bg-black">
            <header className="fixed top-6 left-1/2 z-50 flex h-14 w-11/12 -translate-x-1/2 items-center justify-between rounded-2xl border border-neutral-400 bg-white pl-4 shadow-xl shadow-white/20 md:w-1/3 dark:bg-neutral-800">
                <div className="flex items-center gap-2">
                    <div className="size-7 rounded-md bg-black dark:bg-neutral-200" />
                    <span className="font-bold">Space Trash Map</span>
                </div>
                <Popover open={open}>
                    <PopoverTrigger asChild>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="mr-4 size-9 cursor-pointer active:bg-neutral-300"
                            onClick={() => setOpen(true)}
                        >
                            <span className="material-symbols-outlined filled text-xl!">
                                filter_list
                            </span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        ref={popupRef}
                        align="end"
                        className="mt-4 -mr-4 flex w-52 flex-col pt-4 pb-2"
                    >
                        <div className="flex flex-col gap-4">
                            <p className="px-4 font-bold">Filters</p>
                            <div className="flex flex-col gap-2">
                                <p className="px-4 text-[12px] font-medium text-neutral-600">
                                    OBJECT TYPE
                                </p>
                                <div className="flex flex-col">
                                    {objectTypes.map(type => (
                                        <div
                                            key={type}
                                            className="flex cursor-pointer items-center gap-2 px-4 py-2"
                                            onClick={() =>
                                                setUpcomingFilters(
                                                    upcomingFilters.includes(
                                                        type,
                                                    )
                                                        ? upcomingFilters.filter(
                                                              filter =>
                                                                  type !==
                                                                  filter,
                                                          )
                                                        : [
                                                              ...upcomingFilters,
                                                              type,
                                                          ],
                                                )
                                            }
                                        >
                                            <Checkbox
                                                checked={upcomingFilters.includes(
                                                    type,
                                                )}
                                            />
                                            <p>
                                                {type} ({objectAmountMap[type]})
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Button
                                className="mx-4 cursor-pointer"
                                onClick={() => {
                                    setAppliedFilters(upcomingFilters);
                                    setOpen(false);
                                }}
                            >
                                Apply
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </header>
            <Globe spaceObjects={filteredSpaceObjects} />
        </div>
    );
};
