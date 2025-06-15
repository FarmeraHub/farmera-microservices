import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Subcategory } from './entities/subcategory.entity';
import { ProductSubcategoryDetail } from 'src/products/entities/product-subcategory-detail.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Subcategory, ProductSubcategoryDetail])
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [
    CategoriesService,
    TypeOrmModule,
  ],
})
export class CategoriesModule { }
