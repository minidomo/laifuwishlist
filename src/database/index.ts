import { CharacterDatabase, WishlistDatabase } from '../structures';

export const wishlist = new WishlistDatabase();
export const character = new CharacterDatabase();

wishlist.initialize();
character.initialize();
