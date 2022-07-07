export function isGachaResultCharacterSchema(result: BotTypes.GachaResultSchema):
    result is BotTypes.GachaResultSchema & BotTypes.GachaResultCharacterSchema {
    return result.gachaType === 'character';
}

export function isGachaResultBadgeSchema(result: BotTypes.GachaResultSchema):
    result is BotTypes.GachaResultSchema & BotTypes.GachaResultBadgeSchema {
    return result.gachaType === 'badge';
}
