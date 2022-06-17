import * as add from './add';
import * as backup from './backup';
import * as exportCommand from './export';
import * as importCommand from './import';
import * as ping from './ping';
import * as query from './query';
import * as remove from './remove';
import * as wishlist from './wishlist';
import type { Command } from '../structures';

export const commands: Map<string, Command> = new Map();
commands
    .set(wishlist.data.name, wishlist)
    .set(remove.data.name, remove)
    .set(add.data.name, add)
    .set(query.data.name, query)
    .set(backup.data.name, backup)
    .set(importCommand.data.name, importCommand)
    .set(exportCommand.data.name, exportCommand)
    .set(ping.data.name, ping);
