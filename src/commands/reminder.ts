import { SlashCommandBuilder } from '@discordjs/builders';
import type { CommandInteraction } from 'discord.js';
import { findUser } from '../util';

type ReminderType = 'drop' | 'medal';
type Toggle = 'on' | 'off';

export const data = new SlashCommandBuilder()
    .addStringOption(option =>
        option
            .setName('type')
            .setDescription('Type of reminder')
            .setChoices({ name: 'Drop', value: 'drop' }, { name: 'Medal', value: 'medal' })
            .setRequired(true),
    )
    .addStringOption(option =>
        option
            .setName('toggle')
            .setDescription('Toggle this reminder on/off')
            .setChoices({ name: 'On', value: 'on' }, { name: 'Off', value: 'off' })
            .setRequired(true),
    )
    .setName('reminder')
    .setDescription('Enable/disable reminders');

// eslint-disable-next-line
export async function execute(interaction: CommandInteraction, _unique: BotTypes.Unique) {
    const { options, user } = interaction;

    const reminderType = options.getString('type') as ReminderType;
    const toggle = options.getString('toggle') as Toggle;

    const targetUser = await findUser(user.id);
    const toggleOn = toggle === 'on';

    let content = '';

    if (reminderType === 'drop') {
        if (toggleOn) {
            content = 'You will now be pinged for drops';
        } else {
            content = 'You will no longer be pinged for drops';
        }

        if (targetUser.reminder.drop !== toggleOn) {
            targetUser.reminder.drop = toggleOn;
            await targetUser.save();
        }
    } else {
        if (toggleOn) {
            content = 'You will now be pinged for medal drops';
        } else {
            content = 'You will no longer be pinged for medal drops';
        }

        if (targetUser.reminder.medal !== toggleOn) {
            targetUser.reminder.medal = toggleOn;
            await targetUser.save();
        }
    }

    await interaction.reply({ content, ephemeral: true });
}

// eslint-disable-next-line
export function isPermitted(_interaction: CommandInteraction): boolean {
    return true;
}
