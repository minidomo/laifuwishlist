import { SlashCommandBuilder } from '@discordjs/builders';
import type { CommandInteraction } from 'discord.js';
import * as toggle from './subcommands/toggle';

const subcommands: Map<string, BotTypes.Subcommand> = new Map();
subcommands
    .set(toggle.data.name, toggle);

export const data = new SlashCommandBuilder()
    .addSubcommand(toggle.data)
    .setName('gachahistory')
    .setDescription('Track your gachas');

export async function execute(interaction: CommandInteraction, unique: BotTypes.Unique) {
    const { options } = interaction;

    const subcommandName = options.getSubcommand();
    const subcommand = subcommands.get(subcommandName) as BotTypes.Subcommand;

    if (subcommand.isPermitted(interaction)) {
        await subcommand.execute(interaction, unique);
    }
}

// eslint-disable-next-line
export function isPermitted(_interaction: CommandInteraction): boolean {
    return true;
}
