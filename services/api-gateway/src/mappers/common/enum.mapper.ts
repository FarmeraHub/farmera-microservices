import { MessageType as GrpcMessageType } from "@farmera/grpc-proto/dist/common/enums";
import { MessageType } from "src/communication/enums/message-type.enums";

export class EnumMapper {
    static fromGrpcMessageType(value: GrpcMessageType | undefined): MessageType | undefined {
        if (!value) return undefined;
        switch (value.toString()) {
            case "MEDIA": return MessageType.MEDIA;
            case "MESSAGE": return MessageType.MESSAGE;
            default: return MessageType.MESSAGE_TYPE_UNSPECIFIED;
        }
    }
}