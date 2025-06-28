require('dotenv').config();

const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('✅ Бот работает!');
});

app.listen(3000, () => {
  console.log('🌐 Express-сервер запущен на порту 3000');
});

const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
  InteractionType,
  StringSelectMenuBuilder,
  Events
} = require('discord.js');

const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
dayjs.extend(relativeTime);

// === Жёстко зашитые настройки ===
const INVITE_CHANNEL_ID = '1387148896320487564'; // канал для кнопки заявок
const LEADER_ROLE_ID = '1200040982746517595';
const DEPUTY_ROLE_ID = '1200045928460058768';
const CHANNEL_LOG_MAIN_ID = '1300952587930959942';
const CHANNEL_LOG_TIER_ID = '1349389519287357470';

// === Discord клиент ===
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async () => {
  console.log(`🤖 Бот запущен как ${client.user.tag}`);

  const channel = await client.channels.fetch(INVITE_CHANNEL_ID);
  if (!channel) return console.error('❌ Канал не найден');

  const menu = new StringSelectMenuBuilder()
    .setCustomId('application_selector')
    .setPlaceholder('Выберите тип заявки')
    .addOptions([
      { label: 'Main', value: 'main', emoji: '📝' },
      { label: 'Tier', value: 'tier', emoji: '📂' }
    ]);

  const row = new ActionRowBuilder().addComponents(menu);

  await channel.send({
    content: 'Выберите тип заявки:',
    components: [row]
  });
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isStringSelectMenu() || interaction.customId !== 'application_selector') return;

  const selected = interaction.values[0];
  const leader = `<@&${LEADER_ROLE_ID}>`;
  const deputy = `<@&${DEPUTY_ROLE_ID}>`;
  const userTag = `<@${interaction.user.id}>`;
  const userId = interaction.user.id;
  const date = new Date().toLocaleString('ru-RU');
  const logChannelId = selected === 'main' ? CHANNEL_LOG_MAIN_ID : CHANNEL_LOG_TIER_ID;

  const embed = new EmbedBuilder()
    .setTitle(`Новая заявка: ${selected.toUpperCase()}`)
    .setColor(selected === 'main' ? 0x5865f2 : 0x9b59b6)
    .setDescription(
      `**Имя и фамилия в игре**\n—\n\n` +
      `**Статик на Phoenix**\n—\n\n` +
      `**Ваш прайм-тайм**\n—\n\n` +
      `**Откат стрельбы (Караба)**\n—\n\n` +
      `**Откат стрельбы (Сайга)**\n—\n\n` +
      `**Discord**\n${userTag}\n\n` +
      `**ID**\n${userId}\n\n` +
      `📅 ${date}`
    );

  const logChannel = interaction.guild.channels.cache.get(logChannelId);
  if (logChannel) {
    await logChannel.send({
      content: `${leader} ${deputy}`,
      embeds: [embed]
    });
  }

  await interaction.reply({ content: `✅ Заявка в ${selected.toUpperCase()} отправлена!`, ephemeral: true });
});

client.login(process.env.TOKEN);

