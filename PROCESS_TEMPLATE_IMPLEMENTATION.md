# Process Template System Implementation

## Overview

This document outlines the implementation of the Process Template System for the Farmera agricultural e-commerce platform. The system allows farmers to create process templates with custom steps, assign products to these processes, and track progress through step-based diary entries.

## Architecture

### 1. Data Models

#### ProcessTemplate

Standalone process templates that farmers can create and reuse.

```typescript
interface ProcessTemplate {
  process_id: number;
  process_name: string;
  description: string;
  farm_id: string;
  estimated_duration_days?: number;
  is_active: boolean;
  steps: ProcessStep[];
  step_count?: number; // virtual field
  created: Date;
  updated: Date;
}
```

#### ProcessStep

Individual steps within a process template.

```typescript
interface ProcessStep {
  step_id: number;
  process_id: number;
  step_order: number;
  step_name: string;
  step_description: string;
  is_required: boolean;
  estimated_duration_days?: number;
  instructions?: string;
  created: Date;
}
```

#### ProductProcessAssignment

Links products to process templates (1:many relationship).

```typescript
interface ProductProcessAssignment {
  assignment_id: number;
  product_id: number;
  process_id: number;
  assigned_date: Date;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  current_step_order?: number;
  completion_percentage: number;
  start_date?: Date;
  target_completion_date?: Date;
  actual_completion_date?: Date;
  created: Date;
  updated: Date;
}
```

#### StepDiaryEntry

Step-based diary entries with completion tracking.

```typescript
interface StepDiaryEntry {
  diary_id: number;
  assignment_id: number;
  step_id: number;
  product_id: number;
  step_name: string;
  step_order: number;
  notes: string;
  completion_status: "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
  image_urls: string[];
  video_urls: string[];
  recorded_date: Date;
  latitude?: number;
  longitude?: number;
  weather_conditions?: string;
  quality_rating?: number; // 1-5 stars
  issues_encountered?: string;
  additional_data?: Record<string, any>;
  created: Date;
  updated: Date;
}
```

### 2. API Endpoints

#### Process Template Management

- `POST /api/process-template` - Create process template
- `GET /api/process-template/farm` - Get all templates for user's farm
- `GET /api/process-template/:id` - Get specific template with steps
- `PUT /api/process-template/:id` - Update template and steps
- `DELETE /api/process-template/:id` - Delete template (if not assigned)

#### Process Steps Management

- `GET /api/process-template/:id/steps` - Get all steps for a template
- `PUT /api/process-template/:id/steps/reorder` - Reorder steps

#### Product-Process Assignment

- `POST /api/process-template/product/:productId/assign` - Assign product to process
- `GET /api/process-template/product/:productId/assignment` - Get active assignment
- `DELETE /api/process-template/product/:productId/assignment` - Unassign product

#### Step-Based Diary

- `POST /api/diary/step` - Create step diary entry
- `GET /api/diary/product/:productId/step/:stepId` - Get diaries for specific step
- `GET /api/diary/product/:productId` - Get all diaries for product

### 3. Database Schema

#### Tables Created

1. `process_templates` - Store process templates
2. `process_steps` - Store process steps with ordering
3. `product_process_assignments` - Link products to processes
4. `step_diary_entries` - Store step-based diary entries

#### Key Features

- **Referential Integrity**: Proper foreign key constraints with cascade deletes
- **Unique Constraints**: One active assignment per product
- **Indexes**: Performance optimization for common queries
- **Triggers**: Auto-update timestamps
- **Enums**: Type safety for status fields

### 4. Business Logic

#### Process Template Lifecycle

1. **Creation**: Farmer creates template with initial steps
2. **Management**: Add/edit/reorder steps as needed
3. **Assignment**: Assign multiple products to template
4. **Tracking**: Monitor progress through diary entries
5. **Completion**: Mark assignment as completed

#### Validation Rules

- Process templates must have at least one step
- Only one active assignment per product
- Steps maintain order through `step_order` field
- Diary entries validate against assigned process steps
- Cannot delete templates with active assignments

#### Progress Tracking

- Automatic completion percentage calculation
- Current step tracking for each assignment
- Step completion status in diary entries
- Assignment status updates on completion

## Implementation Files

### Backend (products-service)

#### Entities

- `src/process/entities/process-template.entity.ts`
- `src/process/entities/process-step.entity.ts`
- `src/process/entities/product-process-assignment.entity.ts`
- `src/diary/entities/step-diary-entry.entity.ts`

#### Services

- `src/process/process-template.service.ts`
- `src/diary/step-diary.service.ts`

#### Controllers

- `src/process/process-template.controller.ts`
- `src/diary/step-diary.controller.ts`

