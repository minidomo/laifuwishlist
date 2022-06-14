import * as backup from './backup';
import * as exportCommand from './export';
import * as importCommand from './import';
import * as ping from './ping';
import type { Command } from '../types';

export const commands: Map<string, Command> = new Map();
commands
    .set(backup.data.name, backup)
    .set(importCommand.data.name, importCommand)
    .set(exportCommand.data.name, exportCommand)
    .set(ping.data.name, ping);
