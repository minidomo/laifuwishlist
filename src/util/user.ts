import { User } from '../model';

export async function findUser(id: string): Promise<BotTypes.UserDocument> {
    const userTemp = await User.findOne({ id });

    if (userTemp) {
        return userTemp as unknown as BotTypes.UserDocument;
    }

    const user = new User({ id }) as unknown as BotTypes.UserDocument;
    await user.save();

    return user;
}
