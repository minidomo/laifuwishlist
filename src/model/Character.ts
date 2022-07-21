import { model, Schema } from 'mongoose';

const rankSchema = new Schema({
    lower: { type: Number, default: -1 },
    upper: { type: Number, default: -1 },
});

const rarityInfoSchema = new Schema({
    existingAmount: { type: Number, default: -1 },
    totalClaimed: { type: Number, default: -1 },
});

const rarityInfoCollectionSchema = new Schema({
    alpha: { type: rarityInfoSchema, default: {} },
    beta: { type: rarityInfoSchema, default: {} },
    delta: { type: rarityInfoSchema, default: {} },
    epsilon: { type: rarityInfoSchema, default: {} },
    gamma: { type: rarityInfoSchema, default: {} },
    ultra: { type: rarityInfoSchema, default: {} },
    zeta: { type: rarityInfoSchema, default: {} },
});

const titleSchema = new Schema({
    alternate: { type: String, default: '' },
    english: { type: String, default: '' },
});

const seriesSchema = new Schema({
    title: { type: titleSchema, default: {} },
    id: { type: Number, default: -1 },
    sequence: { type: String, default: '' },
});

const characterSchema = new Schema(
    {
        name: { type: String, default: '' },
        id: { type: Number, required: true },
        influence: { type: Number, default: -1 },
        series: { type: seriesSchema, default: {} },
        rank: { type: rankSchema, default: {} },
        rarities: { type: rarityInfoCollectionSchema, default: {} },
        totalImages: { type: Number, default: -1 },
    },
    { timestamps: true },
);

export const Character = model('Character', characterSchema);
