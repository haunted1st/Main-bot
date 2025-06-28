require('dotenv').config();
const express = require('express');
const { 
  Client, GatewayIntentBits, Events, InteractionType,
  EmbedBuilder, ModalBuilder, TextInputBuilder, 
  TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle 
} = require('discord.js');

const app = express();
app.get('/', (_, res) => res.send('✅ Бот работает!'));
app.listen(3000, () => console.log('🌐 Express-сервер запущен на порту 3000'));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Настройки
const INVITE_CHANNEL_ID = '1387148896320487564';
const CHANNEL_LOG_TIER_ID = '1349389519287357470';
const LEADER_ROLE_ID = '1200040982746517595';
const DEPUTY_ROLE_ID = '1200045928460058768';
const HIGH_ROLE_ID = '1200046656666730527';

// Временное хранилище для Tier
const tierApplications = new Map();

// Отправка SELECT меню
client.once(Events.ClientReady, async () => {
  const channel = await client.channels.fetch(INVITE_CHANNEL_ID);
  if (!channel) return console.error('Канал не найден');

  const menu = new StringSelectMenuBuilder()
    .setCustomId('application_selector')
    .setPlaceholder('Выберите тип заявки')
    .addOptions([
      { label: 'Main', value: 'main', emoji: '📝' },
      { label: 'Tier', value: 'tier', emoji: '🧩' },
    ]);

  const row = new ActionRowBuilder().addComponents(menu);
  await channel.send({ content: 'Выберите тип заявки:', components: [row] });
});

// Обработка взаимодействий
client.on(Events.InteractionCreate, async (interaction) => {
  // Select menu
  if (interaction.isStringSelectMenu() && interaction.customId === 'application_selector') {
    const selected = interaction.values[0];

    if (selected === 'main') {
      const modal = new ModalBuilder()
        .setCustomId('main_application')
        .setTitle('Подать заявку в MAIN');

      const fields = [
        { id: 'full_name', label: 'Ник | Статик | Возраст' },
        { id: 'timezone', label: 'Ваш часовой пояс | Прайм-тайм' },
        { id: 'gta_hours', label: 'Сколько у вас часов в GTA V?' },
        { id: 'tournaments', label: 'Готовы ли вы участвовать во всех турнирах?' },
        { id: 'saiga', label: 'Откат стрельбы (Сайга)' }
      ];

      const rows = fields.map(field =>
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId(field.id)
            .setLabel(field.label)
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

      modal.addComponents(...rows);
      return interaction.showModal(modal);
    }

    if (selected === 'tier') {
      const modal = new ModalBuilder()
        .setCustomId('tier_step1')
        .setTitle('Tier Заявка — Шаг 1');

      const step1Fields = [
        { id: 'tier_name', label: 'Ник | Статик | Возраст' },
        { id: 'past_families', label: 'В каких семьях состояли?', style: TextInputStyle.Paragraph },
{ id: 'why_us', label: 'Почему выбрали нас?', style: TextInputStyle.Paragraph }
      ];

      const rows = step1Fields.map(field =>
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId(field.id)
            .setLabel(field.label)
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

      modal.addComponents(...rows);
      return interaction.showModal(modal);
    }
  }

  // MAIN заявка
  if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'main_application') {
    const get = (id) => interaction.fields.getTextInputValue(id);
    const embed = new EmbedBuilder()
      .setTitle('**Новая заявка в MAIN**')
      .setColor(0x5865f2)
      .setDescription(
        `**Ник | Статик | Возраст**\n${get('full_name')}\n\n` +
        `**Часовой пояс | Прайм-тайм**\n${get('timezone')}\n\n` +
        `**Часы в GTA V**\n${get('gta_hours')}\n\n` +
        `**Готовность к турнирам**\n${get('tournaments')}\n\n` +
        `**Откат стрельбы (Сайга)**\n${get('saiga')}\n\n` +
        `**Ваш Discord**\n<@${interaction.user.id}>\n\n` +
        `**ID Discord**\n${interaction.user.id}`
      );

    const logChannel = interaction.guild.channels.cache.get(CHANNEL_LOG_TIER_ID);
    const mentions = `<@&${LEADER_ROLE_ID}> <@&${DEPUTY_ROLE_ID}> <@&${HIGH_ROLE_ID}>`;
    if (logChannel) {
      await logChannel.send({ content: `${mentions} **Новая заявка в MAIN**`, embeds: [embed] });
    }

    return interaction.reply({ content: '✅ Заявка в MAIN отправлена!', ephemeral: true });
  }

  // Tier Шаг 1
  if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'tier_step1') {
    const userId = interaction.user.id;
    tierApplications.set(userId, {
      tier_name: interaction.fields.getTextInputValue('tier_name'),
      tier_timezone: interaction.fields.getTextInputValue('tier_timezone'),
      tier_families: interaction.fields.getTextInputValue('tier_families'),
    });

    const modal2 = new ModalBuilder()
      .setCustomId('tier_step2')
      .setTitle('Tier Заявка — Шаг 2');

    const step2Fields = [
      { id: 'tier_rules', label: 'Знание правил (1–10)' },
      { id: 'tier_micro', label: 'Микрофон и речь (1–10)' },
      { id: 'tier_behavior', label: 'Рассудительность и поведение (1–10)' },
      { id: 'tier_shooting', label: 'Стрельба (1–10)' },
      { id: 'tier_comment', label: 'Комментарий / Сообщение лидерам' }
    ];

    const rows = step2Fields.map(field =>
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(field.id)
          .setLabel(field.label)
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

    modal2.addComponents(...rows);
    return interaction.showModal(modal2);
  }

  // Tier Шаг 2 — отправка
  if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'tier_step2') {
    const userId = interaction.user.id;
    const saved = tierApplications.get(userId);
    if (!saved) {
      return interaction.reply({ content: '❌ Не найдены данные из первого шага.', ephemeral: true });
    }

    const get = (id) => interaction.fields.getTextInputValue(id);
    const embed = new EmbedBuilder()
      .setTitle('**Новая заявка в TIER**')
      .setColor(0xf59e42)
      .setDescription(
        `**Ник | Статик | Возраст**\n${saved.tier_name}\n\n` +
        `**Часовой пояс | Прайм-тайм**\n${saved.tier_timezone}\n\n` +
        `**Семьи и причина**\n${saved.tier_families}\n\n` +
        `**Знание правил:** ${get('tier_rules')}\n` +
        `**Микрофон и речь:** ${get('tier_micro')}\n` +
        `**Рассудительность:** ${get('tier_behavior')}\n` +
        `**Стрельба:** ${get('tier_shooting')}\n\n` +
        `**Комментарий:**\n${get('tier_comment')}\n\n` +
        `**Ваш Discord:** <@${userId}>\n` +
        `**ID Discord:** ${userId}`
      );

    const logChannel = interaction.guild.channels.cache.get(CHANNEL_LOG_TIER_ID);
    const mentions = `<@&${LEADER_ROLE_ID}> <@&${DEPUTY_ROLE_ID}> <@&${HIGH_ROLE_ID}>`;

    if (logChannel) {
      await logChannel.send({ content: `${mentions} **Новая заявка в TIER**`, embeds: [embed] });
    }

    tierApplications.delete(userId);
    return interaction.reply({ content: '✅ Заявка в TIER отправлена!', ephemeral: true });
  }
});

client.login(process.env.TOKEN);
