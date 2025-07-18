export enum IdentificationStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    UNSPECIFIED = "UNSPECIFIED",
}

export enum IdentificationMethod {
    BIOMETRIC = 'BIOMETRIC',
    ID_CARD = 'ID_CARD',
    PASSPORT = 'PASSPORT',
    UNSPECIFIED = "UNSPECIFIED"
}

export class Identification {
    id: string;
    status: IdentificationStatus;
    nationality: string;
    method: IdentificationMethod;
    id_number: string;
    full_name: string;
}
