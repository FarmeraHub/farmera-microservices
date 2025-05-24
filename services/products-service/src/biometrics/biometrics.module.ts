import { Module } from '@nestjs/common';
import { BiometricsService } from './biometrics.service';
import { HttpModule } from '@nestjs/axios'; 
@Module({
  imports: [HttpModule], 
  controllers: [],
  providers: [BiometricsService],
  exports:[BiometricsService],
})
export class BiometricsModule {}