import { model, Schema } from 'mongoose';

const influenceRankRangeSchema = new Schema({
    lower: { type: Number, required: true },
    upper: { type: Number, required: true },
});

const rarityInfoSchema = new Schema({
    existingAmount: { type: Number, required: true },
    totalClaimed: { type: Number, required: true },
});

const rarityInfoCollectionSchema = new Schema({
    alpha: { type: rarityInfoSchema, required: true },
    beta: { type: rarityInfoSchema, required: true },
    delta: { type: rarityInfoSchema, required: true },
    epsilon: { type: rarityInfoSchema, required: true },
    gamma: { type: rarityInfoSchema, required: true },
    ultra: { type: rarityInfoSchema, required: true },
    zeta: { type: rarityInfoSchema, required: true },
});

const titleSchema = new Schema({
    alternate: { type: String, required: true },
    english: { type: String, required: true },
});

const seriesSchema = new Schema({
    title: { type: titleSchema, required: true },
    id: { type: Number, required: true },
    sequence: { type: String, required: true },
});

const characterSchema = new Schema({
    name: { type: String, required: true },
    id: { type: Number, required: true },
    influence: { type: Number, required: true },
    influenceRankRange: { type: influenceRankRangeSchema, required: true },
    rarities: { type: rarityInfoCollectionSchema, required: true },
    series: { type: seriesSchema, required: true },
    totalImages: { type: Number, required: true },
}, { timestamps: true });

export const Character = model('Character', characterSchema);
