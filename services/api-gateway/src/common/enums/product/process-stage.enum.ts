export enum ProcessStage {
    START = "START", // Preparation e.g planting, seeding, etc.
    PRODUCTION = "PRODUCTION", // Production e.g growing, harvesting, etc.
    COMPLETION = "COMPLETION" // Completion e.g packaging, etc.
}

export enum ProcessStageOrder {
    START = 1,
    PRODUCTION = 2,
    COMPLETION = 3
}