#### DTOs

- `src/process/dto/create-process-template.dto.ts`
- `src/process/dto/update-process-template.dto.ts`
- `src/process/dto/assign-product-process.dto.ts`
- `src/diary/dto/create-step-diary.dto.ts`

#### Module Updates

- `src/process/process.module.ts` - Updated with new entities and services

### Database

- `migrations/create-process-templates.sql` - Complete migration script

### API Gateway

- `src/product/process-template/process-template.controller.ts`
- `src/product/process-template/process-template.service.ts`

## Usage Examples

### 1. Create Process Template

```typescript
const template = {
  process_name: "Trồng rau sạch",
  description: "Quy trình trồng rau sạch từ gieo hạt đến thu hoạch",
  estimated_duration_days: 90,
  steps: [
    {
      step_order: 1,
      step_name: "Chuẩn bị đất",
      step_description: "Làm đất, bón phân hữu cơ",
      estimated_duration_days: 3,
    },
    {
      step_order: 2,
      step_name: "Gieo hạt",
      step_description: "Gieo hạt giống đã tuyển chọn",
      estimated_duration_days: 1,
    },
  ],
};
```

### 2. Assign Product to Process

```typescript
const assignment = {
  process_id: 1,
  start_date: new Date(),
  target_completion_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
};
```

### 3. Create Step Diary Entry

```typescript
const diaryEntry = {
  assignment_id: 1,
  step_id: 1,
  product_id: 123,
  step_name: "Chuẩn bị đất",
  step_order: 1,
  notes: "Đã làm đất và bón phân hữu cơ",
  completion_status: "COMPLETED",
  recorded_date: new Date(),
  latitude: 10.7769,
  longitude: 106.7009,
  weather_conditions: "Nắng nhẹ",
  quality_rating: 5,
};
```

## Frontend Integration

### API Endpoint Changes

Update `lib/core/common/api/api_endpoints.dart`:

```dart
// Process Template endpoints
static const String processTemplateBase = '/process-template';
static const String getProcessTemplatesByFarm = '$processTemplateBase/farm';
static const String createProcessTemplate = processTemplateBase;
static const String getProcessTemplate = '$processTemplateBase/{id}';
static const String updateProcessTemplate = '$processTemplateBase/{id}';
static const String deleteProcessTemplate = '$processTemplateBase/{id}';

// Assignment endpoints
static const String assignProductToProcess = '$processTemplateBase/product/{productId}/assign';
static const String getProductAssignment = '$processTemplateBase/product/{productId}/assignment';

// Step diary endpoints
static const String createStepDiary = '/diary/step';
static const String getProductDiaries = '/diary/product/{productId}';
```

### Model Updates

Update `lib/core/data/models/process.dart` with the new models as designed.

## Deployment Steps

1. **Database Migration**

   ```bash
   # Run the migration script
   psql -d farmera_db -f migrations/create-process-templates.sql
   ```

2. **Backend Deployment**

   ```bash
   # Products service
   cd services/products-service
   npm install
   npm run build
   npm run start:prod
   ```

3. **API Gateway Update**

   ```bash
   # API Gateway
   cd services/api-gateway
   npm install
   npm run build
   npm run start:prod
   ```

4. **Frontend Integration**
   ```bash
   # Flutter app
   cd frontend
   flutter pub get
   dart run build_runner build --delete-conflicting-outputs
   ```

## Testing

### Unit Tests

- Service layer tests for business logic
- Controller tests for endpoint validation
- Repository tests for data operations

### Integration Tests

- End-to-end process template creation
- Product assignment workflows
- Diary entry creation and progress tracking

### API Testing

Use the following test scenarios:

1. Create process template with multiple steps
2. Assign product to process template
3. Create diary entries for each step
4. Verify progress tracking and completion

## Security Considerations

1. **Authorization**: All endpoints validate user ownership
2. **Data Validation**: Comprehensive DTO validation
3. **Referential Integrity**: Database constraints prevent orphaned records
4. **Access Control**: Users can only access their own farm's data

## Performance Optimizations

1. **Indexes**: Added for common query patterns
2. **Eager Loading**: Minimal relations loaded by default
3. **Pagination**: Ready for large datasets
4. **Caching**: Consider Redis for frequent template lookups

## Future Enhancements

1. **Template Sharing**: Allow farmers to share process templates
2. **Notifications**: Alert farmers about pending steps
3. **Analytics**: Track process efficiency and success rates
4. **Mobile Optimization**: Offline diary entry capabilities
5. **Integration**: Connect with IoT sensors for automatic data collection

## Support

For questions or issues with this implementation, contact the development team or refer to the project documentation.
