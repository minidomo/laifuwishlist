import { model, Schema } from 'mongoose';

const characterRarityInfoSchema = new Schema({
    existingAmount: Number,
    totalClaimed: Number,
});

const characterSchema = new Schema({
    characterName: String,
    globalId: Number,
    image: {
        credit: String,
        currentNumber: Number,
        uploader: String,
    },
    influence: Number,
    influenceRankRange: {
        lower: Number,
        upper: Number,
    },
    lastUpdated: Number,
    rarities: {
        alpha: characterRarityInfoSchema,
        beta: characterRarityInfoSchema,
        delta: characterRarityInfoSchema,
        epsilon: characterRarityInfoSchema,
        gamma: characterRarityInfoSchema,
        ultra: characterRarityInfoSchema,
        zeta: characterRarityInfoSchema,
    },
    series: {
        alternateTitle: String,
        englishTitle: String,
        id: Number,
        sequence: String,
    },
    totalImages: Number,
});

export const Character = model('Character', characterSchema);
