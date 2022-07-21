import * as help from './help';
import * as history from './history';
import * as missing from './missing';
import * as modify from './modify';
import * as ping from './ping';
import * as query from './query';
import * as reminder from './reminder';
import * as wishlist from './wishlist';

export const commands: Map<string, BotTypes.Command> = new Map();
commands
    .set(history.data.name, history)
    .set(reminder.data.name, reminder)
    .set(modify.data.name, modify)
    .set(help.data.name, help)
    .set(missing.data.name, missing)
    .set(wishlist.data.name, wishlist)
    .set(query.data.name, query)
    .set(ping.data.name, ping);
