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

const raritiesDefault: BotTypes.RarityInfoCollectionSchema = {
    alpha: { existingAmount: 0, totalClaimed: 0 },
    beta: { existingAmount: 0, totalClaimed: 0 },
    delta: { existingAmount: 0, totalClaimed: 0 },
    epsilon: { existingAmount: 0, totalClaimed: 0 },
    gamma: { existingAmount: 0, totalClaimed: 0 },
    ultra: { existingAmount: 0, totalClaimed: 0 },
    zeta: { existingAmount: 0, totalClaimed: 0 },
};

const influenceRankRangeDefault: BotTypes.InfluenceRankRangeSchema = {
    lower: 0,
    upper: 0,
};

const characterSchema = new Schema(
    {
        name: { type: String, required: true },
        id: { type: Number, required: true },
        influence: { type: Number, required: true },
        series: { type: seriesSchema, required: true },
        influenceRankRange: { type: influenceRankRangeSchema, required: true, default: influenceRankRangeDefault },
        rarities: { type: rarityInfoCollectionSchema, required: true, default: raritiesDefault },
        totalImages: { type: Number, required: true, default: 0 },
    },
    { timestamps: true },
);

export const Character = model('Character', characterSchema);
