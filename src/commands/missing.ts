import { inlineCode, SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, MessageEmbed } from 'discord.js';
import { Character } from '../model';

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

// eslint-disable-next-line
export async function execute(interaction: CommandInteraction, _unique: BotTypes.Unique) {
    const { options } = interaction;

    await interaction.deferReply();

    const maxId = options.getInteger('max_global_id', true);
    const description = await createDescription(maxId);

    const embed = new MessageEmbed()
        .setColor(0xED6A5A)
        .setTitle('Missing Information')
        .setDescription(description);

    await interaction.editReply({
        embeds: [embed],
    });
}

// eslint-disable-next-line
export function isPermitted(_interaction: CommandInteraction): boolean {
    return true;
}

async function createDescription(maxId: number): Promise<string> {
    const ids: string[] = [];
    let consecutive = 0;

    const characters = await Character.find({}).select('id').lean() as BotTypes.LeanCharacterDocument[];
    const existingIds: Set<number> = new Set(characters.map(e => e.id));

    for (let i = 0; i <= maxId + 1; i++) {
        if (existingIds.has(i) || i === maxId + 1) {
            if (consecutive === 1) {
                ids.push(inlineCode(`${i - 1}`));
            } else if (consecutive === 2) {
                ids.push(inlineCode(`${i - 2}`), inlineCode(`${i - 1}`));
            } else if (consecutive > 2) {
                ids.push(inlineCode((`${i - consecutive}-${i - 1}`)));
            }

            consecutive = 0;
        } else {
            consecutive++;
        }
    }

    return ids.join(', ');
}
