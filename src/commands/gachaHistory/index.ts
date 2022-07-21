import { SlashCommandBuilder } from '@discordjs/builders';
import type { ChatInputCommandInteraction } from 'discord.js';
import * as show from './subcommands/show';
import * as stats from './subcommands/stats';
import * as toggle from './subcommands/toggle';

const subcommands: Map<string, BotTypes.Subcommand> = new Map();
subcommands.set(stats.data.name, stats).set(show.data.name, show).set(toggle.data.name, toggle);

export const data = new SlashCommandBuilder()
    .addSubcommand(stats.data)
    .addSubcommand(show.data)
    .addSubcommand(toggle.data)
    .setName('gachahistory')
    .setDescription('Track your gachas');

export async function execute(interaction: ChatInputCommandInteraction, unique: BotTypes.Unique) {
    const { options } = interaction;

    const subcommandName = options.getSubcommand();
    const subcommand = subcommands.get(subcommandName) as BotTypes.Subcommand;

    if (subcommand.isPermitted(interaction)) {
        await subcommand.execute(interaction, unique);
    }
}

// eslint-disable-next-line
export function isPermitted(_interaction: ChatInputCommandInteraction): boolean {
    return true;
}
