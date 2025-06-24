import { Module } from "@nestjs/common";
import { GhnService } from "./ghn.service";
import { GhnController } from "./ghn.controller";
import { HttpModule } from "@nestjs/axios";

@Module({
    imports: [HttpModule],
    controllers: [GhnController],
    providers: [GhnService],
    exports: [GhnService],
})
export class GhnModule { }
