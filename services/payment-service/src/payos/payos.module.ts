import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { PayOSService } from "./payos.service";

@Module({
    imports: [
        HttpModule, 
    ],
    providers: [PayOSService],
    exports: [PayOSService],
})
export class PayOSModule { }