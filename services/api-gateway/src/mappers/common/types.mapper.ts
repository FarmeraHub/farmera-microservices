import { Timestamp as GrpcTimestamp, ProductOptions as GrpcProductOptions, NotificationEmail, NotificationAttachment, StringMap } from "@farmera/grpc-proto/dist/common/types"
import { Attachment, Email } from "src/notification/notification/entities/email.entity";
import { ProductOptions } from "src/product/product/dto/product-options.dto";

export class TypesMapper {
    // Convert Date to GrpcTimestamp
    static toGrpcTimestamp(date: Date | string | undefined | null): GrpcTimestamp | undefined {
        if (!date) return undefined;

        const dateObj = date instanceof Date ? date : new Date(date);

        if (isNaN(dateObj.getTime())) {
            throw new Error(`Invalid date: ${date}`);
        }

        return {
            value: {
                seconds: Math.floor(dateObj.getTime() / 1000),
                nanos: (dateObj.getTime() % 1000) * 1000000,
            },
        };
    }


    // Convert GrpcTimestamp to Date
    static fromGrpcTimestamp(timestamp: GrpcTimestamp): Date | undefined {
        if (!timestamp?.value) return undefined;
        return new Date(
            timestamp.value.seconds * 1000 + timestamp.value.nanos / 1000000,
        );
    }

    static toGrpcProductOptions(value?: ProductOptions): GrpcProductOptions | undefined {
        if (!value) return undefined;
        return {
            include_farm: value.include_farm,
            include_categories: value.include_categories,
            include_processes: value.include_processes,
        }
    }

    static toGrpcStringMap(value?: { [key: string]: string }): StringMap | undefined {
        if (!value?.values) return undefined;
        return {
            values: value
        }
    }

    static toGrpcNotificationEmail(value: Email): NotificationEmail {
        return {
            email: value.email,
            name: value.name,
        }
    }

    static toGrpcNotificationAttachment(value: Attachment): NotificationAttachment {
        return {
            content: value.content,
            filename: value.filename,
            mime_type: value.mime_type,
            disposition: value.disposition,
        }
    }
}