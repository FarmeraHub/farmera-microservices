import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class NewConversation {
    @IsString()
    @IsNotEmpty()
    title: string;
}

export class NewPrivateConversation {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsUUID()
    @IsNotEmpty()
    other_user_id: string
}