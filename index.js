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
const CHANNEL_LOG_MAIN_ID = '1300952587930959942';
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
  {
    id: 'full_name',
    label: 'Ник | Статик | Возраст',
    placeholder: 'Sky | 100000 | 20',
    style: TextInputStyle.Short
  },
  {
    id: 'timezone',
    label: 'Ваш часовой пояс | Прайм-тайм',
    placeholder: '+1 от МСК | 14:00-00:00',
    style: TextInputStyle.Short
  },
  {
    id: 'gta_hours',
    label: 'Сколько у вас часов в GTA V?',
    placeholder: '1488+ часов',
    style: TextInputStyle.Paragraph
  },
  {
    id: 'tournaments',
    label: 'Готовы ли вы участвовать во всех турнирах?',
    placeholder: 'Да, готов.',
    style: TextInputStyle.Paragraph
  },
  {
    id: 'saiga',
    label: 'Откат стрельбы (Сайга + Тяжи)',
    placeholder: 'https://youtube.com/(от 5 минут)',
    style: TextInputStyle.Paragraph
  }
];

     const rows = fields.map(field =>
  new ActionRowBuilder().addComponents(
    new TextInputBuilder()
      .setCustomId(field.id)
      .setLabel(field.label.slice(0, 45))
      .setPlaceholder(field.placeholder || '')
      .setStyle(field.style || TextInputStyle.Short)
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
  {
    id: 'tier_name',
    label: 'Ник | Статик | Возраст',
    placeholder: 'amore | 666 | 21',
    style: TextInputStyle.Short
  },
  {
    id: 'tier_timezone',
    label: 'Ваш часовой пояс | Прайм-тайм',
    placeholder: '+2 МСК | 14:00–00:00',
    style: TextInputStyle.Short
  },
  {
    id: 'tier_families',
    label: 'Сколько у вас часов в GTA V?',
    placeholder: '1488+ часов',
    style: TextInputStyle.Paragraph
  },
  {
    id: 'tier_reason',
    label: 'Как оцениваете свою игру?',
    placeholder: '7 — умею стрелять, знаю правила, учусь играть в тиме',
    style: TextInputStyle.Paragraph
  }
];

const rows = step1Fields.map(field =>
  new ActionRowBuilder().addComponents(
    new TextInputBuilder()
      .setCustomId(field.id)
      .setLabel(field.label.slice(0, 45))
      .setPlaceholder(field.placeholder || '')
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

    const logChannel = interaction.guild.channels.cache.get(CHANNEL_LOG_MAIN_ID);
    const mentions = `<@&${LEADER_ROLE_ID}> <@&${DEPUTY_ROLE_ID}> <@&${HIGH_ROLE_ID}>`;
    if (logChannel) {
      await logChannel.send({ content: `${mentions} **Новая заявка в MAIN**`, embeds: [embed] });
    }

    return interaction.reply({ content: '✅ Заявка в MAIN отправлена!', ephemeral: true });
  }
    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'tier_step1') {
  const userId = interaction.user.id;

  tierApplications.set(userId, {
    tier_name: interaction.fields.getTextInputValue('tier_name'),
    tier_timezone: interaction.fields.getTextInputValue('tier_timezone'),
    tier_families: interaction.fields.getTextInputValue('tier_families'),
    tier_reason: interaction.fields.getTextInputValue('tier_reason'),
  });

  const nextButton = new ButtonBuilder()
    .setCustomId('tier_step2_button')
    .setLabel('Перейти ко 2 шагу')
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(nextButton);

  return interaction.reply({
    content: '✅ Шаг 1 заявки сохранён. Нажмите кнопку ниже, чтобы перейти ко 2 шагу:',
    components: [row],
    ephemeral: true,
  });
}

  // Tier Шаг 1
  if (interaction.isButton() && interaction.customId === 'tier_step2_button') {
  const modal2 = new ModalBuilder()
    .setCustomId('tier_step2')
    .setTitle('Tier Заявка — Шаг 2');

  const step2Fields = [
  {
    id: 'tier_rules',
    label: 'Готовы ли вы принимать участие в турнирах?',
    placeholder: 'Да, готов. / Нет, не готов.',
  },
  {
    id: 'tier_micro',
    label: 'Знание правил турниров Majestic Cyber League.',
    placeholder: 'Да, знаю. / Нет, не знаю.',
  },
  {
    id: 'tier_behavior',
    label: 'Откаты с Каптов (чем больше, тем лучше)',
    placeholder: 'https://youtube.com/...',
  },
  {
    id: 'tier_shooting',
    label: 'Откаты с RP мероприятий (от 5 минут)',
    placeholder: 'https://youtube.com/...',
  },
  {
    id: 'tier_comment',
    label: 'Откаты с турниров (от 5 минут)',
    placeholder: 'https://youtube.com/...',
  }
];

  const rows = step2Fields.map(field =>
  new ActionRowBuilder().addComponents(
    new TextInputBuilder()
      .setCustomId(field.id)
      .setLabel(field.label.slice(0, 45))
      .setPlaceholder(field.placeholder || '')
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
  `**Семьи**\n${saved.tier_families}\n\n` +
  `**Почему выбрали нас?**\n${saved.tier_reason}\n\n` +
  `**Знание правил**\n${get('tier_rules')}\n\n` +
  `**Микрофон и речь**\n${get('tier_micro')}\n\n` +
  `**Рассудительность**\n${get('tier_behavior')}\n\n` +
  `**Стрельба**\n${get('tier_shooting')}\n\n` +
  `**Комментарий**\n${get('tier_comment')}\n\n` +
  `**Ваш Discord**\n<@${userId}>\n` +
  `**ID Discord**\n${userId}`
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
