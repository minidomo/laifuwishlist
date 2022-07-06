import { User } from '../model';

export async function findUser(id: string): Promise<BotTypes.UserDocument> {
    const userTemp = await User.findOne({ id });

    if (userTemp) {
        return userTemp as BotTypes.UserDocument;
    }

    return new User({ id }) as BotTypes.UserDocument;
}
