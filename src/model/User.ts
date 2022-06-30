import { model, Schema } from 'mongoose';

const userSchema = new Schema({
    id: { type: String, required: true },
    seriesIds: { type: Map, of: Boolean, required: true },
    guildIds: { type: Map, of: Boolean, required: true },
    globalIds: { type: Map, of: String, required: true },
}, { timestamps: true });

export const User = model('User', userSchema);
