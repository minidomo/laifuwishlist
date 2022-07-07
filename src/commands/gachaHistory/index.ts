import { SlashCommandBuilder } from '@discordjs/builders';
import type { CommandInteraction } from 'discord.js';

import * as toggle from './subcommands/toggle';

const subcommands: Map<string, BotTypes.Subcommand> = new Map();
subcommands
    .set(toggle.data.name, toggle);

export const data = new SlashCommandBuilder()
    .addSubcommand(subcommand =>
        subcommand
            .setName('toggle')
            .setDescription('Enable/disable tracking history of your gachas'))
    .setName('gachahistory')
    .setDescription('Track your gachas');

export async function execute(interaction: CommandInteraction) {
    const { options } = interaction;

    const subcommandName = options.getSubcommand();
    const subcommand = subcommands.get(subcommandName) as BotTypes.Subcommand;

    if (subcommand.isPermitted(interaction)) {
        subcommand.execute(interaction);
    }
}

export function isPermitted(_interaction: CommandInteraction): boolean {
    return true;
}
