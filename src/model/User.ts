import { model, Schema } from 'mongoose';

function createMap() {
    return new Map();
}

const reminderSchema = new Schema({
    drop: { type: Boolean, default: false },
});

const userSchema = new Schema({
    id: { type: String, required: true },
    seriesIds: { type: Map, of: Boolean, required: true, default: createMap },
    guildIds: { type: Map, of: Boolean, required: true, default: createMap },
    globalIds: { type: Map, of: String, required: true, default: createMap },
    reminder: { type: reminderSchema, required: true, default: {} },
}, { timestamps: true });

export const User = model('User', userSchema);
