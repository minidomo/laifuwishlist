import { SlashCommandSubcommandBuilder } from '@discordjs/builders';
import type { CommandInteraction } from 'discord.js';
import { findUser } from '../../../util';

export const data = new SlashCommandSubcommandBuilder()
    .setName('toggle')
    .setDescription('Enable/disable tracking history of your gachas');

export async function execute(interaction: CommandInteraction) {
    const { user } = interaction;

    const targetUser = await findUser(user.id);
    targetUser.gachaHistory.enabled = !targetUser.gachaHistory.enabled;
    await targetUser.save();

    await interaction.reply({
        content: `Track gacha history: ${targetUser.gachaHistory.enabled}`,
        ephemeral: true,
    });
}

export function isPermitted(_interaction: CommandInteraction) {
    return true;
}
