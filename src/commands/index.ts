import * as save from './save';
import * as test from './test';
import type { Command } from '../types';

export const commands: Map<string, Command> = new Map();
commands
    .set(save.data.name, save)
    .set(test.data.name, test);
