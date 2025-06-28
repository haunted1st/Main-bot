require('dotenv').config();
const express = require('express');
const app = express();
app.get('/', (_, res) => res.send('✅ Бот работает!'));
app.listen(3000, () => console.log('🌐 Express-сервер запущен на порту 3000'));

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  InteractionType,
  ComponentType
} = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const APPLICATION_CHANNEL_ID = '1349389519287357470';
const TEMP_APPLICATION_DATA = new Map();

client.once(Events.ClientReady, async () => {
  const channel = await client.channels.fetch('1387148896320487564');
  if (!channel) return console.error('Канал не найден');

  const menu = new StringSelectMenuBuilder()
    .setCustomId('application_selector')
    .setPlaceholder('Выберите тип заявки')
    .addOptions([
      { label: 'Main', value: 'main', emoji: '📝' },
      { label: 'Tier', value: 'tier', emoji: '📋' }
    ]);

  const row = new ActionRowBuilder().addComponents(menu);

  await channel.send({
    content: 'Выберите тип заявки:',
    components: [row]
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isStringSelectMenu() && interaction.customId === 'application_selector') {
    const selected = interaction.values[0];
    const modal = new ModalBuilder()
      .setCustomId(`step1_${selected}`)
      .setTitle(`Заявка - шаг 1 [${selected.toUpperCase()}]`);

    const fields = [
      { id: 'full_name', label: 'Ник | Статик | Возраст', style: TextInputStyle.Short },
      { id: 'timezone', label: 'Ваш часовой пояс | Прайм-тайм', style: TextInputStyle.Short },
      { id: 'hours', label: 'Сколько у вас часов в GTA V?', style: TextInputStyle.Short }
    ];

    const rows = fields.map(f => new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId(f.id).setLabel(f.label).setStyle(f.style).setRequired(true)
    ));

    modal.addComponents(...rows);
    await interaction.showModal(modal);
  }

  if (interaction.type === InteractionType.ModalSubmit) {
    const [step, type] = interaction.customId.split('_');

    if (step === 'step1') {
      TEMP_APPLICATION_DATA.set(interaction.user.id, {
        type,
        full_name: interaction.fields.getTextInputValue('full_name'),
        timezone: interaction.fields.getTextInputValue('timezone'),
        hours: interaction.fields.getTextInputValue('hours')
      });

      const modal2 = new ModalBuilder()
        .setCustomId(`step2_${type}`)
        .setTitle(`Заявка - шаг 2 [${type.toUpperCase()}]`);

      const fields2 = [
        { id: 'tournament', label: 'Готовы ли вы участвовать в турнирах?', style: TextInputStyle.Short },
        { id: 'shooting', label: 'Откат стрельбы', style: TextInputStyle.Short }
      ];

      const rows2 = fields2.map(f => new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId(f.id).setLabel(f.label).setStyle(f.style).setRequired(true)
      ));

      modal2.addComponents(...rows2);
      await interaction.showModal(modal2);
    }

    if (step === 'step2') {
      const data = TEMP_APPLICATION_DATA.get(interaction.user.id);
      if (!data) return interaction.reply({ content: '⚠️ Ошибка. Не найдены данные первой формы.', ephemeral: true });

      data.tournament = interaction.fields.getTextInputValue('tournament');
      data.shooting = interaction.fields.getTextInputValue('shooting');

      const embed = new EmbedBuilder()
        .setTitle(`📩 Новая заявка в ${data.type.toUpperCase()}`)
        .setColor(0x2f3136)
        .setDescription(
          `**Ник | Статик | Возраст**\n${data.full_name}\n\n` +
          `**Ваш часовой пояс | Прайм-тайм**\n${data.timezone}\n\n` +
          `**Сколько у вас часов в GTA V?**\n${data.hours}\n\n` +
          `**Готовы ли вы участвовать в турнирах?**\n${data.tournament}\n\n` +
          `**Откат стрельбы**\n${data.shooting}\n\n` +
          `**Ваш Discord**\n<@${interaction.user.id}>\n\n` +
          `**ID Discord**\n${interaction.user.id}`
        );

      const channel = await interaction.guild.channels.fetch(APPLICATION_CHANNEL_ID);
      if (channel) {
        await channel.send({ embeds: [embed] });
      }

      TEMP_APPLICATION_DATA.delete(interaction.user.id);
      await interaction.reply({ content: '✅ Заявка успешно отправлена!', ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);
