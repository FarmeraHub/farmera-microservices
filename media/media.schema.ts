import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { MediaType } from 'src/enums/media-type.enum';
import { User } from 'src/users/users.schema';

export type MediaDocument = Media & Document;

class CreatedBy {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  _id: mongoose.Schema.Types.ObjectId;
  @Prop()
  email: string;
}

@Schema({
  timestamps: true,
  //   toJSON: { virtuals: true, getters: true },
  //   toObject: { virtuals: true, getters: true },
})
export class Media {
  _id: mongoose.Schema.Types.ObjectId;

  @Prop()
  name: string;

  @Prop()
  src: string;

  @Prop()
  groupType: MediaType;

  @Prop()
  createdBy: CreatedBy;
}

export const MediaSchema = SchemaFactory.createForClass(Media);
