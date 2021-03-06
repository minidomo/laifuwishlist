import { model, Schema } from 'mongoose';

function createMap() {
    return new Map();
}

const reminderSchema = new Schema({
    drop: { type: Boolean, default: false },
    medal: { type: Boolean, default: false },
});

// TODO update schema
const gachaResultSchema = new Schema(
    {
        gachaType: { type: String, required: true, enum: ['badge', 'character'] },
        stonesUsed: { type: Number, required: true },
        globalId: { type: Number },
        uniqueId: { type: Number },
        rarity: { type: String },
        image: { type: Number },
        tier: { type: Number },
        badgeId: { type: Number },
        title: { type: String },
    },
    { timestamps: true },
);

const gachaHistorySchema = new Schema({
    enabled: { type: Boolean, required: true, default: false },
    history: { type: [gachaResultSchema], required: true },
});

const userSchema = new Schema(
    {
        id: { type: String, required: true },
        seriesIds: { type: Map, of: Boolean, required: true, default: createMap },
        guildIds: { type: Map, of: Boolean, required: true, default: createMap },
        globalIds: { type: Map, of: String, required: true, default: createMap },
        reminder: { type: reminderSchema, required: true, default: {} },
        gachaHistory: { type: gachaHistorySchema, required: true, default: {} },
    },
    { timestamps: true },
);

export const User = model('User', userSchema);
