import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, MessageEmbed } from 'discord.js';
import { character } from '../database';

function generateDescription(maxId: number): string {
    const ids: string[] = [];
    let consecutive = 0;

    for (let i = 0; i <= maxId + 1; i++) {
        const res = character.query({ globalId: i });
        if (res || i === maxId + 1) {
            if (consecutive === 1) {
                ids.push(`\`${i - 1}\``);
            } else if (consecutive === 2) {
                ids.push(`\`${i - 2}\``, `\`${i - 1}\``);
            } else if (consecutive > 2) {
                ids.push(`\`${i - consecutive}-${i - 1}\``);
            }

            consecutive = 0;
        } else {
            consecutive++;
        }
    }

    return ids.join(', ');
}

export const data = new SlashCommandBuilder()
    .addIntegerOption(option =>
        option
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(30000)
            .setName('max_global_id')
            .setDescription('The largest global ID to consider'))
    .setName('missing')
    .setDescription('Shows the global IDs that are missing in the database');

export async function execute(interaction: CommandInteraction) {
    const { options } = interaction;

    const maxId = options.getInteger('max_global_id', true);

    const embed = new MessageEmbed()
        .setColor(0xED6A5A)
        .setTitle('Missing Information')
        .setDescription(generateDescription(maxId));

    await interaction.reply({
        embeds: [embed],
    });
}

export function isPermitted(_interaction: CommandInteraction): boolean {
    return true;
}
