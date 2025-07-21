import { BadRequestException } from "@nestjs/common";

export class Decoder {
    static encodeCursor(payload: string): string {
        return Buffer.from(payload).toString('base64');
    }

    static decodeCursor(cursor: string): string {
        try {
            return Buffer.from(cursor, 'base64').toString('utf8');
        } catch (err) {
            throw new BadRequestException('Invalid cursor');
        }
    }
}